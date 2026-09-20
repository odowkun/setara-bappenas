<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RunningText;
use Illuminate\Http\Request;

class RunningTextController extends Controller
{
    public function index()
    {
        $items = RunningText::where('is_active', true)
            ->orderBy('order_index', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    public function adminIndex()
    {
        $items = RunningText::orderBy('order_index', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'tag' => 'nullable|string|max:50',
            'url' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'order_index' => 'nullable|integer',
        ]);

        $item = RunningText::create([
            'content' => $validated['content'],
            'tag' => strtoupper($validated['tag'] ?? 'PENGUMUMAN'),
            'url' => $validated['url'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'order_index' => $validated['order_index'] ?? 0,
            'created_by' => $request->user()?->name ?? 'Admin',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Teks berjalan berhasil ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $item = RunningText::findOrFail($id);

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'tag' => 'nullable|string|max:50',
            'url' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'order_index' => 'nullable|integer',
        ]);

        $item->update([
            'content' => $validated['content'],
            'tag' => strtoupper($validated['tag'] ?? $item->tag),
            'url' => $validated['url'] ?? null,
            'is_active' => isset($validated['is_active']) ? (bool) $validated['is_active'] : $item->is_active,
            'order_index' => $validated['order_index'] ?? $item->order_index,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Teks berjalan berhasil diperbarui.',
            'data' => $item,
        ]);
    }

    public function toggle($id)
    {
        $item = RunningText::findOrFail($id);
        $item->update(['is_active' => ! $item->is_active]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status teks berjalan berhasil diubah.',
            'data' => $item,
        ]);
    }

    public function destroy($id)
    {
        $item = RunningText::findOrFail($id);
        $item->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Teks berjalan berhasil dihapus.',
        ]);
    }
}
