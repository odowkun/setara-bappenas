<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentAccessGrant;
use App\Models\DocumentDownloadLog;
use App\Models\DocumentVersion;
use App\Services\DocumentAccessService;
use App\Services\DocumentArchiveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentAnalyticsController extends Controller
{
    public function __construct(
        private readonly DocumentAccessService $documentAccessService,
        private readonly DocumentArchiveService $documentArchiveService
    ) {}

    public function preview(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'visitor_id' => ['nullable', 'string', 'max:128'],
        ]);

        $document = $this->publicDocument($id);
        $version = $this->currentVersion($document);
        $this->assertIntegrity($version);

        $rawGrant = Str::random(64);
        $visitorId = trim((string) ($validated['visitor_id'] ?? ''));
        $visitorHash = hash(
            'sha256',
            $visitorId !== '' ? $visitorId : (string) Str::uuid()
        );

        $metrics = DB::transaction(function () use (
            $document,
            $version,
            $visitorHash,
            $rawGrant
        ): array {
            $lockedDocument = Document::query()
                ->whereKey($document->id)
                ->lockForUpdate()
                ->firstOrFail();

            $accessGrant = DocumentAccessGrant::query()->create([
                'document_id' => $lockedDocument->id,
                'document_version_id' => $version->id,
                'purpose' => 'preview',
                'token_hash' => hash('sha256', $rawGrant),
                'expires_at' => now()->addMinutes(
                    (int) config('document-archive.preview_ttl_minutes', 5)
                ),
            ]);

            $created = DB::table('document_view_logs')->insertOrIgnore([
                [
                    'document_id' => $lockedDocument->id,
                    'document_version_id' => $version->id,
                    'access_grant_id' => $accessGrant->id,
                    'visitor_hash' => $visitorHash,
                    'viewed_on' => today()->toDateString(),
                    'viewed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]) === 1;

            $lockedDocument->increment('views');
            if ($created) {
                $lockedDocument->increment('unique_views');
            }
            $lockedDocument->refresh();

            return [
                'views' => (int) $lockedDocument->views,
                'unique_views' => (int) $lockedDocument->unique_views,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'document_id' => (string) $document->id,
                'version_id' => (string) $version->id,
                'version' => $version->version_label,
                'preview_url' => $this->documentAccessService
                    ->temporaryPreviewUrl($document, $version, $rawGrant),
                'expires_at' => now()
                    ->addMinutes((int) config('document-archive.preview_ttl_minutes', 5))
                    ->toIso8601String(),
                ...$metrics,
            ],
        ]);
    }

    public function download(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
        ]);

        $document = $this->publicDocument($id);
        $version = $this->currentVersion($document);
        $this->assertIntegrity($version);

        $normalizedEmail = Str::lower(trim($validated['email']));
        $rawGrant = Str::random(64);
        DocumentAccessGrant::query()->create([
            'document_id' => $document->id,
            'document_version_id' => $version->id,
            'purpose' => 'download',
            'token_hash' => hash('sha256', $rawGrant),
            'email' => $normalizedEmail,
            'email_hash' => hash('sha256', $normalizedEmail),
            'expires_at' => now()->addMinutes(
                (int) config('document-archive.download_ttl_minutes', 5)
            ),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Email diverifikasi. Tautan unduhan satu kali telah dibuat.',
            'data' => [
                'document_id' => (string) $document->id,
                'version_id' => (string) $version->id,
                'version' => $version->version_label,
                'download_url' => $this->documentAccessService
                    ->temporaryDownloadUrl($document, $version, $rawGrant),
                'expires_at' => now()
                    ->addMinutes((int) config('document-archive.download_ttl_minutes', 5))
                    ->toIso8601String(),
                'downloads' => (int) $document->downloads,
                'views' => (int) $document->views,
            ],
        ]);
    }

    public function downloadLogs(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['nullable', 'integer', 'exists:documents,id'],
            'email' => ['nullable', 'string', 'email:rfc', 'max:254'],
        ]);

        $query = DocumentDownloadLog::query()
            ->with([
                'document:id,title,jenis,bidang,archive_code',
                'version:id,version_label',
            ])
            ->when(
                $validated['document_id'] ?? null,
                fn ($builder, $documentId) => $builder->where('document_id', $documentId)
            )
            ->when(
                $validated['email'] ?? null,
                fn ($builder, $email) => $builder->where(
                    'email_hash',
                    hash('sha256', Str::lower(trim($email)))
                )
            );

        $summaryQuery = clone $query;
        $logs = $query
            ->latest('downloaded_at')
            ->limit(500)
            ->get()
            ->map(fn (DocumentDownloadLog $log): array => [
                'id' => (string) $log->id,
                'document_id' => (string) $log->document_id,
                'document_title' => $log->document?->title ?? 'Dokumen diarsipkan',
                'document_archive_code' => $log->document?->archive_code,
                'document_jenis' => $log->document?->jenis ?? '-',
                'document_bidang' => $log->document?->bidang ?? '-',
                'version' => $log->version?->version_label,
                'email' => $log->email,
                'ip_address' => null,
                'user_agent' => null,
                'downloaded_at' => $log->downloaded_at?->toIso8601String(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $logs,
            'summary' => [
                'total_downloads' => (clone $summaryQuery)->count(),
                'unique_emails' => (clone $summaryQuery)->distinct()->count('email_hash'),
                'downloads_today' => (clone $summaryQuery)
                    ->whereDate('downloaded_at', today())
                    ->count(),
            ],
        ]);
    }

    private function publicDocument(int $id): Document
    {
        return Document::query()
            ->whereKey($id)
            ->where('is_public', true)
            ->where('classification', 'public')
            ->where('governance_status', 'approved')
            ->where('storage_status', 'private')
            ->firstOrFail();
    }

    private function currentVersion(Document $document): DocumentVersion
    {
        $version = $document->currentVersion()->first();
        abort_if($version === null || $version->status !== 'approved', 404);

        return $version;
    }

    private function assertIntegrity(DocumentVersion $version): void
    {
        $this->documentArchiveService->verifyIntegrity($version);
        abort_unless(
            $version->fresh()->integrity_status === 'valid',
            409,
            'Integritas berkas tidak valid. Dokumen ditahan dari distribusi.'
        );
    }
}
