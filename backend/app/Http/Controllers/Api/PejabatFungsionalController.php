<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PejabatFungsional;
use App\Models\Pejabat;
use Illuminate\Http\Request;

class PejabatFungsionalController extends Controller
{
    // GET /api/v1/pejabat-fungsional
    public function index()
    {
        $items = PejabatFungsional::orderBy('order_index', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    // POST /api/v1/pejabat-fungsional
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'nip' => 'nullable|string|max:100',
            'avatar' => 'nullable|string',
            'order_index' => 'nullable|integer',
        ]);

        $maxOrder = PejabatFungsional::max('order_index') ?? 0;
        $validated['order_index'] = $validated['order_index'] ?? ($maxOrder + 1);

        $fungsional = PejabatFungsional::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Personel Fungsional berhasil ditambahkan!',
            'data' => $fungsional,
        ], 201);
    }

    // GET /api/v1/pejabat-fungsional/{id}
    public function show($id)
    {
        $fungsional = PejabatFungsional::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $fungsional,
        ]);
    }

    // PUT /api/v1/pejabat-fungsional/{id}
    public function update(Request $request, $id)
    {
        $fungsional = PejabatFungsional::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'nip' => 'nullable|string|max:100',
            'avatar' => 'nullable|string',
            'order_index' => 'nullable|integer',
        ]);

        $fungsional->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data Personel Fungsional berhasil diperbarui!',
            'data' => $fungsional,
        ]);
    }

    // DELETE /api/v1/pejabat-fungsional/{id}
    public function destroy($id)
    {
        $fungsional = PejabatFungsional::findOrFail($id);
        $fungsional->delete();

        return response()->json([
            'success' => true,
            'message' => 'Personel Fungsional berhasil dihapus!',
        ]);
    }

    // POST /api/v1/pejabat-fungsional/cleanup-legacy
    // Purges any remaining 'FUNGSIONAL' position nodes from pejabats table
    public function cleanupLegacy()
    {
        $deleted = Pejabat::where('position', 'like', '%FUNGSIONAL%')
            ->orWhere('position', 'like', '%fungsional%')
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Berhasil membersihkan {$deleted} node fungsional legacy dari bagan struktural.",
            'deleted_count' => $deleted,
        ]);
    }
}
