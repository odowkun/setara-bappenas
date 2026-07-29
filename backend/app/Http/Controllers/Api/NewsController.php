<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    /**
     * Display a listing of all news articles with real view counts.
     */
    public function index(Request $request)
    {
        $query = News::query();

        if ($request->has('category') && $request->category !== 'Semua') {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $news = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $news,
        ]);
    }

    /**
     * Display single news article and increment real database view count.
     */
    public function show($idOrSlug)
    {
        $news = News::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // Real Database Increment of Readers / Hit Views Count
        $news->increment('views');

        return response()->json([
            'success' => true,
            'data' => $news->fresh(),
        ]);
    }

    /**
     * Store new news article.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'author' => 'required|string',
            'content' => 'required|string',
            'summary' => 'nullable|string',
            'image' => 'nullable|string',
            'is_published' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . time();
        $validated['date'] = now()->format('Y-m-d');
        $validated['views'] = 0;

        $news = News::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Artikel berita berhasil disimpan ke database.',
            'data' => $news,
        ], 201);
    }

    /**
     * Update existing news article.
     */
    public function update(Request $request, $id)
    {
        $news = News::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string',
            'author' => 'sometimes|required|string',
            'content' => 'sometimes|required|string',
            'summary' => 'nullable|string',
            'image' => 'nullable|string',
            'is_published' => 'boolean',
        ]);

        if (isset($validated['title']) && $validated['title'] !== $news->title) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . time();
        }

        $news->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Artikel berita berhasil diperbarui di database.',
            'data' => $news,
        ]);
    }

    /**
     * Increment views count directly via API.
     */
    public function incrementViews($id)
    {
        $news = News::findOrFail($id);
        $news->increment('views');

        return response()->json([
            'success' => true,
            'views' => $news->views,
        ]);
    }

    /**
     * Remove news article.
     */
    public function destroy($id)
    {
        $news = News::findOrFail($id);
        $news->delete();

        return response()->json([
            'success' => true,
            'message' => 'Artikel berita berhasil dihapus dari database.',
        ]);
    }
}
