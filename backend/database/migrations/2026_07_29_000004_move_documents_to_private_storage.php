<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $this->moveDirectory('public', 'local');

        DB::table('documents')
            ->select(['id', 'file_path'])
            ->orderBy('id')
            ->each(function (object $document): void {
                $relativePath = $this->relativeDocumentPath((string) $document->file_path);
                if ($relativePath !== null && Storage::disk('local')->exists($relativePath)) {
                    DB::table('documents')
                        ->where('id', $document->id)
                        ->update(['file_path' => $relativePath]);
                }
            });
    }

    public function down(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $this->moveDirectory('local', 'public');

        DB::table('documents')
            ->select(['id', 'file_path'])
            ->orderBy('id')
            ->each(function (object $document): void {
                $relativePath = $this->relativeDocumentPath((string) $document->file_path);
                if ($relativePath !== null && Storage::disk('public')->exists($relativePath)) {
                    DB::table('documents')
                        ->where('id', $document->id)
                        ->update(['file_path' => '/storage/'.$relativePath]);
                }
            });
    }

    private function moveDirectory(string $sourceDisk, string $targetDisk): void
    {
        foreach (Storage::disk($sourceDisk)->allFiles('documents') as $relativePath) {
            $readStream = Storage::disk($sourceDisk)->readStream($relativePath);
            if ($readStream === false) {
                throw new RuntimeException("Dokumen gagal dibaca: {$relativePath}");
            }

            try {
                $written = Storage::disk($targetDisk)->writeStream($relativePath, $readStream);
            } finally {
                if (is_resource($readStream)) {
                    fclose($readStream);
                }
            }

            if (
                ! $written
                || ! Storage::disk($targetDisk)->exists($relativePath)
                || Storage::disk($targetDisk)->size($relativePath)
                    !== Storage::disk($sourceDisk)->size($relativePath)
            ) {
                throw new RuntimeException("Dokumen gagal dipindahkan: {$relativePath}");
            }

            Storage::disk($sourceDisk)->delete($relativePath);
        }
    }

    private function relativeDocumentPath(string $filePath): ?string
    {
        $urlPath = parse_url($filePath, PHP_URL_PATH);
        if (! is_string($urlPath)) {
            return null;
        }

        $normalizedPath = ltrim($urlPath, '/');
        if (str_starts_with($normalizedPath, 'storage/')) {
            $normalizedPath = substr($normalizedPath, strlen('storage/'));
        }

        return str_starts_with($normalizedPath, 'documents/')
            && ! str_contains($normalizedPath, '..')
            && ! str_contains($normalizedPath, '\\')
            && preg_match('/\Adocuments\/[A-Za-z0-9._\/-]+\z/', $normalizedPath) === 1
            ? $normalizedPath
            : null;
    }
};
