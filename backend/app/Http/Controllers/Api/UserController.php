<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use DB;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles', 'permissions')->latest()->get();
        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:superadmin,admin_umum,admin_bidang',
            'bidang' => 'nullable|string|in:infrastruktur,perekonomian,sosbud,renval',
            'nip' => 'nullable|string',
            'jabatan' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make('password123'),
            'role' => $request->role,
            'bidang' => $request->role === 'admin_bidang' ? $request->bidang : null,
            'nip' => $request->nip,
            'jabatan' => $request->jabatan,
        ]);

        // Assign Spatie Role
        $user->assignRole($request->role);

        DB::table('audit_logs')->insert([
            'user_name' => $request->user()?->name ?? 'Administrator',
            'user_role' => 'superadmin',
            'action' => 'ADD_USER',
            'details' => "Menambah user pengelola SPBE baru: {$user->name} ({$user->role}) - Bidang: " . ($user->bidang ?? 'Global'),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Pengguna pengelola SPBE berhasil ditambahkan',
            'data' => $user->load('roles', 'permissions'),
        ]);
    }

    public function destroy($id, Request $request)
    {
        $user = User::findOrFail($id);
        $name = $user->name;
        $user->delete();

        DB::table('audit_logs')->insert([
            'user_name' => $request->user()?->name ?? 'Administrator',
            'user_role' => 'superadmin',
            'action' => 'DELETE_USER',
            'details' => "Menghapus user pengelola SPBE: {$name}",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'User berhasil dihapus',
        ]);
    }
}
