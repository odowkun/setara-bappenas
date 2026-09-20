<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Infografis;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InfografisController extends Controller
{
    public function index(Request $request)
    {
        $query = Infografis::query()->published();

        if ($request->boolean('pinned')) {
            $query->pinned()
                ->orderBy('order_index', 'asc')
                ->orderBy('id', 'desc')
                ->limit($request->integer('limit', 5));

            return response()->json([
                'status' => 'success',
                'data' => $query->get(),
            ]);
        }

        if ($request->filled('category') && $request->query('category') !== 'Semua') {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('is_pinned', 'desc')
            ->orderBy('order_index', 'asc')
            ->orderBy('id', 'desc')
            ->paginate($request->integer('per_page', 12));

        return response()->json([
            'status' => 'success',
            'data' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function show($idOrSlug)
    {
        $infografis = Infografis::published()
            ->where(function ($q) use ($idOrSlug) {
                if (is_numeric($idOrSlug)) {
                    $q->where('id', $idOrSlug);
                } else {
                    $q->where('slug', $idOrSlug);
                }
            })
            ->firstOrFail();

        $infografis->increment('view_count');
        $infografis->refresh();

        return response()->json([
            'status' => 'success',
            'data' => $infografis,
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = Infografis::query();

        if ($request->filled('category') && $request->query('category') !== 'Semua') {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('is_pinned', 'desc')
            ->orderBy('order_index', 'asc')
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
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'image_url' => 'required|string|max:1000',
            'description' => 'nullable|string|max:5000',
            'is_pinned' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'order_index' => 'nullable|integer',
        ]);

        $baseSlug = Str::slug($validated['title']);
        $slug = $baseSlug;
        $counter = 1;
        while (Infografis::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $isPublished = (bool) ($validated['is_published'] ?? true);

        $infografis = Infografis::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'category' => $validated['category'] ?? 'Perencanaan',
            'image_url' => $validated['image_url'],
            'description' => $validated['description'] ?? null,
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
            'is_published' => $isPublished,
            'order_index' => (int) ($validated['order_index'] ?? 0),
            'created_by' => $request->user()?->name ?? 'Admin',
            'published_at' => $isPublished ? now() : null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Infografis berhasil ditambahkan.',
            'data' => $infografis,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $infografis = Infografis::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'image_url' => 'required|string|max:1000',
            'description' => 'nullable|string|max:5000',
            'is_pinned' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'order_index' => 'nullable|integer',
        ]);

        if ($infografis->title !== $validated['title']) {
            $baseSlug = Str::slug($validated['title']);
            $slug = $baseSlug;
            $counter = 1;
            while (Infografis::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $infografis->slug = $slug;
        }

        $wasPublished = $infografis->is_published;
        $nowPublished = isset($validated['is_published']) ? (bool) $validated['is_published'] : $wasPublished;

        $infografis->title = $validated['title'];
        $infografis->category = $validated['category'] ?? $infografis->category;
        $infografis->image_url = $validated['image_url'];
        $infografis->description = $validated['description'] ?? null;
        if (isset($validated['is_pinned'])) {
            $infografis->is_pinned = (bool) $validated['is_pinned'];
        }
        $infografis->is_published = $nowPublished;
        if (isset($validated['order_index'])) {
            $infografis->order_index = (int) $validated['order_index'];
        }

        if (! $wasPublished && $nowPublished && ! $infografis->published_at) {
            $infografis->published_at = now();
        }

        $infografis->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Infografis berhasil diperbarui.',
            'data' => $infografis,
        ]);
    }

    public function togglePin($id)
    {
        $infografis = Infografis::findOrFail($id);
        $infografis->is_pinned = ! $infografis->is_pinned;
        $infografis->save();

        return response()->json([
            'status' => 'success',
            'message' => $infografis->is_pinned ? 'Infografis disematkan di beranda.' : 'Sematkan infografis dicabut.',
            'data' => $infografis,
        ]);
    }

    public function togglePublish($id)
    {
        $infografis = Infografis::findOrFail($id);
        $infografis->is_published = ! $infografis->is_published;
        if ($infografis->is_published && ! $infografis->published_at) {
            $infografis->published_at = now();
        }
        $infografis->save();

        return response()->json([
            'status' => 'success',
            'message' => $infografis->is_published ? 'Infografis diterbitkan.' : 'Infografis ditarik menjadi draf.',
            'data' => $infografis,
        ]);
    }

    public function destroy($id)
    {
        $infografis = Infografis::findOrFail($id);
        $infografis->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Infografis berhasil dihapus.',
        ]);
    }
}
