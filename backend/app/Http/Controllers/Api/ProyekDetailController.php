<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\ProyekDetail;
use App\Models\ProyekAttachment;
use App\Services\EsriGisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProyekDetailController extends Controller
{
    protected EsriGisService $esriService;

    public function __construct(EsriGisService $esriService)
    {
        $this->esriService = $esriService;
    }

    /**
     * Get list of projects (Filterable by document_id, bidang, status)
     */
    public function index(Request $request)
    {
        $query = ProyekDetail::with(['document', 'attachments']);

        if ($request->has('document_id')) {
            $query->where('document_id', $request->document_id);
        }

        if ($request->has('bidang') && $request->bidang !== 'semua') {
            $query->where('bidang', $request->bidang);
        }

        if ($request->has('status_progres') && $request->status_progres !== 'semua') {
            $query->where('status_progres', $request->status_progres);
        }

        $projects = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $projects,
        ]);
    }

    /**
     * Fitur 2: Geotagging Proyek Pembangunan (Spasial)
     */
    public function store(Request $request, $documentId)
    {
        $request->validate([
            'nama_proyek' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'pagu_anggaran' => 'nullable|numeric',
            'bidang' => 'nullable|string',
            'kecamatan' => 'nullable|string',
            'desa_kelurahan' => 'nullable|string',
            'lokasi_deskripsi' => 'nullable|string',
            'opd_penanggung_jawab' => 'nullable|string',
        ]);

        $document = Document::findOrFail($documentId);

        $kodeProyek = 'PRJ-' . strtoupper(substr($document->jenis ?? 'RENJA', 0, 3)) . '-' . date('Y') . '-' . sprintf("%03d", rand(1, 999));

        // 1. Simpan ke database MySQL
        $proyek = ProyekDetail::create([
            'document_id' => $document->id,
            'kode_proyek' => $kodeProyek,
            'nama_proyek' => $request->nama_proyek,
            'bidang' => $request->bidang ?? $document->bidang ?? 'infrastruktur',
            'kecamatan' => $request->kecamatan,
            'desa_kelurahan' => $request->desa_kelurahan,
            'lokasi_deskripsi' => $request->lokasi_deskripsi,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'pagu_anggaran' => $request->pagu_anggaran ?? 0,
            'realisasi_anggaran' => $request->realisasi_anggaran ?? 0,
            'persentase_progres' => $request->persentase_progres ?? 0,
            'status_progres' => $request->status_progres ?? 'belum_mulai',
            'opd_penanggung_jawab' => $request->opd_penanggung_jawab ?? 'Bappeda Halmahera Utara',
            'created_by' => $request->created_by ?? 'Admin Bidang',
        ]);

        // 2. Kirim POST /addFeatures ke ArcGIS REST API & simpan esri_objectid
        $esriResponse = $this->esriService->addFeature([
            'kode_proyek' => $proyek->kode_proyek,
            'nama_proyek' => $proyek->nama_proyek,
            'bidang' => $proyek->bidang,
            'latitude' => $proyek->latitude,
            'longitude' => $proyek->longitude,
            'pagu_anggaran' => $proyek->pagu_anggaran,
            'persentase_progres' => $proyek->persentase_progres,
            'status_progres' => $proyek->status_progres,
        ]);

        if (isset($esriResponse['objectId'])) {
            $proyek->update(['esri_objectid' => $esriResponse['objectId']]);
        }

        // Audit Log
        DB::table('audit_logs')->insert([
            'user_name' => $request->created_by ?? 'Admin Bidang',
            'user_role' => 'admin_bidang',
            'action' => 'GEOTAGGING_PROYEK',
            'details' => "Penambahan titik lokasi proyek: {$proyek->nama_proyek} (ESRI OBJECTID: {$proyek->esri_objectid})",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Geotagging proyek berhasil disimpan dan tersinkronisasi dengan ESRI ArcGIS',
            'data' => $proyek->fresh(['document', 'attachments']),
            'esri_status' => $esriResponse,
        ]);
    }

    /**
     * Detail Proyek Spesifik
     */
    public function show($id)
    {
        $proyek = ProyekDetail::with(['document', 'attachments'])->findOrFail($id);

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
        $request->validate([
            'persentase_progres' => 'required|integer|min:0|max:100',
            'status_progres' => 'nullable|string',
            'realisasi_anggaran' => 'nullable|numeric',
        ]);

        $proyek = ProyekDetail::findOrFail($id);

        $proyek->update([
            'persentase_progres' => $request->persentase_progres,
            'status_progres' => $request->status_progres ?? $proyek->status_progres,
            'realisasi_anggaran' => $request->realisasi_anggaran ?? $proyek->realisasi_anggaran,
            'updated_by' => $request->updated_by ?? 'Staf Monev',
        ]);

        // Sync ke ESRI via POST /updateFeatures jika esri_objectid ada
        $esriResult = null;
        if ($proyek->esri_objectid) {
            $esriResult = $this->esriService->updateFeature((int)$proyek->esri_objectid, [
                'persentase_progres' => $proyek->persentase_progres,
                'status_progres' => $proyek->status_progres,
                'realisasi_anggaran' => (float)$proyek->realisasi_anggaran,
            ]);
        }

        DB::table('audit_logs')->insert([
            'user_name' => $request->updated_by ?? 'Staf Monev',
            'user_role' => 'staf_monev',
            'action' => 'UPDATE_PROGRES_PROYEK',
            'details' => "Memperbarui progres proyek {$proyek->nama_proyek} menjadi {$proyek->persentase_progres}%",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Progres & data sektoral proyek berhasil diperbarui dan disinkronisasi ke ESRI',
            'data' => $proyek->fresh(['document', 'attachments']),
            'esri_sync' => $esriResult,
        ]);
    }

    /**
     * Fitur 4: Upload Lampiran Spasial Teknis (ESRI Attachments)
     */
    public function uploadAttachment(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,pdf,doc,docx|max:20480', // max 20MB
            'file_type' => 'nullable|string',
        ]);

        $proyek = ProyekDetail::findOrFail($id);
        $file = $request->file('file');

        // Store local copy in public disk (storage/app/public/proyek_attachments)
        $fileName = time() . '_' . preg_replace('/[^A-Za-z0-9\._-]/', '', $file->getClientOriginalName());
        $filePath = $file->storeAs('proyek_attachments/' . $proyek->id, $fileName, 'public');
        $publicUrl = '/storage/proyek_attachments/' . $proyek->id . '/' . $fileName;

        // Upload directly to ESRI Attachment Endpoint /{objectId}/addAttachment
        $esriAttachmentResult = null;
        if ($proyek->esri_objectid) {
            $realPath = Storage::path($filePath);
            $esriAttachmentResult = $this->esriService->addAttachment((int)$proyek->esri_objectid, $realPath, $file->getClientOriginalName());
        }

        $attachment = ProyekAttachment::create([
            'proyek_detail_id' => $proyek->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $publicUrl,
            'file_type' => $request->file_type ?? 'foto',
            'file_size' => round($file->getSize() / 1024 / 1024, 2) . ' MB',
            'esri_attachment_id' => $esriAttachmentResult['attachmentId'] ?? null,
            'uploaded_by' => $request->uploaded_by ?? 'Staf Teknis',
        ]);

        DB::table('audit_logs')->insert([
            'user_name' => $request->uploaded_by ?? 'Staf Teknis',
            'user_role' => 'staf_teknis',
            'action' => 'UPLOAD_ESRI_ATTACHMENT',
            'details' => "Mengunggah lampiran teknis ({$file->getClientOriginalName()}) pada proyek {$proyek->nama_proyek}",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
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
            $relativeStoragePath = str_replace('/storage/', 'public/', $attachment->file_path);
            if (\Storage::exists($relativeStoragePath)) {
                \Storage::delete($relativeStoragePath);
            }

            DB::table('audit_logs')->insert([
                'user_name' => $request->user_name ?? 'Admin',
                'user_role' => 'admin',
                'action' => 'DELETE_ATTACHMENT',
                'details' => "Menghapus lampiran teknis: {$attachment->file_name}",
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

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
            $esriResult = $this->esriService->deleteFeature((int)$proyek->esri_objectid);
        }

        // Audit Log
        DB::table('audit_logs')->insert([
            'user_name' => $request->user_name ?? 'Admin',
            'user_role' => $request->user_role ?? 'admin',
            'action' => 'DELETE_GEOTAGGING_PROYEK',
            'details' => "Menghapus geotagging proyek: {$proyek->nama_proyek} (ESRI OBJECTID: {$proyek->esri_objectid})",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $proyek->delete();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Geotagging proyek berhasil dihapus dari MySQL & ESRI ArcGIS',
            'esri_sync' => $esriResult
        ]);
    }

    /**
     * Fitur 5: Integrasi Geoprocessing Analisis (Opsional/Tingkat Lanjut)
     */
    public function geoprocessingBuffer(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'radius' => 'required|numeric|min:10|max:50000', // max 50km
        ]);

        $lat = (float) $request->latitude;
        $lng = (float) $request->longitude;
        $radius = (float) $request->radius;

        $analysis = $this->esriService->executeBuffer($lat, $lng, $radius);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => "Hasil analisis buffer radius {$radius}m berhasil diproses",
            'data' => $analysis,
        ]);
    }
}
