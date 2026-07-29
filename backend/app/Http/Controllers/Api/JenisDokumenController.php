<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JenisDokumen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JenisDokumenController extends Controller
{
    /**
     * Fetch list of document categories (Filterable by role / scope)
     */
    public function index(Request $request)
    {
        $role = $request->role ?? 'semua';
        
        $query = JenisDokumen::query();

        if ($role === 'admin_umum') {
            $query->whereIn('scope_role', ['admin_umum', 'semua']);
        } elseif (str_contains($role, 'admin_bidang')) {
            $query->whereIn('scope_role', ['admin_bidang', 'semua']);
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
            'scope_role' => 'required|in:admin_umum,admin_bidang,semua',
        ]);

        $jenis = JenisDokumen::create([
            'name' => $request->name,
            'code' => strtolower(str_replace(' ', '_', preg_replace('/[^A-Za-z0-9\_]/', '', $request->code))),
            'scope_role' => $request->scope_role,
            'is_default' => false,
            'created_by' => $request->created_by ?? 'SuperAdmin',
        ]);

        DB::table('audit_logs')->insert([
            'user_name' => $request->created_by ?? 'SuperAdmin',
            'user_role' => 'superadmin',
            'action' => 'ADD_JENIS_DOKUMEN',
            'details' => "Menambah jenis dokumen baru: {$jenis->name} ({$jenis->scope_role})",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
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
        $name = $jenis->name;
        $jenis->delete();

        DB::table('audit_logs')->insert([
            'user_name' => $request->deleted_by ?? 'SuperAdmin',
            'user_role' => 'superadmin',
            'action' => 'DELETE_JENIS_DOKUMEN',
            'details' => "Menghapus jenis dokumen: {$name}",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => "Jenis dokumen '{$name}' berhasil dihapus dari database",
        ]);
    }
}
