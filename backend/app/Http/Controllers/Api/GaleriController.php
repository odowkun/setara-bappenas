<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GaleriController extends Controller
{
    /**
     * Display a listing of the galeri albums from Database.
     */
    public function index(Request $request)
    {
        $query = DB::table('galeri')->orderBy('event_date', 'desc');

        if ($request->has('category') && $request->category !== 'Semua') {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $items = $query->get()->map(function ($item) {
            $mediaList = !empty($item->media) ? json_decode($item->media, true) : [];
            if (!is_array($mediaList) || count($mediaList) === 0) {
                $mediaList = [
                    [
                        'id' => 'm-' . $item->id,
                        'type' => 'image',
                        'url' => $item->cover_image ?: 'https://bappeda.halmaherautarakab.go.id/template/assets/img/halut.png',
                        'title' => $item->title,
                    ],
                ];
            }

            $photos = count(array_filter($mediaList, fn($m) => ($m['type'] ?? 'image') !== 'video'));
            $videos = count(array_filter($mediaList, fn($m) => ($m['type'] ?? '') === 'video'));

            return [
                'id' => (string) $item->id,
                'title' => $item->title,
                'category' => $item->category ?: 'General',
                'eventDate' => $item->event_date ?: date('Y-m-d'),
                'description' => $item->description ?: $item->title,
                'coverImage' => $item->cover_image ?: 'https://bappeda.halmaherautarakab.go.id/template/assets/img/halut.png',
                'photoCount' => $photos,
                'videoCount' => $videos,
                'media' => $mediaList,
                'createdAt' => $item->created_at ? explode(' ', $item->created_at)[0] : date('Y-m-d'),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    /**
     * Store a newly created galeri album in database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'event_date' => 'nullable|date',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'media' => 'nullable|array',
        ]);

        $mediaList = $validated['media'] ?? [
            [
                'id' => 'm-' . time(),
                'type' => 'image',
                'url' => $validated['cover_image'] ?? 'https://bappeda.halmaherautarakab.go.id/template/assets/img/halut.png',
                'title' => $validated['title'],
            ]
        ];

        $id = DB::table('galeri')->insertGetId([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'event_date' => $validated['event_date'] ?? now()->toDateString(),
            'description' => $validated['description'] ?? '',
            'cover_image' => $validated['cover_image'] ?? 'https://bappeda.halmaherautarakab.go.id/template/assets/img/halut.png',
            'media' => json_encode($mediaList),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $item = DB::table('galeri')->where('id', $id)->first();

        return response()->json([
            'status' => 'success',
            'message' => 'Album galeri berhasil disimpan ke database',
            'data' => $item,
        ], 201);
    }

    /**
     * Delete an album from database.
     */
    public function destroy($id)
    {
        DB::table('galeri')->where('id', $id)->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Album galeri berhasil dihapus dari database',
        ]);
    }
}
