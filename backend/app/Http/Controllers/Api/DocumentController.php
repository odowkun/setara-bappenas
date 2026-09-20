<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\GeoprocessingAnalysis;
use App\Services\DocumentAccessService;
use App\Services\DocumentArchiveService;
use App\Services\DocumentWatermarkService;
use App\Services\EsriGisService;
use App\Services\OfficialPublicationService;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Pion\Laravel\ChunkUpload\Exceptions\UploadMissingFileException;
use Pion\Laravel\ChunkUpload\Handler\HandlerFactory;
use Pion\Laravel\ChunkUpload\Receiver\FileReceiver;
use Throwable;

class DocumentController extends Controller
{
    public function __construct(
        private readonly DocumentWatermarkService $documentWatermarkService,
        private readonly DocumentAccessService $documentAccessService,
        private readonly DocumentArchiveService $documentArchiveService,
        private readonly OfficialPublicationService $publicationService,
        private readonly EsriGisService $esriService
    ) {}

    public function index(Request $request)
    {
        $query = Document::query()
            ->publiclyAvailable()
            ->with('currentVersion');

        if ($request->filled('bidang') && $request->string('bidang')->toString() !== 'semua') {
            $query->where(function ($builder) use ($request): void {
                $builder
                    ->where('bidang', $request->string('bidang')->toString())
                    ->orWhere('bidang', 'semua');
            });
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $query
                ->latest('published_at')
                ->get()
                ->map(fn (Document $document): array => $this->presentDocument($document)),
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = Document::query()->with(['currentVersion', 'latestVersion']);
        $actor = $request->user();

        if ($actor->hasRole('admin_bidang')) {
            $query
                ->where('bidang', $actor->bidang)
                ->whereNotIn('classification', ['confidential', 'restricted']);
        } elseif ($request->filled('bidang') && $request->string('bidang')->toString() !== 'semua') {
            $query->where('bidang', $request->string('bidang')->toString());
        }

        foreach (['classification', 'governance_status', 'storage_status', 'retention_status'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->string($filter)->toString());
            }
        }

        if ($request->filled('q')) {
            $needle = $request->string('q')->trim()->toString();
            $query->where(function ($builder) use ($needle): void {
                $builder
                    ->where('title', 'like', "%{$needle}%")
                    ->orWhere('archive_code', 'like', "%{$needle}%")
                    ->orWhere('document_number', 'like', "%{$needle}%")
                    ->orWhere('owner_opd', 'like', "%{$needle}%");
            });
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $query
                ->latest('updated_at')
                ->get()
                ->map(fn (Document $document): array => $this->presentDocument($document, true)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:10000'],
            'jenis' => ['required', 'string', 'max:100'],
            'bidang' => [
                'required',
                'string',
                Rule::in(['semua', 'infrastruktur', 'perekonomian', 'sosbud', 'renval']),
            ],
            'tahun' => ['required', 'string', 'max:20'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            'ukuran' => ['required', 'string', 'max:50'],
            'file_path' => ['required', 'string', 'max:2048'],
            'document_number' => ['nullable', 'string', 'max:150'],
            'owner_opd' => ['nullable', 'string', 'max:255'],
            'classification' => [
                'nullable',
                Rule::in(['public', 'internal', 'confidential', 'restricted']),
            ],
            'keywords' => ['nullable', 'array', 'max:30'],
            'keywords.*' => ['string', 'max:80'],
            'effective_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:effective_at'],
            'retention_policy' => [
                'nullable',
                Rule::in(['permanent', 'active_5_years', 'active_10_years', 'custom']),
            ],
            'retention_until' => [
                'nullable',
                'date',
                Rule::requiredIf(
                    $request->input('retention_policy') === 'custom'
                ),
            ],
            'change_summary' => ['nullable', 'string', 'max:2000'],
            'submit_for_review' => ['sometimes', 'boolean'],
            // Legacy clients are accepted, but this flag never bypasses review.
            'is_public' => ['sometimes', 'boolean'],
        ]);

        $actor = $request->user();
        $allowedTypes = $actor->allowed_document_permissions
            ?? $this->defaultDocumentPermissions($actor->role);

        if (! $actor->hasRole('superadmin') && ! in_array($validated['jenis'], $allowedTypes, true)) {
            abort(403, 'Jenis dokumen tidak termasuk hak unggah pengguna.');
        }

        $bidang = $actor->hasRole('admin_bidang')
            ? $actor->bidang
            : $validated['bidang'];
        $classification = $actor->hasRole('admin_bidang')
            ? 'internal'
            : ($validated['classification'] ?? 'internal');
        $privateFilePath = $this->validateWatermarkedFilePath($validated['file_path']);
        $retentionPolicy = $validated['retention_policy'] ?? 'permanent';
        $retentionUntil = $this->retentionUntil(
            $retentionPolicy,
            $validated['retention_until'] ?? null,
            $validated['effective_at']
                ?? $validated['tanggal_mulai']
                ?? null
        );

        $document = DB::transaction(function () use (
            $validated,
            $actor,
            $bidang,
            $classification,
            $privateFilePath,
            $retentionPolicy,
            $retentionUntil
        ): Document {
            $document = Document::query()->create([
                'title' => $validated['title'],
                'summary' => $validated['summary'] ?? null,
                'jenis' => $validated['jenis'],
                'bidang' => $bidang,
                'tahun' => $validated['tahun'],
                'tanggal_mulai' => $validated['tanggal_mulai'] ?? null,
                'tanggal_selesai' => $validated['tanggal_selesai'] ?? null,
                'ukuran' => $validated['ukuran'],
                'downloads' => 0,
                'views' => 0,
                'unique_views' => 0,
                'file_path' => $privateFilePath,
                'is_public' => false,
                'uploaded_by' => $actor->name,
                'created_by_user_id' => $actor->id,
                'document_number' => $validated['document_number'] ?? null,
                'owner_opd' => $validated['owner_opd'] ?? 'BAPPEDA Kabupaten Halmahera Utara',
                'classification' => $classification,
                'governance_status' => 'draft',
                'storage_status' => 'private',
                'keywords' => $validated['keywords'] ?? [],
                'effective_at' => $validated['effective_at'] ?? null,
                'expires_at' => $validated['expires_at'] ?? null,
                'retention_policy' => $retentionPolicy,
                'retention_until' => $retentionUntil,
                'retention_status' => $retentionUntil !== null
                    && today()->gte(Carbon::parse($retentionUntil))
                        ? 'due'
                        : 'active',
                'legal_hold' => false,
            ]);

            $this->documentArchiveService->createInitialVersion(
                $document,
                $privateFilePath,
                $actor,
                $validated['change_summary'] ?? 'Unggahan awal'
            );

            if (
                (bool) ($validated['submit_for_review'] ?? false)
                || (bool) ($validated['is_public'] ?? false)
            ) {
                $document = $this->documentArchiveService->submit($document, $actor);
            }

            return $document->fresh();
        });

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => $document->governance_status === 'pending_review'
                ? 'Dokumen tersimpan dan diajukan untuk review.'
                : 'Dokumen tersimpan sebagai draf arsip privat.',
            'data' => $this->presentDocument($document, true),
        ], 201);
    }

    public function updatePublication(Request $request, Document $document)
    {
        $validated = $request->validate([
            'is_published' => ['required', 'boolean'],
        ]);

        $actor = $request->user();
        abort_unless(
            $actor->hasAnyRole(['superadmin', 'admin_umum']),
            403,
            'Admin bidang dapat mengajukan review, tetapi tidak dapat menerbitkan dokumen.'
        );

        $document = $this->publicationService->update(
            $document,
            $validated['is_published'],
            $actor
        );

        return response()->json([
            'status' => 'success',
            'message' => $document->is_public
                ? 'Versi aktif dokumen berhasil diterbitkan.'
                : 'Dokumen ditarik dari katalog publik tanpa menghapus arsip.',
            'data' => $this->presentDocument($document, true),
        ]);
    }

    public function uploadChunk(Request $request)
    {
        $originalName = $request->file('file')?->getClientOriginalName() ?? '';
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if ($extension !== 'pdf') {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Hanya berkas format PDF resmi (.pdf) yang diperbolehkan untuk dokumen perencanaan BAPPEDA HALUT.',
            ], 422);
        }

        $receiver = new FileReceiver(
            'file',
            $request,
            HandlerFactory::classFromRequest($request)
        );

        if ($receiver->isUploaded() === false) {
            throw new UploadMissingFileException;
        }

        $save = $receiver->receive();
        if ($save->isFinished()) {
            return $this->saveFile($save->getFile());
        }

        $handler = $save->handler();

        return response()->json([
            'status' => 'chunk_received',
            'progress' => $handler->getPercentageDone(),
            'bytes_received' => $handler->getPercentageDone(),
        ]);
    }

    protected function saveFile(UploadedFile $file)
    {
        $destinationDirectory = 'documents/'.date('Y/m');

        try {
            $processedDocument = $this->documentWatermarkService->process(
                $file,
                $destinationDirectory
            );

            return response()->json([
                'status' => 'success',
                'code' => 200,
                'message' => 'Berkas tersimpan privat dan watermark BAPPEDA HALUT diterapkan.',
                'file_path' => $processedDocument['relative_path'],
                'file_name' => $processedDocument['file_name'],
                'file_size' => $this->formatFileSize($processedDocument['file_size_bytes']),
                'watermark_applied' => true,
            ]);
        } catch (Throwable $exception) {
            Log::error('Document watermark processing failed.', [
                'file_name' => $file->getClientOriginalName(),
                'exception' => $exception,
            ]);

            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function destroy(Document $document, Request $request)
    {
        if (
            $request->user()->hasRole('admin_bidang')
            && $document->bidang !== $request->user()->bidang
        ) {
            abort(404);
        }

        // Mode hapus permanen: bersihkan dokumen induk beserta seluruh tagging proyek, progress, lampiran teknis & ESRI
        if (
            $request->boolean('permanent')
            || $request->boolean('force')
            || $request->query('permanent') === '1'
            || $request->query('force') === '1'
            || $request->input('action') === 'permanent'
        ) {
            if ($document->legal_hold) {
                return response()->json([
                    'status' => 'error',
                    'code' => 422,
                    'message' => 'Dokumen berstatus legal hold resmi tidak dapat dihapus permanen.',
                ], 422);
            }

            DB::transaction(function () use ($document): void {
                $document->loadMissing(['proyekDetails.attachments', 'versions']);

                // 1. Hapus cascade seluruh geotagging proyek, data progres, lampiran fisik, dan fitur ESRI
                foreach ($document->proyekDetails as $proyek) {
                    // Hapus lampiran fisik dan record proyek_attachments
                    foreach ($proyek->attachments as $attachment) {
                        $relativeStoragePath = str_replace('/storage/', 'public/', $attachment->file_path);
                        if (Storage::disk('public')->exists($relativeStoragePath)) {
                            Storage::disk('public')->delete($relativeStoragePath);
                        }
                        if (Storage::exists($relativeStoragePath)) {
                            Storage::delete($relativeStoragePath);
                        }
                        $attachment->delete();
                    }

                    // Hapus direktori folder lampiran jika ada
                    if (Storage::disk('public')->exists("proyek_attachments/{$proyek->id}")) {
                        Storage::disk('public')->deleteDirectory("proyek_attachments/{$proyek->id}");
                    }

                    // Hapus fitur dari ESRI ArcGIS Service jika ada
                    if ($proyek->esri_objectid) {
                        try {
                            $this->esriService->deleteFeature((int) $proyek->esri_objectid);
                        } catch (Throwable $e) {
                            Log::warning("Gagal menghapus fitur ESRI OBJECTID {$proyek->esri_objectid}: {$e->getMessage()}");
                        }
                    }

                    // Hapus analisis geoprocessing yang terikat
                    GeoprocessingAnalysis::where('proyek_detail_id', $proyek->id)->delete();

                    // Hapus data proyek fisik (termasuk pagu, realisasi, progres)
                    $proyek->delete();
                }

                // 2. Hapus berkas fisik versi dokumen dan record versinya
                foreach ($document->versions as $version) {
                    if ($version->file_path && Storage::disk('local')->exists($version->file_path)) {
                        Storage::disk('local')->delete($version->file_path);
                    }
                    $version->delete();
                }

                // Hapus berkas file_path induk jika tersimpan terpisah
                if ($document->file_path && Storage::disk('local')->exists($document->file_path)) {
                    Storage::disk('local')->delete($document->file_path);
                }

                // 3. Bersihkan log terkait
                $document->approvalLogs()->delete();
                $document->viewLogs()->delete();
                $document->accessGrants()->delete();
                $document->downloadLogs()->delete();

                // 4. Hapus record dokumen induk
                $document->delete();
            });

            return response()->json([
                'status' => 'success',
                'code' => 200,
                'message' => 'Dokumen induk beserta seluruh tagging proyek, data progres, dan lampiran teknis terkait berhasil dihapus permanen.',
            ]);
        }

        $archived = $this->documentArchiveService->archive(
            $document,
            $request->user(),
            $request->string('reason')->trim()->toString() ?: null
        );

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Dokumen diarsipkan. Versi, checksum, dan histori tetap dipertahankan.',
            'data' => $this->presentDocument($archived, true),
        ]);
    }

    private function validateWatermarkedFilePath(string $filePath): string
    {
        $relativePath = $this->documentAccessService->privateRelativePath($filePath);
        $isWatermarkedPdf = is_string($relativePath)
            && str_ends_with($relativePath, '_watermarked.pdf');

        if (! $isWatermarkedPdf || ! Storage::disk('local')->exists($relativePath)) {
            throw ValidationException::withMessages([
                'file_path' => 'Dokumen harus berasal dari hasil watermark BAPPEDA HALUT.',
            ]);
        }

        return $relativePath;
    }

    /**
     * @return array<string, mixed>
     */
    private function presentDocument(Document $document, bool $admin = false): array
    {
        $document->loadMissing(['currentVersion', 'latestVersion']);
        $latestVersion = $document->latestVersion;
        $previewUrl = $admin && $latestVersion
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
            'tanggal_mulai' => $document->tanggal_mulai,
            'tanggal_selesai' => $document->tanggal_selesai,
            'ukuran' => $document->ukuran,
            'downloads' => (int) $document->downloads,
            'views' => (int) $document->views,
            'unique_views' => (int) $document->unique_views,
            'file_path' => null,
            'preview_url' => $previewUrl,
            'is_public' => (bool) $document->is_public,
            'uploaded_by' => $document->uploaded_by,
            'owner_opd' => $document->owner_opd,
            'classification' => $document->classification,
            'governance_status' => $document->governance_status,
            'storage_status' => $document->storage_status,
            'retention_policy' => $document->retention_policy,
            'retention_until' => $document->retention_until?->toDateString(),
            'retention_status' => $document->retention_status,
            'legal_hold' => (bool) $document->legal_hold,
            'current_version' => $document->currentVersion
                ? $this->compactVersion($document->currentVersion)
                : null,
            'latest_version' => $latestVersion
                ? $this->compactVersion($latestVersion)
                : null,
            'published_at' => $document->published_at?->toIso8601String(),
            'created_at' => $document->created_at?->toIso8601String(),
            'updated_at' => $document->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function compactVersion(DocumentVersion $version): array
    {
        return [
            'id' => (string) $version->id,
            'version_label' => $version->version_label,
            'status' => $version->status,
            'integrity_status' => $version->integrity_status,
            'extraction_status' => $version->extraction_status,
        ];
    }

    private function formatFileSize(int $bytes): string
    {
        return number_format($bytes / 1024 / 1024, 2).' MB';
    }

    private function retentionUntil(
        string $policy,
        ?string $explicitDate,
        ?string $effectiveDate
    ): ?string {
        if ($policy === 'permanent') {
            return null;
        }

        if ($policy === 'custom') {
            return $explicitDate;
        }

        $startDate = Carbon::parse($effectiveDate ?? today());

        return match ($policy) {
            'active_5_years' => $startDate->addYears(5)->toDateString(),
            'active_10_years' => $startDate->addYears(10)->toDateString(),
            default => $explicitDate,
        };
    }

    /**
     * @return array<int, string>
     */
    private function defaultDocumentPermissions(string $role): array
    {
        return match ($role) {
            'superadmin' => ['rpjpd', 'rpjmd', 'rkpd', 'lkpj', 'renstra', 'renja', 'dik_sektoral', 'data_sektoral'],
            'admin_umum' => ['rpjpd', 'rpjmd', 'rkpd', 'lkpj'],
            default => ['renstra', 'renja', 'dik_sektoral', 'data_sektoral'],
        };
    }
}
