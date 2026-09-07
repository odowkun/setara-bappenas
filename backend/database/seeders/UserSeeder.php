<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['superadmin', 'admin_umum', 'admin_bidang'] as $roleName) {
            Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);
        }

        $email = strtolower(trim((string) env('BAPPEDA_SEED_SUPERADMIN_EMAIL')));
        $password = (string) env('BAPPEDA_SEED_SUPERADMIN_PASSWORD');

        if ($email === '' || $password === '') {
            $this->command?->warn(
                'Super Admin tidak dibuat. Isi BAPPEDA_SEED_SUPERADMIN_EMAIL dan BAPPEDA_SEED_SUPERADMIN_PASSWORD sebelum menjalankan seeder.'
            );

            return;
        }

        if (
            strlen($password) < 12
            || ! preg_match('/[a-z]/', $password)
            || ! preg_match('/[A-Z]/', $password)
            || ! preg_match('/[0-9]/', $password)
        ) {
            throw new \RuntimeException(
                'BAPPEDA_SEED_SUPERADMIN_PASSWORD minimal 12 karakter dan wajib mengandung huruf besar, huruf kecil, serta angka.'
            );
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => (string) env('BAPPEDA_SEED_SUPERADMIN_NAME', 'Super Admin BAPPEDA Halut'),
                'password' => Hash::make($password),
                'role' => 'superadmin',
                'jabatan' => 'Administrator Sistem',
                'allowed_document_permissions' => [
                    'rpjpd',
                    'rpjmd',
                    'rkpd',
                    'lkpj',
                    'renstra',
                    'renja',
                    'dik_sektoral',
                    'data_sektoral',
                ],
            ]
        );
        $user->syncRoles(['superadmin']);
    }
}
