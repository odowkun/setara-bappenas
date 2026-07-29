<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_increments_the_database_view_counter(): void
    {
        $documentId = $this->createDocument(['views' => 4]);

        $this->postJson("/api/v1/documents/{$documentId}/preview")
            ->assertOk()
            ->assertJsonPath('data.views', 5);

        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'views' => 5,
        ]);
    }

    public function test_download_requires_a_valid_email_without_changing_counters(): void
    {
        $documentId = $this->createDocument(['downloads' => 7]);

        $this->postJson("/api/v1/documents/{$documentId}/download", [
            'email' => 'alamat-tidak-valid',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'downloads' => 7,
        ]);
        $this->assertDatabaseCount('document_download_logs', 0);
    }

    public function test_download_records_email_and_increments_counter_atomically(): void
    {
        $documentId = $this->createDocument(['downloads' => 2, 'views' => 9]);

        $this->withHeaders(['User-Agent' => 'BAPPEDA Feature Test'])
            ->postJson("/api/v1/documents/{$documentId}/download", [
                'email' => 'Warga@Example.COM',
            ])
            ->assertOk()
            ->assertJsonPath('data.downloads', 3)
            ->assertJsonPath('data.views', 9)
            ->assertJsonPath('data.download_url', 'https://example.com/dokumen.pdf');

        $this->assertDatabaseHas('document_download_logs', [
            'document_id' => $documentId,
            'email' => 'warga@example.com',
            'user_agent' => 'BAPPEDA Feature Test',
        ]);
        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'downloads' => 3,
        ]);
    }

    public function test_admin_can_filter_download_logs_by_document(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $firstDocumentId = $this->createDocument(['title' => 'Dokumen Pertama']);
        $secondDocumentId = $this->createDocument(['title' => 'Dokumen Kedua']);

        DB::table('document_download_logs')->insert([
            [
                'document_id' => $firstDocumentId,
                'email' => 'satu@example.com',
                'downloaded_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'document_id' => $secondDocumentId,
                'email' => 'dua@example.com',
                'downloaded_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->getJson("/api/v1/document-download-logs?document_id={$firstDocumentId}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'satu@example.com')
            ->assertJsonPath('summary.total_downloads', 1)
            ->assertJsonPath('summary.unique_emails', 1);
    }

    public function test_public_cannot_read_download_email_logs(): void
    {
        $this->getJson('/api/v1/document-download-logs')->assertUnauthorized();
    }

    private function createDocument(array $overrides = []): int
    {
        return DB::table('documents')->insertGetId(array_merge([
            'title' => 'Dokumen Publik',
            'jenis' => 'rkpd',
            'bidang' => 'semua',
            'tahun' => '2026',
            'ukuran' => '1.00 MB',
            'downloads' => 0,
            'views' => 0,
            'file_path' => 'https://example.com/dokumen.pdf',
            'is_public' => true,
            'uploaded_by' => 'Admin BAPPEDA',
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }
}
