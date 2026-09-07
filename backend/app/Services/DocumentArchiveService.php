<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentApprovalLog;
use App\Models\DocumentVersion;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class DocumentArchiveService
{
    public function createInitialVersion(
        Document $document,
        string $filePath,
        User $actor,
        ?string $changeSummary = null
    ): DocumentVersion {
        return DB::transaction(function () use (
            $document,
            $filePath,
            $actor,
            $changeSummary
        ): DocumentVersion {
            $lockedDocument = $this->lockDocument($document);
            if ($lockedDocument->versions()->exists()) {
                throw ValidationException::withMessages([
                    'version' => 'Versi awal sudah tersedia untuk dokumen ini.',
                ]);
            }

            $version = $this->persistVersion(
                $lockedDocument,
                $filePath,
                $actor,
                1,
                $changeSummary ?? 'Unggahan awal'
            );

            // current_version_id is reserved for an approved, distributable version.
            $lockedDocument->forceFill([
                'archive_code' => $lockedDocument->archive_code
                    ?: $this->archiveCode($lockedDocument),
                'storage_status' => 'private',
                'governance_status' => 'draft',
                'current_version_id' => null,
                'is_public' => false,
                'published_at' => null,
                'published_by_user_id' => null,
            ])->save();

            return $version;
        });
    }

    public function addVersion(
        Document $document,
        string $filePath,
        User $actor,
        ?string $changeSummary = null
    ): DocumentVersion {
        return DB::transaction(function () use (
            $document,
            $filePath,
            $actor,
            $changeSummary
        ): DocumentVersion {
            $lockedDocument = $this->lockDocument($document);
            abort_if(
                $lockedDocument->governance_status === 'archived',
                409,
                'Dokumen yang telah diarsipkan tidak dapat menerima versi baru.'
            );

            $nextNumber = ((int) $lockedDocument->versions()->max('version_number')) + 1;
            $version = $this->persistVersion(
                $lockedDocument,
                $filePath,
                $actor,
                $nextNumber,
                $changeSummary
            );

            $lockedDocument->forceFill([
                'archive_code' => $lockedDocument->archive_code
                    ?: $this->archiveCode($lockedDocument),
                'storage_status' => 'private',
                'governance_status' => $lockedDocument->currentVersion?->status === 'approved'
                    ? 'approved'
                    : 'draft',
                'review_note' => null,
            ])->save();

            return $version;
        });
    }

    public function submit(
        Document $document,
        User $actor,
        ?string $note = null
    ): Document
    {
        return DB::transaction(function () use (
            $document,
            $actor,
            $note
        ): Document {
            $lockedDocument = $this->lockDocument($document);
            $version = $lockedDocument->latestVersion()->lockForUpdate()->first();
            if ($version === null) {
                throw ValidationException::withMessages([
                    'version' => 'Dokumen belum mempunyai versi untuk diajukan.',
                ]);
            }

            if (! in_array($version->status, ['draft', 'rejected'], true)) {
                throw ValidationException::withMessages([
                    'version' => 'Hanya versi draf atau versi yang ditolak yang dapat diajukan.',
                ]);
            }

            $this->verifyIntegrity($version);
            $version->refresh();
            if ($version->integrity_status !== 'valid') {
                throw ValidationException::withMessages([
                    'integrity' => 'Versi gagal verifikasi integritas dan tidak dapat diajukan.',
                ]);
            }

            $fromStatus = $lockedDocument->governance_status;
            $hasApprovedCurrent = $lockedDocument->currentVersion()
                ->where('status', 'approved')
                ->exists();

            $version->forceFill([
                'status' => 'pending_review',
                'submitted_at' => now(),
                'submitted_by_user_id' => $actor->id,
                'approved_at' => null,
                'approved_by_user_id' => null,
                'review_note' => null,
            ])->save();

            $lockedDocument->forceFill([
                'governance_status' => $hasApprovedCurrent
                    ? 'approved'
                    : 'pending_review',
                'submitted_at' => now(),
                'submitted_by_user_id' => $actor->id,
                'review_note' => null,
            ])->save();

            $this->recordApproval(
                $lockedDocument,
                $version,
                $actor,
                'submitted',
                $fromStatus,
                'pending_review',
                $note
            );

            return $lockedDocument->fresh();
        });
    }

    public function review(
        Document $document,
        User $actor,
        string $action,
        ?string $note = null
    ): Document {
        return DB::transaction(function () use (
            $document,
            $actor,
            $action,
            $note
        ): Document {
            abort_unless(
                $actor->hasRole('superadmin') || $actor->can('review_documents'),
                403,
                'Pengguna tidak memiliki kewenangan review dokumen.'
            );

            $normalizedAction = match ($action) {
                'approve', 'approved' => 'approve',
                'reject', 'rejected' => 'reject',
                default => null,
            };
            if ($normalizedAction === null) {
                throw ValidationException::withMessages([
                    'action' => 'Aksi review harus approve atau reject.',
                ]);
            }
            if ($normalizedAction === 'reject' && blank($note)) {
                throw ValidationException::withMessages([
                    'note' => 'Alasan penolakan wajib diisi.',
                ]);
            }

            $lockedDocument = $this->lockDocument($document);
            $version = $lockedDocument->latestVersion()->lockForUpdate()->first();
            if ($version === null || $version->status !== 'pending_review') {
                throw ValidationException::withMessages([
                    'version' => 'Tidak ada versi berstatus pending review.',
                ]);
            }
            if (
                ! $actor->hasRole('superadmin')
                && in_array(
                    (int) $actor->id,
                    [
                        (int) $version->created_by_user_id,
                        (int) $version->submitted_by_user_id,
                    ],
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'review' => 'Pembuat atau pengaju versi tidak dapat menyetujui dokumennya sendiri.',
                ]);
            }

            $fromStatus = $lockedDocument->governance_status;
            if ($normalizedAction === 'approve') {
                $this->verifyIntegrity($version);
                $version->refresh();
                if ($version->integrity_status !== 'valid') {
                    throw ValidationException::withMessages([
                        'integrity' => 'Versi tidak dapat disetujui karena checksum tidak valid.',
                    ]);
                }

                $version->forceFill([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by_user_id' => $actor->id,
                    'review_note' => $note,
                ])->save();

                $lockedDocument->forceFill([
                    'current_version_id' => $version->id,
                    'file_path' => $version->file_path,
                    'ukuran' => $this->formatFileSize((int) $version->file_size_bytes),
                    'storage_status' => 'private',
                    'governance_status' => 'approved',
                    'approved_at' => now(),
                    'approved_by_user_id' => $actor->id,
                    'review_note' => $note,
                ])->save();

                $toStatus = 'approved';
                $logAction = 'approve';
            } else {
                $version->forceFill([
                    'status' => 'rejected',
                    'approved_at' => null,
                    'approved_by_user_id' => null,
                    'review_note' => $note,
                ])->save();

                $hasApprovedCurrent = $lockedDocument->currentVersion()
                    ->where('status', 'approved')
                    ->exists();
                $toStatus = $hasApprovedCurrent ? 'approved' : 'rejected';
                $lockedDocument->forceFill([
                    'governance_status' => $toStatus,
                    'approved_at' => $hasApprovedCurrent
                        ? $lockedDocument->approved_at
                        : null,
                    'approved_by_user_id' => $hasApprovedCurrent
                        ? $lockedDocument->approved_by_user_id
                        : null,
                    'review_note' => $note,
                    'is_public' => $hasApprovedCurrent
                        ? $lockedDocument->is_public
                        : false,
                ])->save();
                $logAction = 'reject';
            }

            $this->recordApproval(
                $lockedDocument,
                $version,
                $actor,
                $logAction,
                $fromStatus,
                $toStatus,
                $note
            );

            return $lockedDocument->fresh();
        });
    }

    public function verifyIntegrity(DocumentVersion $version): DocumentVersion
    {
        $disk = $version->storage_disk ?: config('document-archive.disk', 'local');
        $status = 'missing';
        $actualChecksum = null;

        try {
            if (Storage::disk($disk)->exists($version->file_path)) {
                $absolutePath = Storage::disk($disk)->path($version->file_path);
                $actualChecksum = hash_file('sha256', $absolutePath);
                $status = hash_equals(
                    (string) $version->checksum_sha256,
                    (string) $actualChecksum
                ) ? 'valid' : 'mismatch';
            }
        } catch (Throwable) {
            $status = 'missing';
        }

        $version->forceFill([
            'integrity_status' => $status,
            'integrity_verified_at' => now(),
        ])->save();

        if ($status !== 'valid') {
            $document = $version->document()->first();
            $document?->forceFill([
                'is_public' => false,
                'published_at' => null,
                'published_by_user_id' => null,
                'storage_status' => $status === 'missing' ? 'missing' : 'private',
                'governance_status' => $status === 'missing'
                    && $document->governance_status !== 'archived'
                    ? 'pending_migration'
                    : $document->governance_status,
            ])->save();
        }

        return $version->fresh();
    }

    public function archive(
        Document $document,
        User $actor,
        ?string $note = null
    ): Document {
        return DB::transaction(function () use ($document, $actor, $note): Document {
            abort_unless(
                $actor->hasRole('superadmin')
                    || $actor->can('manage_document_retention'),
                403,
                'Pengguna tidak memiliki kewenangan retensi arsip.'
            );

            $lockedDocument = $this->lockDocument($document);
            if ($lockedDocument->legal_hold) {
                throw ValidationException::withMessages([
                    'legal_hold' => 'Dokumen berada dalam legal hold dan tidak dapat diarsipkan.',
                ]);
            }

            $fromStatus = $lockedDocument->governance_status;
            $currentVersion = $lockedDocument->currentVersion()
                ->lockForUpdate()
                ->first();
            if ($currentVersion !== null) {
                $currentVersion->forceFill(['status' => 'archived'])->save();
            }

            $lockedDocument->forceFill([
                'governance_status' => 'archived',
                'retention_status' => 'archived',
                'current_version_id' => null,
                'is_public' => false,
                'published_at' => null,
                'published_by_user_id' => null,
                'archived_at' => now(),
                'archived_by_user_id' => $actor->id,
                'archive_note' => $note,
            ])->save();

            $this->recordApproval(
                $lockedDocument,
                $currentVersion,
                $actor,
                'archived',
                $fromStatus,
                'archived',
                $note
            );

            return $lockedDocument->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateGovernance(
        Document $document,
        array $attributes,
        User $actor
    ): Document {
        return DB::transaction(function () use (
            $document,
            $attributes,
            $actor
        ): Document {
            $lockedDocument = $this->lockDocument($document);

            if (array_key_exists('classification', $attributes)) {
                abort_unless(
                    $actor->hasRole('superadmin')
                        || $actor->can('classify_documents'),
                    403,
                    'Pengguna tidak memiliki kewenangan klasifikasi dokumen.'
                );
            }

            $retentionFields = [
                'retention_policy',
                'retention_until',
                'legal_hold',
            ];
            if (array_intersect($retentionFields, array_keys($attributes)) !== []) {
                abort_unless(
                    $actor->hasRole('superadmin')
                        || $actor->can('manage_document_retention'),
                    403,
                    'Pengguna tidak memiliki kewenangan retensi arsip.'
                );
            }

            $allowed = [
                'document_number',
                'owner_opd',
                'classification',
                'keywords',
                'effective_at',
                'expires_at',
                'retention_policy',
                'retention_until',
                'legal_hold',
                'review_note',
            ];
            $updates = array_intersect_key($attributes, array_flip($allowed));
            $updates['archive_code'] = $lockedDocument->archive_code
                ?: $this->archiveCode($lockedDocument);

            if (
                array_key_exists('legal_hold', $updates)
                && (bool) $updates['legal_hold'] !== (bool) $lockedDocument->legal_hold
                && blank($updates['review_note'] ?? null)
            ) {
                throw ValidationException::withMessages([
                    'review_note' => 'Alasan menambah atau melepas legal hold wajib diisi.',
                ]);
            }

            if (($updates['retention_policy'] ?? null) === 'permanent') {
                $updates['retention_until'] = null;
            } elseif (
                isset($updates['retention_policy'])
                && blank($updates['retention_until'] ?? null)
            ) {
                $startDate = $updates['effective_at']
                    ?? $lockedDocument->effective_at
                    ?? today();
                $updates['retention_until'] = match ($updates['retention_policy']) {
                    'active_5_years' => Carbon::parse($startDate)->addYears(5)->toDateString(),
                    'active_10_years' => Carbon::parse($startDate)->addYears(10)->toDateString(),
                    default => $lockedDocument->retention_until,
                };
            }

            $legalHold = (bool) (
                $updates['legal_hold']
                ?? $lockedDocument->legal_hold
            );
            $retentionUntil = $updates['retention_until']
                ?? $lockedDocument->retention_until;
            $updates['retention_status'] = match (true) {
                $legalHold => 'held',
                $lockedDocument->governance_status === 'archived' => 'archived',
                $retentionUntil !== null && now()->startOfDay()->gte($retentionUntil) =>
                    'due',
                default => 'active',
            };

            if (
                isset($updates['classification'])
                && $updates['classification'] !== 'public'
            ) {
                $updates['is_public'] = false;
                $updates['published_at'] = null;
                $updates['published_by_user_id'] = null;
            }

            $fromStatus = $lockedDocument->governance_status;
            $lockedDocument->forceFill($updates)->save();
            $this->recordApproval(
                $lockedDocument,
                $lockedDocument->latestVersion()->first(),
                $actor,
                'governance_updated',
                $fromStatus,
                $lockedDocument->governance_status,
                $updates['review_note'] ?? null
            );

            return $lockedDocument->fresh();
        });
    }

    private function persistVersion(
        Document $document,
        string $filePath,
        User $actor,
        int $versionNumber,
        ?string $changeSummary
    ): DocumentVersion {
        $disk = (string) config('document-archive.disk', 'local');
        if (! Storage::disk($disk)->exists($filePath)) {
            throw ValidationException::withMessages([
                'file_path' => 'Berkas versi tidak ditemukan pada storage privat.',
            ]);
        }

        $absolutePath = Storage::disk($disk)->path($filePath);
        $checksum = hash_file('sha256', $absolutePath);
        if (! is_string($checksum)) {
            throw ValidationException::withMessages([
                'file_path' => 'Checksum berkas versi tidak dapat dihitung.',
            ]);
        }

        $latestChecksum = $document->latestVersion()->value('checksum_sha256');
        if ($latestChecksum !== null && hash_equals((string) $latestChecksum, $checksum)) {
            throw ValidationException::withMessages([
                'file_path' => 'Isi berkas identik dengan versi terbaru.',
            ]);
        }

        $mimeType = Storage::disk($disk)->mimeType($filePath);

        return $document->versions()->create([
            'version_number' => $versionNumber,
            'version_label' => 'v'.$versionNumber.'.0',
            'file_name' => basename($filePath),
            'file_path' => $filePath,
            'storage_disk' => $disk,
            'mime_type' => is_string($mimeType) ? $mimeType : 'application/pdf',
            'file_size_bytes' => Storage::disk($disk)->size($filePath),
            'checksum_sha256' => $checksum,
            'integrity_status' => 'valid',
            'integrity_verified_at' => now(),
            'extraction_status' => 'pending',
            'change_summary' => $changeSummary,
            'status' => 'draft',
            'created_by_user_id' => $actor->id,
        ]);
    }

    private function lockDocument(Document $document): Document
    {
        return Document::query()
            ->whereKey($document->getKey())
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function archiveCode(Document $document): string
    {
        return sprintf(
            '%s-%08d',
            (string) config('document-archive.code_prefix', 'BPH-DOC'),
            $document->getKey()
        );
    }

    private function recordApproval(
        Document $document,
        ?DocumentVersion $version,
        User $actor,
        string $action,
        ?string $fromStatus,
        string $toStatus,
        ?string $note = null
    ): void {
        DocumentApprovalLog::query()->create([
            'document_id' => $document->id,
            'document_version_id' => $version?->id,
            'actor_user_id' => $actor->id,
            'action' => $action,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'note' => $note,
        ]);
    }

    private function formatFileSize(int $bytes): string
    {
        return number_format($bytes / 1024 / 1024, 2).' MB';
    }
}
