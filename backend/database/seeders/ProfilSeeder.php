<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Profil;

class ProfilSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tentang / Sejarah BAPPEDA
        Profil::updateOrCreate(
            ['key' => 'tentang'],
            [
                'title' => 'Gambaran Umum & Sejarah BAPPEDA',
                'subtitle' => 'Sejarah Pembentukan dan Peran Strategis BAPPEDA Kabupaten Halmahera Utara',
                'content' => 'Badan Perencanaan Pembangunan Daerah (BAPPEDA) Kabupaten Halmahera Utara dibentuk berdasarkan Peraturan Daerah Kabupaten Halmahera Utara sebagai Lembaga Teknis Daerah yang bertanggung jawab atas penyusunan dan pengendalian perencanaan pembangunan daerah secara terpadu dan berkelanjutan. Berkedudukan di Tobelo, BAPPEDA bertugas merumuskan kebijakan teknis perencanaan pembangunan serta mengoordinasikan perencanaan program strategis dari seluruh Organisasi Perangkat Daerah (OPD).',
                'meta_json' => [
                    'tahun_berdiri' => '2003',
                    'alamat' => 'Jl. Kawasan Pemerintahan Tobelo, Halmahera Utara, Maluku Utara',
                    'telepon' => '(0924) 262211',
                    'email' => 'info@bappeda.halmaherautarakab.go.id',
                ]
            ]
        );

        // 2. Visi & Misi BAPPEDA
        Profil::updateOrCreate(
            ['key' => 'visi_misi'],
            [
                'title' => 'Visi & Misi BAPPEDA Halmahera Utara',
                'subtitle' => 'Arah dan Prioritas Pembangunan Daerah Kabupaten Halmahera Utara',
                'content' => 'Terwujudnya Kabupaten Halmahera Utara yang Maju, Sejahtera, Berdaya Saing, dan Berkelanjutan Berbasis Sumber Daya Lokal.',
                'meta_json' => [
                    'misi' => [
                        'Mewujudkan tata kelola pemerintahan yang profesional, transparan, dan berakuntabilitas tinggi berbasis SPBE.',
                        'Meningkatkan kualitas sumber daya manusia melalui akses pendidikan dan pelayanan kesehatan yang memadai.',
                        'Mempercepat pembangunan infrastruktur daerah yang terintegrasi dan berwawasan lingkungan.',
                        'Mengembangkan perekonomian daerah berbasis potensi pertanian, kelautan, perikanan, dan pariwisata daerah.'
                    ]
                ]
            ]
        );

        // 3. Tugas & Fungsi
        Profil::updateOrCreate(
            ['key' => 'tugas_fungsi'],
            [
                'title' => 'Tugas Pokok & Fungsi Organisasi',
                'subtitle' => 'Peran Strategis Perencanaan dan Evaluasi Pembangunan Daerah',
                'content' => 'BAPPEDA mempunyai tugas membantu Bupati dalam melaksanakan fungsi penunjang urusan pemerintahan bidang perencanaan, penelitian, dan pengembangan yang menjadi kewenangan daerah.',
                'meta_json' => [
                    'fungsi' => [
                        'Penyusunan kebijakan teknis bidang perencanaan pembangunan daerah.',
                        'Pelaksanaan tugas dukungan teknis perencanaan, pengendalian, dan evaluasi pembangunan.',
                        'Pemantauan, evaluasi, dan pelaporan pelaksanaan fungsi penunjang perencanaan pembangunan daerah.',
                        'Pembinaan teknis penyelenggaraan fungsi-fungsi penunjang perencanaan pada Perangkat Daerah.'
                    ]
                ]
            ]
        );

        // 4. Dasar Hukum
        Profil::updateOrCreate(
            ['key' => 'dasar_hukum'],
            [
                'title' => 'Dasar Hukum & Landasan Kerja',
                'subtitle' => 'Regulasi dan Peraturan Perundang-undangan yang Melandasi Kinerja BAPPEDA',
                'content' => 'Penyelenggaraan tugas pokok dan fungsi BAPPEDA Kabupaten Halmahera Utara didasarkan pada regulasi resmi pemerintah pusat dan daerah.',
                'meta_json' => [
                    'regulasi' => [
                        [
                            'nama' => 'Undang-Undang Nomor 25 Tahun 2004',
                            'tentang' => 'Sistem Perencanaan Pembangunan Nasional (SPPN)',
                            'kategori' => 'Undang-Undang'
                        ],
                        [
                            'nama' => 'Undang-Undang Nomor 23 Tahun 2014',
                            'tentang' => 'Pemerintahan Daerah',
                            'kategori' => 'Undang-Undang'
                        ],
                        [
                            'nama' => 'Permendagri Nomor 86 Tahun 2017',
                            'tentang' => 'Tata Cara Perencanaan, Pengendalian dan Evaluasi Pembangunan Daerah',
                            'kategori' => 'Peraturan Menteri'
                        ],
                        [
                            'nama' => 'Perda Kabupaten Halmahera Utara No. 5 Tahun 2021',
                            'tentang' => 'RPJMD Kabupaten Halmahera Utara Tahun 2021-2026',
                            'kategori' => 'Peraturan Daerah'
                        ]
                    ]
                ]
            ]
        );
    }
}
