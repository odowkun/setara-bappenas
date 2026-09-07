<?php

namespace Tests\Feature;

use App\Models\SpatialLayer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SpatialLayerTest extends TestCase
{
    use RefreshDatabase;

    private function createAdminUser(): User
    {
        $role = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $permission = Permission::firstOrCreate(['name' => 'manage_dashboard', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);

        $admin = User::create([
            'name' => 'Super Admin Test',
            'email' => 'admin_spatial@halmaherautarakab.go.id',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
        ]);
        $admin->assignRole('superadmin');

        return $admin;
    }

    public function test_can_list_spatial_layers(): void
    {
        SpatialLayer::create([
            'name' => 'Layer Test 1',
            'type' => 'kecamatan',
            'legal_basis' => 'Perda No. 1 2026',
            'feature_count' => 3,
            'color' => '#0284c7',
            'visible' => true,
        ]);

        $response = $this->getJson('/api/v1/spatial-layers');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(3, 'data');
    }

    public function test_authorized_user_can_create_and_toggle_spatial_layer(): void
    {
        $admin = $this->createAdminUser();

        // 1. Create
        $createRes = $this->actingAs($admin)
            ->postJson('/api/v1/spatial-layers', [
                'name' => 'Kecamatan Kao Barat',
                'type' => 'kecamatan',
                'legal_basis' => 'Perda Halut 2026',
                'feature_count' => 4,
                'color' => '#10b981',
                'visible' => true,
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Kecamatan Kao Barat')
            ->assertJsonPath('data.visible', true);

        $layerId = $createRes->json('data.id');

        // 2. Toggle visibility
        $toggleRes = $this->actingAs($admin)
            ->patchJson("/api/v1/spatial-layers/{$layerId}/toggle");

        $toggleRes->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.visible', false);

        // 3. Delete
        $deleteRes = $this->actingAs($admin)
            ->deleteJson("/api/v1/spatial-layers/{$layerId}");

        $deleteRes->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('spatial_layers', ['id' => $layerId]);
    }
}
