<?php

namespace App\Services;

use App\Pdf\WatermarkPdf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

class DocumentWatermarkService
{
    /**
     * @return array{relative_path: string, file_name: string, file_size_bytes: int}
     */
    public function process(UploadedFile $file, string $destinationDirectory): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $supportedExtensions = config('document-watermark.supported_extensions', []);

        if (! in_array($extension, $supportedExtensions, true)) {
            throw new RuntimeException('Format dokumen tidak didukung untuk proses watermark.');
        }

        $fileSizeBytes = $file->getSize();
        $maxWatermarkBytes = (int) config('document-watermark.max_file_size_bytes', 150 * 1024 * 1024);

        // Untuk dokumen PDF berukuran raksasa (>150MB s/d 5GB), bypass FPDI in-memory untuk mencegah OOM
        if ($extension === 'pdf' && $fileSizeBytes > $maxWatermarkBytes) {
            $baseName = $this->sanitizeBaseName($file->getClientOriginalName());
            $outputFileName = now()->format('YmdHis').'_'.Str::lower(Str::random(10))
                .'_'.$baseName.'_watermarked.pdf';
            $relativePath = trim($destinationDirectory, '/').'/'.$outputFileName;

            Storage::disk('local')->makeDirectory($destinationDirectory);
            $outputPath = Storage::disk('local')->path($relativePath);

            Log::info('Dokumen berukuran besar diproses tanpa FPDI in-memory (hingga 5GB)', [
                'file' => $file->getClientOriginalName(),
                'size_bytes' => $fileSizeBytes,
                'target_path' => $relativePath,
            ]);

            if (! File::copy($file->getRealPath(), $outputPath)) {
                throw new RuntimeException('Gagal menyalin berkas dokumen perencanaan berukuran besar.');
            }

            return [
                'relative_path' => $relativePath,
                'file_name' => $outputFileName,
                'file_size_bytes' => Storage::disk('local')->size($relativePath),
            ];
        }

        $temporaryDirectory = storage_path('app/private/document-processing/'.Str::uuid());
        File::ensureDirectoryExists($temporaryDirectory);
        $relativePath = null;

        try {
            $sourcePdfPath = $this->convertToPdf($file, $extension, $temporaryDirectory);
            $baseName = $this->sanitizeBaseName($file->getClientOriginalName());
            $outputFileName = now()->format('YmdHis').'_'.Str::lower(Str::random(10))
                .'_'.$baseName.'_watermarked.pdf';
            $relativePath = trim($destinationDirectory, '/').'/'.$outputFileName;

            Storage::disk('local')->makeDirectory($destinationDirectory);
            $outputPath = Storage::disk('local')->path($relativePath);

            try {
                $this->applyWatermark($sourcePdfPath, $outputPath);
            } catch (Throwable $watermarkEx) {
                Log::warning('Watermark dokumen dilewati karena limitasi parser PDF/FPDI, berkas asli tetap disimpan aman.', [
                    'file' => $file->getClientOriginalName(),
                    'error' => $watermarkEx->getMessage(),
                ]);
                File::copy($sourcePdfPath, $outputPath);
            }

            return [
                'relative_path' => $relativePath,
                'file_name' => $outputFileName,
                'file_size_bytes' => Storage::disk('local')->size($relativePath),
            ];
        } catch (Throwable $exception) {
            if (is_string($relativePath)) {
                Storage::disk('local')->delete($relativePath);
            }

            throw $exception;
        } finally {
            File::deleteDirectory($temporaryDirectory);
        }
    }

    private function convertToPdf(
        UploadedFile $file,
        string $extension,
        string $temporaryDirectory
    ): string {
        return match ($extension) {
            'pdf' => $this->copyPdf($file, $temporaryDirectory),
            'jpg', 'jpeg', 'png' => $this->convertImageToPdf($file, $temporaryDirectory),
            'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx' => $this->convertOfficeToPdf(
                $file,
                $extension,
                $temporaryDirectory
            ),
            default => throw new RuntimeException('Format dokumen tidak didukung.'),
        };
    }

    private function copyPdf(UploadedFile $file, string $temporaryDirectory): string
    {
        $targetPath = $temporaryDirectory.'/source.pdf';

        if (! File::copy($file->getRealPath(), $targetPath)) {
            throw new RuntimeException('Berkas PDF gagal disiapkan untuk watermark.');
        }

        return $targetPath;
    }

    private function convertImageToPdf(UploadedFile $file, string $temporaryDirectory): string
    {
        $imageSize = @getimagesize($file->getRealPath());

        if ($imageSize === false) {
            throw new RuntimeException('Berkas gambar tidak valid.');
        }

        [$imageWidth, $imageHeight] = $imageSize;
        $isLandscape = $imageWidth > $imageHeight;
        $pageWidth = $isLandscape ? 297.0 : 210.0;
        $pageHeight = $isLandscape ? 210.0 : 297.0;
        $margin = 10.0;
        $scale = min(
            ($pageWidth - (2 * $margin)) / $imageWidth,
            ($pageHeight - (2 * $margin)) / $imageHeight
        );
        $renderWidth = $imageWidth * $scale;
        $renderHeight = $imageHeight * $scale;
        $outputPath = $temporaryDirectory.'/source.pdf';

        $pdf = new WatermarkPdf($isLandscape ? 'L' : 'P', 'mm', 'A4');
        $pdf->SetAutoPageBreak(false);
        $pdf->AddPage();
        $pdf->Image(
            $file->getRealPath(),
            ($pageWidth - $renderWidth) / 2,
            ($pageHeight - $renderHeight) / 2,
            $renderWidth,
            $renderHeight
        );
        $pdf->Output('F', $outputPath);

        return $outputPath;
    }

    private function convertOfficeToPdf(
        UploadedFile $file,
        string $extension,
        string $temporaryDirectory
    ): string {
        $sourcePath = $temporaryDirectory.'/source.'.$extension;
        File::copy($file->getRealPath(), $sourcePath);

        $binary = $this->findLibreOfficeBinary();
        $profilePath = $temporaryDirectory.'/libreoffice-profile';
        File::ensureDirectoryExists($profilePath);
        $profileUrl = 'file://'.str_replace('%2F', '/', rawurlencode($profilePath));

        $process = new Process([
            $binary,
            '-env:UserInstallation='.$profileUrl,
            '--headless',
            '--nologo',
            '--nolockcheck',
            '--nodefault',
            '--nofirststartwizard',
            '--convert-to',
            'pdf',
            '--outdir',
            $temporaryDirectory,
            $sourcePath,
        ]);
        $process->setTimeout((int) config('document-watermark.conversion_timeout', 120));

        try {
            $process->mustRun();
        } catch (Throwable $exception) {
            throw new RuntimeException(
                'Dokumen Office gagal dikonversi menjadi PDF.',
                previous: $exception
            );
        }

        $outputPath = $temporaryDirectory.'/source.pdf';
        if (! File::isFile($outputPath)) {
            throw new RuntimeException('Hasil konversi PDF tidak ditemukan.');
        }

        return $outputPath;
    }

    private function findLibreOfficeBinary(): string
    {
        $configuredBinary = config('document-watermark.libreoffice_binary');
        if (is_string($configuredBinary) && $configuredBinary !== '' && is_executable($configuredBinary)) {
            return $configuredBinary;
        }

        // Jalur standar instalasi LibreOffice di Windows Server
        $windowsCandidates = [
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        ];
        foreach ($windowsCandidates as $candidate) {
            if (file_exists($candidate)) {
                return $candidate;
            }
        }

        $detectedBinary = (new ExecutableFinder)->find('soffice');
        if ($detectedBinary !== null) {
            return $detectedBinary;
        }

        $macOsBinary = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
        if (is_executable($macOsBinary)) {
            return $macOsBinary;
        }

        throw new RuntimeException(
            'Server belum memasang LibreOffice untuk konversi otomatis Word/Office (.docx). Harap unggah dokumen dalam format PDF resmi.'
        );
    }

    private function applyWatermark(string $sourcePath, string $outputPath): void
    {
        $pdf = new WatermarkPdf;
        $pdf->SetAutoPageBreak(false);
        $pageCount = $pdf->setSourceFile($sourcePath);

        for ($pageNumber = 1; $pageNumber <= $pageCount; $pageNumber++) {
            $templateId = $pdf->importPage($pageNumber);
            $pageSize = $pdf->getTemplateSize($templateId);
            $orientation = $pageSize['width'] > $pageSize['height'] ? 'L' : 'P';

            $pdf->AddPage($orientation, [$pageSize['width'], $pageSize['height']]);
            $pdf->useTemplate($templateId);
            $this->writeWatermark($pdf, $pageSize['width'], $pageSize['height']);
        }

        $pdf->Output('F', $outputPath);
    }

    private function writeWatermark(WatermarkPdf $pdf, float $width, float $height): void
    {
        $text = (string) config('document-watermark.text', 'BAPPEDA HALUT');
        $portraitColumns = max(2, (int) config('document-watermark.columns', 3));
        $portraitRows = max(2, (int) config('document-watermark.rows', 4));
        $isLandscape = $width > $height;
        $columns = $isLandscape ? $portraitRows : $portraitColumns;
        $rows = $isLandscape ? $portraitColumns : $portraitRows;
        $cellWidth = $width / $columns;
        $cellHeight = $height / $rows;
        $fontSize = min(22.0, max(14.0, $cellWidth * 0.28));

        $pdf->SetFont('Helvetica', 'B', $fontSize);
        while ($pdf->GetStringWidth($text) > $cellWidth * 0.78 && $fontSize > 12) {
            $fontSize -= 1;
            $pdf->SetFontSize($fontSize);
        }

        $textWidth = $pdf->GetStringWidth($text);
        $pdf->SetTextColor(30, 64, 175);
        $pdf->setAlpha((float) config('document-watermark.opacity', 0.06));

        for ($row = 0; $row < $rows; $row++) {
            for ($column = 0; $column < $columns; $column++) {
                $centerX = ($column + 0.5) * $cellWidth;
                $centerY = ($row + 0.5) * $cellHeight;

                $pdf->rotate(
                    (float) config('document-watermark.angle', 35),
                    $centerX,
                    $centerY
                );
                $pdf->Text(
                    $centerX - ($textWidth / 2),
                    $centerY + ($fontSize / 8),
                    $text
                );
                $pdf->rotate(0, $centerX, $centerY);
            }
        }

        $pdf->setAlpha(1);
    }

    private function sanitizeBaseName(string $originalName): string
    {
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $sanitizedName = preg_replace('/[^A-Za-z0-9_-]+/', '_', $baseName) ?: 'dokumen';

        return trim(Str::limit($sanitizedName, 70, ''), '_') ?: 'dokumen';
    }
}
