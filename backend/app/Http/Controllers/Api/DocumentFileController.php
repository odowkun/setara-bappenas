<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentAccessGrant;
use App\Models\DocumentDownloadLog;
use App\Models\DocumentVersion;
use App\Services\DocumentAccessService;
use App\Services\DocumentArchiveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class DocumentFileController extends Controller
{
    public function __construct(
        private readonly DocumentAccessService $documentAccessService,
        private readonly DocumentArchiveService $documentArchiveService
    ) {}

    public function preview(
        Request $request,
        Document $document,
        DocumentVersion $version
    ): Response {
        $this->assertPublicVersion($document, $version);
        $this->validGrant($request, $document, $version, 'preview');
        $this->assertIntegrity($version);

        return $this->documentAccessService->inline($document, $version);
    }

    public function adminPreview(
        Request $request,
        Document $document,
        DocumentVersion $version
    ): Response {
        if ($actor = $request->user()) {
            if ($actor->hasRole('admin_bidang')) {
                abort_unless($actor->bidang === $document->bidang, 404);
                abort_if(
                    in_array($document->classification, ['confidential', 'restricted'], true),
                    404
                );
            }
        }

        abort_unless((int) $version->document_id === (int) $document->id, 404);
        $this->assertIntegrity($version);

        return $this->documentAccessService->inline($document, $version);
    }

    public function download(
        Request $request,
        Document $document,
        DocumentVersion $version
    ): Response {
        $this->assertPublicVersion($document, $version);
        $grant = $this->validGrant($request, $document, $version, 'download');
        $this->assertIntegrity($version);

        DB::transaction(function () use ($grant, $document, $version): void {
            $lockedGrant = DocumentAccessGrant::query()
                ->whereKey($grant->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_if($lockedGrant->consumed_at !== null, 410, 'Tautan unduhan sudah digunakan.');
            abort_if($lockedGrant->expires_at?->isPast(), 410, 'Tautan unduhan telah kedaluwarsa.');

            $lockedGrant->forceFill(['consumed_at' => now()])->save();

            DocumentDownloadLog::query()->create([
                'document_id' => $document->id,
                'document_version_id' => $version->id,
                'access_grant_id' => $lockedGrant->id,
                'email' => $lockedGrant->email,
                'email_hash' => $lockedGrant->email_hash,
                'ip_address' => null,
                'user_agent' => null,
                'downloaded_at' => now(),
            ]);

            $document->increment('downloads');
        });

        return $this->documentAccessService->download($document, $version);
    }

    private function validGrant(
        Request $request,
        Document $document,
        DocumentVersion $version,
        string $purpose
    ): DocumentAccessGrant {
        $token = $request->query('grant');
        abort_unless(is_string($token) && strlen($token) >= 32, 403, 'Grant akses tidak valid.');

        $grant = DocumentAccessGrant::query()
            ->where('token_hash', hash('sha256', $token))
            ->where('document_id', $document->id)
            ->where('document_version_id', $version->id)
            ->where('purpose', $purpose)
            ->first();

        abort_if($grant === null, 403, 'Grant akses tidak valid.');
        abort_if($grant->expires_at?->isPast(), 410, 'Grant akses telah kedaluwarsa.');
        abort_if(
            $purpose === 'download' && $grant->consumed_at !== null,
            410,
            'Tautan unduhan sudah digunakan.'
        );

        return $grant;
    }

    private function assertPublicVersion(
        Document $document,
        DocumentVersion $version
    ): void {
        $document->refresh();

        abort_unless(
            $document->is_public
                && $document->classification === 'public'
                && $document->governance_status === 'approved'
                && $document->storage_status === 'private'
                && (int) $document->current_version_id === (int) $version->id
                && (int) $version->document_id === (int) $document->id
                && $version->status === 'approved',
            404
        );
    }

    private function assertIntegrity(DocumentVersion $version): void
    {
        $this->documentArchiveService->verifyIntegrity($version);
        $version->refresh();

        abort_unless(
            $version->integrity_status === 'valid',
            409,
            'Integritas berkas tidak valid. Dokumen ditahan dari distribusi.'
        );
    }

    private function assertCanManage(Request $request, Document $document): void
    {
        $actor = $request->user();
        abort_if($actor === null, 401);

        if ($actor->hasRole('admin_bidang')) {
            abort_unless($actor->bidang === $document->bidang, 404);
            abort_if(
                in_array($document->classification, ['confidential', 'restricted'], true),
                404
            );
        }
    }
}
