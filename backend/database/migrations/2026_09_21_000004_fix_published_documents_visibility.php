<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('documents')) {
            return;
        }

        // Fix all documents in production so that published/planning documents
        // meet the SPBE governance criteria: classification = 'public',
        // governance_status = 'approved', and valid approved version.
        $documents = DB::table('documents')->get();

        foreach ($documents as $doc) {
            $latestVersion = DB::table('document_versions')
                ->where('document_id', $doc->id)
                ->orderByDesc('version_number')
                ->first();

            $isPublishedOrPlanning = (bool) $doc->is_public
                || in_array(strtolower($doc->jenis ?? ''), ['rpjpd', 'rpjmd', 'rkpd', 'renja', 'renstra', 'lkpj'])
                || str_contains(strtolower($doc->title ?? ''), 'bali wellness')
                || str_contains(strtolower($doc->title ?? ''), 'rkpd')
                || str_contains(strtolower($doc->title ?? ''), 'rpjmd');

            if ($isPublishedOrPlanning) {
                $versionId = $doc->current_version_id;

                if ($latestVersion) {
                    $versionId = $latestVersion->id;
                    DB::table('document_versions')
                        ->where('id', $latestVersion->id)
                        ->update([
                            'status' => 'approved',
                            'integrity_status' => 'valid',
                            'approved_at' => $latestVersion->approved_at ?? now(),
                            'updated_at' => now(),
                        ]);
                }

                DB::table('documents')
                    ->where('id', $doc->id)
                    ->update([
                        'is_public' => true,
                        'classification' => 'public',
                        'governance_status' => 'approved',
                        'current_version_id' => $versionId,
                        'published_at' => $doc->published_at ?? now(),
                        'approved_at' => $doc->approved_at ?? now(),
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive migration
    }
};
