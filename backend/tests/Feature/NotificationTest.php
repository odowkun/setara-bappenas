<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Kritik;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $superadminRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $adminBidangRole = Role::firstOrCreate(['name' => 'admin_bidang', 'guard_name' => 'web']);
        $adminUmumRole = Role::firstOrCreate(['name' => 'admin_umum', 'guard_name' => 'web']);

        $perms = [
            'manage_profil', 'manage_pengumuman', 'manage_tautan_opd', 'manage_gis',
            'manage_dashboard', 'view_audit_logs', 'manage_berita', 'manage_galeri',
            'manage_dokumen', 'manage_users', 'manage_survey', 'view_download_logs',
            'manage_document_types', 'manage_kritik',
        ];

        foreach ($perms as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }
    }

    public function test_unauthenticated_user_cannot_access_notifications(): void
    {
        $response = $this->getJson('/api/v1/admin/notifications');
        $response->assertStatus(401);
    }

    public function test_superadmin_receives_comprehensive_notifications(): void
    {
        $superadmin = User::factory()->create([
            'role' => 'superadmin',
            'email' => 'super@bappeda.test',
        ]);
        $superadmin->assignRole('superadmin');

        // Create test data
        Kritik::create([
            'nama' => 'Warga Test',
            'email' => 'warga@test.com',
            'subjek' => 'Aspirasi Pelayanan Publik',
            'pesan' => 'Mohon ditingkatkan kecepatan pelayanan',
            'status' => 'Menunggu Tanggapan',
        ]);

        Survey::create([
            'nama_responden' => 'Responden A',
            'ikm_score' => 88.5,
            'kategori' => 'Baik',
            'jenis_layanan' => 'Layanan Perencanaan',
            'u1_persyaratan' => 4,
            'u2_prosedur' => 4,
            'u3_kecepatan' => 4,
            'u4_produk' => 5,
            'u5_sikap' => 4,
        ]);

        Document::create([
            'title' => 'Dokumen RKPD 2026',
            'jenis' => 'Rencana Kerja',
            'bidang' => 'semua',
            'tahun' => 2026,
            'is_public' => true,
            'governance_status' => 'submitted',
            'uploaded_by' => 'Admin Super',
        ]);

        Sanctum::actingAs($superadmin);

        $response = $this->getJson('/api/v1/admin/notifications');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        $types = array_column($data, 'type');
        $this->assertContains('kritik', $types);
        $this->assertContains('ikm', $types);
        $this->assertContains('dokumen', $types);
    }

    public function test_user_with_only_manage_kritik_only_sees_kritik_notifications(): void
    {
        $user = User::factory()->create([
            'role' => 'admin_umum',
            'email' => 'kritik.only@bappeda.test',
            'custom_permissions' => ['manage_kritik'],
        ]);
        $user->assignRole('admin_umum');

        // Create various data
        Kritik::create([
            'nama' => 'Warga Kritik',
            'email' => 'kritik@test.com',
            'subjek' => 'Saran Perbaikan Jalan',
            'pesan' => 'Perbaikan jalan di Tobelo',
            'status' => 'Menunggu Tanggapan',
        ]);

        Survey::create([
            'nama_responden' => 'Responden B',
            'ikm_score' => 90,
            'kategori' => 'Sangat Baik',
            'jenis_layanan' => 'Layanan Perencanaan',
            'u1_persyaratan' => 5,
            'u2_prosedur' => 5,
            'u3_kecepatan' => 5,
            'u4_produk' => 5,
            'u5_sikap' => 5,
        ]);

        Document::create([
            'title' => 'Dokumen Rahasia Internal',
            'jenis' => 'Laporan',
            'bidang' => 'infrastruktur',
            'tahun' => 2026,
            'is_public' => false,
            'governance_status' => 'draft',
            'uploaded_by' => 'Staff Test',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/notifications');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        $types = array_unique(array_column($data, 'type'));
        // Must ONLY contain 'kritik', NOT 'ikm' or 'dokumen'
        $this->assertEquals(['kritik'], array_values($types));
    }

    public function test_admin_bidang_only_sees_documents_matching_their_bidang(): void
    {
        $userIpw = User::factory()->create([
            'role' => 'admin_bidang',
            'bidang' => 'infrastruktur',
            'email' => 'ipw@bappeda.test',
            'custom_permissions' => ['manage_dokumen'],
        ]);
        $userIpw->assignRole('admin_bidang');

        Document::create([
            'title' => 'Dokumen Tata Ruang IPW',
            'jenis' => 'RTRW',
            'bidang' => 'infrastruktur',
            'tahun' => 2026,
            'is_public' => true,
            'governance_status' => 'submitted',
            'uploaded_by' => 'IPW Staff',
        ]);

        Document::create([
            'title' => 'Dokumen Kesehatan Sosbud',
            'jenis' => 'Laporan',
            'bidang' => 'sosbud',
            'tahun' => 2026,
            'is_public' => true,
            'governance_status' => 'submitted',
            'uploaded_by' => 'Sosbud Staff',
        ]);

        Sanctum::actingAs($userIpw);

        $response = $this->getJson('/api/v1/admin/notifications');
        $response->assertStatus(200);

        $data = $response->json('data');
        $docTitles = array_column($data, 'message');

        $this->assertTrue(collect($docTitles)->contains(fn ($msg) => str_contains($msg, 'Dokumen Tata Ruang IPW')));
        $this->assertFalse(collect($docTitles)->contains(fn ($msg) => str_contains($msg, 'Dokumen Kesehatan Sosbud')));
    }
}
