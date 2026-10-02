<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            if (! Schema::hasColumn('proyek_details', 'sumber_dana')) {
                $table->string('sumber_dana', 100)->nullable()->after('opd_penanggung_jawab');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            if (Schema::hasColumn('proyek_details', 'sumber_dana')) {
                $table->dropColumn('sumber_dana');
            }
        });
    }
};
