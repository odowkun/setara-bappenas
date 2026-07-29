<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        $news = [
            [
                'title' => 'Bupati Halmahera Utara Buka FGD Percepatan Akses Keuangan Daerah, Bappeda Dukung Implementasi IKAD',
                'slug' => 'bupati-halmahera-utara-buka-fgd-percepatan-akses-keuangan-daerah-bappeda-dukung-implementasi-ikad',
                'content' => '<p>BAPEDA HALUT — Bupati Halmahera Utara secara resmi membuka Forum Group Discussion (FGD) Percepatan Akses Keuangan Daerah yang diselenggarakan bersama Bappeda Halmahera Utara untuk mempercepat implementasi IKAD di seluruh kecamatan.</p><p>Kepala Bappeda menyatakan dukungan penuh terhadap seluruh program percepatan inklusi keuangan guna menopang pembangunan ekonomi inklusif daerah.</p>',
                'category' => 'Berita Utama',
                'image' => 'https://bappeda.halmaherautarakab.go.id/assets/images/6ac3f40212814bd9cdddb87c54e063c9.png',
                'date' => '2026-07-21',
                'views' => 13,
                'author' => 'bappeda',
                'is_published' => true,
                'created_at' => '2026-07-21 09:00:00',
                'updated_at' => '2026-07-21 09:00:00',
            ],
            [
                'title' => 'Kepala Bappeda Halmahera Utara Jadi Narasumber pada Konferensi Pendidikan Indonesia 2026 di Sleman',
                'slug' => 'kepala-bappeda-halmahera-utara-jadi-narasumber-pada-konferensi-pendidikan-indonesia-2026-di-sleman',
                'content' => '<p>SLEMAN — Kepala Bappeda Kabupaten Halmahera Utara menghadiri Konferensi Pendidikan Indonesia 2026 sebagai narasumber utama memaparkan strategi inovasi alokasi dana pendidikan daerah dan akselerasi SDM berkualitas di kawasan timur Indonesia.</p>',
                'category' => 'Berita Utama',
                'image' => 'https://bappeda.halmaherautarakab.go.id/assets/images/d35ee9396b0a961f6a736bbb52050828.png',
                'date' => '2026-07-02',
                'views' => 418,
                'author' => 'bappeda',
                'is_published' => true,
                'created_at' => '2026-07-02 10:30:00',
                'updated_at' => '2026-07-02 10:30:00',
            ],
            [
                'title' => 'Kepala Bappeda Halut Hadiri Rakor Optimalisasi Pembangunan Sekolah Rakyat Permanen di Jakarta',
                'slug' => 'kepala-bappeda-halut-hadiri-rakor-optimalisasi-pembangunan-sekolah-rakyat-permanen-di-jakarta',
                'content' => '<p>JAKARTA — Kepala Bappeda Halut menghadiri Rapat Koordinasi Nasional mengenai perancangan dan alokasi anggaran pembangunan Sekolah Rakyat Permanen untuk pelosok Halmahera Utara.</p>',
                'category' => 'Berita Utama',
                'image' => 'https://bappeda.halmaherautarakab.go.id/assets/images/fd58cf35baac884f7d70439b279411c6.png',
                'date' => '2026-06-17',
                'views' => 385,
                'author' => 'bappeda',
                'is_published' => true,
                'created_at' => '2026-06-17 11:15:00',
                'updated_at' => '2026-06-17 11:15:00',
            ],
            [
                'title' => 'Kepala Bappeda Dampingi Bupati Hadiri Peresmian Jembatan Garuda di Kao Barat',
                'slug' => 'kepala-bappeda-dampingi-bupati-hadiri-peresmian-jembatan-garuda-di-kao-barat',
                'content' => '<p>KAO BARAT — Kepala Bappeda Halmahera Utara mendampingi Bupati Halmahera Utara meresmikan Jembatan Garuda di Kecamatan Kao Barat yang didanai melalui skema komitmen APBD dan Dana Transfer Khusus.</p>',
                'category' => 'Berita Utama',
                'image' => 'https://bappeda.halmaherautarakab.go.id/assets/images/179bda39bd91b7dc5a48bc946fdfaadf.png',
                'date' => '2026-06-11',
                'views' => 164,
                'author' => 'bappeda',
                'is_published' => true,
                'created_at' => '2026-06-11 14:20:00',
                'updated_at' => '2026-06-11 14:20:00',
            ],
        ];

        foreach ($news as $n) {
            DB::table('news')->updateOrInsert(
                ['slug' => $n['slug']],
                $n
            );
        }
    }
}
