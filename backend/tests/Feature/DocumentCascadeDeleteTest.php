<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\GeoprocessingAnalysis;
use App\Models\ProyekAttachment;
use App\Models\ProyekDetail;
use App\Models\User;
use App\Services\EsriGisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class DocumentCascadeDeleteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::fake('public');
    }

    public function test_permanent_delete_cascades_projects_progress_attachments_and_esri_feature(): void
    {
        $superadmin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $superadmin->assignRole('superadmin');

        $document = Document::query()->create([
            'archive_code' => 'BPH-DOC-TEST001',
            'title' => 'Master Dokumen RKPD 2026',
            'jenis' => 'rkpd',
            'bidang' => 'infrastruktur',
            'tahun' => '2026',
            'ukuran' => '1.5 MB',
            'file_path' => 'documents/2026/09/master_rkpd.pdf',
            'uploaded_by' => 'Super Admin',
            'governance_status' => 'approved',
            'storage_status' => 'private',
            'legal_hold' => false,
        ]);

        Storage::disk('local')->put($document->file_path, 'fake master pdf');

        $version = DocumentVersion::query()->create([
            'document_id' => $document->id,
            'version_number' => 1,
            'version_label' => 'v1.0',
            'file_name' => 'rkpd_v1.pdf',
            'file_path' => 'documents/2026/09/rkpd_v1.pdf',
            'disk' => 'local',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => 1024,
            'checksum_sha256' => hash('sha256', 'fake v1 pdf'),
            'status' => 'approved',
            'integrity_status' => 'valid',
        ]);
        Storage::disk('local')->put($version->file_path, 'fake v1 pdf');

        $proyek = ProyekDetail::query()->create([
            'document_id' => $document->id,
            'kode_proyek' => 'PRJ-TEST-001',
            'nama_proyek' => 'Peningkatan Jalan Tobelo - Galela',
            'bidang' => 'infrastruktur',
            'kecamatan' => 'Tobelo',
            'desa_kelurahan' => 'Gamsungi',
            'latitude' => 1.7289,
            'longitude' => 128.0054,
            'esri_objectid' => 999123,
            'esri_sync_status' => 'synced',
            'pagu_anggaran' => 1500000000,
            'realisasi_anggaran' => 750000000,
            'persentase_progres' => 50,
            'status_progres' => 'dalam_proses',
            'opd_penanggung_jawab' => 'Dinas PUPR',
        ]);

        $attachmentFile = "public/proyek_attachments/{$proyek->id}/foto_lapangan.jpg";
        Storage::disk('public')->put($attachmentFile, 'fake attachment image');

        $attachment = ProyekAttachment::query()->create([
            'proyek_detail_id' => $proyek->id,
            'file_name' => 'foto_lapangan.jpg',
            'file_path' => "/storage/proyek_attachments/{$proyek->id}/foto_lapangan.jpg",
            'file_type' => 'foto',
            'file_size' => '1.2 MB',
            'uploaded_by' => 'Admin',
        ]);

        $geoprocessing = GeoprocessingAnalysis::query()->create([
            'name' => 'Buffer 500m Jalan Tobelo',
            'proyek_detail_id' => $proyek->id,
            'center_latitude' => 1.7289,
            'center_longitude' => 128.0054,
            'radius_meters' => 500,
            'color' => '#2563eb',
            'result_source' => 'local_fallback',
            'geojson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);

        $esriMock = Mockery::mock(EsriGisService::class);
        $esriMock->shouldReceive('deleteFeature')
            ->once()
            ->with(999123)
            ->andReturn(['success' => true]);
        $this->app->instance(EsriGisService::class, $esriMock);

        Sanctum::actingAs($superadmin);

        $response = $this->deleteJson("/api/v1/documents/{$document->id}?permanent=1");

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('code', 200);

        // Verify document is deleted
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        $this->assertDatabaseMissing('document_versions', ['id' => $version->id]);
        Storage::disk('local')->assertMissing($document->file_path);
        Storage::disk('local')->assertMissing($version->file_path);

        // Verify project and progress data are deleted
        $this->assertDatabaseMissing('proyek_details', ['id' => $proyek->id]);

        // Verify technical attachment and physical file are deleted
        $this->assertDatabaseMissing('proyek_attachments', ['id' => $attachment->id]);
        Storage::disk('public')->assertMissing($attachmentFile);

        // Verify geoprocessing analysis is deleted
        $this->assertDatabaseMissing('geoprocessing_analyses', ['id' => $geoprocessing->id]);
    }

    public function test_permanent_delete_blocked_when_legal_hold(): void
    {
        $superadmin = User::factory()->create([
            'role' => 'superadmin',
            'bidang' => 'semua',
        ]);
        $superadmin->assignRole('superadmin');

        $document = Document::query()->create([
            'archive_code' => 'BPH-DOC-HOLD01',
            'title' => 'Master Dokumen Legal Hold',
            'jenis' => 'rpjmd',
            'bidang' => 'renval',
            'tahun' => '2026',
            'ukuran' => '2 MB',
            'file_path' => 'documents/2026/09/hold.pdf',
            'uploaded_by' => 'Super Admin',
            'governance_status' => 'draft',
            'storage_status' => 'private',
            'legal_hold' => true,
        ]);

        Sanctum::actingAs($superadmin);

        $response = $this->deleteJson("/api/v1/documents/{$document->id}?permanent=1");

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Dokumen berstatus legal hold resmi tidak dapat dihapus permanen.');

        $this->assertDatabaseHas('documents', ['id' => $document->id]);
    }
}
