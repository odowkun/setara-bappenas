<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\ProyekDetail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProyekDetailProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_update_project_progress(): void
    {
        $admin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $admin->assignRole('superadmin');
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $document = Document::create([
            'title' => 'Dokumen Induk Test',
            'jenis' => 'rkpd',
            'bidang' => 'infrastruktur',
            'tahun' => '2026',
            'ukuran' => '1.2 MB',
            'file_path' => 'documents/test.pdf',
            'is_public' => true,
            'is_featured' => false,
            'uploaded_by' => 'Tester',
        ]);

        $proyek = ProyekDetail::create([
            'document_id' => $document->id,
            'kode_proyek' => 'PRJ-TEST-001',
            'nama_proyek' => 'Jembatan Uji Coba',
            'bidang' => 'infrastruktur',
            'latitude' => 1.728,
            'longitude' => 127.998,
            'persentase_progres' => 20,
            'status_progres' => 'dalam_proses',
            'pagu_anggaran' => 100000000,
            'realisasi_anggaran' => 20000000,
            'created_by' => 'Tester',
        ]);

        $response = $this->putJson("/api/v1/proyek-details/{$proyek->id}/progres", [
            'persentase_progres' => 75,
            'status_progres' => 'dalam_proses',
            'realisasi_anggaran' => 75000000,
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.persentase_progres', 75)
            ->assertJsonPath('data.status_progres', 'dalam_proses')
            ->assertJsonPath('data.realisasi_anggaran', 75000000);

        $this->assertDatabaseHas('proyek_details', [
            'id' => $proyek->id,
            'persentase_progres' => 75,
            'status_progres' => 'dalam_proses',
            'realisasi_anggaran' => 75000000,
            'updated_by' => $admin->name,
        ]);
    }

    public function test_admin_bidang_can_only_update_project_within_their_bidang(): void
    {
        $adminInfra = User::factory()->create([
            'role' => 'admin_bidang',
            'bidang' => 'infrastruktur',
        ]);
        $adminInfra->assignRole('admin_bidang');

        $document = Document::create([
            'title' => 'Dokumen Ekonomi Test',
            'jenis' => 'rkpd',
            'bidang' => 'perekonomian',
            'tahun' => '2026',
            'ukuran' => '1.2 MB',
            'file_path' => 'documents/test-ekonomi.pdf',
            'is_public' => true,
            'is_featured' => false,
            'uploaded_by' => 'Tester',
        ]);

        $proyekEkonomi = ProyekDetail::create([
            'document_id' => $document->id,
            'kode_proyek' => 'PRJ-EKO-001',
            'nama_proyek' => 'Pasar Tradisional',
            'bidang' => 'perekonomian',
            'latitude' => 1.728,
            'longitude' => 127.998,
            'persentase_progres' => 10,
            'status_progres' => 'dalam_proses',
            'pagu_anggaran' => 100000000,
            'realisasi_anggaran' => 10000000,
            'created_by' => 'Tester',
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($adminInfra);

        // Should be forbidden (403) because project belongs to perekonomian
        $this->putJson("/api/v1/proyek-details/{$proyekEkonomi->id}/progres", [
            'persentase_progres' => 50,
            'status_progres' => 'dalam_proses',
        ])->assertForbidden();

        // Project in infrastruktur should succeed
        $proyekInfra = ProyekDetail::create([
            'document_id' => $document->id,
            'kode_proyek' => 'PRJ-INF-001',
            'nama_proyek' => 'Jalan Desa',
            'bidang' => 'infrastruktur',
            'latitude' => 1.730,
            'longitude' => 127.990,
            'persentase_progres' => 30,
            'status_progres' => 'dalam_proses',
            'pagu_anggaran' => 200000000,
            'realisasi_anggaran' => 60000000,
            'created_by' => 'Tester',
        ]);

        $this->putJson("/api/v1/proyek-details/{$proyekInfra->id}/progres", [
            'persentase_progres' => 60,
            'status_progres' => 'dalam_proses',
            'realisasi_anggaran' => 120000000,
        ])->assertOk()
            ->assertJsonPath('data.persentase_progres', 60);
    }
}
