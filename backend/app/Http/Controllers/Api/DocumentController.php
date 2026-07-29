<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DocumentWatermarkService;
use DB;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Pion\Laravel\ChunkUpload\Exceptions\UploadMissingFileException;
use Pion\Laravel\ChunkUpload\Handler\HandlerFactory;
use Pion\Laravel\ChunkUpload\Receiver\FileReceiver;
use Throwable;

class DocumentController extends Controller
{
    public function __construct(
        private readonly DocumentWatermarkService $documentWatermarkService
    ) {}

    public function index(Request $request)
    {
        $query = DB::table('documents');

        if ($request->has('bidang') && $request->bidang !== 'semua') {
            $query->where(function ($q) use ($request) {
                $q->where('bidang', $request->bidang)
                    ->orWhere('bidang', 'semua');
            });
        }

        $docs = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $docs,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'jenis' => 'required|string',
            'bidang' => 'required|string',
            'tahun' => 'required|string',
            'uploaded_by' => 'required|string',
            'file_path' => 'required|string',
        ]);

        $this->validateWatermarkedFilePath($request->file_path);

        $id = DB::table('documents')->insertGetId([
            'title' => $request->title,
            'jenis' => $request->jenis,
            'bidang' => $request->bidang,
            'tahun' => $request->tahun,
            'ukuran' => $request->ukuran ?? '5.2 MB',
            'downloads' => 0,
            'file_path' => $request->file_path,
            'is_public' => true,
            'uploaded_by' => $request->uploaded_by,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $doc = DB::table('documents')->where('id', $id)->first();

        DB::table('audit_logs')->insert([
            'user_name' => $request->uploaded_by,
            'user_role' => 'admin',
            'action' => 'UPLOAD_DOCUMENT',
            'details' => "Mengunggah dokumen baru: {$request->title} (Bidang: {$request->bidang})",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Dokumen berhasil disimpan',
            'data' => $doc,
        ], 201);
    }

    /**
     * Resumable Chunked File Upload API Endpoint
     * Handles 5MB chunks safely with auto-resume support
     */
    public function uploadChunk(Request $request)
    {
        // Receiver receives chunk files dynamically
        $receiver = new FileReceiver('file', $request, HandlerFactory::classFromRequest($request));

        if ($receiver->isUploaded() === false) {
            throw new UploadMissingFileException;
        }

        $save = $receiver->receive();

        // Check if the upload has finished (all chunks received and merged)
        if ($save->isFinished()) {
            return $this->saveFile($save->getFile());
        }

        // We are still uploading chunks -> Return current upload progress handler
        $handler = $save->handler();

        return response()->json([
            'status' => 'chunk_received',
            'progress' => $handler->getPercentageDone(),
            'bytes_received' => $handler->getPercentageDone(),
        ]);
    }

    /**
     * Saves the final merged file after all chunks arrive
     */
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
                'message' => 'Berkas berhasil digabungkan dan watermark BAPPEDA HALUT diterapkan.',
                'file_path' => '/storage/'.$processedDocument['relative_path'],
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

    public function destroy($id, Request $request)
    {
        $doc = DB::table('documents')->where('id', $id)->first();
        if ($doc) {
            DB::table('documents')->where('id', $id)->delete();
            DB::table('audit_logs')->insert([
                'user_name' => $request->user_name ?? 'Admin',
                'user_role' => 'admin',
                'action' => 'DELETE_DOCUMENT',
                'details' => "Menghapus dokumen: {$doc->title}",
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Dokumen berhasil dihapus',
        ]);
    }

    private function validateWatermarkedFilePath(string $filePath): void
    {
        $urlPath = parse_url($filePath, PHP_URL_PATH);
        if (! is_string($urlPath)) {
            throw ValidationException::withMessages([
                'file_path' => 'Alamat berkas dokumen tidak valid.',
            ]);
        }

        $relativePath = ltrim(substr($urlPath, strlen('/storage/')), '/');
        $isWatermarkedPdf = str_starts_with($urlPath, '/storage/documents/')
            && str_ends_with($urlPath, '_watermarked.pdf');

        if (! $isWatermarkedPdf || ! Storage::disk('public')->exists($relativePath)) {
            throw ValidationException::withMessages([
                'file_path' => 'Dokumen harus berasal dari hasil watermark BAPPEDA HALUT.',
            ]);
        }
    }

    private function formatFileSize(int $bytes): string
    {
        return number_format($bytes / 1024 / 1024, 2).' MB';
    }
}
