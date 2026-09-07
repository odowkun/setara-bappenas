<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Models\DocumentApprovalLog;
use Illuminate\Console\Command;

class ArchiveRetentionScanCommand extends Command
{
    protected $signature = 'documents:archive-retention-scan
        {--dry-run : Tampilkan arsip jatuh tempo tanpa mengubah status}
        {--limit= : Batas jumlah dokumen dalam satu pemindaian}';

    protected $description = 'Tandai arsip yang jatuh tempo untuk review tanpa menghapus berkas';

    public function handle(): int
    {
        $limit = max(
            1,
            (int) (
                $this->option('limit')
                ?: config('document-archive.retention_scan_limit', 500)
            )
        );

        $documents = Document::query()
            ->where('legal_hold', false)
            ->whereNotIn('governance_status', ['archived', 'pending_migration'])
            ->whereNot('retention_policy', 'permanent')
            ->whereNotNull('retention_until')
            ->whereDate('retention_until', '<=', today())
            ->orderBy('retention_until')
            ->limit($limit)
            ->get();

        if ($documents->isEmpty()) {
            $this->info('Tidak ada arsip yang jatuh tempo.');

            return self::SUCCESS;
        }

        foreach ($documents as $document) {
            $this->line(
                "{$document->archive_code} | {$document->retention_until?->toDateString()} "
                ."| {$document->title}"
            );

            if ($this->option('dry-run')) {
                continue;
            }

            $fromStatus = $document->retention_status;
            $document->forceFill(['retention_status' => 'due'])->save();
            DocumentApprovalLog::query()->create([
                'document_id' => $document->id,
                'document_version_id' => $document->current_version_id,
                'actor_user_id' => null,
                'action' => 'retention_due',
                'from_status' => $fromStatus,
                'to_status' => 'due',
                'note' => 'Ditandai otomatis oleh pemindaian retensi; tidak ada berkas yang dihapus.',
            ]);
        }

        $action = $this->option('dry-run') ? 'Ditemukan' : 'Ditandai untuk review';
        $this->info("{$action}: {$documents->count()} arsip.");

        return self::SUCCESS;
    }
}
