<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;

class KritikController extends Controller
{
    public function index()
    {
        $kritiks = DB::table('kritiks')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $kritiks,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string',
            'email' => 'required|email',
            'telepon' => 'nullable|string',
            'skpd_tujuan' => 'nullable|string',
            'subjek' => 'required|string',
            'pesan' => 'required|string',
        ]);

        $id = DB::table('kritiks')->insertGetId([
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
                'id' => $id,
                'status' => 'Menunggu Tanggapan',
            ]
        ]);
    }

    public function updateTanggapan(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
            'catatan_balasan' => 'nullable|string',
        ]);

        DB::table('kritiks')->where('id', $id)->update([
            'status' => $request->status,
            'catatan_balasan' => $request->catatan_balasan,
            'updated_at' => now(),
        ]);

        $item = DB::table('kritiks')->where('id', $id)->first();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Tanggapan Kritik & Saran berhasil disimpan',
            'data' => $item,
        ]);
    }
}
