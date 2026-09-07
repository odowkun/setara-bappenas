<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kritik;
use Illuminate\Http\Request;

class KritikController extends Controller
{
    public function index()
    {
        $kritiks = Kritik::query()->latest()->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $kritiks,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telepon' => 'nullable|string|max:30',
            'skpd_tujuan' => 'nullable|string|max:255',
            'subjek' => 'required|string|max:255',
            'pesan' => 'required|string|max:5000',
        ]);

        $kritik = Kritik::query()->create([
            'nama' => $request->nama,
            'email' => $request->email,
            'telepon' => $request->telepon,
            'skpd_tujuan' => $request->skpd_tujuan ?? 'BAPPEDA Halmahera Utara',
            'subjek' => $request->subjek,
            'pesan' => $request->pesan,
            'status' => 'Menunggu Tanggapan',
            'catatan_balasan' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Kritik & Saran Anda berhasil disampaikan ke BAPPEDA.',
            'data' => [
                'id' => $kritik->id,
                'status' => 'Menunggu Tanggapan',
            ],
        ], 201);
    }

    public function updateTanggapan(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Menunggu Tanggapan,Dalam Proses,Sudah Ditanggapi,Ditutup',
            'catatan_balasan' => 'nullable|string|max:5000',
        ]);

        $item = Kritik::query()->findOrFail($id);
        $item->update([
            'status' => $request->status,
            'catatan_balasan' => $request->catatan_balasan,
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Tanggapan Kritik & Saran berhasil disimpan',
            'data' => $item->fresh(),
        ]);
    }
}
