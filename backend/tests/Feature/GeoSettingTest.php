<?php

namespace Tests\Feature;

use App\Models\GeoSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GeoSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_user_can_view_geo_settings(): void
    {
        $response = $this->getJson('/api/v1/geo-settings');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.default_latitude', 1.7289)
            ->assertJsonPath('data.default_longitude', 128.0054);
    }

    public function test_authorized_admin_can_update_geo_settings(): void
    {
        $role = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $permission = Permission::firstOrCreate(['name' => 'manage_dashboard', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);

        $admin = User::create([
            'name' => 'Super Admin Test',
            'email' => 'admin_test@halmaherautarakab.go.id',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
        ]);
        $admin->assignRole('superadmin');

        $response = $this->actingAs($admin)
            ->putJson('/api/v1/geo-settings', [
                'default_latitude' => 1.7299,
                'default_longitude' => 128.0066,
                'default_zoom_level' => 14,
                'default_basemap' => 'googleHybrid',
                'esri_feature_service_url' => 'https://services.arcgis.com/test/FeatureServer/0',
                'esri_geoprocessing_url' => 'https://geoprocessing.arcgis.com/test/GPServer',
                'auto_sync_esri' => false,
                'default_layer_color' => '#2563eb',
                'default_fill_opacity' => 0.40,
                'max_kmz_file_mb' => 20,
                'spatial_reference_srid' => 'EPSG:4326',
                'unit_luas' => 'ha',
                'unit_panjang' => 'km',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.default_zoom_level', 14)
            ->assertJsonPath('data.default_basemap', 'googleHybrid')
            ->assertJsonPath('data.auto_sync_esri', false);
    }
}
