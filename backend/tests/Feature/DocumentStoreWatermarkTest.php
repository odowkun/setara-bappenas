<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentStoreWatermarkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create([
            'role' => 'superadmin',
            'allowed_document_permissions' => [
                'rpjpd',
                'rpjmd',
                'rkpd',
                'lkpj',
                'renstra',
                'renja',
                'dik_sektoral',
                'data_sektoral',
            ],
        ]);
        $user->assignRole('superadmin');
        Sanctum::actingAs($user);
    }

    public function test_it_rejects_a_document_that_did_not_come_from_watermark_processing(): void
    {
        Storage::fake('local');

        $response = $this->postJson('/api/v1/documents', $this->validPayload([
            'file_path' => 'https://example.com/dokumen-asli.pdf',
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file_path');
        $this->assertDatabaseCount('documents', 0);
    }

    public function test_it_rejects_document_path_traversal(): void
    {
        Storage::fake('local');

        $this->postJson('/api/v1/documents', $this->validPayload([
            'file_path' => 'documents/../../config_watermarked.pdf',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file_path');
    }

    public function test_it_saves_a_verified_watermarked_document(): void
    {
        Storage::fake('local');
        $relativePath = 'documents/2026/07/rencana_kerja_watermarked.pdf';
        Storage::disk('local')->put($relativePath, '%PDF-1.4 test');

        $response = $this->postJson('/api/v1/documents', $this->validPayload([
            'file_path' => $relativePath,
        ]));

        $response->assertCreated();
        $this->assertStringStartsWith(
            '/api/v1/admin/documents/',
            (string) $response->json('data.preview_url')
        );
        $response->assertJsonPath('data.file_path', null);
        $this->assertDatabaseHas('documents', [
            'title' => 'Rencana Kerja BAPPEDA 2026',
            'file_path' => $relativePath,
        ]);
    }

    public function test_it_rejects_a_document_without_real_file_size_metadata(): void
    {
        Storage::fake('local');
        $relativePath = 'documents/2026/07/tanpa_ukuran_watermarked.pdf';
        Storage::disk('local')->put($relativePath, '%PDF-1.4 test');
        $payload = $this->validPayload(['file_path' => $relativePath]);
        unset($payload['ukuran']);

        $this->postJson('/api/v1/documents', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ukuran');
    }

    /**
     * @param  array<string, string>  $overrides
     * @return array<string, string>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Rencana Kerja BAPPEDA 2026',
            'jenis' => 'renja',
            'bidang' => 'infrastruktur',
            'tahun' => '2026',
            'ukuran' => '1.20 MB',
            'uploaded_by' => 'Admin BAPPEDA',
        ], $overrides);
    }
}
