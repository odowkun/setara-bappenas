<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentDownloadLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentAnalyticsController extends Controller
{
    public function preview(int $id): JsonResponse
    {
        $document = Document::query()
            ->whereKey($id)
            ->where('is_public', true)
            ->firstOrFail();

        $document->increment('views');

        return response()->json([
            'status' => 'success',
            'data' => [
                'document_id' => (string) $document->id,
                'views' => (int) $document->fresh()->views,
            ],
        ]);
    }

    public function download(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
        ]);

        $result = DB::transaction(function () use ($id, $request, $validated): array {
            $document = Document::query()
                ->whereKey($id)
                ->where('is_public', true)
                ->lockForUpdate()
                ->firstOrFail();

            abort_if(blank($document->file_path), 404, 'Berkas dokumen tidak tersedia.');

            DocumentDownloadLog::query()->create([
                'document_id' => $document->id,
                'email' => Str::lower(trim($validated['email'])),
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
                'downloaded_at' => now(),
            ]);

            $document->increment('downloads');
            $document->refresh();

            return [
                'document_id' => (string) $document->id,
                'download_url' => $document->file_path,
                'downloads' => (int) $document->downloads,
                'views' => (int) $document->views,
            ];
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Email tercatat. Dokumen siap diunduh.',
            'data' => $result,
        ]);
    }

    public function downloadLogs(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['nullable', 'integer', 'exists:documents,id'],
            'email' => ['nullable', 'string', 'max:254'],
        ]);

        $query = DocumentDownloadLog::query()
            ->with('document:id,title,jenis,bidang')
            ->when(
                $validated['document_id'] ?? null,
                fn ($builder, $documentId) => $builder->where('document_id', $documentId)
            )
            ->when(
                $validated['email'] ?? null,
                fn ($builder, $email) => $builder->where('email', 'like', '%'.Str::lower($email).'%')
            );

        $summaryQuery = clone $query;
        $logs = $query
            ->latest('downloaded_at')
            ->limit(500)
            ->get()
            ->map(fn (DocumentDownloadLog $log): array => [
                'id' => (string) $log->id,
                'document_id' => (string) $log->document_id,
                'document_title' => $log->document?->title ?? 'Dokumen dihapus',
                'document_jenis' => $log->document?->jenis ?? '-',
                'document_bidang' => $log->document?->bidang ?? '-',
                'email' => $log->email,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'downloaded_at' => $log->downloaded_at?->toIso8601String(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $logs,
            'summary' => [
                'total_downloads' => (clone $summaryQuery)->count(),
                'unique_emails' => (clone $summaryQuery)->distinct()->count('email'),
                'downloads_today' => (clone $summaryQuery)
                    ->whereDate('downloaded_at', today())
                    ->count(),
            ],
        ]);
    }
}
