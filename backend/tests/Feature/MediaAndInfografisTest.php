<?php

namespace Tests\Feature;

use App\Models\Infografis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaAndInfografisTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_media_upload_optimized_returns_url_and_variants(): void
    {
        $admin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $admin->assignRole('superadmin');
        Sanctum::actingAs($admin);

        $file = UploadedFile::fake()->image('infografis-sample.png', 800, 600);

        $response = $this->postJson('/api/v1/media/upload-optimized', [
            'media' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'code',
                'message',
                'data' => [
                    'url',
                    'master_url',
                    'web_url',
                    'thumb_url',
                    'original_name',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.url'));
    }

    public function test_admin_can_create_and_update_infografis(): void
    {
        $admin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $admin->assignRole('superadmin');
        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/v1/admin/infografis', [
            'title' => 'Indikator Kinerja Makro 2026',
            'category' => 'Perencanaan',
            'image_url' => '/storage/media/web/test-infografis.webp',
            'description' => 'Ringkasan capaian kinerja makro tahun 2026.',
            'is_pinned' => true,
            'is_published' => true,
            'order_index' => 1,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.title', 'Indikator Kinerja Makro 2026')
            ->assertJsonPath('data.is_pinned', true);

        $infografisId = $createResponse->json('data.id');

        $updateResponse = $this->putJson("/api/v1/admin/infografis/{$infografisId}", [
            'title' => 'Indikator Kinerja Makro 2026 Edisi Revisi',
            'category' => 'Ekonomi',
            'image_url' => '/storage/media/web/test-infografis-v2.webp',
            'description' => 'Ringkasan capaian kinerja revisi.',
            'is_pinned' => true,
            'is_published' => true,
            'order_index' => 2,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.title', 'Indikator Kinerja Makro 2026 Edisi Revisi')
            ->assertJsonPath('data.category', 'Ekonomi');

        $this->assertDatabaseHas('infografis', [
            'id' => $infografisId,
            'title' => 'Indikator Kinerja Makro 2026 Edisi Revisi',
            'category' => 'Ekonomi',
            'image_url' => '/storage/media/web/test-infografis-v2.webp',
        ]);
    }
}
