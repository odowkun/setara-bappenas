<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SurveySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Clear existing survey responses & questions
        Schema::disableForeignKeyConstraints();
        DB::table('surveys')->truncate();
        DB::table('survey_questions')->truncate();
        DB::table('survey_services')->truncate();
        Schema::enableForeignKeyConstraints();

        // 2. Insert BAPPEDA Services
        $services = [
            ['id' => 1, 'name' => 'BAPPEDA Halmahera Utara (Kantor Utama)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Bidang Perencanaan Pembangunan & Evaluasi', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'Bidang Pembangunan Manusia & Masyarakat (PMM)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'Bidang Ekonomi & Sumber Daya Alam (SDA)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => 'Bidang Infrastruktur & Pengembangan Wilayah (IPW)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 6, 'name' => 'Bidang Pengendalian, Evaluasi & Pelaporan (PEP)', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 7, 'name' => 'Sekretariat BAPPEDA', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 8, 'name' => 'Layanan Informasi Publik & GIS Peta Spasial', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('survey_services')->insert($services);

        // 3. Insert Service-Bound Dynamic Survey Questions
        $questions = [
            // Service 1: BAPPEDA Halmahera Utara (Kantor Utama)
            [
                'service_id' => 1,
                'title' => 'Kejelasan Persyaratan Pelayanan BAPPEDA Utama',
                'description' => 'Keselarasan persyaratan pelayanan dengan jenis pelayanannya di kantor utama.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 1,
                'title' => 'Kemudahan Prosedur & Alur Pelayanan Publik',
                'description' => 'Kemudahan tahapan pelayanan yang diberikan kepada masyarakat.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 1,
                'title' => 'Kecepatan Waktu Penyelesaian Pelayanan',
                'description' => 'Target waktu penyelesaian pelayanan sesuai standar operasional BAPPEDA.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 1,
                'title' => 'Sikap & Keramahan Petugas BAPPEDA',
                'description' => 'Kematangan, kesopanan, dan kesiapan petugas dalam merespons publik.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Service 2: Bidang Perencanaan Pembangunan & Evaluasi
            [
                'service_id' => 2,
                'title' => 'Kejelasan Prosedur Konsultasi Dokumen RKPD & RPJMD',
                'description' => 'Kemudahan alur bimbingan dan konsultasi perencanaan pembangunan daerah.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 2,
                'title' => 'Kecepatan Verifikasi Usulan Perencanaan SKPD',
                'description' => 'Ketepatan dan kelancaran proses penelaahan dokumen usulan program daerah.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 2,
                'title' => 'Kompetensi & Solusi Tim Perencana BAPPEDA',
                'description' => 'Keahlian teknis staf dalam memberikan masukan perencanaan strategis.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Service 3: Bidang Pembangunan Manusia & Masyarakat (PMM)
            [
                'service_id' => 3,
                'title' => 'Kejelasan Informasi Program Penurunan Stunting & Sosbud',
                'description' => 'Ketersediaan data dan informasi sektor pembangunan manusia dan kemiskinan.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 3,
                'title' => 'Kemudahan Fasilitasi Usulan Bidang PMM',
                'description' => 'Kelancaran komunikasi fasilitasi forum Musrenbang sosial budaya.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 3,
                'title' => 'Keramahan Petugas Bidang PMM BAPPEDA',
                'description' => 'Kesantunan dan kepedulian tim dalam memberikan bimbingan sosial.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Service 4: Bidang Ekonomi & Sumber Daya Alam (SDA)
            [
                'service_id' => 4,
                'title' => 'Kejelasan Persyaratan Konsultasi Program Ekonomi Daerah',
                'description' => 'Kemudahan informasi pendampingan usulan bidang pertanian, perikanan & UMKM.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 4,
                'title' => 'Kecepatan Tanggapan Terhadap Usulan Program Ekonomi',
                'description' => 'Responsivitas staf dalam memverifikasi usulan sektor ekonomi unggulan.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Service 5: Bidang Infrastruktur & Pengembangan Wilayah (IPW)
            [
                'service_id' => 5,
                'title' => 'Kejelasan Prosedur Rekomendasi Tata Ruang & Spasial',
                'description' => 'Kemudahan petunjuk teknis layanan advis tata ruang dan wilayah daerah.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 5,
                'title' => 'Kecepatan Verifikasi Berkas Infrastruktur & Kawasan',
                'description' => 'Target waktu penelaahan dokumen usulan fisik dan prasarana wilayah.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Service 6: Bidang Pengendalian, Evaluasi & Pelaporan (PEP)
            [
                'service_id' => 6,
                'title' => 'Kemudahan Sistem Pelaporan Kinerja Pembangunan Daerah',
                'description' => 'Kepraktisan format pengisian evaluasi realisasi pembangunan daerah.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 6,
                'title' => 'Kecepatan Umpan Balik Evaluasi Laporan SKPD',
                'description' => 'Ketepatan waktu staf PEP dalam memberikan catatan perbaikan LKPJ / RKPD.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Service 7: Sekretariat BAPPEDA
            [
                'service_id' => 7,
                'title' => 'Kecepatan Layanan Persuratan & Keuangan Sekretariat',
                'description' => 'Kelancaran pengurusan surat administrasi dan koordinasi pimpinan.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 7,
                'title' => 'Keramahan & Kebersihan Ruang Pelayanan Front Office',
                'description' => 'Kenyamanan fasilitas ruang tunggu dan kesantunan petugas penerima tamu.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Service 8: Layanan Informasi Publik & GIS Peta Spasial
            [
                'service_id' => 8,
                'title' => 'Kemudahan Akses Peta Digital & Portal Publik BAPPEDA',
                'description' => 'Kecepatan dan kemudahan pengunduhan data geospasial dan dokumen publik.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'service_id' => 8,
                'title' => 'Kualitas & Ketepatan Visualisasi Peta Spasial Halmahera Utara',
                'description' => 'Keakuratan informasi spasial zonasi wilayah dan kawasan pembangunan.',
                'question_type' => 'rating',
                'options' => json_encode(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']),
                'is_required' => true,
                'order_index' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];
        DB::table('survey_questions')->insert($questions);

        // 4. Insert Fresh Realistic Survey Responses
        $responses = [
            [
                'nama_responden' => 'Drs. M. Tani',
                'email' => 'mtani@halutkab.go.id',
                'pekerjaan' => 'ASN Perangkat Daerah',
                'jenis_layanan' => 'BAPPEDA Halmahera Utara (Kantor Utama)',
                'u1_persyaratan' => 5,
                'u2_prosedur' => 5,
                'u3_kecepatan' => 5,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 100.00,
                'saran_masukan' => 'Proses verifikasi dokumen usulan sangat cepat dan responsif.',
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
            [
                'nama_responden' => 'Sarah M. Pdt',
                'email' => 'sarah.m@gmail.com',
                'pekerjaan' => 'Wiraswasta / Masyarakat',
                'jenis_layanan' => 'Layanan Informasi Publik & GIS Peta Spasial',
                'u1_persyaratan' => 4,
                'u2_prosedur' => 5,
                'u3_kecepatan' => 4,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 92.00,
                'saran_masukan' => 'Sistem peta digital sangat membantu dalam konsultasi tata ruang.',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'nama_responden' => 'Ir. Thomas S. Lesnussa',
                'email' => 'thomas.lesnussa@gmail.com',
                'pekerjaan' => 'Konsultan Pembangunan',
                'jenis_layanan' => 'Bidang Perencanaan Pembangunan & Evaluasi',
                'u1_persyaratan' => 5,
                'u2_prosedur' => 4,
                'u3_kecepatan' => 5,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 96.00,
                'saran_masukan' => 'Pelayanan petugas di kantor BAPPEDA sangat ramah dan kooperatif.',
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(3),
            ],
            [
                'nama_responden' => 'Dra. Maria S. Pdt',
                'email' => 'maria.pdt@halutkab.go.id',
                'pekerjaan' => 'Masyarakat Umum',
                'jenis_layanan' => 'Sekretariat BAPPEDA',
                'u1_persyaratan' => 5,
                'u2_prosedur' => 5,
                'u3_kecepatan' => 4,
                'u4_produk' => 5,
                'u5_sikap' => 5,
                'ikm_score' => 96.00,
                'saran_masukan' => 'Aspirasi Musrenbang dapat dilacak dengan transparan.',
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(4),
            ],
        ];
        DB::table('surveys')->insert($responses);
    }
}
