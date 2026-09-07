<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profil;
use App\Services\HtmlSanitizer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfilController extends Controller
{
    private const ALLOWED_KEYS = [
        'tentang',
        'visi_misi',
        'tugas_fungsi',
        'dasar_hukum',
    ];

    public function __construct(
        private readonly HtmlSanitizer $htmlSanitizer
    ) {}

    // GET /api/v1/profil -> Get all profiles or list
    public function index()
    {
        $profils = Profil::all()
            ->each(function (Profil $profil): void {
                $profil->content = $this->htmlSanitizer->sanitize($profil->content);
            })
            ->keyBy('key');

        return response()->json([
            'success' => true,
            'data' => $profils,
        ]);
    }

    // GET /api/v1/profil/{key} -> Fetch profile by key (tentang, visi_misi, tugas_fungsi, dasar_hukum)
    public function show($key)
    {
        abort_unless(in_array($key, self::ALLOWED_KEYS, true), 404);
        $profil = Profil::where('key', $key)->first();

        if (! $profil) {
            return response()->json([
                'success' => false,
                'message' => 'Data Profil tidak ditemukan',
            ], 404);
        }

        $profil->content = $this->htmlSanitizer->sanitize($profil->content);

        return response()->json([
            'success' => true,
            'data' => $profil,
        ]);
    }

    // POST/PUT /api/v1/profil/{key} -> Update or create profile entry
    public function update(Request $request, $key)
    {
        $request->merge(['key' => $key]);
        $validated = $request->validate([
            'key' => ['required', Rule::in(self::ALLOWED_KEYS)],
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'nullable|string|max:500000',
            'meta_json' => 'nullable|array',
        ]);

        $profil = Profil::updateOrCreate(
            ['key' => $key],
            [
                'title' => $validated['title'],
                'subtitle' => $validated['subtitle'] ?? null,
                'content' => $this->htmlSanitizer->sanitize($validated['content'] ?? null),
                'meta_json' => $validated['meta_json'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Data profil {$key} berhasil diperbarui!",
            'data' => $profil,
        ]);
    }
}
