<?php

namespace Tests\Feature;

use App\Models\DocumentDownloadLog;
use App\Models\DocumentVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Storage::disk('local')->put('documents/test_watermarked.pdf', '%PDF-1.4 test');
    }

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

        $response = $this->withHeaders(['User-Agent' => 'BAPPEDA Feature Test'])
            ->postJson("/api/v1/documents/{$documentId}/download", [
                'email' => 'Warga@Example.COM',
            ])
            ->assertOk()
            ->assertJsonPath('data.downloads', 2)
            ->assertJsonPath('data.views', 9);

        $downloadUrl = (string) $response->json('data.download_url');
        $this->assertStringContainsString(
            "/api/v1/documents/{$documentId}/versions/",
            $downloadUrl
        );
        $this->assertDatabaseCount('document_download_logs', 0);
        $this->get($downloadUrl)
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename=dokumen-publik-v1-0.pdf');
        $this->get($downloadUrl)->assertStatus(410);

        $log = DocumentDownloadLog::query()->firstOrFail();
        $this->assertSame($documentId, $log->document_id);
        $this->assertSame('warga@example.com', $log->email);
        $this->assertSame(hash('sha256', 'warga@example.com'), $log->email_hash);
        $this->assertNull($log->ip_address);
        $this->assertNull($log->user_agent);
        $this->assertNotSame(
            'warga@example.com',
            DB::table('document_download_logs')->where('id', $log->id)->value('email')
        );
        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'downloads' => 3,
        ]);
    }

    public function test_admin_can_filter_download_logs_by_document(): void
    {
        $user = User::factory()->create(['role' => 'admin_umum']);
        $user->assignRole('admin_umum');
        Sanctum::actingAs($user);
        $firstDocumentId = $this->createDocument(['title' => 'Dokumen Pertama']);
        $secondDocumentId = $this->createDocument(['title' => 'Dokumen Kedua']);

        DocumentDownloadLog::query()->create(
            [
                'document_id' => $firstDocumentId,
                'email' => 'satu@example.com',
                'email_hash' => hash('sha256', 'satu@example.com'),
                'downloaded_at' => now(),
            ]
        );
        DocumentDownloadLog::query()->create(
            [
                'document_id' => $secondDocumentId,
                'email' => 'dua@example.com',
                'email_hash' => hash('sha256', 'dua@example.com'),
                'downloaded_at' => now(),
            ]
        );

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

    public function test_public_document_response_hides_the_storage_path_and_serves_inline_preview(): void
    {
        $documentId = $this->createDocument();

        $this->getJson('/api/v1/documents')
            ->assertOk()
            ->assertJsonPath('data.0.file_path', null)
            ->assertJsonPath('data.0.preview_url', null);

        $previewUrl = $this->postJson(
            "/api/v1/documents/{$documentId}/preview",
            ['visitor_id' => 'analytics-test-browser']
        )->assertOk()->json('data.preview_url');

        $this->get($previewUrl)
            ->assertOk()
            ->assertHeader('content-disposition', 'inline; filename=dokumen-publik-v1-0.pdf')
            ->assertHeaderMissing('X-Frame-Options');
    }

    private function createDocument(array $overrides = []): int
    {
        $documentId = DB::table('documents')->insertGetId(array_merge([
            'title' => 'Dokumen Publik',
            'jenis' => 'rkpd',
            'bidang' => 'semua',
            'tahun' => '2026',
            'ukuran' => '1.00 MB',
            'downloads' => 0,
            'views' => 0,
            'file_path' => 'documents/test_watermarked.pdf',
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
            'file_path' => 'documents/test_watermarked.pdf',
            'file_name' => 'test_watermarked.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => Storage::disk('local')->size('documents/test_watermarked.pdf'),
            'checksum_sha256' => hash_file(
                'sha256',
                Storage::disk('local')->path('documents/test_watermarked.pdf')
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
}
