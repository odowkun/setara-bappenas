<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentVersion;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class DocumentAccessService
{
    public function temporaryPreviewUrl(
        Document $document,
        DocumentVersion $version,
        string $grant
    ): string
    {
        return URL::temporarySignedRoute(
            'documents.file.preview',
            now()->addMinutes((int) config('document-archive.preview_ttl_minutes', 5)),
            [
                'document' => $document->getKey(),
                'version' => $version->getKey(),
                'grant' => $grant,
            ],
            false
        );
    }

    public function temporaryAdminPreviewUrl(
        Document $document,
        DocumentVersion $version
    ): string
    {
        return URL::temporarySignedRoute(
            'documents.file.admin-preview',
            now()->addMinutes(10),
            [
                'document' => $document->getKey(),
                'version' => $version->getKey(),
            ],
            false
        );
    }

    public function temporaryDownloadUrl(
        Document $document,
        DocumentVersion $version,
        string $grant
    ): string
    {
        return URL::temporarySignedRoute(
            'documents.file.download',
            now()->addMinutes((int) config('document-archive.download_ttl_minutes', 5)),
            [
                'document' => $document->getKey(),
                'version' => $version->getKey(),
                'grant' => $grant,
            ],
            false
        );
    }

    public function inline(Document $document, DocumentVersion $version): Response
    {
        $absolutePath = $this->absolutePath($version->file_path);
        abort_if($absolutePath === null, 404, 'Berkas dokumen tidak tersedia.');

        $response = response()->file($absolutePath, [
            'Content-Type' => $version->mime_type ?: 'application/pdf',
            'Cache-Control' => 'no-store, private, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
        $response->setContentDisposition(
            'inline',
            $this->downloadName($document, $version)
        );

        return $response;
    }

    public function download(Document $document, DocumentVersion $version): Response
    {
        $absolutePath = $this->absolutePath($version->file_path);
        abort_if($absolutePath === null, 404, 'Berkas dokumen tidak tersedia.');

        return response()->download(
            $absolutePath,
            $this->downloadName($document, $version),
            [
                'Content-Type' => $version->mime_type ?: 'application/pdf',
                'Cache-Control' => 'no-store, private, max-age=0',
                'Pragma' => 'no-cache',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    public function privateRelativePath(string $filePath): ?string
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

    public function absolutePath(?string $filePath): ?string
    {
        if (! is_string($filePath) || $filePath === '') {
            return null;
        }

        $relativePath = $this->privateRelativePath($filePath);
        if ($relativePath === null) {
            return null;
        }

        if (Storage::disk('local')->exists($relativePath)) {
            return Storage::disk('local')->path($relativePath);
        }

        return null;
    }

    private function downloadName(
        Document $document,
        DocumentVersion $version
    ): string
    {
        $extension = pathinfo($version->file_name ?: $version->file_path, PATHINFO_EXTENSION);
        $safeExtension = preg_match('/\A[a-zA-Z0-9]{1,8}\z/', $extension) === 1
            ? strtolower($extension)
            : 'pdf';

        $versionLabel = ltrim(
            (string) ($version->version_label ?: $version->version_number.'.0'),
            'vV'
        );

        return sprintf(
            '%s-v%s.%s',
            Str::slug($document->title) ?: 'dokumen-bappeda-halut',
            str_replace('.', '-', $versionLabel),
            $safeExtension
        );
    }
}
