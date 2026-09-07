<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            if (! Schema::hasColumn('proyek_details', 'delineasi_geojson')) {
                $table->json('delineasi_geojson')->nullable()->after('longitude');
            }
            if (! Schema::hasColumn('proyek_details', 'tipe_geometri')) {
                $table->string('tipe_geometri', 50)->default('point')->after('delineasi_geojson');
            }
            if (! Schema::hasColumn('proyek_details', 'luas_area_ha')) {
                $table->decimal('luas_area_ha', 12, 4)->nullable()->after('tipe_geometri');
            }
            if (! Schema::hasColumn('proyek_details', 'panjang_km')) {
                $table->decimal('panjang_km', 12, 4)->nullable()->after('luas_area_ha');
            }
        });

        Schema::table('geoprocessing_analyses', function (Blueprint $table) {
            if (! Schema::hasColumn('geoprocessing_analyses', 'source_kmz_path')) {
                $table->string('source_kmz_path')->nullable()->after('catatan');
            }
            if (! Schema::hasColumn('geoprocessing_analyses', 'layer_geojson')) {
                $table->json('layer_geojson')->nullable()->after('source_kmz_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('proyek_details', function (Blueprint $table) {
            $table->dropColumn(['delineasi_geojson', 'tipe_geometri', 'luas_area_ha', 'panjang_km']);
        });

        Schema::table('geoprocessing_analyses', function (Blueprint $table) {
            $table->dropColumn(['source_kmz_path', 'layer_geojson']);
        });
    }
};
