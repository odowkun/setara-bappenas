<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeoSetting extends Model
{
    use HasFactory;

    protected $table = 'geo_settings';

    protected $fillable = [
        'default_latitude',
        'default_longitude',
        'default_zoom_level',
        'default_basemap',
        'esri_feature_service_url',
        'esri_geoprocessing_url',
        'auto_sync_esri',
        'default_layer_color',
        'default_fill_opacity',
        'default_buffer_radius_meter',
        'buffer_color',
        'buffer_opacity',
        'sector_pin_colors_json',
        'print_layout_config_json',
        'max_kmz_file_mb',
        'custom_boundary_name',
        'custom_boundary_path',
        'custom_boundary_geojson',
        'custom_boundary_features_count',
        'custom_boundary_area_ha',
        'custom_boundary_length_km',
        'custom_boundary_color',
        'custom_boundary_uploaded_at',
        'spatial_reference_srid',
        'unit_luas',
        'unit_panjang',
        'updated_by',
    ];

    protected $casts = [
        'default_latitude' => 'float',
        'default_longitude' => 'float',
        'default_zoom_level' => 'integer',
        'auto_sync_esri' => 'boolean',
        'default_fill_opacity' => 'float',
        'default_buffer_radius_meter' => 'integer',
        'buffer_opacity' => 'float',
        'sector_pin_colors_json' => 'array',
        'print_layout_config_json' => 'array',
        'max_kmz_file_mb' => 'integer',
        'custom_boundary_features_count' => 'integer',
        'custom_boundary_area_ha' => 'float',
        'custom_boundary_length_km' => 'float',
        'custom_boundary_uploaded_at' => 'datetime',
    ];

    protected $appends = [
        'has_custom_boundary',
    ];

    public function getHasCustomBoundaryAttribute(): bool
    {
        return ! empty($this->custom_boundary_geojson) || ! empty($this->custom_boundary_path);
    }

    /**
     * Singleton accessor for active GeoSetting
     */
    public static function getActive(): self
    {
        return self::firstOrCreate(
            ['id' => 1],
            [
                'default_latitude' => 1.7289,
                'default_longitude' => 128.0054,
                'default_zoom_level' => 12,
                'default_basemap' => 'esriSatellite',
                'esri_feature_service_url' => (string) config('services.esri.feature_service_url'),
                'esri_geoprocessing_url' => (string) config('services.esri.geoprocessing_url'),
                'auto_sync_esri' => true,
                'default_layer_color' => '#7c3aed',
                'default_fill_opacity' => 0.35,
                'max_kmz_file_mb' => 15,
                'spatial_reference_srid' => 'EPSG:4326',
                'unit_luas' => 'ha',
                'unit_panjang' => 'km',
                'updated_by' => 'System',
            ]
        );
    }
}
