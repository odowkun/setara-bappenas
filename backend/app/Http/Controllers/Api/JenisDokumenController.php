<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JenisDokumen;
use Illuminate\Http\Request;

class JenisDokumenController extends Controller
{
    /**
     * Fetch list of document categories (Filterable by role / scope)
     */
    public function index(Request $request)
    {
        $role = $request->role ?? null;
        $bidang = $request->bidang ?? null;

        $query = JenisDokumen::query();

        if ($role === 'superadmin') {
            // SuperAdmin has access to all document types
        } elseif ($bidang && $bidang !== 'semua') {
            // Filter by specific bidang plus global/common documents
            $query->whereIn('scope_role', ['semua', 'admin_bidang', $bidang]);
        } elseif ($role === 'admin_umum' || $bidang === 'semua') {
            // Sekretariat / Admin Umum gets makro and global documents
            $query->whereIn('scope_role', ['admin_umum', 'semua', 'sektert']);
        } elseif ($role === 'admin_bidang') {
            // Any admin_bidang gets global or bidang-scoped documents
            $query->whereIn('scope_role', ['admin_bidang', 'semua', 'infrastruktur', 'sosbud', 'perekonomian', 'renval']);
        }

        $list = $query->orderBy('id', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $list,
        ]);
    }

    /**
     * Store new document category (Administrator Only)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:jenis_dokuments,code',
            'scope_role' => 'required|in:admin_umum,admin_bidang,semua,infrastruktur,sosbud,perekonomian,renval,sektert',
        ]);

        $jenis = JenisDokumen::create([
            'name' => $request->name,
            'code' => strtolower(str_replace(' ', '_', preg_replace('/[^A-Za-z0-9\_]/', '', $request->code))),
            'scope_role' => $request->scope_role,
            'is_default' => false,
            'created_by' => $request->user()->name,
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Jenis dokumen baru berhasil ditambahkan ke database',
            'data' => $jenis,
        ]);
    }

    /**
     * Delete document category (Administrator Only)
     */
    public function destroy($id, Request $request)
    {
        $jenis = JenisDokumen::findOrFail($id);
        $jenis->delete();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => "Jenis dokumen '{$jenis->name}' berhasil dihapus dari database",
        ]);
    }
}
