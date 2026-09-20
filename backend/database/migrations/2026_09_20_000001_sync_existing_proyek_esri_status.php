<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('proyek_details')) {
            // Update all existing projects where esri_objectid is set to synced
            DB::table('proyek_details')
                ->whereNotNull('esri_objectid')
                ->where('esri_sync_status', '!=', 'synced')
                ->update([
                    'esri_sync_status' => 'synced',
                    'esri_synced_at' => now(),
                    'esri_last_error' => null,
                ]);
        }
    }

    public function down(): void
    {
        // No-op rollback
    }
};
