<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\JenisDokumen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserBidangScopedDocumentRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $permissions = [
            'manage_profil',
            'manage_pengumuman',
            'manage_tautan_opd',
            'manage_gis',
            'manage_dashboard',
            'view_audit_logs',
            'manage_berita',
            'manage_galeri',
            'manage_dokumen',
            'manage_users',
            'manage_survey',
            'view_download_logs',
            'manage_document_types',
            'manage_kritik',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $superadmin = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $superadmin->syncPermissions($permissions);

        $adminUmum = Role::firstOrCreate(['name' => 'admin_umum', 'guard_name' => 'web']);
        $adminUmum->syncPermissions(['manage_dokumen', 'manage_berita', 'manage_pengumuman']);

        $adminBidang = Role::firstOrCreate(['name' => 'admin_bidang', 'guard_name' => 'web']);
        $adminBidang->syncPermissions(['manage_dokumen', 'manage_gis']);

        // Seed Jenis Dokumen
        JenisDokumen::firstOrCreate([
            'code' => 'renstra',
        ], [
            'name' => 'Rencana Strategis',
            'scope_role' => 'semua',
            'is_default' => false,
            'created_by' => 'SuperAdmin',
        ]);

        JenisDokumen::firstOrCreate([
            'code' => 'klhs_ipw',
        ], [
            'name' => 'Kajian Lingkungan Hidup Strategis IPW',
            'scope_role' => 'infrastruktur',
            'is_default' => false,
            'created_by' => 'SuperAdmin',
        ]);

        JenisDokumen::firstOrCreate([
            'code' => 'stunting_sosbud',
        ], [
            'name' => 'RAD Penanganan Stunting',
            'scope_role' => 'sosbud',
            'is_default' => false,
            'created_by' => 'SuperAdmin',
        ]);
    }

    public function test_superadmin_can_create_user_with_bidang_and_granular_spatie_permissions(): void
    {
        $super = User::factory()->create(['role' => 'superadmin']);
        $super->assignRole('superadmin');
        Sanctum::actingAs($super);

        $response = $this->postJson('/api/v1/users', [
            'name' => 'Nofrendy Johanis Utubulang, ST',
            'email' => 'nofrendy@halut.go.id',
            'password' => 'PasswordKuat123',
            'password_confirmation' => 'PasswordKuat123',
            'role' => 'admin_bidang',
            'bidang' => 'infrastruktur',
            'jabatan' => 'Kabid Infrastruktur & Pengembangan Wilayah (IPW)',
            'permissions' => ['manage_pengumuman', 'manage_tautan_opd', 'manage_galeri', 'manage_dokumen', 'manage_users'],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', [
            'email' => 'nofrendy@halut.go.id',
            'role' => 'admin_bidang',
            'bidang' => 'infrastruktur',
        ]);

        $createdUser = User::where('email', 'nofrendy@halut.go.id')->first();
        $this->assertTrue($createdUser->hasPermissionTo('manage_dokumen'));
        $this->assertTrue($createdUser->hasPermissionTo('manage_pengumuman'));
        $this->assertFalse($createdUser->hasPermissionTo('manage_profil'));
    }

    public function test_admin_bidang_can_upload_global_document_and_own_bidang_document(): void
    {
        Storage::fake('local');
        $filePath = 'documents/2026/09/renstra_test_watermarked.pdf';
        Storage::disk('local')->put($filePath, '%PDF-1.4 sample');

        $ipwUser = User::factory()->create([
            'role' => 'admin_bidang',
            'bidang' => 'infrastruktur',
            'allowed_document_permissions' => null, // Dynamic default based on bidang
        ]);
        $ipwUser->assignRole('admin_bidang');
        Sanctum::actingAs($ipwUser);

        // 1. Upload dokumen global (renstra, scope_role: semua) -> HARUS LOLOS
        $resGlobal = $this->postJson('/api/v1/documents', [
            'title' => 'Renstra IPW 2026',
            'jenis' => 'renstra',
            'bidang' => 'infrastruktur',
            'tahun' => '2026',
            'ukuran' => '1 MB',
            'file_path' => $filePath,
        ]);
        $resGlobal->assertCreated();

        // 2. Upload dokumen khusus IPW (klhs_ipw, scope_role: infrastruktur) -> HARUS LOLOS
        $filePathKlhs = 'documents/2026/09/klhs_test_watermarked.pdf';
        Storage::disk('local')->put($filePathKlhs, '%PDF-1.4 sample');

        $resKlhs = $this->postJson('/api/v1/documents', [
            'title' => 'KLHS Tata Ruang Tobelo',
            'jenis' => 'klhs_ipw',
            'bidang' => 'infrastruktur',
            'tahun' => '2026',
            'ukuran' => '1 MB',
            'file_path' => $filePathKlhs,
        ]);
        $resKlhs->assertCreated();

        // 3. Upload dokumen khusus Sosbud (stunting_sosbud, scope_role: sosbud) -> HARUS DITOLAK 403
        $filePathStunting = 'documents/2026/09/stunting_test_watermarked.pdf';
        Storage::disk('local')->put($filePathStunting, '%PDF-1.4 sample');

        $resStunting = $this->postJson('/api/v1/documents', [
            'title' => 'RAD Stunting IPW Mencoba',
            'jenis' => 'stunting_sosbud',
            'bidang' => 'infrastruktur',
            'tahun' => '2026',
            'ukuran' => '1 MB',
            'file_path' => $filePathStunting,
        ]);
        $resStunting->assertForbidden();
    }

    public function test_jenis_dokumen_index_filters_correctly_by_bidang(): void
    {
        $super = User::factory()->create(['role' => 'superadmin']);
        $super->assignRole('superadmin');
        Sanctum::actingAs($super);

        // Filter IPW should return 'renstra' (semua) and 'klhs_ipw' (infrastruktur), but NOT 'stunting_sosbud'
        $res = $this->getJson('/api/v1/jenis-dokumen?bidang=infrastruktur');
        $res->assertOk();

        $codes = collect($res->json('data'))->pluck('code')->all();
        $this->assertContains('renstra', $codes);
        $this->assertContains('klhs_ipw', $codes);
        $this->assertNotContains('stunting_sosbud', $codes);
    }
}
