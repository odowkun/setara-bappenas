<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\JenisDokumen;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles', 'permissions')->latest()->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => UserResource::collection($users)->resolve(),
        ]);
    }

    public function store(Request $request)
    {
        $explicitUsername = $request->filled('username');
        $usernameInput = trim((string) ($request->input('username') ?? ''));
        $emailInput = trim((string) ($request->input('email') ?? ''));

        if (! $explicitUsername) {
            if ($emailInput !== '') {
                $baseUser = preg_replace('/[^a-zA-Z0-9_.-]/', '', explode('@', $emailInput)[0]);
                $usernameInput = Str::lower($baseUser ?: 'user' . time());
            } elseif ($request->has('name')) {
                $baseUser = preg_replace('/[^a-zA-Z0-9_.-]/', '', Str::slug($request->string('name')->toString(), '.'));
                $usernameInput = Str::lower($baseUser ?: 'user' . time());
            }

            if ($usernameInput !== '' && User::where('username', $usernameInput)->exists()) {
                $suffix = 1;
                while (User::where('username', "{$usernameInput}{$suffix}")->exists()) {
                    $suffix++;
                }
                $usernameInput = "{$usernameInput}{$suffix}";
            }
        }

        $request->merge([
            'username' => $usernameInput !== '' ? Str::lower($usernameInput) : null,
            'email' => $emailInput !== '' ? Str::lower($emailInput) : null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:50', 'regex:/^[a-zA-Z0-9_.-]+$/', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(12)->mixedCase()->numbers(),
            ],
            'role' => ['required', Rule::in(['superadmin', 'admin_umum', 'admin_bidang'])],
            'bidang' => ['nullable', Rule::in(['infrastruktur', 'perekonomian', 'sosbud', 'renval'])],
            'nip' => ['nullable', 'string', 'max:50'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
            'allowed_document_permissions' => ['sometimes', 'nullable', 'array'],
            'allowed_document_permissions.*' => ['string', Rule::in($this->documentPermissionNames())],
        ], [
            'username.regex' => 'Username hanya boleh berupa huruf, angka, titik, strip (-), dan garis bawah (_).',
            'username.unique' => 'Username ini sudah digunakan oleh akun lain.',
        ]);

        $this->validateBidangForRole($validated);

        $user = DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'username' => $validated['username'],
                'email' => $validated['email'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'bidang' => $validated['role'] === 'admin_bidang' ? $validated['bidang'] : null,
                'nip' => $validated['nip'] ?? null,
                'jabatan' => $validated['jabatan'] ?? null,
                'allowed_document_permissions' => $validated['allowed_document_permissions']
                    ?? $this->defaultDocumentPermissions($validated['role'], $validated['bidang'] ?? null),
            ]);

            $user->syncRoles([$validated['role']]);
            $user->syncPermissions($validated['permissions'] ?? []);

            return $user;
        });

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Pengguna pengelola berhasil ditambahkan',
            'data' => (new UserResource($user->fresh()))->resolve(),
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        if ($request->has('username')) {
            $uVal = trim((string) $request->input('username'));
            $request->merge(['username' => $uVal !== '' ? Str::lower($uVal) : null]);
        }
        if ($request->has('email')) {
            $eVal = trim((string) $request->input('email'));
            $request->merge(['email' => $eVal !== '' ? Str::lower($eVal) : null]);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => [
                'sometimes',
                'required',
                'string',
                'min:3',
                'max:50',
                'regex:/^[a-zA-Z0-9_.-]+$/',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => [
                'nullable',
                'confirmed',
                Password::min(12)->mixedCase()->numbers(),
            ],
            'role' => ['sometimes', 'required', Rule::in(['superadmin', 'admin_umum', 'admin_bidang'])],
            'bidang' => ['nullable', Rule::in(['infrastruktur', 'perekonomian', 'sosbud', 'renval'])],
            'nip' => ['nullable', 'string', 'max:50'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
            'allowed_document_permissions' => ['sometimes', 'nullable', 'array'],
            'allowed_document_permissions.*' => ['string', Rule::in($this->documentPermissionNames())],
        ], [
            'username.regex' => 'Username hanya boleh berupa huruf, angka, titik, strip (-), dan garis bawah (_).',
            'username.unique' => 'Username ini sudah digunakan oleh akun lain.',
        ]);

        $role = $validated['role'] ?? $user->role;
        $this->validateBidangForRole([...$validated, 'role' => $role]);

        if (
            $user->hasRole('superadmin')
            && $role !== 'superadmin'
            && User::role('superadmin')->count() <= 1
        ) {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Super Admin terakhir tidak dapat diturunkan rolenya.',
            ], 422);
        }

        if (
            $request->user()->is($user)
            && $role !== 'superadmin'
        ) {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Super Admin tidak dapat menurunkan role akunnya sendiri.',
            ], 422);
        }

        DB::transaction(function () use ($user, $validated, $role): void {
            $attributes = collect($validated)
                ->only(['name', 'username', 'email', 'nip', 'jabatan', 'allowed_document_permissions'])
                ->all();

            if (isset($attributes['email'])) {
                $attributes['email'] = Str::lower(trim($attributes['email']));
            }

            if (! empty($validated['password'])) {
                $attributes['password'] = Hash::make($validated['password']);
            }

            $attributes['role'] = $role;
            $attributes['bidang'] = $role === 'admin_bidang'
                ? ($validated['bidang'] ?? $user->bidang)
                : null;

            $user->update($attributes);
            $user->syncRoles([$role]);

            if (array_key_exists('permissions', $validated)) {
                $user->syncPermissions($validated['permissions']);
            }

            if (! empty($validated['password'])) {
                $user->tokens()->delete();
            }
        });

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Pengguna dan hak akses berhasil diperbarui.',
            'data' => (new UserResource($user->fresh()))->resolve(),
        ]);
    }

    public function destroy($id, Request $request)
    {
        $user = User::findOrFail($id);

        if ($request->user()->is($user)) {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Akun yang sedang digunakan tidak dapat dihapus.',
            ], 422);
        }

        if (
            $user->hasRole('superadmin')
            && User::role('superadmin')->count() <= 1
        ) {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Super Admin terakhir tidak dapat dihapus.',
            ], 422);
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'User berhasil dihapus',
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function validateBidangForRole(array $validated): void
    {
        if (
            ($validated['role'] ?? null) === 'admin_bidang'
            && empty($validated['bidang'])
        ) {
            throw ValidationException::withMessages([
                'bidang' => ['Bidang wajib dipilih untuk Admin Bidang.'],
            ]);
        }
    }

    /**
     * @return array<int, string>
     */
    private function documentPermissionNames(): array
    {
        $codes = JenisDokumen::pluck('code')->all();
        $fallback = ['rpjpd', 'rpjmd', 'rkpd', 'lkpj', 'renstra', 'renja', 'dik_sektoral', 'data_sektoral', 'rpjmn', 'rpjmd_prov', 'rpjmd_kab'];
        return array_values(array_unique(array_merge($fallback, $codes)));
    }

    /**
     * @return array<int, string>
     */
    private function defaultDocumentPermissions(string $role, ?string $bidang = null): array
    {
        if ($role === 'superadmin') {
            return $this->documentPermissionNames();
        }

        $query = JenisDokumen::query();
        if ($role === 'admin_umum' || $bidang === 'semua') {
            $query->whereIn('scope_role', ['admin_umum', 'semua', 'sektert']);
        } elseif ($bidang) {
            $query->whereIn('scope_role', ['semua', 'admin_bidang', $bidang]);
        } else {
            $query->whereIn('scope_role', ['semua', 'admin_bidang']);
        }

        $codes = $query->pluck('code')->all();
        if (! empty($codes)) {
            return $codes;
        }

        return match ($role) {
            'superadmin' => $this->documentPermissionNames(),
            'admin_umum' => ['rpjpd', 'rpjmd', 'rkpd', 'lkpj', 'rpjmn', 'rpjmd_prov', 'rpjmd_kab'],
            default => ['renstra', 'renja', 'dik_sektoral', 'data_sektoral'],
        };
    }
}
