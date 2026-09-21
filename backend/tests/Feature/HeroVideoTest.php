<?php

namespace Tests\Feature;

use App\Models\HeroVideoSetting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HeroVideoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\UserSeeder::class);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'manage_galeri', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'manage_dashboard', 'guard_name' => 'web']);
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $role->givePermissionTo(['manage_galeri', 'manage_dashboard']);
    }

    public function test_public_can_get_hero_video_setting(): void
    {
        $response = $this->getJson('/api/v1/hero-video');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'id',
                    'video_url',
                    'poster_url',
                    'badge_title',
                    'badge_subtitle',
                    'title',
                    'subtitle',
                    'is_active',
                ],
            ]);
    }

    public function test_admin_can_get_and_update_hero_video_with_youtube_url(): void
    {
        $admin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $admin->assignRole('superadmin');
        Sanctum::actingAs($admin);

        $responseGet = $this->getJson('/api/v1/admin/hero-video');
        $responseGet->assertOk()
            ->assertJsonPath('status', 'success');

        $payload = [
            'video_url' => 'https://youtu.be/ABs7uaqojsY?si=mocXO85Nkj6MABIK',
            'poster_url' => '/storage/media/web/1789952056_web_Foto 1.webp',
            'badge_title' => 'VIDEO SAMBUTAN PEMBUKAAN',
            'badge_subtitle' => 'Pembangunan Halut 2026',
            'title' => 'Sambutan & Arah Kebijakan Pembangunan',
            'subtitle' => 'Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara.',
            'is_active' => true,
        ];

        $responsePut = $this->putJson('/api/v1/admin/hero-video', $payload);

        $responsePut->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.video_url', 'https://youtu.be/ABs7uaqojsY?si=mocXO85Nkj6MABIK')
            ->assertJsonPath('data.poster_url', '/storage/media/web/1789952056_web_Foto 1.webp');

        $this->assertDatabaseHas('hero_video_settings', [
            'video_url' => 'https://youtu.be/ABs7uaqojsY?si=mocXO85Nkj6MABIK',
            'poster_url' => '/storage/media/web/1789952056_web_Foto 1.webp',
        ]);
    }

    public function test_admin_can_update_hero_video_with_mp4_file(): void
    {
        $admin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $admin->assignRole('superadmin');
        Sanctum::actingAs($admin);

        $payload = [
            'video_url' => '/storage/media/originals/1789952056_master_video.mp4',
            'poster_url' => '/images/bappeda/fgd-keuangan.png',
            'badge_title' => 'DOKUMENTASI KHUSUS',
            'badge_subtitle' => 'Halut Emas 2026',
            'title' => 'Video Arahan Kepala BAPPEDA',
            'subtitle' => 'Dokumentasi resmi arahan strategis.',
            'is_active' => true,
        ];

        $responsePut = $this->putJson('/api/v1/admin/hero-video', $payload);

        $responsePut->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.video_url', '/storage/media/originals/1789952056_master_video.mp4')
            ->assertJsonPath('data.title', 'Video Arahan Kepala BAPPEDA');
    }

    public function test_unauthenticated_user_cannot_update_hero_video(): void
    {
        $payload = [
            'video_url' => 'https://youtu.be/ABs7uaqojsY',
            'title' => 'Test Video',
        ];

        $response = $this->putJson('/api/v1/admin/hero-video', $payload);
        $response->assertUnauthorized();
    }
}
