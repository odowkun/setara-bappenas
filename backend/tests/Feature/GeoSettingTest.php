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

    public function test_authorized_admin_can_upload_and_reset_custom_boundary(): void
    {
        $role = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $permission = Permission::firstOrCreate(['name' => 'manage_dashboard', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);

        $admin = User::create([
            'name' => 'Super Admin Test',
            'email' => 'admin_geo@halmaherautarakab.go.id',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
        ]);
        $admin->assignRole('superadmin');

        $dummyGeoJson = [
            'type' => 'FeatureCollection',
            'features' => [
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Polygon',
                        'coordinates' => [
                            [
                                [128.0, 1.7],
                                [128.1, 1.7],
                                [128.1, 1.8],
                                [128.0, 1.8],
                                [128.0, 1.7],
                            ],
                        ],
                    ],
                    'properties' => ['name' => 'Batas Revisi RTRW 2026'],
                ],
            ],
        ];

        // 1. Upload Custom Boundary
        $uploadResponse = $this->actingAs($admin)
            ->postJson('/api/v1/geo-settings/boundary', [
                'file_name' => 'RTRW_Halut_2026.kmz',
                'geojson' => $dummyGeoJson,
                'features_count' => 1,
                'area_ha' => 12500.5,
                'length_km' => 45.2,
                'color' => '#dc2626',
            ]);

        $uploadResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.custom_boundary_name', 'RTRW_Halut_2026.kmz')
            ->assertJsonPath('data.has_custom_boundary', true)
            ->assertJsonPath('data.custom_boundary_features_count', 1);

        // Verify public user also sees custom boundary
        $publicResponse = $this->getJson('/api/v1/geo-settings');
        $publicResponse->assertStatus(200)
            ->assertJsonPath('data.custom_boundary_name', 'RTRW_Halut_2026.kmz')
            ->assertJsonPath('data.has_custom_boundary', true);

        // 2. Reset Custom Boundary
        $resetResponse = $this->actingAs($admin)
            ->deleteJson('/api/v1/geo-settings/boundary');

        $resetResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.custom_boundary_name', null)
            ->assertJsonPath('data.has_custom_boundary', false);
    }
}

