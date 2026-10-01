<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserUsernameAndLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['superadmin', 'admin_umum', 'admin_bidang'] as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }
    }

    public function test_user_can_be_created_with_username_and_without_email(): void
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $superadmin->assignRole('superadmin');
        Sanctum::actingAs($superadmin);

        $response = $this->postJson('/api/v1/users', [
            'name' => 'Agustino Hermanus, ST',
            'username' => 'agustino.hermanus',
            'email' => null,
            'nip' => '198103202006041002',
            'jabatan' => 'Kabid Infrastruktur & Pengembangan Wilayah (IPW)',
            'role' => 'admin_bidang',
            'bidang' => 'infrastruktur',
            'password' => 'PasswordKuat123',
            'password_confirmation' => 'PasswordKuat123',
        ]);

        $response->assertCreated();
        $this->assertEquals('agustino.hermanus', $response->json('data.username'));
        $this->assertNull($response->json('data.email'));

        $this->assertDatabaseHas('users', [
            'name' => 'Agustino Hermanus, ST',
            'username' => 'agustino.hermanus',
            'email' => null,
            'nip' => '198103202006041002',
        ]);
    }

    public function test_user_can_login_with_username_or_email(): void
    {
        $user = User::factory()->create([
            'username' => 'pejabat.bappeda',
            'email' => 'pejabat@halmaherautarakab.go.id',
            'password' => bcrypt('KataSandiAman123'),
            'role' => 'admin_umum',
        ]);
        $user->assignRole('admin_umum');

        // Test login with username
        $loginWithUsername = $this->postJson('/api/v1/auth/login', [
            'login' => 'pejabat.bappeda',
            'password' => 'KataSandiAman123',
        ]);
        $loginWithUsername->assertOk();
        $this->assertEquals('pejabat.bappeda', $loginWithUsername->json('data.user.username'));

        // Test login with email
        $loginWithEmail = $this->postJson('/api/v1/auth/login', [
            'login' => 'pejabat@halmaherautarakab.go.id',
            'password' => 'KataSandiAman123',
        ]);
        $loginWithEmail->assertOk();
        $this->assertEquals('pejabat.bappeda', $loginWithEmail->json('data.user.username'));
    }

    public function test_duplicate_username_is_rejected(): void
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $superadmin->assignRole('superadmin');
        Sanctum::actingAs($superadmin);

        User::factory()->create([
            'username' => 'staf.it',
            'role' => 'admin_umum',
        ]);

        $this->postJson('/api/v1/users', [
            'name' => 'Staf IT Lain',
            'username' => 'staf.it',
            'role' => 'admin_umum',
            'password' => 'PasswordKuat123',
            'password_confirmation' => 'PasswordKuat123',
        ])->assertUnprocessable()->assertJsonValidationErrors('username');
    }

    public function test_user_can_update_username(): void
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $superadmin->assignRole('superadmin');
        Sanctum::actingAs($superadmin);

        $user = User::factory()->create([
            'username' => 'nama.lama',
            'role' => 'admin_umum',
        ]);
        $user->assignRole('admin_umum');

        $this->putJson("/api/v1/users/{$user->id}", [
            'username' => 'nama.baru',
        ])->assertOk()->assertJsonPath('data.username', 'nama.baru');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'username' => 'nama.baru',
        ]);
    }
}
