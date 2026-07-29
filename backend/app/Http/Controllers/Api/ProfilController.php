<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profil;
use Illuminate\Http\Request;

class ProfilController extends Controller
{
    // GET /api/v1/profil -> Get all profiles or list
    public function index()
    {
        $profils = Profil::all()->keyBy('key');

        return response()->json([
            'success' => true,
            'data' => $profils,
        ]);
    }

    // GET /api/v1/profil/{key} -> Fetch profile by key (tentang, visi_misi, tugas_fungsi, dasar_hukum)
    public function show($key)
    {
        $profil = Profil::where('key', $key)->first();

        if (!$profil) {
            return response()->json([
                'success' => false,
                'message' => 'Data Profil tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $profil,
        ]);
    }

    // POST/PUT /api/v1/profil/{key} -> Update or create profile entry
    public function update(Request $request, $key)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'meta_json' => 'nullable|array',
        ]);

        $profil = Profil::updateOrCreate(
            ['key' => $key],
            [
                'title' => $validated['title'],
                'subtitle' => $validated['subtitle'] ?? null,
                'content' => $validated['content'] ?? null,
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
