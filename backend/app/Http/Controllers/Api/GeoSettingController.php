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

    /**
     * Upload and set custom boundary for Halmahera Utara
     */
    public function uploadBoundary(Request $request)
    {
        $validated = $request->validate([
            'file_name' => 'required|string|max:255',
            'geojson' => 'required',
            'features_count' => 'nullable|integer',
            'area_ha' => 'nullable|numeric',
            'length_km' => 'nullable|numeric',
            'color' => 'nullable|string|max:50',
        ]);

        $geoJsonData = is_array($validated['geojson']) 
            ? json_encode($validated['geojson']) 
            : $validated['geojson'];

        // Save GeoJSON to storage
        $filePath = 'spasial/custom_halut_boundary.geojson';
        \Illuminate\Support\Facades\Storage::disk('public')->put($filePath, $geoJsonData);

        $setting = GeoSetting::getActive();
        $setting->update([
            'custom_boundary_name' => $validated['file_name'],
            'custom_boundary_path' => $filePath,
            'custom_boundary_geojson' => $geoJsonData,
            'custom_boundary_features_count' => $validated['features_count'] ?? 1,
            'custom_boundary_area_ha' => $validated['area_ha'] ?? null,
            'custom_boundary_length_km' => $validated['length_km'] ?? null,
            'custom_boundary_color' => $validated['color'] ?? '#ef4444',
            'custom_boundary_uploaded_at' => now(),
            'updated_by' => $request->user()?->name ?: 'Administrator BAPPEDA',
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Batas wilayah Kabupaten Halmahera Utara berhasil diperbarui dengan file spasial kustom.',
            'data' => $setting->fresh(),
        ]);
    }

    /**
     * Reset custom boundary back to default official BPS boundary
     */
    public function resetBoundary(Request $request)
    {
        $setting = GeoSetting::getActive();

        if ($setting->custom_boundary_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($setting->custom_boundary_path)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($setting->custom_boundary_path);
        }

        $setting->update([
            'custom_boundary_name' => null,
            'custom_boundary_path' => null,
            'custom_boundary_geojson' => null,
            'custom_boundary_features_count' => null,
            'custom_boundary_area_ha' => null,
            'custom_boundary_length_km' => null,
            'custom_boundary_color' => '#ef4444',
            'custom_boundary_uploaded_at' => null,
            'updated_by' => $request->user()?->name ?: 'Administrator BAPPEDA',
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Batas wilayah Kabupaten Halmahera Utara berhasil di-reset ke batas resmi bawaan BPS (Permendagri No. 137).',
            'data' => $setting->fresh(),
        ]);
    }
}

