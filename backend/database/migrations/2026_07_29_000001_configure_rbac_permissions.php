<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * @var array<int, string>
     */
    private array $permissions = [
        'manage_dashboard',
        'manage_users',
        'view_audit_logs',
        'manage_profil',
        'manage_berita',
        'manage_pengumuman',
        'manage_galeri',
        'manage_tautan_opd',
        'manage_dokumen',
        'manage_document_types',
        'view_download_logs',
        'manage_survey',
        'manage_kritik',
        'manage_gis',
    ];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->permissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        $rolePermissions = [
            'superadmin' => $this->permissions,
            'admin_umum' => [
                'manage_dashboard',
                'manage_berita',
                'manage_pengumuman',
                'manage_galeri',
                'manage_tautan_opd',
                'manage_dokumen',
                'view_download_logs',
                'manage_survey',
                'manage_kritik',
                'manage_gis',
            ],
            'admin_bidang' => [
                'manage_dokumen',
                'manage_gis',
            ],
        ];

        foreach ($rolePermissions as $roleName => $permissions) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);
            $role->syncPermissions($permissions);
        }

        User::query()->each(function (User $user): void {
            if (in_array($user->role, ['superadmin', 'admin_umum', 'admin_bidang'], true)) {
                $user->syncRoles([$user->role]);
            }

            if ($user->allowed_document_permissions === null) {
                $user->forceFill([
                    'allowed_document_permissions' => match ($user->role) {
                        'superadmin' => ['rpjpd', 'rpjmd', 'rkpd', 'lkpj', 'renstra', 'renja', 'dik_sektoral', 'data_sektoral'],
                        'admin_umum' => ['rpjpd', 'rpjmd', 'rkpd', 'lkpj'],
                        default => ['renstra', 'renja', 'dik_sektoral', 'data_sektoral'],
                    },
                ])->save();
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::query()->each(function (Role $role): void {
            $remainingPermissions = $role->permissions
                ->reject(fn (Permission $permission): bool => in_array($permission->name, $this->permissions, true))
                ->pluck('name')
                ->all();

            $role->syncPermissions($remainingPermissions);
        });

        Permission::query()->whereIn('name', $this->permissions)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
