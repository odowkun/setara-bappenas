<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SyncEsriProjectJob;
use App\Models\Document;
use App\Models\GeoprocessingAnalysis;
use App\Models\ProyekAttachment;
use App\Models\ProyekDetail;
use App\Services\DocumentAccessService;
use App\Services\EsriGisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProyekDetailController extends Controller
{
    protected EsriGisService $esriService;

    public function __construct(
        EsriGisService $esriService,
        private readonly DocumentAccessService $documentAccessService
    ) {
        $this->esriService = $esriService;
    }

    /**
     * Get list of projects (Filterable by document_id, bidang, status)
     */
    public function index(Request $request)
    {
        $query = ProyekDetail::with(['document', 'attachments']);

        $this->applyProjectFilters($query, $request);
        $projects = $query->orderBy('created_at', 'desc')->get();
        $this->hideInternalActorFields($projects);
        $this->replaceDocumentFilePaths($projects);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $projects,
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = ProyekDetail::with(['document', 'attachments']);
        $actor = $request->user();

        if ($actor->hasRole('admin_bidang')) {
            $query->where('bidang', $actor->bidang);
        }

        $this->applyProjectFilters($query, $request);
        $projects = $query->orderBy('created_at', 'desc')->get();
        $this->replaceDocumentFilePaths($projects, true);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $projects,
        ]);
    }

    private function applyProjectFilters($query, Request $request): void
    {

        if ($request->has('document_id')) {
            $query->where('document_id', $request->document_id);
        }

        if ($request->has('bidang') && $request->bidang !== 'semua') {
            $query->where('bidang', $request->bidang);
        }

        if ($request->has('status_progres') && $request->status_progres !== 'semua') {
            if ($request->status_progres === 'selesai' || $request->status_progres === '100') {
                $query->where(function ($q) {
                    $q->where('status_progres', 'selesai')
                      ->orWhere('persentase_progres', '>=', 100);
                });
            } else {
                $query->where('status_progres', $request->status_progres);
            }
        }

        if ($request->boolean('only_completed') || $request->input('min_progress') == 100) {
            $query->where(function ($q) {
                $q->where('status_progres', 'selesai')
                  ->orWhere('persentase_progres', '>=', 100);
            });
        }
    }

    /**
     * Fitur 2: Geotagging Proyek Pembangunan (Spasial)
     */
    public function store(Request $request, $documentId)
    {
        $validated = $request->validate([
            'nama_proyek' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'pagu_anggaran' => 'required|numeric|min:0',
            'realisasi_anggaran' => 'nullable|numeric|min:0',
            'persentase_progres' => 'nullable|integer|min:0|max:100',
            'status_progres' => 'nullable|string|in:belum_mulai,dalam_proses,selesai,terkendala',
            'bidang' => 'required|string|in:infrastruktur,perekonomian,sosbud,renval',
            'kecamatan' => 'required|string|max:150',
            'desa_kelurahan' => 'nullable|string|max:150',
            'lokasi_deskripsi' => 'nullable|string|max:2000',
            'opd_penanggung_jawab' => 'required|string|max:255',
            'delineasi_geojson' => 'nullable|array',
            'tipe_geometri' => 'nullable|string|in:point,polygon,polyline,circle',
            'luas_area_ha' => 'nullable|numeric|min:0',
            'panjang_km' => 'nullable|numeric|min:0',
        ]);

        $document = Document::findOrFail($documentId);
        $actor = $request->user();
        $this->authorizeBidang($request, $document->bidang);

        $kodeProyek = 'PRJ-'
            .strtoupper(substr($document->jenis, 0, 3))
            .'-'.now()->format('Y')
            .'-'.Str::upper(substr((string) Str::ulid(), -10));
        $bidang = $actor->hasRole('admin_bidang')
            ? $actor->bidang
            : ($document->bidang !== 'semua' ? $document->bidang : $validated['bidang']);

        // 1. Simpan ke database MySQL
        $proyek = ProyekDetail::create([
            'document_id' => $document->id,
            'kode_proyek' => $kodeProyek,
            'nama_proyek' => $validated['nama_proyek'],
            'bidang' => $bidang,
            'kecamatan' => $validated['kecamatan'],
            'desa_kelurahan' => $validated['desa_kelurahan'] ?? null,
            'lokasi_deskripsi' => $validated['lokasi_deskripsi'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'pagu_anggaran' => $validated['pagu_anggaran'],
            'realisasi_anggaran' => $validated['realisasi_anggaran'] ?? 0,
            'persentase_progres' => $validated['persentase_progres'] ?? 0,
            'status_progres' => $validated['status_progres'] ?? 'belum_mulai',
            'delineasi_geojson' => $validated['delineasi_geojson'] ?? null,
            'tipe_geometri' => $validated['tipe_geometri'] ?? 'point',
            'luas_area_ha' => $validated['luas_area_ha'] ?? null,
            'panjang_km' => $validated['panjang_km'] ?? null,
            'opd_penanggung_jawab' => $validated['opd_penanggung_jawab'],
            'created_by' => $actor->name,
            'esri_sync_status' => 'pending',
        ]);

        // 2. Synchronize GIS registry
        SyncEsriProjectJob::dispatchSync($proyek, 'add');

        $freshProject = $proyek->fresh(['document', 'attachments']);
        $this->replaceDocumentFilePaths(collect([$freshProject]), true);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Geotagging proyek tersimpan di database dan tersinkronisasi ke GIS.',
            'data' => $freshProject,
            'esri_status' => [
                'success' => false,
                'sync_status' => $freshProject->esri_sync_status,
                'object_id' => $freshProject->esri_objectid,
                'message' => 'Geotagging proyek tersimpan di database lokal.',
            ],
        ], 201);
    }

    /**
     * Detail Proyek Spesifik
     */
    public function show($id)
    {
        $proyek = ProyekDetail::with(['document', 'attachments'])
            ->findOrFail($id);
        $this->hideInternalActorFields(collect([$proyek]));
        $this->replaceDocumentFilePaths(collect([$proyek]));

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $proyek,
        ]);
    }

    /**
     * Fitur 3: Update Data Sektoral & Progres (Tabular Update 2-Arah)
     */
    public function updateProgres(Request $request, $id)
    {
        $validated = $request->validate([
            'persentase_progres' => 'required|integer|min:0|max:100',
            'status_progres' => 'nullable|string|in:belum_mulai,dalam_proses,selesai,terkendala',
            'realisasi_anggaran' => 'nullable|numeric|min:0',
            'delineasi_geojson' => 'nullable|array',
            'tipe_geometri' => 'nullable|string|in:point,polygon,polyline,circle',
            'luas_area_ha' => 'nullable|numeric|min:0',
            'panjang_km' => 'nullable|numeric|min:0',
        ]);

        $proyek = ProyekDetail::findOrFail($id);
        $this->authorizeBidang($request, $proyek->bidang);

        $updateData = [
            'persentase_progres' => $validated['persentase_progres'],
            'status_progres' => $validated['status_progres'] ?? $proyek->status_progres,
            'realisasi_anggaran' => $validated['realisasi_anggaran'] ?? $proyek->realisasi_anggaran,
            'updated_by' => $request->user()->name,
        ];

        if (array_key_exists('delineasi_geojson', $validated)) {
            $updateData['delineasi_geojson'] = $validated['delineasi_geojson'];
        }
        if (isset($validated['tipe_geometri'])) {
            $updateData['tipe_geometri'] = $validated['tipe_geometri'];
        }
        if (array_key_exists('luas_area_ha', $validated)) {
            $updateData['luas_area_ha'] = $validated['luas_area_ha'];
        }
        if (array_key_exists('panjang_km', $validated)) {
            $updateData['panjang_km'] = $validated['panjang_km'];
        }

        $updateData['updated_by'] = $actor->name;
        $proyek->update($updateData);

        // Synchronize GIS registry
        SyncEsriProjectJob::dispatchSync($proyek, $proyek->esri_objectid ? 'update' : 'add');

        $freshProject = $proyek->fresh(['document', 'attachments']);
        $this->replaceDocumentFilePaths(collect([$freshProject]), true);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Progres & data sektoral proyek berhasil diperbarui dan disinkronisasi ke GIS.',
            'data' => $freshProject,
            'esri_sync' => [
                'success' => $freshProject->esri_sync_status === 'synced',
                'sync_status' => $freshProject->esri_sync_status,
            ],
        ]);
    }

    /**
     * Manual Re-sync ESRI ArcGIS REST API
     */
    public function resyncEsri(Request $request, $id)
    {
        $proyek = ProyekDetail::findOrFail($id);
        $this->authorizeBidang($request, $proyek->bidang);

        SyncEsriProjectJob::dispatchSync($proyek, $proyek->esri_objectid ? 'update' : 'add');

        $freshProject = $proyek->fresh(['document', 'attachments']);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => "Proses sinkronisasi GIS untuk proyek '{$freshProject->nama_proyek}' berhasil diperbarui ({$freshProject->esri_sync_status}).",
            'data' => $freshProject,
        ]);
    }

    /**
     * Fitur 4: Upload Lampiran Spasial Teknis (ESRI Attachments)
     */
    public function uploadAttachment(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,pdf,doc,docx|max:20480', // max 20MB
            'file_type' => 'nullable|string|max:100',
        ]);

        $proyek = ProyekDetail::findOrFail($id);
        $this->authorizeBidang($request, $proyek->bidang);
        $file = $request->file('file');

        // Store local copy in public disk (storage/app/public/proyek_attachments)
        $fileName = time().'_'.preg_replace('/[^A-Za-z0-9\._-]/', '', $file->getClientOriginalName());
        $filePath = $file->storeAs('proyek_attachments/'.$proyek->id, $fileName, 'public');
        $publicUrl = '/storage/proyek_attachments/'.$proyek->id.'/'.$fileName;

        // Upload directly to ESRI Attachment Endpoint /{objectId}/addAttachment
        $esriAttachmentResult = null;
        if ($proyek->esri_objectid) {
            $realPath = Storage::path($filePath);
            $esriAttachmentResult = $this->esriService->addAttachment((int) $proyek->esri_objectid, $realPath, $file->getClientOriginalName());
        }

        $attachment = ProyekAttachment::create([
            'proyek_detail_id' => $proyek->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $publicUrl,
            'file_type' => $request->file_type ?? 'foto',
            'file_size' => round($file->getSize() / 1024 / 1024, 2).' MB',
            'esri_attachment_id' => $esriAttachmentResult['attachmentId'] ?? null,
            'uploaded_by' => $request->user()->name,
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Lampiran teknis berhasil diunggah ke server & ESRI Geodatabase',
            'data' => $attachment,
            'esri_attachment' => $esriAttachmentResult,
        ]);
    }

    public function deleteAttachment($attachmentId, Request $request)
    {
        $attachment = ProyekAttachment::find($attachmentId);
        if ($attachment) {
            $this->authorizeBidang($request, $attachment->proyekDetail->bidang);
            $relativeStoragePath = str_replace('/storage/', 'public/', $attachment->file_path);
            if (\Storage::exists($relativeStoragePath)) {
                \Storage::delete($relativeStoragePath);
            }

            $attachment->delete();
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Lampiran teknis berhasil dihapus',
        ]);
    }

    /**
     * Delete project (geotagging & database record)
     */
    public function destroy($id, Request $request)
    {
        $proyek = ProyekDetail::findOrFail($id);
        $this->authorizeBidang($request, $proyek->bidang);

        // Delete related attachments locally and physically
        foreach ($proyek->attachments as $attachment) {
            $relativeStoragePath = str_replace('/storage/', 'public/', $attachment->file_path);
            if (Storage::exists($relativeStoragePath)) {
                Storage::delete($relativeStoragePath);
            }
            $attachment->delete();
        }

        // Delete from ESRI if esri_objectid exists
        $esriResult = null;
        if ($proyek->esri_objectid) {
            $esriResult = $this->esriService->deleteFeature((int) $proyek->esri_objectid);
        }

        $proyek->delete();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Geotagging proyek berhasil dihapus dari MySQL & ESRI ArcGIS',
            'esri_sync' => $esriResult,
        ]);
    }

    /**
     * Fitur 5: Integrasi Geoprocessing Analisis (Opsional/Tingkat Lanjut)
     */
    public function geoprocessingBuffer(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'proyek_detail_id' => 'nullable|integer|exists:proyek_details,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'required|numeric|min:10|max:50000', // max 50km
            'color' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:5000',
            'layer_geojson' => 'nullable|array',
            'source_kmz_path' => 'nullable|string|max:1000',
        ]);

        $lat = (float) $request->latitude;
        $lng = (float) $request->longitude;
        $radius = (float) $request->radius;

        $analysis = $this->esriService->executeBuffer($lat, $lng, $radius);
        $record = GeoprocessingAnalysis::create([
            'name' => $request->name ?: "Analisis buffer {$radius} meter",
            'category' => $request->category,
            'proyek_detail_id' => $request->proyek_detail_id,
            'center_latitude' => $lat,
            'center_longitude' => $lng,
            'radius_meters' => $radius,
            'color' => $request->color ?: '#2563eb',
            'notes' => $request->notes,
            'result_source' => $analysis['source'],
            'geojson' => $analysis['geojson'],
            'layer_geojson' => $request->layer_geojson,
            'source_kmz_path' => $request->source_kmz_path,
            'created_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => "Hasil analisis buffer radius {$radius}m tersimpan di database.",
            'data' => $record,
        ], 201);
    }

    public function updateGeoprocessing(Request $request, GeoprocessingAnalysis $analysis)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'proyek_detail_id' => 'nullable|integer|exists:proyek_details,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'required|numeric|min:10|max:50000',
            'color' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:5000',
            'layer_geojson' => 'nullable|array',
            'source_kmz_path' => 'nullable|string|max:1000',
        ]);

        $result = $this->esriService->executeBuffer(
            (float) $request->latitude,
            (float) $request->longitude,
            (float) $request->radius
        );

        $analysis->update([
            'name' => $request->name,
            'category' => $request->category,
            'proyek_detail_id' => $request->proyek_detail_id,
            'center_latitude' => $request->latitude,
            'center_longitude' => $request->longitude,
            'radius_meters' => $request->radius,
            'color' => $request->color ?: '#2563eb',
            'notes' => $request->notes,
            'result_source' => $result['source'],
            'geojson' => $result['geojson'],
            'layer_geojson' => $request->layer_geojson ?? $analysis->layer_geojson,
            'source_kmz_path' => $request->source_kmz_path ?? $analysis->source_kmz_path,
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Analisis geoprocessing berhasil diperbarui di database.',
            'data' => $analysis->fresh(),
        ]);
    }

    public function geoprocessingIndex()
    {
        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => GeoprocessingAnalysis::query()
                ->select([
                    'id',
                    'name',
                    'category',
                    'proyek_detail_id',
                    'center_latitude',
                    'center_longitude',
                    'radius_meters',
                    'color',
                    'notes',
                    'result_source',
                    'geojson',
                    'source_kmz_path',
                    'layer_geojson',
                    'created_at',
                ])
                ->latest()
                ->get(),
        ]);
    }

    public function destroyGeoprocessing(GeoprocessingAnalysis $analysis)
    {
        $analysis->delete();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Analisis geoprocessing berhasil dihapus dari database.',
        ]);
    }

    private function authorizeBidang(Request $request, ?string $bidang): void
    {
        $actor = $request->user();
        if (
            $actor->hasRole('admin_bidang')
            && $bidang !== 'semua'
            && $bidang !== $actor->bidang
        ) {
            abort(403, 'Data bidang lain tidak dapat diubah.');
        }
    }

    private function hideInternalActorFields($projects): void
    {
        $projects->each(function (ProyekDetail $project): void {
            $project->makeHidden(['created_by', 'updated_by']);
            $project->document?->makeHidden(['uploaded_by']);
            $project->attachments->each->makeHidden(['uploaded_by']);
        });
    }

    private function replaceDocumentFilePaths($projects, bool $admin = false): void
    {
        $projects->each(function (ProyekDetail $project) use ($admin): void {
            if ($project->document === null) {
                return;
            }

            $document = $project->document;
            $document->file_path = null;
            $document->setAttribute('preview_requires_grant', true);

            if (! $admin) {
                return;
            }

            $version = $document->latestVersion()->first();
            $document->setAttribute(
                'preview_url',
                $version
                    ? $this->documentAccessService
                        ->temporaryAdminPreviewUrl($document, $version)
                    : null
            );
        });
    }
}
