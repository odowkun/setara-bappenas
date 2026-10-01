<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    use HasRoles {
        hasPermissionTo as traitHasPermissionTo;
        getAllPermissions as traitGetAllPermissions;
        syncPermissions as traitSyncPermissions;
    }

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'bidang',
        'allowed_document_permissions',
        'custom_permissions',
        'nip',
        'jabatan',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'allowed_document_permissions' => 'array',
            'custom_permissions' => 'array',
        ];
    }

    public function hasPermissionTo($permission, ?string $guardName = null): bool
    {
        if ($this->hasRole('superadmin')) {
            return true;
        }

        if ($this->custom_permissions !== null) {
            $permissionName = $permission instanceof \Spatie\Permission\Models\Permission
                ? $permission->name
                : (is_string($permission) ? $permission : (string) ($permission->name ?? $permission));

            return in_array($permissionName, $this->custom_permissions, true);
        }

        return $this->traitHasPermissionTo($permission, $guardName);
    }

    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        if ($this->hasRole('superadmin')) {
            return \Spatie\Permission\Models\Permission::query()->orderBy('name')->get();
        }

        if ($this->custom_permissions !== null) {
            if (empty($this->custom_permissions)) {
                return collect();
            }

            return \Spatie\Permission\Models\Permission::whereIn('name', $this->custom_permissions)
                ->orderBy('name')
                ->get();
        }

        return $this->traitGetAllPermissions();
    }

    public function syncPermissions(...$permissions): static
    {
        $collected = collect($permissions)
            ->flatten()
            ->map(fn ($p) => $p instanceof \Spatie\Permission\Models\Permission ? $p->name : (string) $p)
            ->filter()
            ->values()
            ->all();

        $this->custom_permissions = $collected;
        $this->saveQuietly();

        return $this->traitSyncPermissions(...$permissions);
    }
}
