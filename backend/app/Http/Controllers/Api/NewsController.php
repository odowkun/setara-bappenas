<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Services\HtmlSanitizer;
use App\Services\OfficialPublicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    public function __construct(
        private readonly HtmlSanitizer $htmlSanitizer,
        private readonly OfficialPublicationService $publicationService
    ) {}

    /**
     * Display a listing of all news articles with real view counts.
     */
    public function index(Request $request)
    {
        $query = News::query()->where('is_published', true);
        $this->applyFilters($query, $request);

        $news = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $news,
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = News::query();
        $this->applyFilters($query, $request);
        $news = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $news,
        ]);
    }

    public function adminShow(News $news)
    {
        $news->content = $this->htmlSanitizer->sanitize($news->content);

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
        $news = News::query()
            ->where('is_published', true)
            ->where(function ($query) use ($idOrSlug): void {
                $query->where('id', $idOrSlug)
                    ->orWhere('slug', $idOrSlug);
            })
            ->firstOrFail();

        $news->content = $this->htmlSanitizer->sanitize($news->content);
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
            'category' => 'required|string|max:100|exists:news_categories,name',
            'content' => 'required|string|max:500000',
            'summary' => 'nullable|string|max:2000',
            'image' => 'nullable|string|max:2048',
            'is_published' => 'boolean',
        ]);

        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);
        $validated['content'] = $this->htmlSanitizer->sanitize($validated['content']);
        $validated['author'] = $request->user()->name;
        $validated['slug'] = Str::slug($validated['title']).'-'.time();
        $validated['date'] = now()->format('Y-m-d');
        $validated['views'] = 0;
        $validated['created_by_user_id'] = $request->user()->id;
        $validated['is_published'] = false;

        $news = News::create($validated);
        if ($publish) {
            $news = $this->publicationService->update($news, true, $request->user());
        }

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
            'category' => 'sometimes|required|string|max:100|exists:news_categories,name',
            'content' => 'sometimes|required|string|max:500000',
            'summary' => 'nullable|string|max:2000',
            'image' => 'nullable|string|max:2048',
            'is_published' => 'boolean',
        ]);

        $publicationChanged = array_key_exists('is_published', $validated);
        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);
        if (array_key_exists('content', $validated)) {
            $validated['content'] = $this->htmlSanitizer->sanitize($validated['content']);
        }

        if (isset($validated['title']) && $validated['title'] !== $news->title) {
            $validated['slug'] = Str::slug($validated['title']).'-'.time();
        }

        $news->update($validated);
        if ($publicationChanged) {
            $news = $this->publicationService->update($news, $publish, $request->user());
        }

        return response()->json([
            'success' => true,
            'message' => 'Artikel berita berhasil diperbarui di database.',
            'data' => $news,
        ]);
    }

    public function updatePublication(Request $request, News $news)
    {
        $validated = $request->validate([
            'is_published' => 'required|boolean',
        ]);
        $news = $this->publicationService->update(
            $news,
            $validated['is_published'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => $news->is_published
                ? 'Artikel berita berhasil diterbitkan.'
                : 'Artikel berita ditarik menjadi draf.',
            'data' => $news,
        ]);
    }

    /**
     * Increment views count directly via API.
     */
    public function incrementViews($id)
    {
        $news = News::query()->where('is_published', true)->findOrFail($id);
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

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('category') && $request->category !== 'Semua') {
            $query->where('category', $request->string('category')->toString());
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->limit(100)->toString();
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }
    }
}
