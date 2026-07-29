<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower($request->email))->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'code' => 401,
                'message' => 'Email atau kata sandi tidak sesuai.',
            ], 401);
        }

        // Generate Sanctum API token
        $token = $user->createToken('bappeda_spbe_token')->plainTextToken;

        // Log audit
        DB::table('audit_logs')->insert([
            'user_name' => $user->name,
            'user_role' => $user->role,
            'action' => 'LOGIN_SUCCESS',
            'details' => "Berhasil masuk sebagai {$user->role}",
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Login berhasil',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'bidang' => $user->bidang,
                    'nip' => $user->nip,
                    'jabatan' => $user->jabatan,
                ],
            ],
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Logout berhasil',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $request->user(),
        ]);
    }
}
