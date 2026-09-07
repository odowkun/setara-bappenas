<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geo_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('default_latitude', 10, 6)->default(1.7289);
            $table->decimal('default_longitude', 10, 6)->default(128.0054);
            $table->integer('default_zoom_level')->default(12);
            $table->string('default_basemap', 50)->default('esriSatellite');
            $table->string('esri_feature_service_url', 1000)->nullable();
            $table->string('esri_geoprocessing_url', 1000)->nullable();
            $table->boolean('auto_sync_esri')->default(true);
            $table->string('default_layer_color', 50)->default('#7c3aed');
            $table->decimal('default_fill_opacity', 3, 2)->default(0.35);
            $table->integer('max_kmz_file_mb')->default(15);
            $table->string('spatial_reference_srid', 50)->default('EPSG:4326');
            $table->string('unit_luas', 20)->default('ha');
            $table->string('unit_panjang', 20)->default('km');
            $table->string('updated_by')->nullable();
            $table->timestamps();
        });

        // Insert initial default record
        DB::table('geo_settings')->insert([
            'id' => 1,
            'default_latitude' => 1.7289,
            'default_longitude' => 128.0054,
            'default_zoom_level' => 12,
            'default_basemap' => 'esriSatellite',
            'esri_feature_service_url' => env('ESRI_FEATURE_SERVICE_URL', 'https://services.arcgis.com/dummy/arcgis/rest/services/BappedaHalut/FeatureServer/0'),
            'esri_geoprocessing_url' => env('ESRI_GEOPROCESSING_URL', 'https://geoprocessing.arcgis.com/dummy/arcgis/rest/services/Buffer/GPServer'),
            'auto_sync_esri' => true,
            'default_layer_color' => '#7c3aed',
            'default_fill_opacity' => 0.35,
            'max_kmz_file_mb' => 15,
            'spatial_reference_srid' => 'EPSG:4326',
            'unit_luas' => 'ha',
            'unit_panjang' => 'km',
            'updated_by' => 'System Administrator',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('geo_settings');
    }
};
