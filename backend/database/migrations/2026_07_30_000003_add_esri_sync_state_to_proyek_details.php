<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            if (! Schema::hasColumn('proyek_details', 'esri_sync_status')) {
                $table->string('esri_sync_status', 50)->default('pending')->after('esri_objectid');
            }
            if (! Schema::hasColumn('proyek_details', 'esri_synced_at')) {
                $table->timestamp('esri_synced_at')->nullable()->after('esri_sync_status');
            }
            if (! Schema::hasColumn('proyek_details', 'esri_last_error')) {
                $table->text('esri_last_error')->nullable()->after('esri_synced_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            $table->dropColumn(['esri_sync_status', 'esri_synced_at', 'esri_last_error']);
        });
    }
};
