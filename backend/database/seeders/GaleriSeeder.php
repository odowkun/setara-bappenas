<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GaleriSeeder extends Seeder
{
    /**
     * Run the database seeds with downloaded local image files.
     */
    public function run(): void
    {
        $albums = [
            [
                'title' => 'Sinkronisasi RPJPN dengan RPJPD Kabupaten Halmahera Utara',
                'category' => 'Perencanaan & Pengendalian',
                'event_date' => '2024-06-15',
                'description' => 'Rapat koordinasi dan penyelarasan Rencana Pembangunan Jangka Panjang Nasional (RPJPN) dengan RPJPD Kabupaten Halmahera Utara.',
                'cover_image' => '/uploads/galeri/9d5fe4642d674252cfd3d8be1b0eca61.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-101',
                        'type' => 'image',
                        'url' => '/uploads/galeri/9d5fe4642d674252cfd3d8be1b0eca61.jpg',
                        'title' => 'Sinkronisasi RPJPN dengan RPJPD Halut',
                    ],
                    [
                        'id' => 'm-102',
                        'type' => 'image',
                        'url' => '/uploads/galeri/abd1c83bf755b03821bc71fcd4ac8b60.jpeg',
                        'title' => 'Penyelarasan Target RPJPN dan RPJPD',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Rapat Kerja BAPPEDA Kabupaten Halmahera Utara Tahun 2024',
                'category' => 'Rapat BAPPEDA Kab. Halut',
                'event_date' => '2024-05-20',
                'description' => 'Pelaksanaan Rapat Kerja internal BAPPEDA Kabupaten Halmahera Utara untuk evaluasi dan percepatan program pembangunan daerah.',
                'cover_image' => '/uploads/galeri/9accf9235f0fdb7540ab4825dceb9087.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-201',
                        'type' => 'image',
                        'url' => '/uploads/galeri/9accf9235f0fdb7540ab4825dceb9087.jpg',
                        'title' => 'Rapat Kerja BAPPEDA Tahun 2024',
                    ],
                    [
                        'id' => 'm-202',
                        'type' => 'image',
                        'url' => '/uploads/galeri/9d905fbab2b0c25cac715cfae7a135a6.jpeg',
                        'title' => 'Pembahasan Progres Evaluasi RPJPD',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Rapat Pembahasan Updating Data di Aplikasi BPJS Kesehatan',
                'category' => 'Monitoring & Evaluasi',
                'event_date' => '2024-05-14',
                'description' => 'Koordinasi pemutakhiran data kepesertaan jaminan kesehatan daerah Kabupaten Halmahera Utara.',
                'cover_image' => '/uploads/galeri/ce210ff6e53f8eb5102dfd1daa679d9b.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-301',
                        'type' => 'image',
                        'url' => '/uploads/galeri/ce210ff6e53f8eb5102dfd1daa679d9b.jpg',
                        'title' => 'Updating Data Aplikasi BPJS',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Rapat Pembahasan Data dan Informasi Satu Data Indonesia Halut',
                'category' => 'Monitoring & Evaluasi',
                'event_date' => '2024-04-28',
                'description' => 'Rapat pembinaan dan sinkronisasi portal data sektoral antar Organisasi Perangkat Daerah se-Kabupaten Halmahera Utara.',
                'cover_image' => '/uploads/galeri/b6400a3e16f818abafc70a337378ca72.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-401',
                        'type' => 'image',
                        'url' => '/uploads/galeri/b6400a3e16f818abafc70a337378ca72.jpg',
                        'title' => 'Pembahasan Forum Satu Data Indonesia Halut',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Rapat Kelompok Kerja (POKJA) PKP Kabupaten Halmahera Utara 2024',
                'category' => 'Perencanaan & Pengendalian',
                'event_date' => '2024-04-18',
                'description' => 'Pertemuan pokja Perumahan dan Kawasan Permukiman untuk perencanaan infrastruktur permukiman sehat dan berkeberlanjutan.',
                'cover_image' => '/uploads/galeri/27fa95a19dea974c3677e9451ebe1955.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-501',
                        'type' => 'image',
                        'url' => '/uploads/galeri/27fa95a19dea974c3677e9451ebe1955.jpg',
                        'title' => 'Rapat POKJA PKP Tahun 2024',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Rapat Evaluasi Penyelenggaraan Statistik Sektoral (EPSS)',
                'category' => 'Monitoring & Evaluasi',
                'event_date' => '2024-03-26',
                'description' => 'Evaluasi kualitas, validitas, dan aksesibilitas statistik sektoral dalam mendukung perencanaan berbasis data terpadu.',
                'cover_image' => '/uploads/galeri/eeb738d2be1c39929bcf6268ee80287b.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-601',
                        'type' => 'image',
                        'url' => '/uploads/galeri/eeb738d2be1c39929bcf6268ee80287b.jpg',
                        'title' => 'Rapat Evaluasi EPSS TAHUN 2023',
                    ],
                    [
                        'id' => 'm-602',
                        'type' => 'image',
                        'url' => '/uploads/galeri/8b096241977d6eb13d7a27ac6dde28e5.jpeg',
                        'title' => 'Evaluasi Capaian Pembangunan OPD',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Advokasi Kelembagaan Gerakan Keamanan Pangan Daerah',
                'category' => 'Serba-Serbi',
                'event_date' => '2024-03-12',
                'description' => 'Kegiatan advokasi gerakan kelembagaan pangan sehat dan aman untuk mendukung gizi dan ketahanan pangan masyarakat Halut.',
                'cover_image' => '/uploads/galeri/16abcf974eeee5b826a0bab9f37a9a37.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-701',
                        'type' => 'image',
                        'url' => '/uploads/galeri/16abcf974eeee5b826a0bab9f37a9a37.jpg',
                        'title' => 'Advokasi Keamanan Pangan Daerah',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Penilaian Tahap I Penghargaan Pembangunan Daerah (PPD)',
                'category' => 'Perencanaan & Pengendalian',
                'event_date' => '2024-02-22',
                'description' => 'Presentasi dan verifikasi dokumen inovasi perencanaan pembangunan Kabupaten Halmahera Utara oleh tim penilai PPD.',
                'cover_image' => '/uploads/galeri/f0a218c4a1402c063dc8e901d17a7dc0.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-801',
                        'type' => 'image',
                        'url' => '/uploads/galeri/f0a218c4a1402c063dc8e901d17a7dc0.jpg',
                        'title' => 'Penilaian Tahap I PPD Halmahera Utara',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Rapat Manajemen Data Intervensi Stunting Terintegrasi Halut',
                'category' => 'Perencanaan & Pengendalian',
                'event_date' => '2024-02-10',
                'description' => 'Konsolidasi data spasial dan program sasaran intervensi stunting terpadu lintas sektor.',
                'cover_image' => '/uploads/galeri/fee9150284e5db955290ff31a0a766a7.jpg',
                'media' => json_encode([
                    [
                        'id' => 'm-901',
                        'type' => 'image',
                        'url' => '/uploads/galeri/fee9150284e5db955290ff31a0a766a7.jpg',
                        'title' => 'Rapat Manajemen Data Stunting',
                    ],
                    [
                        'id' => 'm-902',
                        'type' => 'image',
                        'url' => '/uploads/galeri/a9b90febd2b7096b3d5d0cfb58487491.jpeg',
                        'title' => 'Monitoring Stunting Bersama Bappeda Malut',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Kegiatan RAPURNA TMMD Ke-44 Tahun Anggaran 2024',
                'category' => 'Perencanaan & Pengendalian',
                'event_date' => '2024-01-18',
                'description' => 'Rapat Paripurna koordinasi pelaksanaan TNI Manunggal Membangun Desa di wilayah Kabupaten Halmahera Utara.',
                'cover_image' => '/uploads/galeri/2c340ae688157600b01428aa3f1efe2b.jpeg',
                'media' => json_encode([
                    [
                        'id' => 'm-1001',
                        'type' => 'image',
                        'url' => '/uploads/galeri/2c340ae688157600b01428aa3f1efe2b.jpeg',
                        'title' => 'RAPURNA TMMD KE-44 TA 2024',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('galeri')->truncate();
        DB::table('galeri')->insert($albums);
    }
}
