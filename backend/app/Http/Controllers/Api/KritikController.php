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

    public function publicFeed()
    {
        $kritiks = Kritik::query()
            ->latest()
            ->take(100)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama' => $this->maskName($item->nama),
                    'skpd_tujuan' => $item->skpd_tujuan,
                    'subjek' => $item->subjek,
                    'pesan' => $item->pesan,
                    'status' => $item->status,
                    'catatan_balasan' => $item->catatan_balasan,
                    'created_at' => $item->created_at ? $item->created_at->toISOString() : null,
                ];
            });

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $kritiks,
        ]);
    }

    private function maskName(?string $name): string
    {
        if (empty($name)) {
            return 'Warga (***)';
        }

        $parts = preg_split('/\s+/', trim($name));
        $maskedParts = array_map(function ($part) {
            $len = mb_strlen($part);
            if ($len <= 1) {
                return $part . '***';
            }
            return mb_substr($part, 0, 1) . '***';
        }, $parts);

        return implode(' ', $maskedParts);
    }

    public function updateTanggapan(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Menunggu Tanggapan,Dalam Proses,Dalam Proses Tindak Lanjut,Sudah Ditanggapi,Ditutup',
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
