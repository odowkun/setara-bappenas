<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentStoreWatermarkTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_rejects_a_document_that_did_not_come_from_watermark_processing(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/v1/documents', $this->validPayload([
            'file_path' => 'https://example.com/dokumen-asli.pdf',
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file_path');
        $this->assertDatabaseCount('documents', 0);
    }

    public function test_it_saves_a_verified_watermarked_document(): void
    {
        Storage::fake('public');
        $relativePath = 'documents/2026/07/rencana_kerja_watermarked.pdf';
        Storage::disk('public')->put($relativePath, '%PDF-1.4 test');

        $response = $this->postJson('/api/v1/documents', $this->validPayload([
            'file_path' => 'http://localhost:8000/storage/'.$relativePath,
        ]));

        $response
            ->assertCreated()
            ->assertJsonPath('data.file_path', 'http://localhost:8000/storage/'.$relativePath);
        $this->assertDatabaseHas('documents', [
            'title' => 'Rencana Kerja BAPPEDA 2026',
            'file_path' => 'http://localhost:8000/storage/'.$relativePath,
        ]);
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
