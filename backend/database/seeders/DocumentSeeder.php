<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        $docs = [
            [
                'title' => 'Laporan Kinerja Instansi Pemerintah (LKj/LAKIP) BAPPEDA Halut Tahun 2025',
                'jenis' => 'lakip',
                'bidang' => 'renval',
                'tahun' => '2025',
                'ukuran' => '5.4 MB',
                'downloads' => 312,
                'file_path' => 'https://drive.google.com/file/d/1x2PqjQLgYd_vA6x-mK94RwuC0tqOHAYE/view?usp=sharing',
                'is_public' => true,
                'uploaded_by' => 'Admin Bappeda Halut',
                'created_at' => '2026-03-31 10:00:00',
                'updated_at' => '2026-03-31 10:00:00',
            ],
            [
                'title' => 'Perjanjian Kinerja BAPPEDA Kabupaten Halmahera Utara Tahun 2026',
                'jenis' => 'renstra',
                'bidang' => 'renval',
                'tahun' => '2026',
                'ukuran' => '2.8 MB',
                'downloads' => 420,
                'file_path' => 'https://drive.google.com/file/d/16wKa6TXPNzLMxkI2TU-yqA8lPXQeKUo7/view?usp=sharing',
                'is_public' => true,
                'uploaded_by' => 'Admin Bappeda Halut',
                'created_at' => '2026-03-27 11:30:00',
                'updated_at' => '2026-03-27 11:30:00',
            ],
            [
                'title' => 'PERBUB No. 41 tentang Perubahan Rencana Kerja Perangkat Daerah (P-Renja) Tahun 2025',
                'jenis' => 'renja',
                'bidang' => 'infrastruktur',
                'tahun' => '2025',
                'ukuran' => '3.9 MB',
                'downloads' => 518,
                'file_path' => 'https://drive.google.com/file/d/1syVi8Rz2Jg3XvZhyYW10Fqv16jkCWAiO/view?usp=sharing',
                'is_public' => true,
                'uploaded_by' => 'Kasubag Perencanaan Bappeda',
                'created_at' => '2026-01-13 09:15:00',
                'updated_at' => '2026-01-13 09:15:00',
            ],
            [
                'title' => 'PERBUB No. 40 Tahun 2025 Tentang Rencana Kerja Perangkat Daerah (Renja) Halut 2025',
                'jenis' => 'renja',
                'bidang' => 'infrastruktur',
                'tahun' => '2025',
                'ukuran' => '4.2 MB',
                'downloads' => 610,
                'file_path' => 'https://drive.google.com/file/d/1O91u9HWz5zvjaxDHP87WXDeh-0xenxDa/view?usp=drive_link',
                'is_public' => true,
                'uploaded_by' => 'Kasubag Perencanaan Bappeda',
                'created_at' => '2026-01-13 08:30:00',
                'updated_at' => '2026-01-13 08:30:00',
            ],
            [
                'title' => 'PERDA No. 6 Tahun 2025 Tentang RPJMD Kabupaten Halmahera Utara Tahun 2025–2029',
                'jenis' => 'rpjmd',
                'bidang' => 'semua',
                'tahun' => '2025',
                'ukuran' => '8.6 MB',
                'downloads' => 1240,
                'file_path' => 'https://drive.google.com/file/d/1tPkkVgdPYSVR6my0tWpRbiMLNOeHWp7r/view?usp=sharing',
                'is_public' => true,
                'uploaded_by' => 'Dr. Jan W. N. Papilaya, M.Si',
                'created_at' => '2025-11-13 14:00:00',
                'updated_at' => '2025-11-13 14:00:00',
            ],
            [
                'title' => 'PERBUB No. 38 Tahun 2025 Tentang RKPD Kab. Halmahera Utara Tahun 2026',
                'jenis' => 'rkpd',
                'bidang' => 'semua',
                'tahun' => '2026',
                'ukuran' => '6.1 MB',
                'downloads' => 985,
                'file_path' => 'https://bappeda.halmaherautarakab.go.id/download/file/e84fcfdd51a553909fb0be1e54a86345.pdf',
                'is_public' => true,
                'uploaded_by' => 'Siti Rahmawati (Admin Umum)',
                'created_at' => '2025-10-29 10:00:00',
                'updated_at' => '2025-10-29 10:00:00',
            ],
            [
                'title' => 'PERBUB No. 37 Tahun 2025 Tentang Perubahan RKPD (P-RKPD) Halut 2025',
                'jenis' => 'rkpd',
                'bidang' => 'semua',
                'tahun' => '2025',
                'ukuran' => '4.7 MB',
                'downloads' => 730,
                'file_path' => 'https://bappeda.halmaherautarakab.go.id/download/file/0176dbf02c2208d0c99fdb414aaddac8.pdf',
                'is_public' => true,
                'uploaded_by' => 'Siti Rahmawati (Admin Umum)',
                'created_at' => '2025-10-29 09:30:00',
                'updated_at' => '2025-10-29 09:30:00',
            ],
            [
                'title' => 'RPJPD Kabupaten Halmahera Utara Tahun 2025–2045',
                'jenis' => 'rpjpd',
                'bidang' => 'semua',
                'tahun' => '2025',
                'ukuran' => '9.5 MB',
                'downloads' => 1520,
                'file_path' => 'https://bappeda.halmaherautarakab.go.id/download/file/e84fcfdd51a553909fb0be1e54a86345.pdf',
                'is_public' => true,
                'uploaded_by' => 'Dr. Jan W. N. Papilaya, M.Si',
                'created_at' => '2025-09-15 08:00:00',
                'updated_at' => '2025-09-15 08:00:00',
            ],
            [
                'title' => 'Dokumen Informasi Kinerja (Dik) Sektoral Pembangunan Wilayah',
                'jenis' => 'dik_sektoral',
                'bidang' => 'sosbud',
                'tahun' => '2026',
                'ukuran' => '4.2 MB',
                'downloads' => 310,
                'file_path' => 'https://bappeda.halmaherautarakab.go.id/download/file/dik-sektoral-2026.pdf',
                'is_public' => true,
                'uploaded_by' => 'Ir. Hendra Kusuma (Admin Bidang)',
                'created_at' => '2026-05-01 13:30:00',
                'updated_at' => '2026-05-01 13:30:00',
            ],
            [
                'title' => 'Data Sektoral Pembangunan Halmahera Utara',
                'jenis' => 'data_sektoral',
                'bidang' => 'perekonomian',
                'tahun' => '2026',
                'ukuran' => '3.8 MB',
                'downloads' => 620,
                'file_path' => 'https://bappeda.halmaherautarakab.go.id/download/file/data-sektoral-halut-2026.pdf',
                'is_public' => true,
                'uploaded_by' => 'Ir. Hendra Kusuma (Admin Bidang)',
                'created_at' => '2026-05-20 11:00:00',
                'updated_at' => '2026-05-20 11:00:00',
            ],
        ];

        foreach ($docs as $doc) {
            DB::table('documents')->updateOrInsert(
                ['title' => $doc['title']],
                $doc
            );
        }
    }
}
