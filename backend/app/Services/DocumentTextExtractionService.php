<?php

namespace App\Services;

use App\Models\DocumentVersion;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

class DocumentTextExtractionService
{
    public function extract(DocumentVersion $version): DocumentVersion
    {
        $disk = $version->storage_disk ?: config('document-archive.disk', 'local');
        if (! Storage::disk($disk)->exists($version->file_path)) {
            return $this->finish(
                $version,
                'failed',
                null,
                null,
                'Berkas versi tidak ditemukan pada storage privat.'
            );
        }

        $absolutePath = Storage::disk($disk)->path($version->file_path);
        $checksum = hash_file('sha256', $absolutePath);
        if (
            ! is_string($checksum)
            || ! hash_equals((string) $version->checksum_sha256, $checksum)
        ) {
            $version->forceFill([
                'integrity_status' => 'mismatch',
                'integrity_verified_at' => now(),
            ])->save();

            return $this->finish(
                $version,
                'failed',
                null,
                null,
                'Ekstraksi dibatalkan karena checksum berkas tidak sesuai.'
            );
        }

        $version->forceFill([
            'extraction_status' => 'processing',
            'extraction_method' => null,
            'extraction_error' => null,
        ])->save();

        $pageCount = $this->pageCount($absolutePath);
        $pdftotext = $this->binary('pdftotext_binary', 'pdftotext');
        $embeddedFailure = null;

        if ($pdftotext !== null) {
            try {
                $process = new Process([
                    $pdftotext,
                    '-layout',
                    '-enc',
                    'UTF-8',
                    $absolutePath,
                    '-',
                ]);
                $process->setTimeout(
                    (int) config('document-archive.extraction_timeout_seconds', 120)
                );
                $process->mustRun();
                $text = $this->normalizeText($process->getOutput());

                if ($text !== '') {
                    return $this->finish(
                        $version,
                        'completed',
                        'pdftotext',
                        $text,
                        null,
                        $pageCount
                    );
                }

                $embeddedFailure = 'PDF tidak mempunyai lapisan teks yang dapat dibaca.';
            } catch (Throwable $exception) {
                $embeddedFailure = 'pdftotext gagal: '.$exception->getMessage();
            }
        } else {
            $embeddedFailure = 'Binary pdftotext tidak tersedia.';
        }

        if (! (bool) config('document-archive.ocr_enabled', false)) {
            return $this->finish(
                $version,
                'unavailable',
                null,
                null,
                $embeddedFailure.' OCR dinonaktifkan.',
                $pageCount
            );
        }

        return $this->extractWithOcr(
            $version,
            $absolutePath,
            $embeddedFailure,
            $pageCount
        );
    }

    private function extractWithOcr(
        DocumentVersion $version,
        string $absolutePath,
        string $previousMessage,
        ?int $knownPageCount
    ): DocumentVersion {
        $pdftoppm = $this->binary('pdftoppm_binary', 'pdftoppm');
        $tesseract = $this->binary('tesseract_binary', 'tesseract');
        if ($pdftoppm === null || $tesseract === null) {
            return $this->finish(
                $version,
                'unavailable',
                null,
                null,
                $previousMessage.' Adapter OCR tidak lengkap: pdftoppm/tesseract tidak tersedia.',
                $knownPageCount
            );
        }
        $maximumPages = max(
            1,
            (int) config('document-archive.ocr_max_pages', 100)
        );
        if ($knownPageCount !== null && $knownPageCount > $maximumPages) {
            return $this->finish(
                $version,
                'unavailable',
                null,
                null,
                "OCR ditahan: {$knownPageCount} halaman melebihi batas aman {$maximumPages} halaman.",
                $knownPageCount
            );
        }

        $temporaryDirectory = storage_path(
            'app/private/document-processing/ocr-'.Str::uuid()
        );
        File::ensureDirectoryExists($temporaryDirectory);

        try {
            $pagePrefix = $temporaryDirectory.'/page';
            $render = new Process([
                $pdftoppm,
                '-png',
                '-r',
                (string) config('document-archive.ocr_resolution', 200),
                $absolutePath,
                $pagePrefix,
            ]);
            $render->setTimeout(
                (int) config('document-archive.extraction_timeout_seconds', 120)
            );
            $render->mustRun();

            $pageImages = File::glob($pagePrefix.'-*.png');
            natsort($pageImages);
            if ($pageImages === []) {
                return $this->finish(
                    $version,
                    'failed',
                    'tesseract',
                    null,
                    'OCR gagal karena halaman PDF tidak dapat dirender.',
                    $knownPageCount
                );
            }

            $pages = [];
            foreach ($pageImages as $pageImage) {
                $ocr = new Process([
                    $tesseract,
                    $pageImage,
                    'stdout',
                    '-l',
                    (string) config('document-archive.ocr_language', 'ind+eng'),
                ]);
                $ocr->setTimeout(
                    (int) config('document-archive.ocr_page_timeout_seconds', 60)
                );
                $ocr->mustRun();
                $pages[] = $this->normalizeText($ocr->getOutput());
            }

            $text = trim(implode("\n\n", array_filter($pages)));
            if ($text === '') {
                return $this->finish(
                    $version,
                    'unavailable',
                    'tesseract',
                    null,
                    'OCR selesai, tetapi tidak menemukan teks yang dapat diindeks.',
                    count($pageImages)
                );
            }

            return $this->finish(
                $version,
                'completed',
                'tesseract',
                $text,
                null,
                count($pageImages)
            );
        } catch (Throwable $exception) {
            return $this->finish(
                $version,
                'failed',
                'tesseract',
                null,
                'OCR gagal: '.$exception->getMessage(),
                $knownPageCount
            );
        } finally {
            File::deleteDirectory($temporaryDirectory);
        }
    }

    private function pageCount(string $absolutePath): ?int
    {
        $pdfinfo = $this->binary('pdfinfo_binary', 'pdfinfo');
        if ($pdfinfo === null) {
            return null;
        }

        try {
            $process = new Process([$pdfinfo, $absolutePath]);
            $process->setTimeout(30);
            $process->mustRun();
            if (preg_match('/^Pages:\\s+(\\d+)$/mi', $process->getOutput(), $matches) === 1) {
                return (int) $matches[1];
            }
        } catch (Throwable) {
            return null;
        }

        return null;
    }

    private function binary(string $configKey, string $fallbackName): ?string
    {
        $configured = config('document-archive.'.$configKey);
        if (
            is_string($configured)
            && $configured !== ''
            && is_executable($configured)
        ) {
            return $configured;
        }

        return (new ExecutableFinder)->find($fallbackName);
    }

    private function normalizeText(string $text): string
    {
        $withoutNullBytes = str_replace("\0", '', $text);
        $normalizedLines = preg_replace(
            "/[\\t ]+\\n/",
            "\n",
            str_replace(["\r\n", "\r"], "\n", $withoutNullBytes)
        );

        return trim((string) preg_replace("/\\n{3,}/", "\n\n", $normalizedLines));
    }

    private function finish(
        DocumentVersion $version,
        string $status,
        ?string $method,
        ?string $text,
        ?string $error,
        ?int $pageCount = null
    ): DocumentVersion {
        $version->forceFill([
            'extraction_status' => $status,
            'extraction_method' => $method,
            'full_text' => $text,
            'extraction_error' => $error,
            'page_count' => $pageCount ?? $version->page_count,
            'extracted_at' => now(),
        ])->save();

        return $version->fresh();
    }
}
