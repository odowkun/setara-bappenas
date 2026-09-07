<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('geo_settings', function (Blueprint $table) {
            $table->string('custom_boundary_name')->nullable()->after('max_kmz_file_mb');
            $table->string('custom_boundary_path', 1000)->nullable()->after('custom_boundary_name');
            $table->mediumText('custom_boundary_geojson')->nullable()->after('custom_boundary_path');
            $table->integer('custom_boundary_features_count')->nullable()->after('custom_boundary_geojson');
            $table->decimal('custom_boundary_area_ha', 14, 4)->nullable()->after('custom_boundary_features_count');
            $table->decimal('custom_boundary_length_km', 14, 4)->nullable()->after('custom_boundary_area_ha');
            $table->string('custom_boundary_color', 50)->nullable()->default('#ef4444')->after('custom_boundary_length_km');
            $table->timestamp('custom_boundary_uploaded_at')->nullable()->after('custom_boundary_color');
        });
    }

    public function down(): void
    {
        Schema::table('geo_settings', function (Blueprint $table) {
            $table->dropColumn([
                'custom_boundary_name',
                'custom_boundary_path',
                'custom_boundary_geojson',
                'custom_boundary_features_count',
                'custom_boundary_area_ha',
                'custom_boundary_length_km',
                'custom_boundary_color',
                'custom_boundary_uploaded_at',
            ]);
        });
    }
};
