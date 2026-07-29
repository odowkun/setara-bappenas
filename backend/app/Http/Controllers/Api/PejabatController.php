<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pejabat;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PejabatController extends Controller
{
    // GET /api/v1/pejabat -> Returns flat list & nested tree hierarchy
    public function index()
    {
        $all = Pejabat::orderBy('order_index', 'asc')->get();

        // Build nested tree structure for OrgChart
        $itemsByNodeId = [];
        foreach ($all as $item) {
            $node = [
                'id' => $item->node_id,
                'name' => $item->name ?: '(Belum Ditentukan)',
                'position' => $item->position,
                'nip' => $item->nip ?? '',
                'avatar' => $item->avatar,
                'parent_id' => $item->parent_id,
                'pos_x' => $item->pos_x,
                'pos_y' => $item->pos_y,
                'db_id' => $item->id,
                'children' => [],
            ];
            $itemsByNodeId[$item->node_id] = $node;
        }

        $tree = null;
        foreach ($itemsByNodeId as $nodeId => &$node) {
            if ($node['parent_id'] && isset($itemsByNodeId[$node['parent_id']])) {
                $itemsByNodeId[$node['parent_id']]['children'][] = &$node;
            } else {
                $tree = &$node;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'flat' => $all,
                'tree' => $tree,
            ],
        ]);
    }

    // GET /api/v1/pejabat/{id} -> Fetch single pejabat by ID
    public function show($id)
    {
        $pejabat = Pejabat::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $pejabat,
        ]);
    }

    // POST /api/v1/pejabat -> Create structural position & official
    public function store(Request $request)
    {
        $validated = $request->validate([
            'position' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'nip' => 'nullable|string|max:100',
            'parent_id' => 'nullable|string|max:255',
            'avatar' => 'nullable|string',
            'pos_x' => 'nullable|integer',
            'pos_y' => 'nullable|integer',
        ]);

        $maxOrder = Pejabat::max('order_index') ?? 0;
        $nodeId = 'node-' . Str::slug($validated['position']) . '-' . time();

        $pejabat = Pejabat::create([
            'node_id' => $nodeId,
            'parent_id' => $validated['parent_id'] ?: null,
            'position' => mb_strtoupper($validated['position']),
            'name' => $validated['name'] ?: '(Belum Ditentukan)',
            'nip' => $validated['nip'] ?? '',
            'avatar' => $validated['avatar'] ?? null,
            'order_index' => $maxOrder + 1,
            'pos_x' => $validated['pos_x'] ?? null,
            'pos_y' => $validated['pos_y'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data Posisi Jabatan & Pejabat Baru berhasil ditambahkan!',
            'data' => $pejabat,
        ], 201);
    }

    // PUT /api/v1/pejabat/{id} -> Update existing structural node & official
    public function update(Request $request, $id)
    {
        $pejabat = Pejabat::findOrFail($id);

        $validated = $request->validate([
            'position' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'nip' => 'nullable|string|max:100',
            'parent_id' => 'nullable|string|max:255',
            'avatar' => 'nullable|string',
            'pos_x' => 'nullable|integer',
            'pos_y' => 'nullable|integer',
        ]);

        $pejabat->update([
            'position' => mb_strtoupper($validated['position']),
            'name' => $validated['name'] ?: '(Belum Ditentukan)',
            'nip' => $validated['nip'] ?? '',
            'parent_id' => $validated['parent_id'] ?: null,
            'avatar' => array_key_exists('avatar', $validated) ? $validated['avatar'] : $pejabat->avatar,
            'pos_x' => $validated['pos_x'] ?? $pejabat->pos_x,
            'pos_y' => $validated['pos_y'] ?? $pejabat->pos_y,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data Jabatan dan Pejabat berhasil diperbarui!',
            'data' => $pejabat,
        ]);
    }

    // DELETE /api/v1/pejabat/{id} -> Delete position
    public function destroy($id)
    {
        $pejabat = Pejabat::findOrFail($id);
        
        // Re-assign children to parent_id of deleted node to preserve tree
        Pejabat::where('parent_id', $pejabat->node_id)->update([
            'parent_id' => $pejabat->parent_id,
        ]);

        $pejabat->delete();

        return response()->json([
            'success' => true,
            'message' => 'Posisi Jabatan berhasil dihapus dari struktur!',
        ]);
    }

    // POST /api/v1/pejabat/bulk-update -> Assign pejabat in bulk
    public function bulkUpdate(Request $request)
    {
        $officials = $request->input('officials', []);

        foreach ($officials as $item) {
            if (isset($item['node_id'])) {
                Pejabat::where('node_id', $item['node_id'])->update([
                    'name' => $item['name'] ?: '(Belum Ditentukan)',
                    'position' => mb_strtoupper($item['position'] ?? ''),
                    'nip' => $item['nip'] ?? '',
                    'avatar' => $item['avatar'] ?? null,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Penugasan Pejabat BAPPEDA berhasil disinkronkan!',
        ]);
    }

    // POST /api/v1/pejabat/save-positions -> Save Canvas XY coordinates for interactive org chart
    public function savePositions(Request $request)
    {
        $positions = $request->input('positions', []);

        foreach ($positions as $item) {
            if (isset($item['node_id'])) {
                Pejabat::where('node_id', $item['node_id'])->update([
                    'pos_x' => (int) $item['x'],
                    'pos_y' => (int) $item['y'],
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Posisi Tata Letak Bagan (Koordinat Canvas) Berhasil Disimpan!',
        ]);
    }
}
