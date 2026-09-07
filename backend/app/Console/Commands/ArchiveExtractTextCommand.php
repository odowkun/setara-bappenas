<?php

namespace App\Console\Commands;

use App\Models\DocumentVersion;
use App\Services\DocumentTextExtractionService;
use Illuminate\Console\Command;
use Throwable;

class ArchiveExtractTextCommand extends Command
{
    protected $signature = 'documents:archive-extract
        {document? : ID atau kode arsip dokumen}
        {--version-id= : ID versi tertentu}
        {--force : Proses ulang versi yang sudah pernah diekstrak}';

    protected $description = 'Ekstrak teks arsip dokumen secara jujur dengan pdftotext dan OCR opsional';

    public function handle(DocumentTextExtractionService $extractor): int
    {
        $query = DocumentVersion::query()
            ->with('document')
            ->whereHas(
                'document',
                fn ($documentQuery) => $documentQuery
                    ->where('storage_status', 'private')
            );
        $document = $this->argument('document');
        $version = $this->option('version-id');

        if (is_string($document) && $document !== '') {
            $query->whereHas('document', function ($documentQuery) use ($document): void {
                $documentQuery->where(function ($identityQuery) use ($document): void {
                    $identityQuery->where('archive_code', $document);
                    if (ctype_digit($document)) {
                        $identityQuery->orWhereKey((int) $document);
                    }
                });
            });
        }

        if (is_string($version) && ctype_digit($version)) {
            $query->whereKey((int) $version);
        }

        if (! $this->option('force')) {
            $query->whereIn('extraction_status', [
                'pending',
                'failed',
                'unavailable',
            ]);
        }

        $total = (clone $query)->count();
        if ($total === 0) {
            $this->info('Tidak ada versi arsip yang perlu diekstrak.');

            return self::SUCCESS;
        }

        $this->info("Memproses {$total} versi arsip.");
        $completed = 0;
        $notCompleted = 0;

        $query->orderBy('id')->chunkById(25, function ($versions) use (
            $extractor,
            &$completed,
            &$notCompleted
        ): void {
            foreach ($versions as $documentVersion) {
                try {
                    $result = $extractor->extract($documentVersion);
                    if ($result->extraction_status === 'completed') {
                        $completed++;
                        $this->line(
                            "OK {$result->document?->archive_code} {$result->version_label}"
                        );
                    } else {
                        $notCompleted++;
                        $this->warn(
                            "{$result->extraction_status} "
                            ."{$result->document?->archive_code} "
                            ."{$result->version_label}: "
                            .($result->extraction_error ?? 'tanpa detail')
                        );
                    }
                } catch (Throwable $exception) {
                    $notCompleted++;
                    $this->error(
                        "FAILED versi {$documentVersion->id}: {$exception->getMessage()}"
                    );
                }
            }
        });

        $this->newLine();
        $this->info("Selesai: {$completed} completed, {$notCompleted} belum terindeks.");

        return $notCompleted === 0 ? self::SUCCESS : self::FAILURE;
    }
}
