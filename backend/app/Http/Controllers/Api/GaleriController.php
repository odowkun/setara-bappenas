<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Galeri;
use App\Services\OfficialPublicationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GaleriController extends Controller
{
    public function __construct(
        private readonly OfficialPublicationService $publicationService
    ) {}

    public function index(Request $request)
    {
        return $this->listing($request, false);
    }

    public function adminIndex(Request $request)
    {
        return $this->listing($request, true);
    }

    public function show(Galeri $galeri)
    {
        return response()->json([
            'success' => true,
            'data' => $this->payload($galeri),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateGallery($request);
        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);

        $galeri = Galeri::create([
            ...$validated,
            'is_published' => false,
            'created_by_user_id' => $request->user()->id,
        ]);

        if ($publish) {
            $galeri = $this->publicationService->update($galeri, true, $request->user());
        }

        return response()->json([
            'success' => true,
            'message' => $publish
                ? 'Album galeri berhasil disimpan dan diterbitkan.'
                : 'Album galeri berhasil disimpan sebagai draf.',
            'data' => $this->payload($galeri),
        ], 201);
    }

    public function update(Request $request, Galeri $galeri)
    {
        $validated = $this->validateGallery($request, true);
        $publicationChanged = array_key_exists('is_published', $validated);
        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);

        $galeri->update($validated);
        $galeri->refresh();

        if ($publicationChanged) {
            $galeri = $this->publicationService->update($galeri, $publish, $request->user());
        }

        return response()->json([
            'success' => true,
            'message' => 'Album galeri berhasil diperbarui di database.',
            'data' => $this->payload($galeri),
        ]);
    }

    public function updatePublication(Request $request, Galeri $galeri)
    {
        $validated = $request->validate([
            'is_published' => 'required|boolean',
        ]);

        $galeri = $this->publicationService->update(
            $galeri,
            $validated['is_published'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => $galeri->is_published
                ? 'Album galeri berhasil diterbitkan.'
                : 'Album galeri ditarik menjadi draf.',
            'data' => $this->payload($galeri),
        ]);
    }

    public function destroy(Galeri $galeri)
    {
        $galeri->delete();

        return response()->json([
            'success' => true,
            'message' => 'Album galeri berhasil dihapus dari database.',
        ]);
    }

    private function listing(Request $request, bool $admin)
    {
        $query = Galeri::query()->orderByDesc('event_date')->orderByDesc('id');

        if (! $admin) {
            $query->where('is_published', true);
        }
        if ($request->filled('category') && $request->string('category')->toString() !== 'Semua') {
            $query->where('category', $request->string('category')->limit(255)->toString());
        }
        if ($request->filled('search')) {
            $search = $request->string('search')->limit(100)->toString();
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()->map(fn (Galeri $galeri): array => $this->payload($galeri)),
        ]);
    }

    private function validateGallery(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes|required' : 'required';
        $safeMediaUrl = function (string $attribute, mixed $value, \Closure $fail): void {
            if (
                ! is_string($value)
                || str_starts_with($value, 'blob:')
                || str_starts_with($value, 'data:')
            ) {
                $fail("{$attribute} harus berupa URL media yang sudah tersimpan di server.");
            }
        };

        return $request->validate([
            'title' => "{$required}|string|max:255",
            'category' => "{$required}|string|max:255",
            'event_date' => 'nullable|date',
            'description' => 'nullable|string|max:10000',
            'cover_image' => ['nullable', 'string', 'max:2048', $safeMediaUrl],
            'media' => 'nullable|array|max:100',
            'media.*.id' => 'required_with:media|string|max:100',
            'media.*.type' => ['required_with:media', Rule::in(['image', 'video'])],
            'media.*.url' => ['required_with:media', 'string', 'max:2048', $safeMediaUrl],
            'media.*.master_url' => ['nullable', 'string', 'max:2048', $safeMediaUrl],
            'media.*.title' => 'required_with:media|string|max:255',
            'is_published' => 'sometimes|boolean',
        ]);
    }

    private function payload(Galeri $galeri): array
    {
        $media = is_array($galeri->media) ? $galeri->media : [];

        return [
            'id' => (string) $galeri->id,
            'title' => $galeri->title,
            'category' => $galeri->category,
            'eventDate' => $galeri->event_date?->format('Y-m-d'),
            'description' => $galeri->description,
            'coverImage' => $galeri->cover_image,
            'photoCount' => count(array_filter(
                $media,
                fn (array $item): bool => ($item['type'] ?? 'image') === 'image'
            )),
            'videoCount' => count(array_filter(
                $media,
                fn (array $item): bool => ($item['type'] ?? '') === 'video'
            )),
            'media' => $media,
            'is_published' => $galeri->is_published,
            'published_at' => $galeri->published_at?->toISOString(),
            'isPublished' => $galeri->is_published,
            'publishedAt' => $galeri->published_at?->toISOString(),
            'createdAt' => $galeri->created_at?->toISOString(),
        ];
    }
}
