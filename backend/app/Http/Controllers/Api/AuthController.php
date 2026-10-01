<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'nullable|string',
            'username' => 'nullable|string',
            'login' => 'nullable|string',
            'password' => 'required|string',
            'cf_turnstile_token' => 'nullable|string',
        ]);

        $loginInput = Str::lower(trim((string) (
            $request->input('login')
            ?? $request->input('username')
            ?? $request->input('email')
            ?? ''
        )));

        if ($loginInput === '') {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Username atau email wajib diisi.',
            ], 422);
        }

        // Cloudflare Turnstile Verification (jika secret key dikonfigurasi dan bukan saat running unit test)
        $turnstileSecret = config('services.cloudflare.turnstile_secret') ?? env('CLOUDFLARE_TURNSTILE_SECRET_KEY');
        if (! empty($turnstileSecret) && ! app()->runningUnitTests()) {
            $turnstileToken = $request->input('cf_turnstile_token') ?? $request->input('cf-turnstile-response');

            if (empty($turnstileToken)) {
                return response()->json([
                    'status' => 'error',
                    'code' => 422,
                    'message' => 'Verifikasi keamanan Cloudflare Turnstile wajib diselesaikan.',
                ], 422);
            }

            try {
                $cfResponse = \Illuminate\Support\Facades\Http::asForm()->timeout(5)->post(
                    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                    [
                        'secret' => $turnstileSecret,
                        'response' => $turnstileToken,
                        'remoteip' => $request->ip(),
                    ]
                );

                $cfData = $cfResponse->json();

                if (! ($cfData['success'] ?? false)) {
                    \Illuminate\Support\Facades\Log::warning('Cloudflare Turnstile verification failed', [
                        'ip' => $request->ip(),
                        'errors' => $cfData['error-codes'] ?? [],
                    ]);

                    return response()->json([
                        'status' => 'error',
                        'code' => 422,
                        'message' => 'Verifikasi keamanan Cloudflare gagal atau kedaluwarsa. Silakan muat ulang verifikasi.',
                    ], 422);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Cloudflare Turnstile connection failed: ' . $e->getMessage());
            }
        }

        $user = User::where(function ($query) use ($loginInput) {
            $query->where('email', $loginInput)
                ->orWhere('username', $loginInput);
        })->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            $maskedIdentifier = strlen($loginInput) > 4
                ? Str::mask($loginInput, '*', 2, max(strlen($loginInput) - 4, 1))
                : '***';

            DB::table('audit_logs')->insert([
                'user_name' => $maskedIdentifier,
                'user_role' => 'unknown',
                'action' => 'LOGIN_FAILED',
                'details' => 'Percobaan login ditolak.',
                'ip_address' => $request->ip() ?? 'unknown',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'status' => 'error',
                'code' => 401,
                'message' => 'Username/email atau kata sandi tidak sesuai.',
            ], 401);
        }

        // Generate Sanctum API token
        $token = $user->createToken('bappeda_auth_token')->plainTextToken;

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

        $isSecure = $request->isSecure() || config('app.env') === 'production';
        $cookie = cookie(
            'bappeda_sanctum_token',
            $token,
            60 * 24 * 7, // 7 days duration
            '/',
            null,
            $isSecure,
            true, // httpOnly: prevents XSS and JavaScript theft
            false,
            'Lax'
        );

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Login berhasil',
            'data' => [
                'token' => $token,
                'user' => (new UserResource($user))->resolve(),
            ],
        ])->withCookie($cookie);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }

        $forgetCookie = cookie()->forget('bappeda_sanctum_token', '/');

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Logout berhasil',
        ])->withCookie($forgetCookie);
    }

    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => (new UserResource($request->user()))->resolve(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $request->merge([
            'email' => Str::lower(trim($request->string('email')->toString())),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'nip' => ['nullable', 'string', 'max:50'],
            'jabatan' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update([
            ...$validated,
            'email' => Str::lower(trim($validated['email'])),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Profil berhasil diperbarui.',
            'data' => (new UserResource($user->fresh()))->resolve(),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required',
                'confirmed',
                Password::min(12)->mixedCase()->numbers(),
            ],
        ]);

        $user = $request->user();
        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Kata sandi lama tidak sesuai.',
                'errors' => [
                    'current_password' => ['Kata sandi lama tidak sesuai.'],
                ],
            ], 422);
        }

        $user->update(['password' => $validated['password']]);

        $currentTokenId = $user->currentAccessToken()?->id;
        $user->tokens()
            ->when($currentTokenId, fn ($query) => $query->whereKeyNot($currentTokenId))
            ->delete();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Kata sandi berhasil diperbarui. Sesi lain telah dicabut.',
        ]);
    }
}
