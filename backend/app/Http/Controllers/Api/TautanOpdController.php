<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TautanOpdController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('tautan_opds')
            ->orderBy('order_index')
            ->orderBy('name');

        if ($request->boolean('public')) {
            $query->where('is_active', true);
        }

        $items = $query->get()->map(fn ($item) => [
            'id' => (string) $item->id,
            'name' => $item->name,
            'logoUrl' => $item->logo_url,
            'url' => $item->url,
            'orderIndex' => (int) $item->order_index,
            'isActive' => (bool) $item->is_active,
            'createdAt' => $item->created_at,
            'updatedAt' => $item->updated_at,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:160',
            'logo_url' => 'required|string|max:2048',
            'url' => 'nullable|url|max:2048',
            'order_index' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $id = DB::table('tautan_opds')->insertGetId([
            'name' => $validated['name'],
            'logo_url' => $validated['logo_url'],
            'url' => $validated['url'] ?? null,
            'order_index' => $validated['order_index'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tautan OPD berhasil ditambahkan.',
            'data' => DB::table('tautan_opds')->where('id', $id)->first(),
        ], 201);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|mimes:jpg,jpeg,png,webp,svg|max:10240',
        ]);

        $file = $request->file('logo');
        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = now()->format('YmdHis') . '_' . Str::random(12) . '.' . $extension;
        $targetDir = public_path('uploads/tautan-opd');

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $file->move($targetDir, $filename);

        return response()->json([
            'status' => 'success',
            'message' => 'Logo OPD berhasil diunggah.',
            'data' => [
                'logo_url' => asset('uploads/tautan-opd/' . $filename),
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:160',
            'logo_url' => 'required|string|max:2048',
            'url' => 'nullable|url|max:2048',
            'order_index' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        DB::table('tautan_opds')->where('id', $id)->update([
            'name' => $validated['name'],
            'logo_url' => $validated['logo_url'],
            'url' => $validated['url'] ?? null,
            'order_index' => $validated['order_index'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tautan OPD berhasil diperbarui.',
        ]);
    }

    public function destroy($id)
    {
        DB::table('tautan_opds')->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Tautan OPD berhasil dihapus.',
        ]);
    }
}
