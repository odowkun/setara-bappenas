<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpatialLayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SpatialLayerController extends Controller
{
    /**
     * List all spatial layers
     */
    public function index()
    {
        $layers = SpatialLayer::orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $layers,
        ]);
    }

    /**
     * Store a new spatial layer
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:kabupaten,kecamatan,rtrw',
            'legal_basis' => 'nullable|string|max:255',
            'feature_count' => 'nullable|integer|min:1',
            'color' => 'nullable|string|max:50',
            'visible' => 'nullable|boolean',
            'file_name' => 'nullable|string|max:255',
            'geojson' => 'nullable',
        ]);

        $geoJsonData = null;
        $filePath = null;

        if (! empty($validated['geojson'])) {
            $geoJsonData = is_array($validated['geojson']) 
                ? json_encode($validated['geojson']) 
                : $validated['geojson'];

            $fileName = $validated['file_name'] ?: 'layer_' . time() . '.geojson';
            $filePath = 'spasial/layers/' . $fileName;
            Storage::disk('public')->put($filePath, $geoJsonData);
        }

        $layer = SpatialLayer::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'legal_basis' => $validated['legal_basis'] ?? null,
            'feature_count' => $validated['feature_count'] ?? 1,
            'color' => $validated['color'] ?? '#0284c7',
            'visible' => $validated['visible'] ?? true,
            'file_name' => $validated['file_name'] ?? null,
            'file_path' => $filePath,
            'geojson' => $geoJsonData,
            'created_by' => $request->user()?->name ?: 'Administrator BAPPEDA',
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Layer spasial berhasil ditambahkan ke database.',
            'data' => $layer,
        ], 201);
    }

    /**
     * Toggle layer visibility
     */
    public function toggleVisibility($id)
    {
        $layer = SpatialLayer::findOrFail($id);
        $layer->visible = ! $layer->visible;
        $layer->save();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => "Layer '{$layer->name}' berhasil " . ($layer->visible ? 'diaktifkan' : 'dinonaktifkan') . '.',
            'data' => $layer,
        ]);
    }

    /**
     * Delete a spatial layer
     */
    public function destroy($id)
    {
        $layer = SpatialLayer::findOrFail($id);

        if ($layer->file_path && Storage::disk('public')->exists($layer->file_path)) {
            Storage::disk('public')->delete($layer->file_path);
        }

        $layer->delete();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => "Layer '{$layer->name}' berhasil dihapus dari database.",
        ]);
    }
}
