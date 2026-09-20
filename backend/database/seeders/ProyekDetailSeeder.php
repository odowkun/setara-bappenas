<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProyekDetailSeeder extends Seeder
{
    public function run(): void
    {
        $document = DB::table('documents')->first();
        if (! $document) {
            $docId = DB::table('documents')->insertGetId([
                'title' => 'Dokumen Rencana Kerja Pemerintah Daerah (RKPD) 2026',
                'jenis' => 'rkpd',
                'bidang' => 'semua',
                'tahun' => '2026',
                'ukuran' => '3.5 MB',
                'downloads' => 0,
                'file_path' => null,
                'is_public' => true,
                'uploaded_by' => 'Administrator',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $docId = $document->id;
        }

        $projects = [
            [
                'document_id' => $docId,
                'kode_proyek' => 'PRJ-RENJA-2026-001',
                'nama_proyek' => 'Pembangunan Puskesmas Pembantu Desa Tou',
                'bidang' => 'infrastruktur',
                'kecamatan' => 'Kao Barat',
                'desa_kelurahan' => 'Tou',
                'lokasi_deskripsi' => 'Jalan Utama Desa Tou dekat Pos Kesehatan',
                'latitude' => 1.2584,
                'longitude' => 127.8923,
                'esri_objectid' => 1042,
                'esri_sync_status' => 'synced',
                'esri_synced_at' => now(),
                'pagu_anggaran' => 750000000,
                'realisasi_anggaran' => 375000000,
                'persentase_progres' => 50,
                'status_progres' => 'dalam_proses',
                'opd_penanggung_jawab' => 'Dinas Kesehatan / Bappeda Halut',
                'created_by' => 'Ir. Hendra Kusuma',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'document_id' => $docId,
                'kode_proyek' => 'PRJ-RENJA-2026-002',
                'nama_proyek' => 'Rehabilitasi Drainase Perkotaan Tobelo Central',
                'bidang' => 'infrastruktur',
                'kecamatan' => 'Tobelo',
                'desa_kelurahan' => 'Gamtala',
                'lokasi_deskripsi' => 'Koridor Pasar Central Tobelo',
                'latitude' => 1.7289,
                'longitude' => 128.0054,
                'esri_objectid' => 1043,
                'esri_sync_status' => 'synced',
                'esri_synced_at' => now(),
                'pagu_anggaran' => 1200000000,
                'realisasi_anggaran' => 960000000,
                'persentase_progres' => 80,
                'status_progres' => 'dalam_proses',
                'opd_penanggung_jawab' => 'Dinas PUPR / Bappeda Halut',
                'created_by' => 'Ir. Hendra Kusuma',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'document_id' => $docId,
                'kode_proyek' => 'PRJ-RENJA-2026-003',
                'nama_proyek' => 'Pengembangan Pasar Tradisional Galela',
                'bidang' => 'perekonomian',
                'kecamatan' => 'Galela',
                'desa_kelurahan' => 'Soasio',
                'lokasi_deskripsi' => 'Kawasan Pesisir Pasar Soasio Galela',
                'latitude' => 1.8341,
                'longitude' => 127.8412,
                'esri_objectid' => 1044,
                'esri_sync_status' => 'synced',
                'esri_synced_at' => now(),
                'pagu_anggaran' => 850000000,
                'realisasi_anggaran' => 850000000,
                'persentase_progres' => 100,
                'status_progres' => 'selesai',
                'opd_penanggung_jawab' => 'Dinas Perindag / Bappeda Halut',
                'created_by' => 'Siti Rahmawati',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'document_id' => $docId,
                'kode_proyek' => 'PRJ-RENJA-2026-004',
                'nama_proyek' => 'Peningkatan Sarana Air Bersih Tobelo Selatan',
                'bidang' => 'infrastruktur',
                'kecamatan' => 'Tobelo Selatan',
                'desa_kelurahan' => 'Kusuri',
                'lokasi_deskripsi' => 'Sumber Mata Air Sumber Agung Kusuri',
                'latitude' => 1.6210,
                'longitude' => 127.9450,
                'esri_objectid' => 1045,
                'esri_sync_status' => 'synced',
                'esri_synced_at' => now(),
                'pagu_anggaran' => 600000000,
                'realisasi_anggaran' => 150000000,
                'persentase_progres' => 25,
                'status_progres' => 'dalam_proses',
                'opd_penanggung_jawab' => 'Dinas PUPR / Bappeda Halut',
                'created_by' => 'Ir. Hendra Kusuma',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($projects as $prj) {
            DB::table('proyek_details')->updateOrInsert(
                ['kode_proyek' => $prj['kode_proyek']],
                $prj
            );
        }
    }
}
