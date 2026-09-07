<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeoSetting;
use Illuminate\Http\Request;

class GeoSettingController extends Controller
{
    /**
     * Get active spatial & GIS settings
     */
    public function show()
    {
        $setting = GeoSetting::getActive();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $setting,
        ]);
    }

    /**
     * Update active spatial & GIS settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'default_latitude' => 'required|numeric|between:-90,90',
            'default_longitude' => 'required|numeric|between:-180,180',
            'default_zoom_level' => 'required|integer|between:1,22',
            'default_basemap' => 'required|string|in:esriSatellite,esriTopo,googleHybrid,googleStreet',
            'esri_feature_service_url' => 'nullable|url|max:1000',
            'esri_geoprocessing_url' => 'nullable|url|max:1000',
            'auto_sync_esri' => 'required|boolean',
            'default_layer_color' => 'required|string|max:50',
            'default_fill_opacity' => 'required|numeric|between:0,1',
            'max_kmz_file_mb' => 'required|integer|between:1,100',
            'spatial_reference_srid' => 'required|string|max:50',
            'unit_luas' => 'required|string|in:ha,m2',
            'unit_panjang' => 'required|string|in:km,m',
        ]);

        $setting = GeoSetting::getActive();
        $setting->update(array_merge($validated, [
            'updated_by' => $request->user()?->name ?: 'System Administrator',
        ]));

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Konfigurasi Spasial & WebGIS BAPPEDA berhasil diperbarui.',
            'data' => $setting->fresh(),
        ]);
    }
}
