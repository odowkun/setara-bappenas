<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OfficialPublicationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_gallery_draft_is_saved_but_not_public_until_published(): void
    {
        $actor = $this->actingAsAdminUmum();

        $created = $this->postJson('/api/v1/galeri', [
            'title' => 'Dokumentasi Resmi Forum Satu Data',
            'category' => 'Rapat',
            'event_date' => '2026-07-29',
            'description' => 'Dokumentasi yang menunggu persetujuan publikasi.',
            'cover_image' => '/storage/media/web/forum-satu-data.webp',
            'media' => [
                [
                    'id' => 'forum-satu-data-1',
                    'type' => 'image',
                    'url' => '/storage/media/web/forum-satu-data.webp',
                    'title' => 'Pembukaan forum',
                ],
            ],
            'is_published' => false,
        ])->assertCreated();

        $galleryId = $created->json('data.id');

        $this->assertDatabaseHas('galeri', [
            'id' => $galleryId,
            'title' => 'Dokumentasi Resmi Forum Satu Data',
            'is_published' => false,
            'created_by_user_id' => $actor->id,
        ]);

        $this->getJson('/api/v1/galeri')
            ->assertOk()
            ->assertJsonMissing(['title' => 'Dokumentasi Resmi Forum Satu Data']);
        $this->getJson('/api/v1/search?q=Forum+Satu+Data')
            ->assertOk()
            ->assertJsonMissing(['title' => 'Dokumentasi Resmi Forum Satu Data']);

        $this->getJson("/api/v1/admin/galeri/{$galleryId}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Dokumentasi Resmi Forum Satu Data');

        $this->patchJson("/api/v1/galeri/{$galleryId}/publication", [
            'is_published' => true,
        ])->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->assertDatabaseHas('galeri', [
            'id' => $galleryId,
            'is_published' => true,
            'published_by_user_id' => $actor->id,
        ]);
        $this->assertNotNull(DB::table('galeri')->where('id', $galleryId)->value('published_at'));

        $this->getJson('/api/v1/galeri')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Dokumentasi Resmi Forum Satu Data']);
    }

    public function test_gallery_edit_route_updates_the_database_instead_of_fake_saving(): void
    {
        $this->actingAsAdminUmum();

        $galleryId = DB::table('galeri')->insertGetId([
            'title' => 'Judul Sebelum Edit',
            'category' => 'Rapat',
            'event_date' => '2026-07-28',
            'description' => 'Sebelum edit',
            'cover_image' => '/storage/media/web/sebelum.webp',
            'media' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->putJson("/api/v1/galeri/{$galleryId}", [
            'title' => 'Judul Setelah Edit',
            'category' => 'Musrenbang',
            'event_date' => '2026-07-29',
            'description' => 'Perubahan tersimpan nyata.',
            'cover_image' => '/storage/media/web/setelah.webp',
            'media' => [],
        ])->assertOk()
            ->assertJsonPath('data.title', 'Judul Setelah Edit');

        $this->assertDatabaseHas('galeri', [
            'id' => $galleryId,
            'title' => 'Judul Setelah Edit',
            'description' => 'Perubahan tersimpan nyata.',
        ]);
    }

    public function test_news_agenda_and_announcement_have_real_draft_publish_transitions(): void
    {
        $actor = $this->actingAsAdminUmum();
        $categoryId = DB::table('agenda_categories')->value('id');
        $typeId = DB::table('announcement_types')->value('id');
        $newsCategory = DB::table('news_categories')->value('name');

        $newsId = $this->postJson('/api/v1/news', [
            'title' => 'Draf Berita Workflow',
            'category' => $newsCategory,
            'author' => 'Redaksi',
            'content' => '<p>Belum terbit</p>',
            'is_published' => false,
        ])->assertCreated()->json('data.id');

        $agendaId = $this->postJson('/api/v1/agendas', [
            'agenda_category_id' => $categoryId,
            'title' => 'Draf Agenda Workflow',
            'start_at' => '2026-08-01T09:00:00',
            'end_at' => '2026-08-01T11:00:00',
            'is_published' => false,
        ])->assertCreated()->json('data.id');

        $announcementId = $this->postJson('/api/v1/pengumuman', [
            'announcement_type_id' => $typeId,
            'title' => 'Draf Pengumuman Workflow',
            'content' => '<p>Belum terbit</p>',
            'is_published' => false,
        ])->assertCreated()->json('data.id');

        foreach ([
            ['news', $newsId],
            ['agendas', $agendaId],
            ['pengumuman', $announcementId],
        ] as [$resource, $id]) {
            $this->patchJson("/api/v1/{$resource}/{$id}/publication", [
                'is_published' => true,
            ])->assertOk()
                ->assertJsonPath('data.is_published', true);
        }

        $this->assertDatabaseHas('news', [
            'id' => $newsId,
            'published_by_user_id' => $actor->id,
        ]);
        $this->assertDatabaseHas('agendas', [
            'id' => $agendaId,
            'published_by_user_id' => $actor->id,
        ]);
        $this->assertDatabaseHas('announcements', [
            'id' => $announcementId,
            'published_by_user_id' => $actor->id,
        ]);

        $this->getJson('/api/v1/news')->assertJsonFragment(['title' => 'Draf Berita Workflow']);
        $this->getJson('/api/v1/agendas')->assertJsonFragment(['title' => 'Draf Agenda Workflow']);
        $this->getJson('/api/v1/pengumuman')->assertJsonFragment(['title' => 'Draf Pengumuman Workflow']);

        $this->patchJson("/api/v1/news/{$newsId}/publication", [
            'is_published' => false,
        ])->assertOk();

        $this->getJson('/api/v1/news')
            ->assertJsonMissing(['title' => 'Draf Berita Workflow']);
        $this->assertDatabaseHas('news', [
            'id' => $newsId,
            'is_published' => false,
            'published_at' => null,
            'published_by_user_id' => null,
        ]);
    }

    public function test_publication_pages_do_not_contain_fake_save_or_mock_media(): void
    {
        $paths = [
            base_path('../frontend/src/app/dashboard/galeri/tambah/page.tsx'),
            base_path('../frontend/src/app/dashboard/galeri/edit/[id]/page.tsx'),
            base_path('../frontend/src/app/dashboard/geotagging-proyek/page.tsx'),
            base_path('../frontend/src/app/dashboard/dokumen/[id]/page.tsx'),
            base_path('../frontend/src/app/dashboard/dokumen/tambah/page.tsx'),
            base_path('../frontend/src/app/berita/page.tsx'),
            base_path('../frontend/src/components/home/LatestNewsCarousel.tsx'),
        ];

        foreach ($paths as $path) {
            $contents = file_get_contents($path);
            $this->assertIsString($contents);
            $this->assertStringNotContainsString('images.unsplash.com', $contents);
            $this->assertStringNotContainsString('gtv-videos-bucket/sample', $contents);
            $this->assertStringNotContainsString('setTimeout(() =>', $contents);
            $this->assertStringNotContainsString('pagu_anggaran: 750000000', $contents);
            $this->assertStringNotContainsString('pagu_anggaran: 500000000', $contents);
            $this->assertStringNotContainsString('created_by: user', $contents);
            $this->assertStringNotContainsString('author: item.author || "Redaksi', $contents);
            $this->assertStringNotContainsString('date: item.date || new Date()', $contents);
            $this->assertStringNotContainsString('uploadedBy: user?.name', $contents);
        }
    }

    public function test_project_requires_real_official_fields_instead_of_server_defaults(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/2026/07/rkpd_watermarked.pdf', '%PDF-1.4');
        $actor = $this->actingAsAdminUmum();

        $documentId = $this->postJson('/api/v1/documents', [
            'title' => 'RKPD Sumber Proyek Resmi',
            'jenis' => 'rkpd',
            'bidang' => 'semua',
            'tahun' => '2026',
            'ukuran' => '1 MB',
            'file_path' => 'documents/2026/07/rkpd_watermarked.pdf',
            'is_public' => true,
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/documents/{$documentId}/proyek", [
            'nama_proyek' => 'Proyek Tidak Lengkap',
            'latitude' => 1.7289,
            'longitude' => 128.0054,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors([
                'bidang',
                'kecamatan',
                'pagu_anggaran',
                'opd_penanggung_jawab',
            ]);

        $created = $this->postJson("/api/v1/documents/{$documentId}/proyek", [
            'nama_proyek' => 'Rehabilitasi Jalan Desa Data Nyata',
            'bidang' => 'infrastruktur',
            'kecamatan' => 'Galela',
            'desa_kelurahan' => 'Soakonora',
            'latitude' => 1.9635,
            'longitude' => 127.7872,
            'pagu_anggaran' => 125000000,
            'opd_penanggung_jawab' => 'Dinas Pekerjaan Umum dan Penataan Ruang',
        ])->assertCreated();

        $projectId = $created->json('data.id');
        $this->assertDatabaseHas('proyek_details', [
            'id' => $projectId,
            'nama_proyek' => 'Rehabilitasi Jalan Desa Data Nyata',
            'bidang' => 'infrastruktur',
            'kecamatan' => 'Galela',
            'pagu_anggaran' => 125000000,
            'opd_penanggung_jawab' => 'Dinas Pekerjaan Umum dan Penataan Ruang',
            'created_by' => $actor->name,
        ]);
        $this->assertStringStartsWith('PRJ-RKP-2026-', $created->json('data.kode_proyek'));
        $created->assertJsonPath('esri_status.success', false);
    }

    public function test_document_is_saved_as_draft_then_published_through_real_route(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/2026/07/rkpd_watermarked.pdf', '%PDF-1.4');
        $actor = $this->actingAsAdminUmum();

        $documentId = $this->postJson('/api/v1/documents', [
            'title' => 'RKPD Draf Resmi',
            'jenis' => 'rkpd',
            'bidang' => 'semua',
            'tahun' => '2026',
            'ukuran' => '1 MB',
            'file_path' => 'documents/2026/07/rkpd_watermarked.pdf',
            'is_public' => false,
        ])->assertCreated()->json('data.id');

        $this->getJson('/api/v1/documents')
            ->assertOk()
            ->assertJsonMissing(['title' => 'RKPD Draf Resmi']);

        $reviewer = $this->actingAsAdminUmum();
        $this->putJson("/api/v1/admin/documents/{$documentId}/governance", [
            'classification' => 'public',
        ])->assertOk();

        Sanctum::actingAs($actor);
        $this->patchJson("/api/v1/documents/{$documentId}/workflow/submit", [
            'notes' => 'Diajukan untuk pemeriksaan resmi.',
        ])->assertOk();

        Sanctum::actingAs($reviewer);
        $this->patchJson("/api/v1/documents/{$documentId}/workflow/review", [
            'decision' => 'approved',
            'notes' => 'Checksum dan metadata dinyatakan sesuai.',
        ])->assertOk();

        $this->patchJson("/api/v1/documents/{$documentId}/publication", [
            'is_published' => true,
        ])->assertOk()->assertJsonPath('data.is_public', true);

        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'is_public' => true,
            'created_by_user_id' => $actor->id,
            'published_by_user_id' => $reviewer->id,
        ]);
        $this->getJson('/api/v1/documents')
            ->assertOk()
            ->assertJsonFragment(['title' => 'RKPD Draf Resmi']);
    }

    public function test_draft_announcement_attachment_is_private_until_publication(): void
    {
        Storage::fake('local');
        $this->actingAsAdminUmum();
        $typeId = DB::table('announcement_types')->value('id');

        $created = $this->post('/api/v1/pengumuman', [
            'announcement_type_id' => $typeId,
            'title' => 'Edaran dengan Lampiran Privat',
            'content' => '<p>Isi edaran</p>',
            'is_published' => false,
            'attachment' => UploadedFile::fake()->create(
                'edaran-resmi.pdf',
                100,
                'application/pdf'
            ),
        ])->assertCreated();

        $announcementId = $created->json('data.id');
        $path = DB::table('announcements')
            ->where('id', $announcementId)
            ->value('file_path');
        Storage::disk('local')->assertExists($path);
        Storage::disk('public')->assertMissing($path);

        $this->get("/api/v1/pengumuman/{$announcementId}/attachment")
            ->assertNotFound();

        $this->patchJson("/api/v1/pengumuman/{$announcementId}/publication", [
            'is_published' => true,
        ])->assertOk();

        $this->get("/api/v1/pengumuman/{$announcementId}/attachment")
            ->assertOk();
    }

    private function actingAsAdminUmum(): User
    {
        $user = User::factory()->create(['role' => 'admin_umum']);
        $user->assignRole('admin_umum');
        Sanctum::actingAs($user);

        return $user;
    }
}
