<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure Spatie Roles exist
        Role::firstOrCreate(['name' => 'superadmin']);
        Role::firstOrCreate(['name' => 'admin_umum']);
        Role::firstOrCreate(['name' => 'admin_bidang']);

        $users = [
            [
                'name' => 'Dr. Jan W. N. Papilaya, M.Si',
                'email' => 'admin@halmaherautarakab.go.id',
                'password' => Hash::make('password123'),
                'role' => 'superadmin',
                'nip' => '197204121998031004',
                'jabatan' => 'Kepala BAPPEDA (Administrator)',
            ],
            [
                'name' => 'Siti Rahmawati, S.STP',
                'email' => 'umum@halmaherautarakab.go.id',
                'password' => Hash::make('password123'),
                'role' => 'admin_umum',
                'nip' => '198509152009022003',
                'jabatan' => 'Kasubag Umum & Humas Bappeda',
            ],
            [
                'name' => 'Ir. Hendra Kusuma',
                'email' => 'infrastruktur@halmaherautarakab.go.id',
                'password' => Hash::make('password123'),
                'role' => 'admin_bidang',
                'bidang' => 'infrastruktur',
                'nip' => '198103202006041002',
                'jabatan' => 'Kabid Infrastruktur & Pengembangan Wilayah',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $user->assignRole($userData['role']);
        }
    }
}
