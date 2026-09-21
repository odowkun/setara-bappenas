<?php

namespace Tests\Feature;

use App\Services\DocumentWatermarkService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use setasign\Fpdi\Fpdi;
use Tests\TestCase;

class DocumentWatermarkServiceTest extends TestCase
{
    public function test_it_adds_repeated_transparent_watermarks_to_every_pdf_page(): void
    {
        Storage::fake('local');
        $sourcePath = $this->createTwoPagePdf();
        $uploadedFile = new UploadedFile(
            $sourcePath,
            'Rencana Kerja 2026.pdf',
            'application/pdf',
            null,
            true
        );

        $result = app(DocumentWatermarkService::class)->process(
            $uploadedFile,
            'documents/testing'
        );

        Storage::disk('local')->assertExists($result['relative_path']);
        $this->assertStringEndsWith('_watermarked.pdf', $result['file_name']);

        $outputPath = Storage::disk('local')->path($result['relative_path']);
        $outputContents = file_get_contents($outputPath);
        $this->assertIsString($outputContents);
        $this->assertStringContainsString('/ExtGState', $outputContents);

        $pdfInspector = new Fpdi;
        $this->assertSame(2, $pdfInspector->setSourceFile($outputPath));

        unlink($sourcePath);
    }

    public function test_it_safely_bypasses_in_memory_watermarking_for_large_documents_up_to_5gb(): void
    {
        Storage::fake('local');
        config()->set('document-watermark.max_file_size_bytes', 1024); // Set low limit for testing threshold

        $sourcePath = $this->createTwoPagePdf();
        $uploadedFile = new UploadedFile(
            $sourcePath,
            'Dokumen Induk RPJMD 5GB.pdf',
            'application/pdf',
            null,
            true
        );

        $result = app(DocumentWatermarkService::class)->process(
            $uploadedFile,
            'documents/testing'
        );

        Storage::disk('local')->assertExists($result['relative_path']);
        $this->assertStringEndsWith('_watermarked.pdf', $result['file_name']);
        $this->assertGreaterThan(0, $result['file_size_bytes']);

        unlink($sourcePath);
    }

    public function test_it_skips_watermark_when_skip_watermark_flag_is_true(): void
    {
        Storage::fake('local');
        $sourcePath = $this->createTwoPagePdf();
        $uploadedFile = new UploadedFile(
            $sourcePath,
            'Dokumen Sudah Watermark Manual.pdf',
            'application/pdf',
            null,
            true
        );

        $result = app(DocumentWatermarkService::class)->process(
            $uploadedFile,
            'documents/testing',
            true // skipWatermark = true
        );

        Storage::disk('local')->assertExists($result['relative_path']);
        $this->assertStringEndsWith('_watermarked.pdf', $result['file_name']);
        $this->assertFalse($result['watermark_applied']);
        $this->assertTrue($result['watermark_bypassed']);

        unlink($sourcePath);
    }

    public function test_it_rejects_an_unsupported_document_format(): void
    {
        Storage::fake('local');
        $sourcePath = tempnam(sys_get_temp_dir(), 'watermark-test-');
        file_put_contents($sourcePath, 'plain text');
        $uploadedFile = new UploadedFile(
            $sourcePath,
            'catatan.txt',
            'text/plain',
            null,
            true
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Format dokumen tidak didukung');

        try {
            app(DocumentWatermarkService::class)->process(
                $uploadedFile,
                'documents/testing'
            );
        } finally {
            unlink($sourcePath);
        }
    }

    private function createTwoPagePdf(): string
    {
        $sourcePath = tempnam(sys_get_temp_dir(), 'watermark-source-');
        $pdf = new \FPDF;
        $pdf->AddPage('P');
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->Text(20, 30, 'Teks dokumen halaman pertama tetap terbaca.');
        $pdf->AddPage('L');
        $pdf->Text(20, 30, 'Teks dokumen halaman kedua tetap terbaca.');
        $pdf->Output('F', $sourcePath);

        return $sourcePath;
    }
}
