<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\ProyekDetail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardChartTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_dashboard_charts_with_dynamic_project_summary(): void
    {
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

        ProyekDetail::create([
            'document_id' => $document->id,
            'kode_proyek' => 'PRJ-TEST-101',
            'nama_proyek' => 'Proyek Fisik Selesai',
            'bidang' => 'infrastruktur',
            'kecamatan' => 'Tobelo',
            'opd_penanggung_jawab' => 'Bappeda Kabupaten Halmahera Utara',
            'sumber_dana' => 'APBD 1',
            'latitude' => 1.7289,
            'longitude' => 128.0054,
            'pagu_anggaran' => 1000000000,
            'realisasi_anggaran' => 1000000000,
            'persentase_progres' => 100,
            'status_progres' => 'selesai',
        ]);

        ProyekDetail::create([
            'document_id' => $document->id,
            'kode_proyek' => 'PRJ-TEST-102',
            'nama_proyek' => 'Proyek Dalam Proses',
            'bidang' => 'perekonomian',
            'kecamatan' => 'Galela',
            'opd_penanggung_jawab' => 'Bappeda Kabupaten Halmahera Utara',
            'sumber_dana' => 'APBN',
            'latitude' => 1.7300,
            'longitude' => 128.0100,
            'pagu_anggaran' => 500000000,
            'realisasi_anggaran' => 250000000,
            'persentase_progres' => 50,
            'status_progres' => 'dalam_proses',
        ]);

        $response = $this->getJson('/api/v1/dashboard/charts');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.projects_summary.total_projects', 2)
            ->assertJsonPath('data.projects_summary.status_counts.selesai', 1)
            ->assertJsonPath('data.projects_summary.status_counts.dalam_proses', 1)
            ->assertJsonPath('data.projects_summary.total_pagu', 1500000000)
            ->assertJsonPath('data.projects_summary.total_realisasi', 1250000000);
    }
}
