<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentAccessGrant;
use App\Models\DocumentVersion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentKnowledgeArchiveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-07-29 10:00:00', 'Asia/Makassar'));
        Storage::fake('local');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_upload_creates_private_draft_with_immutable_version_one_and_server_checksum(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        [$document, $version, $response, $bytes] = $this->storeDraft(
            $uploader,
            'RKPD Infrastruktur Versi Awal'
        );

        $response
            ->assertCreated()
            ->assertJsonPath('data.classification', 'internal')
            ->assertJsonPath('data.governance_status', 'draft')
            ->assertJsonPath('data.storage_status', 'private')
            ->assertJsonPath('data.is_public', false)
            ->assertJsonPath('data.current_version', null)
            ->assertJsonPath('data.latest_version.id', (string) $version->id)
            ->assertJsonPath('data.latest_version.status', 'draft')
            ->assertJsonPath('data.latest_version.integrity_status', 'valid');

        $this->assertSame('infrastruktur', $document->bidang);
        $this->assertSame($uploader->id, $document->created_by_user_id);
        $this->assertSame(1, (int) $version->version_number);
        $this->assertSame('draft', $version->status);
        $this->assertSame(hash('sha256', $bytes), $version->checksum_sha256);
        $this->assertNull($document->current_version_id);
        Storage::disk('local')->assertExists($version->file_path);
    }

    public function test_public_catalog_excludes_unapproved_and_internal_documents(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $reviewer = $this->makeUser('admin_umum');

        [$visible] = $this->storeDraft($uploader, 'Dokumen Publik Disetujui');
        $this->approveAndPublish($visible, $uploader, $reviewer);

        [$unapproved] = $this->storeDraft($uploader, 'Dokumen Publik Belum Disetujui');
        $this->setClassification($unapproved, $reviewer, 'public');
        $unapproved->forceFill(['is_public' => true])->save();

        [$internal] = $this->storeDraft($uploader, 'Dokumen Internal Disetujui');
        $this->approve($internal, $uploader, $reviewer);
        $internal->forceFill(['is_public' => true])->save();

        $payload = $this->getJson('/api/v1/documents')
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('Dokumen Publik Disetujui', $payload);
        $this->assertStringNotContainsString('Dokumen Publik Belum Disetujui', $payload);
        $this->assertStringNotContainsString('Dokumen Internal Disetujui', $payload);
    }

    public function test_submit_approve_and_publish_uses_official_reviewer_workflow(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $reviewer = $this->makeUser('admin_umum');
        [$document, $version] = $this->storeDraft(
            $uploader,
            'Dokumen Melalui Review Resmi'
        );

        $this->setClassification($document, $reviewer, 'public');

        Sanctum::actingAs($uploader);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/submit",
            ['notes' => 'Mohon diperiksa oleh reviewer resmi.']
        )
            ->assertOk()
            ->assertJsonPath('data.governance_status', 'pending_review')
            ->assertJsonPath('data.latest_version.status', 'pending_review');
        $this->assertDatabaseHas('document_approval_logs', [
            'document_id' => $document->id,
            'document_version_id' => $version->id,
            'actor_user_id' => $uploader->id,
            'action' => 'submitted',
            'note' => 'Mohon diperiksa oleh reviewer resmi.',
        ]);

        Sanctum::actingAs($reviewer);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/review",
            [
                'decision' => 'approved',
                'notes' => 'Isi dan checksum telah diperiksa.',
            ]
        )
            ->assertOk()
            ->assertJsonPath('data.governance_status', 'approved')
            ->assertJsonPath('data.current_version.id', (string) $version->id)
            ->assertJsonPath('data.current_version.status', 'approved');

        $this->patchJson(
            "/api/v1/documents/{$document->id}/publication",
            ['is_published' => true]
        )
            ->assertOk()
            ->assertJsonPath('data.is_public', true);

        $this->assertDatabaseHas('document_approval_logs', [
            'document_id' => $document->id,
            'document_version_id' => $version->id,
            'actor_user_id' => $reviewer->id,
            'action' => 'approve',
            'to_status' => 'approved',
        ]);
        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'governance_status' => 'approved',
            'current_version_id' => $version->id,
            'is_public' => true,
            'published_by_user_id' => $reviewer->id,
        ]);
    }

    public function test_admin_bidang_cannot_approve_or_govern_another_bidang(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $otherBidang = $this->makeUser('admin_bidang', 'perekonomian');
        [$document] = $this->storeDraft(
            $uploader,
            'Dokumen Bidang Infrastruktur'
        );

        Sanctum::actingAs($uploader);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/submit",
            ['notes' => 'Diajukan untuk review.']
        )->assertOk();

        Sanctum::actingAs($uploader);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/review",
            ['decision' => 'approved', 'notes' => 'Menyetujui dokumen sendiri.']
        )->assertForbidden();

        Sanctum::actingAs($otherBidang);
        $this->getJson(
            "/api/v1/admin/documents/{$document->id}/governance"
        )->assertNotFound();

        Sanctum::actingAs($otherBidang);
        $this->putJson(
            "/api/v1/admin/documents/{$document->id}/governance",
            ['classification' => 'public']
        )->assertForbidden();

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'bidang' => 'infrastruktur',
            'classification' => 'internal',
            'governance_status' => 'pending_review',
        ]);
    }

    public function test_public_preview_returns_version_bound_signature_and_counts_unique_visitor_once_per_day(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $reviewer = $this->makeUser('admin_umum');
        [$document] = $this->storeDraft($uploader, 'Dokumen Statistik Preview');
        $document = $this->approveAndPublish($document, $uploader, $reviewer);
        $version = $document->currentVersion()->firstOrFail();

        $first = $this->postJson(
            "/api/v1/documents/{$document->id}/preview",
            ['visitor_id' => 'browser-warga-001']
        )
            ->assertOk()
            ->assertJsonPath('data.version_id', (string) $version->id)
            ->assertJsonPath('data.views', 1)
            ->assertJsonPath('data.unique_views', 1);

        $previewUrl = (string) $first->json('data.preview_url');
        $this->assertStringContainsString(
            "/api/v1/documents/{$document->id}/versions/{$version->id}/preview-file",
            $previewUrl
        );
        $this->assertStringContainsString('signature=', $previewUrl);
        $this->assertStringContainsString('grant=', $previewUrl);

        $this->get(
            "/api/v1/documents/{$document->id}/versions/{$version->id}/preview-file"
        )->assertForbidden();
        $this->get($previewUrl)->assertOk();

        $this->postJson(
            "/api/v1/documents/{$document->id}/preview",
            ['visitor_id' => 'browser-warga-001']
        )
            ->assertOk()
            ->assertJsonPath('data.views', 2)
            ->assertJsonPath('data.unique_views', 1);

        $this->travelTo(now()->addDay());
        $this->postJson(
            "/api/v1/documents/{$document->id}/preview",
            ['visitor_id' => 'browser-warga-001']
        )
            ->assertOk()
            ->assertJsonPath('data.views', 3)
            ->assertJsonPath('data.unique_views', 2);
    }

    public function test_admin_preview_url_serves_inline_stream_via_temporary_signed_route(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        [$document, $version] = $this->storeDraft(
            $uploader,
            'Dokumen Draft Untuk Admin Preview'
        );

        $adminIndexResponse = $this->actingAs($uploader)
            ->getJson('/api/v1/admin/documents')
            ->assertOk();

        $previewUrl = (string) $adminIndexResponse->json('data.0.preview_url');
        $this->assertNotEmpty($previewUrl);
        $this->assertStringContainsString('signature=', $previewUrl);

        // Akses langsung tanpa bearer token (seperti saat browser membuka link di tab baru)
        $this->get($previewUrl)
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        // Akses dengan URL yang ditamper harus 403 Forbidden
        $this->get($previewUrl.'tampered')
            ->assertForbidden();
    }

    public function test_email_download_grant_logs_and_increments_only_when_stream_is_consumed_once(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $reviewer = $this->makeUser('admin_umum');
        [$document] = $this->storeDraft($uploader, 'Dokumen Unduhan Terukur');
        $document = $this->approveAndPublish($document, $uploader, $reviewer);
        $version = $document->currentVersion()->firstOrFail();

        $grantResponse = $this->postJson(
            "/api/v1/documents/{$document->id}/download",
            ['email' => ' Warga@Example.COM ']
        )
            ->assertOk()
            ->assertJsonPath('data.version_id', (string) $version->id)
            ->assertJsonPath('data.downloads', 0);

        $this->assertDatabaseCount('document_download_logs', 0);
        $this->assertSame(0, $document->fresh()->downloads);

        $downloadUrl = (string) $grantResponse->json('data.download_url');
        $this->assertStringContainsString(
            "/api/v1/documents/{$document->id}/versions/{$version->id}/file",
            $downloadUrl
        );
        $this->get($downloadUrl)
            ->assertOk()
            ->assertHeader(
                'content-disposition',
                'attachment; filename=dokumen-unduhan-terukur-v1-0.pdf'
            );

        $this->assertDatabaseHas('document_download_logs', [
            'document_id' => $document->id,
            'document_version_id' => $version->id,
            'email_hash' => hash('sha256', 'warga@example.com'),
        ]);
        $this->assertSame(1, $document->fresh()->downloads);
        $this->assertNotNull(
            DocumentAccessGrant::query()
                ->where('document_id', $document->id)
                ->where('purpose', 'download')
                ->firstOrFail()
                ->consumed_at
        );

        $this->get($downloadUrl)->assertStatus(410);
        $this->assertDatabaseCount('document_download_logs', 1);
        $this->assertSame(1, $document->fresh()->downloads);
    }

    public function test_approved_revision_swaps_current_version_while_draft_keeps_old_current(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $reviewer = $this->makeUser('admin_umum');
        [$document] = $this->storeDraft($uploader, 'Dokumen Dengan Revisi');
        $document = $this->approveAndPublish($document, $uploader, $reviewer);
        $versionOne = $document->currentVersion()->firstOrFail();

        $revisionPath = 'documents/testing/revisi_kedua_watermarked.pdf';
        Storage::disk('local')->put(
            $revisionPath,
            $this->validPdfBytes('Isi resmi versi kedua')
        );

        Sanctum::actingAs($uploader);
        $revisionResponse = $this->postJson(
            "/api/v1/documents/{$document->id}/versions",
            [
                'file_path' => $revisionPath,
                'change_summary' => 'Memperbarui indikator pembangunan.',
            ]
        )
            ->assertCreated()
            ->assertJsonPath(
                'data.document.current_version.id',
                (string) $versionOne->id
            )
            ->assertJsonPath('data.version.version_number', 2)
            ->assertJsonPath('data.version.status', 'draft');

        $versionTwoId = (int) $revisionResponse->json('data.version.id');
        $this->assertSame(
            $versionOne->id,
            $document->fresh()->current_version_id
        );

        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/submit",
            ['notes' => 'Revisi kedua siap diperiksa.']
        )->assertOk();

        Sanctum::actingAs($reviewer);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/review",
            [
                'decision' => 'approved',
                'notes' => 'Revisi kedua sesuai dokumen sumber.',
            ]
        )
            ->assertOk()
            ->assertJsonPath('data.current_version.id', (string) $versionTwoId);

        $this->assertSame(
            $versionTwoId,
            $document->fresh()->current_version_id
        );
        $this->assertDatabaseHas('document_versions', [
            'id' => $versionOne->id,
            'document_id' => $document->id,
            'status' => 'approved',
        ]);
        $this->assertDatabaseHas('document_versions', [
            'id' => $versionTwoId,
            'document_id' => $document->id,
            'status' => 'approved',
        ]);
    }

    public function test_checksum_tampering_blocks_signed_stream_and_republication(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $reviewer = $this->makeUser('admin_umum');
        [$document] = $this->storeDraft($uploader, 'Dokumen Uji Integritas');
        $document = $this->approveAndPublish($document, $uploader, $reviewer);
        $version = $document->currentVersion()->firstOrFail();

        $previewUrl = (string) $this->postJson(
            "/api/v1/documents/{$document->id}/preview",
            ['visitor_id' => 'integrity-test-browser']
        )->assertOk()->json('data.preview_url');

        Storage::disk('local')->put(
            $version->file_path,
            'berkas telah diubah di luar alur arsip'
        );

        $this->get($previewUrl)->assertStatus(409);
        $this->assertNotSame(
            'valid',
            $version->fresh()->integrity_status
        );

        Sanctum::actingAs($reviewer);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/publication",
            ['is_published' => false]
        )->assertOk();
        $this->patchJson(
            "/api/v1/documents/{$document->id}/publication",
            ['is_published' => true]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('publication');

        $this->assertFalse((bool) $document->fresh()->is_public);
    }

    public function test_archive_honors_legal_hold_and_preserves_document_version_and_file(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $recordsOfficer = $this->makeUser('admin_umum');
        [$document, $version] = $this->storeDraft(
            $uploader,
            'Dokumen Retensi Permanen'
        );
        $originalPath = $version->file_path;

        Sanctum::actingAs($recordsOfficer);
        $this->putJson(
            "/api/v1/admin/documents/{$document->id}/governance",
            [
                'legal_hold' => true,
                'review_note' => 'Ditahan karena proses pemeriksaan resmi.',
            ]
        )
            ->assertOk()
            ->assertJsonPath('data.legal_hold', true);

        $this->deleteJson(
            "/api/v1/documents/{$document->id}",
            ['reason' => 'Permintaan pengarsipan rutin.']
        )->assertUnprocessable();

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'legal_hold' => true,
            'governance_status' => 'draft',
        ]);
        Storage::disk('local')->assertExists($originalPath);

        $this->putJson(
            "/api/v1/admin/documents/{$document->id}/governance",
            [
                'legal_hold' => false,
                'review_note' => 'Pemeriksaan selesai; hold dilepas.',
            ]
        )->assertOk();

        $this->deleteJson(
            "/api/v1/documents/{$document->id}",
            ['reason' => 'Masa aktif selesai; dipindahkan ke arsip.']
        )
            ->assertOk()
            ->assertJsonPath('data.governance_status', 'archived')
            ->assertJsonPath('data.is_public', false);

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'governance_status' => 'archived',
            'retention_status' => 'archived',
        ]);
        $this->assertDatabaseHas('document_versions', [
            'id' => $version->id,
            'document_id' => $document->id,
        ]);
        Storage::disk('local')->assertExists($originalPath);
    }

    public function test_ocr_full_text_public_search_only_returns_current_approved_public_document(): void
    {
        $uploader = $this->makeUser('admin_bidang', 'infrastruktur');
        $reviewer = $this->makeUser('admin_umum');

        [$publicDocument] = $this->storeDraft(
            $uploader,
            'Arsip Pangan Publik'
        );
        $publicDocument = $this->approveAndPublish(
            $publicDocument,
            $uploader,
            $reviewer
        );
        $publicVersion = $publicDocument->currentVersion()->firstOrFail();
        $publicVersion->forceFill([
            'full_text' => 'Strategi ketahanan pangan pala Galela tahun berjalan.',
            'extraction_status' => 'completed',
        ])->save();

        [$internalDocument] = $this->storeDraft(
            $uploader,
            'Catatan Pangan Internal'
        );
        $internalDocument = $this->approve(
            $internalDocument,
            $uploader,
            $reviewer
        );
        $internalDocument->forceFill(['is_public' => true])->save();
        $internalVersion = $internalDocument->currentVersion()->firstOrFail();
        $internalVersion->forceFill([
            'full_text' => 'Strategi ketahanan pangan pala Galela bersifat internal.',
            'extraction_status' => 'completed',
        ])->save();

        $payload = $this->getJson(
            '/api/v1/search?q='.urlencode('ketahanan pangan pala')
        )
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('Arsip Pangan Publik', $payload);
        $this->assertStringNotContainsString('Catatan Pangan Internal', $payload);
    }

    /**
     * @return array{Document, DocumentVersion, \Illuminate\Testing\TestResponse, string}
     */
    private function storeDraft(
        User $uploader,
        string $title
    ): array {
        $path = sprintf(
            'documents/testing/%s_watermarked.pdf',
            Str::slug($title)
        );
        $bytes = $this->validPdfBytes($title);
        Storage::disk('local')->put($path, $bytes);

        Sanctum::actingAs($uploader);
        $response = $this->postJson('/api/v1/documents', [
            'title' => $title,
            'summary' => 'Ringkasan resmi '.$title,
            'jenis' => 'rkpd',
            'bidang' => $uploader->bidang ?: 'semua',
            'tahun' => '2026',
            'ukuran' => strlen($bytes).' bytes',
            'file_path' => $path,
            'change_summary' => 'Unggahan versi awal.',
        ])->assertCreated();

        $document = Document::query()->findOrFail(
            (int) $response->json('data.id')
        );
        $version = DocumentVersion::query()
            ->where('document_id', $document->id)
            ->where('version_number', 1)
            ->firstOrFail();

        return [$document, $version, $response, $bytes];
    }

    private function approveAndPublish(
        Document $document,
        User $uploader,
        User $reviewer
    ): Document {
        $this->setClassification($document, $reviewer, 'public');
        $document = $this->approve($document, $uploader, $reviewer);

        Sanctum::actingAs($reviewer);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/publication",
            ['is_published' => true]
        )->assertOk();

        return $document->fresh();
    }

    private function approve(
        Document $document,
        User $uploader,
        User $reviewer
    ): Document {
        Sanctum::actingAs($uploader);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/submit",
            ['notes' => 'Diajukan melalui pengujian arsip.']
        )->assertOk();

        Sanctum::actingAs($reviewer);
        $this->patchJson(
            "/api/v1/documents/{$document->id}/workflow/review",
            [
                'decision' => 'approved',
                'notes' => 'Disetujui reviewer pengujian.',
            ]
        )->assertOk();

        return $document->fresh();
    }

    private function setClassification(
        Document $document,
        User $reviewer,
        string $classification
    ): void {
        Sanctum::actingAs($reviewer);
        $this->putJson(
            "/api/v1/admin/documents/{$document->id}/governance",
            [
                'classification' => $classification,
                'review_note' => 'Klasifikasi diverifikasi petugas arsip.',
            ]
        )->assertOk();
    }

    private function makeUser(string $role, ?string $bidang = null): User
    {
        $user = User::factory()->create([
            'role' => $role,
            'bidang' => $bidang,
            'allowed_document_permissions' => ['rkpd'],
        ]);
        $user->assignRole($role);

        return $user;
    }

    private function validPdfBytes(string $text): string
    {
        $pdf = new \FPDF;
        $pdf->AddPage();
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->Text(20, 30, Str::ascii($text));

        return $pdf->Output('S');
    }
}
