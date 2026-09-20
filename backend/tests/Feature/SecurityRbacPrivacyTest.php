<?php

namespace Tests\Feature;

use App\Models\DocumentVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SecurityRbacPrivacyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_public_cannot_access_personal_or_administrative_data(): void
    {
        $this->getJson('/api/v1/users')->assertUnauthorized();
        $this->getJson('/api/v1/audit-logs')->assertUnauthorized();
        $this->getJson('/api/v1/document-download-logs')->assertUnauthorized();
        $this->getJson('/api/v1/surveys')->assertUnauthorized();
        $this->getJson('/api/v1/kritik')->assertUnauthorized();
        $this->getJson('/api/v1/admin/documents')->assertUnauthorized();
        $this->getJson('/api/v1/admin/proyek-details')->assertUnauthorized();
    }

    public function test_api_responses_include_security_and_privacy_cache_headers(): void
    {
        $this->getJson('/api/v1/documents')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Referrer-Policy', 'same-origin');

        $this->getJson('/api/v1/users')
            ->assertUnauthorized()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_public_survey_summary_only_contains_aggregate_values(): void
    {
        DB::table('surveys')->insert([
            'nama_responden' => 'Nama Rahasia',
            'email' => 'rahasia@example.com',
            'pekerjaan' => 'Masyarakat',
            'jenis_layanan' => 'Informasi Publik',
            'u1_persyaratan' => 5,
            'u2_prosedur' => 5,
            'u3_kecepatan' => 5,
            'u4_produk' => 5,
            'u5_sikap' => 5,
            'ikm_score' => 100,
            'saran_masukan' => 'Pesan privat',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/surveys/summary')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'summary' => [
                        'total_responden',
                        'ikm_score',
                        'mutu_pelayanan',
                        'kategori',
                    ],
                ],
            ]);

        $payload = $response->getContent();
        $this->assertStringNotContainsString('Nama Rahasia', $payload);
        $this->assertStringNotContainsString('rahasia@example.com', $payload);
        $this->assertStringNotContainsString('Pesan privat', $payload);
        $response->assertJsonMissingPath('data.surveys');
    }

    public function test_admin_bidang_cannot_read_survey_personal_data(): void
    {
        $this->actingAsRole('admin_bidang', 'infrastruktur');

        $this->getJson('/api/v1/surveys')->assertForbidden();
        $this->getJson('/api/v1/kritik')->assertForbidden();
        $this->getJson('/api/v1/document-download-logs')->assertForbidden();
    }

    public function test_non_superadmin_cannot_manage_user_accounts_even_with_direct_permission(): void
    {
        $manager = User::factory()->create([
            'role' => 'admin_umum',
        ]);
        $manager->assignRole('admin_umum');
        $manager->givePermissionTo(Permission::findByName('manage_users'));
        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/users')->assertForbidden();
    }

    public function test_last_superadmin_cannot_be_downgraded(): void
    {
        $target = User::factory()->create([
            'role' => 'superadmin',
        ]);
        $target->assignRole('superadmin');
        Sanctum::actingAs($target);

        $this->putJson("/api/v1/users/{$target->id}", [
            'role' => 'admin_umum',
        ])->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Super Admin terakhir tidak dapat diturunkan rolenya.'
            );

        $this->assertTrue($target->fresh()->hasRole('superadmin'));
    }

    public function test_user_email_is_normalized_before_unique_validation(): void
    {
        $this->actingAsRole('superadmin');
        $existing = User::factory()->create([
            'email' => 'admin.umum@example.com',
            'role' => 'admin_umum',
        ]);
        $existing->assignRole('admin_umum');

        $this->postJson('/api/v1/users', [
            'name' => 'Duplikat',
            'email' => '  ADMIN.UMUM@EXAMPLE.COM  ',
            'password' => 'KataSandiAman2026',
            'password_confirmation' => 'KataSandiAman2026',
            'role' => 'admin_umum',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_public_search_excludes_private_documents_and_their_projects(): void
    {
        $publicDocumentId = $this->createDocument([
            'title' => 'RKPD Terbuka Publik',
            'is_public' => true,
        ]);
        $privateDocumentId = $this->createDocument([
            'title' => 'RKPD Rahasia Internal',
            'is_public' => false,
        ]);

        DB::table('proyek_details')->insert([
            [
                'document_id' => $publicDocumentId,
                'kode_proyek' => 'PRJ-PUBLIC-001',
                'nama_proyek' => 'Jembatan Terbuka Publik',
                'bidang' => 'infrastruktur',
                'latitude' => 1.728,
                'longitude' => 127.998,
                'created_by' => 'Admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'document_id' => $privateDocumentId,
                'kode_proyek' => 'PRJ-PRIVATE-001',
                'nama_proyek' => 'Jembatan Rahasia Internal',
                'bidang' => 'infrastruktur',
                'latitude' => 1.729,
                'longitude' => 127.999,
                'created_by' => 'Admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $documentResponse = $this->getJson('/api/v1/search?q=RKPD')
            ->assertOk()
            ->getContent();
        $this->assertStringContainsString('RKPD Terbuka Publik', $documentResponse);
        $this->assertStringNotContainsString('RKPD Rahasia Internal', $documentResponse);

        $projectResponse = $this->getJson('/api/v1/search?q=Jembatan')
            ->assertOk()
            ->getContent();
        $this->assertStringContainsString('Jembatan Terbuka Publik', $projectResponse);
        $this->assertStringNotContainsString('Jembatan Rahasia Internal', $projectResponse);

        $publicProjects = $this->getJson('/api/v1/proyek-details')
            ->assertOk()
            ->assertJsonPath(
                'data.0.document.file_path',
                null
            )
            ->assertJsonPath('data.0.document.preview_requires_grant', true)
            ->getContent();
        $this->assertStringNotContainsString('https://example.com/dokumen.pdf', $publicProjects);
    }

    public function test_document_actor_and_bidang_are_derived_from_authenticated_user(): void
    {
        Storage::fake('local');
        $relativePath = 'documents/2026/07/renja_watermarked.pdf';
        Storage::disk('local')->put($relativePath, '%PDF-1.4 test');

        $actor = $this->actingAsRole('admin_bidang', 'infrastruktur');
        $actor->forceFill([
            'allowed_document_permissions' => ['renja'],
        ])->save();

        $this->postJson('/api/v1/documents', [
            'title' => 'RENJA Infrastruktur',
            'jenis' => 'renja',
            'bidang' => 'perekonomian',
            'tahun' => '2026',
            'ukuran' => '1 MB',
            'file_path' => $relativePath,
            'uploaded_by' => 'Nama Palsu',
        ])->assertCreated();

        $this->assertDatabaseHas('documents', [
            'title' => 'RENJA Infrastruktur',
            'bidang' => 'infrastruktur',
            'uploaded_by' => $actor->name,
        ]);
        $this->assertDatabaseMissing('documents', [
            'uploaded_by' => 'Nama Palsu',
        ]);
    }

    public function test_successful_admin_mutation_is_recorded_from_server_actor(): void
    {
        $actor = $this->actingAsRole('superadmin');

        $this->postJson('/api/v1/users', [
            'name' => 'Admin Baru',
            'email' => 'admin.baru@example.com',
            'password' => 'KataSandiAman2026',
            'password_confirmation' => 'KataSandiAman2026',
            'role' => 'admin_umum',
        ])->assertCreated();

        $this->assertDatabaseHas('audit_logs', [
            'user_name' => $actor->name,
            'user_role' => 'superadmin',
            'action' => 'USERS_STORE',
        ]);
    }

    public function test_personal_data_is_encrypted_at_rest_but_readable_by_authorized_admin(): void
    {
        $this->postJson('/api/v1/surveys', [
            'nama_responden' => 'Warga Privat',
            'email' => 'warga.privat@example.com',
            'pekerjaan' => 'Masyarakat',
            'jenis_layanan' => 'Informasi Publik',
            'u1_persyaratan' => 5,
            'u2_prosedur' => 4,
            'u3_kecepatan' => 5,
            'u4_produk' => 4,
            'u5_sikap' => 5,
            'saran_masukan' => 'Masukan yang bersifat privat.',
        ])->assertCreated();

        $this->postJson('/api/v1/kritik', [
            'nama' => 'Pelapor Privat',
            'email' => 'pelapor.privat@example.com',
            'telepon' => '081234567890',
            'subjek' => 'Laporan privat',
            'pesan' => 'Isi laporan yang bersifat privat.',
        ])->assertCreated();

        $documentId = $this->createDocument();
        $downloadGrant = $this->postJson("/api/v1/documents/{$documentId}/download", [
            'email' => 'pengunduh.privat@example.com',
        ])->assertOk();
        $this->get((string) $downloadGrant->json('data.download_url'))->assertOk();

        $surveyRow = DB::table('surveys')->latest('id')->first();
        $kritikRow = DB::table('kritiks')->latest('id')->first();
        $downloadRow = DB::table('document_download_logs')->latest('id')->first();

        $this->assertNotSame('warga.privat@example.com', $surveyRow->email);
        $this->assertNotSame('Warga Privat', $surveyRow->nama_responden);
        $this->assertNotSame('Masukan yang bersifat privat.', $surveyRow->saran_masukan);
        $this->assertNotSame('pelapor.privat@example.com', $kritikRow->email);
        $this->assertNotSame('081234567890', $kritikRow->telepon);
        $this->assertNotSame('Isi laporan yang bersifat privat.', $kritikRow->pesan);
        $this->assertNotSame('pengunduh.privat@example.com', $downloadRow->email);

        $this->actingAsRole('admin_umum');
        $this->getJson('/api/v1/surveys')
            ->assertOk()
            ->assertJsonFragment([
                'nama_responden' => 'Warga Privat',
                'email' => 'warga.privat@example.com',
                'saran_masukan' => 'Masukan yang bersifat privat.',
            ]);
        $this->getJson('/api/v1/kritik')
            ->assertOk()
            ->assertJsonFragment([
                'nama' => 'Pelapor Privat',
                'email' => 'pelapor.privat@example.com',
                'telepon' => '081234567890',
                'pesan' => 'Isi laporan yang bersifat privat.',
            ]);
        $this->getJson('/api/v1/document-download-logs')
            ->assertOk()
            ->assertJsonFragment([
                'email' => 'pengunduh.privat@example.com',
            ]);
    }

    public function test_public_news_endpoints_exclude_drafts_while_authorized_admin_can_read_them(): void
    {
        DB::table('news')->insert([
            [
                'title' => 'Berita Publik',
                'slug' => 'berita-publik',
                'category' => 'Pembangunan',
                'author' => 'Humas',
                'date' => '2026-07-29',
                'views' => 0,
                'content' => '<p>Konten publik</p>',
                'image' => null,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Draf Rahasia Internal',
                'slug' => 'draf-rahasia-internal',
                'category' => 'Internal',
                'author' => 'Humas',
                'date' => '2026-07-29',
                'views' => 0,
                'content' => '<p>Belum boleh terbit</p>',
                'image' => null,
                'is_published' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $publicList = $this->getJson('/api/v1/news')->assertOk()->getContent();
        $this->assertStringContainsString('Berita Publik', $publicList);
        $this->assertStringNotContainsString('Draf Rahasia Internal', $publicList);
        $this->getJson('/api/v1/news/draf-rahasia-internal')->assertNotFound();

        $search = $this->getJson('/api/v1/search?q=Rahasia')->assertOk()->getContent();
        $this->assertStringNotContainsString('Draf Rahasia Internal', $search);

        $this->actingAsRole('admin_umum');
        $this->getJson('/api/v1/admin/news')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Draf Rahasia Internal']);
    }

    public function test_rich_text_is_sanitized_before_it_is_persisted(): void
    {
        $this->actingAsRole('superadmin');
        DB::table('news_categories')->insertOrIgnore([
            'name' => 'Pengujian',
            'slug' => 'pengujian',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/news', [
            'title' => 'Uji Sanitasi',
            'category' => 'Pengujian',
            'author' => 'Humas',
            'content' => '<p>Teks aman</p><script>alert(1)</script><img src="/aman.jpg" onerror="alert(2)"><a href="javascript:alert(3)">tautan</a>',
            'is_published' => true,
        ])->assertCreated();

        $content = (string) DB::table('news')
            ->where('id', $response->json('data.id'))
            ->value('content');

        $this->assertStringContainsString('<p>Teks aman</p>', $content);
        $this->assertStringNotContainsString('<script', $content);
        $this->assertStringNotContainsString('onerror', $content);
        $this->assertStringNotContainsString('javascript:', $content);
    }

    private function actingAsRole(string $role, ?string $bidang = null): User
    {
        $user = User::factory()->create([
            'role' => $role,
            'bidang' => $bidang,
        ]);
        $user->assignRole($role);
        Sanctum::actingAs($user);

        return $user;
    }

    private function createDocument(array $overrides = []): int
    {
        $relativePath = 'documents/security/'.uniqid('document-', true).'_watermarked.pdf';
        Storage::disk('local')->put($relativePath, '%PDF-1.4 security');

        $documentId = DB::table('documents')->insertGetId(array_merge([
            'title' => 'Dokumen Publik',
            'jenis' => 'rkpd',
            'bidang' => 'semua',
            'tahun' => '2026',
            'ukuran' => '1.00 MB',
            'downloads' => 0,
            'views' => 0,
            'file_path' => $relativePath,
            'is_public' => true,
            'classification' => 'public',
            'governance_status' => 'approved',
            'storage_status' => 'private',
            'retention_policy' => 'permanent',
            'retention_status' => 'active',
            'legal_hold' => false,
            'uploaded_by' => 'Admin BAPPEDA',
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        $version = DocumentVersion::query()->create([
            'document_id' => $documentId,
            'version_number' => 1,
            'version_label' => '1.0',
            'file_path' => $relativePath,
            'file_name' => basename($relativePath),
            'mime_type' => 'application/pdf',
            'file_size_bytes' => Storage::disk('local')->size($relativePath),
            'checksum_sha256' => hash_file(
                'sha256',
                Storage::disk('local')->path($relativePath)
            ),
            'integrity_status' => 'valid',
            'extraction_status' => 'pending',
            'status' => 'approved',
            'approved_at' => now(),
        ]);
        DB::table('documents')->where('id', $documentId)->update([
            'current_version_id' => $version->id,
        ]);

        return $documentId;
    }

    public function test_public_kritik_endpoint_masks_name_and_strips_private_contacts(): void
    {
        $this->postJson('/api/v1/kritik', [
            'nama' => 'Budi Santoso',
            'email' => 'budi.santoso@example.com',
            'telepon' => '081299998888',
            'subjek' => 'Saran publik',
            'pesan' => 'Mohon ditingkatkan transparansi data.',
        ])->assertCreated();

        $response = $this->getJson('/api/v1/kritik/public')->assertOk();
        $response->assertJsonStructure([
            'status',
            'code',
            'data' => [
                '*' => [
                    'id',
                    'nama',
                    'skpd_tujuan',
                    'subjek',
                    'pesan',
                    'status',
                    'catatan_balasan',
                    'created_at',
                ],
            ],
        ]);

        $content = $response->getContent();
        $this->assertStringContainsString('B*** S***', $content);
        $this->assertStringNotContainsString('Budi Santoso', $content);
        $this->assertStringNotContainsString('budi.santoso@example.com', $content);
        $this->assertStringNotContainsString('081299998888', $content);
    }
}
