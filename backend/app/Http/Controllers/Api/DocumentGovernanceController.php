<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Services\DocumentAccessService;
use App\Services\DocumentArchiveService;
use App\Services\DocumentTextExtractionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DocumentGovernanceController extends Controller
{
    public function __construct(
        private readonly DocumentArchiveService $documentArchiveService,
        private readonly DocumentAccessService $documentAccessService,
        private readonly DocumentTextExtractionService $textExtractionService
    ) {}

    public function show(Request $request, Document $document): JsonResponse
    {
        $this->assertCanManage($request, $document);

        return response()->json([
            'status' => 'success',
            'data' => $this->present($document),
        ]);
    }

    public function update(
        Request $request,
        Document $document
    ): JsonResponse {
        $this->assertCanManage($request, $document);
        $this->assertRecordsOfficer($request);

        $validated = $request->validate([
            'document_number' => ['nullable', 'string', 'max:150'],
            'owner_opd' => ['nullable', 'string', 'max:255'],
            'classification' => [
                'sometimes',
                Rule::in(['public', 'internal', 'confidential', 'restricted']),
            ],
            'keywords' => ['nullable', 'array', 'max:30'],
            'keywords.*' => ['string', 'max:80'],
            'effective_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:effective_at'],
            'retention_policy' => [
                'sometimes',
                Rule::in(['permanent', 'active_5_years', 'active_10_years', 'custom']),
            ],
            'retention_until' => [
                'nullable',
                'date',
                Rule::requiredIf(
                    $request->input('retention_policy') === 'custom'
                ),
            ],
            'legal_hold' => ['sometimes', 'boolean'],
            'review_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $updated = $this->documentArchiveService->updateGovernance(
            $document,
            $validated,
            $request->user()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Metadata tata kelola arsip berhasil diperbarui.',
            'data' => $this->present($updated),
        ]);
    }

    public function addVersion(
        Request $request,
        Document $document
    ): JsonResponse {
        $this->assertCanManage($request, $document);

        $validated = $request->validate([
            'file_path' => ['required', 'string', 'max:2048'],
            'change_summary' => ['nullable', 'string', 'max:2000'],
            'change_notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $filePath = $this->validatedPrivateFile($validated['file_path']);
        $changeSummary = trim((string) (
            $validated['change_summary']
            ?? $validated['change_notes']
            ?? ''
        ));
        if ($changeSummary === '') {
            throw ValidationException::withMessages([
                'change_summary' => 'Ringkasan perubahan versi wajib diisi.',
            ]);
        }

        $version = $this->documentArchiveService->addVersion(
            $document,
            $filePath,
            $request->user(),
            $changeSummary
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Versi baru tersimpan sebagai draf tanpa menimpa versi aktif.',
            'data' => [
                'version' => $this->presentVersion($version),
                'document' => $this->present($document->fresh()),
            ],
        ], 201);
    }

    public function submit(
        Request $request,
        Document $document
    ): JsonResponse {
        $this->assertCanManage($request, $document);
        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $note = $validated['note'] ?? $validated['notes'] ?? null;

        $updated = $this->documentArchiveService->submit(
            $document,
            $request->user(),
            $note
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Versi terbaru diajukan untuk review resmi.',
            'data' => $this->present($updated),
        ]);
    }

    public function review(
        Request $request,
        Document $document
    ): JsonResponse {
        $this->assertCanManage($request, $document);
        $this->assertReviewer($request);

        $validated = $request->validate([
            'action' => ['nullable', Rule::in(['approve', 'reject'])],
            'decision' => ['nullable', Rule::in(['approved', 'rejected'])],
            'note' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $action = $validated['action']
            ?? match ($validated['decision'] ?? null) {
                'approved' => 'approve',
                'rejected' => 'reject',
                default => null,
            };
        if ($action === null) {
            throw ValidationException::withMessages([
                'action' => 'Keputusan review wajib diisi.',
            ]);
        }
        $note = $validated['note'] ?? $validated['notes'] ?? null;
        if ($action === 'reject' && blank($note)) {
            throw ValidationException::withMessages([
                'note' => 'Alasan penolakan wajib diisi.',
            ]);
        }

        $updated = $this->documentArchiveService->review(
            $document,
            $request->user(),
            $action,
            $note
        );

        return response()->json([
            'status' => 'success',
            'message' => $action === 'approve'
                ? 'Versi disetujui dan ditetapkan sebagai versi aktif.'
                : 'Versi ditolak dan versi aktif sebelumnya tetap dipertahankan.',
            'data' => $this->present($updated),
        ]);
    }

    public function verify(
        Request $request,
        Document $document
    ): JsonResponse {
        $this->assertCanManage($request, $document);
        $this->assertRecordsOfficer($request);

        $version = $document->latestVersion()->firstOrFail();
        $verified = $this->documentArchiveService->verifyIntegrity($version);

        return response()->json([
            'status' => 'success',
            'message' => $verified->integrity_status === 'valid'
                ? 'Checksum sesuai dengan berkas privat.'
                : 'Checksum tidak sesuai. Berkas ditahan dari distribusi.',
            'data' => $this->presentVersion($verified),
        ]);
    }

    public function extract(
        Request $request,
        Document $document,
        DocumentVersion $version
    ): JsonResponse {
        $this->assertCanManage($request, $document);
        abort_unless((int) $version->document_id === (int) $document->id, 404);

        $processed = $this->textExtractionService->extract($version);

        return response()->json([
            'status' => 'success',
            'message' => match ($processed->extraction_status) {
                'completed' => 'Ekstraksi teks selesai dan indeks pencarian diperbarui.',
                'unavailable' => 'Teks tertanam tidak ditemukan dan OCR belum tersedia.',
                default => 'Ekstraksi teks selesai dengan status '.$processed->extraction_status.'.',
            },
            'data' => $this->presentVersion($processed),
        ]);
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

    private function assertReviewer(Request $request): void
    {
        abort_unless(
            $request->user()?->hasAnyRole(['superadmin', 'admin_umum']),
            403,
            'Hanya reviewer resmi yang dapat menyetujui atau menolak versi.'
        );
    }

    private function assertRecordsOfficer(Request $request): void
    {
        abort_unless(
            $request->user()?->hasAnyRole(['superadmin', 'admin_umum']),
            403,
            'Metadata klasifikasi, retensi, dan integritas hanya dikelola petugas arsip.'
        );
    }

    private function validatedPrivateFile(string $filePath): string
    {
        $relativePath = $this->documentAccessService->privateRelativePath($filePath);
        if (
            $relativePath === null
            || ! str_ends_with($relativePath, '_watermarked.pdf')
            || ! Storage::disk('local')->exists($relativePath)
        ) {
            throw ValidationException::withMessages([
                'file_path' => 'Versi harus berupa PDF ber-watermark pada storage privat.',
            ]);
        }

        return $relativePath;
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Document $document): array
    {
        $document->load([
            'currentVersion',
            'latestVersion',
            'versions' => fn ($query) => $query->latest('version_number'),
            'approvalLogs.actor:id,name,role',
        ]);

        $latestVersion = $document->latestVersion;
        $previewUrl = $latestVersion
            ? $this->documentAccessService->temporaryAdminPreviewUrl(
                $document,
                $latestVersion
            )
            : null;

        return [
            'id' => (string) $document->id,
            'archive_code' => $document->archive_code,
            'document_number' => $document->document_number,
            'title' => $document->title,
            'summary' => $document->summary,
            'jenis' => $document->jenis,
            'bidang' => $document->bidang,
            'tahun' => (string) $document->tahun,
            'ukuran' => $document->ukuran,
            'owner_opd' => $document->owner_opd,
            'classification' => $document->classification,
            'governance_status' => $document->governance_status,
            'storage_status' => $document->storage_status,
            'keywords' => $document->keywords ?? [],
            'effective_at' => $document->effective_at?->toDateString(),
            'expires_at' => $document->expires_at?->toDateString(),
            'retention_policy' => $document->retention_policy,
            'retention_until' => $document->retention_until?->toDateString(),
            'retention_status' => $document->retention_status,
            'legal_hold' => (bool) $document->legal_hold,
            'review_note' => $document->review_note,
            'is_public' => (bool) $document->is_public,
            'published_at' => $document->published_at?->toIso8601String(),
            'submitted_at' => $document->submitted_at?->toIso8601String(),
            'approved_at' => $document->approved_at?->toIso8601String(),
            'downloads' => (int) $document->downloads,
            'views' => (int) $document->views,
            'unique_views' => (int) $document->unique_views,
            'uploaded_by' => $document->uploaded_by,
            'preview_url' => $previewUrl,
            'current_version' => $document->currentVersion
                ? $this->presentVersion($document->currentVersion)
                : null,
            'latest_version' => $latestVersion
                ? $this->presentVersion($latestVersion)
                : null,
            'versions' => $document->versions
                ->map(fn (DocumentVersion $version) => $this->presentVersion($version))
                ->values(),
            'approval_logs' => $document->approvalLogs
                ->map(fn ($log): array => [
                    'id' => (string) $log->id,
                    'action' => $log->action,
                    'from_status' => $log->from_status,
                    'to_status' => $log->to_status,
                    'note' => $log->note,
                    'actor' => $log->actor ? [
                        'id' => (string) $log->actor->id,
                        'name' => $log->actor->name,
                        'role' => $log->actor->role,
                    ] : null,
                    'created_at' => $log->created_at?->toIso8601String(),
                ])
                ->values(),
            'created_at' => $document->created_at?->toIso8601String(),
            'updated_at' => $document->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentVersion(DocumentVersion $version): array
    {
        return [
            'id' => (string) $version->id,
            'version_number' => (int) $version->version_number,
            'version_label' => $version->version_label,
            'file_name' => $version->file_name,
            'mime_type' => $version->mime_type,
            'file_size_bytes' => (int) $version->file_size_bytes,
            'checksum_sha256' => $version->checksum_sha256,
            'integrity_status' => $version->integrity_status,
            'integrity_verified_at' => $version->integrity_verified_at?->toIso8601String(),
            'extraction_status' => $version->extraction_status,
            'extraction_method' => $version->extraction_method,
            'extracted_at' => $version->extracted_at?->toIso8601String(),
            'searchable_characters' => mb_strlen((string) $version->full_text),
            'change_summary' => $version->change_summary,
            'status' => $version->status,
            'submitted_at' => $version->submitted_at?->toIso8601String(),
            'approved_at' => $version->approved_at?->toIso8601String(),
            'review_note' => $version->review_note,
            'created_at' => $version->created_at?->toIso8601String(),
        ];
    }
}
