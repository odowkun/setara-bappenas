<?php

use App\Models\Survey;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Only seed if existing responses are fewer than 10
        if (Survey::query()->count() > 10) {
            return;
        }

        $samples = [
            // SANGAT MEMUASKAN (23 responses - score >= 80)
            ['nama' => 'Dra. Maria S. Pdt', 'pekerjaan' => 'ASN Halut', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [5,5,5,5,5], 'score' => 100.0, 'saran' => 'Informasi RKPD dan RPJMD sangat transparan dan mudah diakses secara digital.'],
            ['nama' => 'Hengky L. Tani', 'pekerjaan' => 'Wiraswasta', 'layanan' => 'Layanan Informasi Publik & GIS Peta Spasial', 'u' => [5,5,4,5,5], 'score' => 96.0, 'saran' => 'Peta spasial proyek strategis sangat membantu pemantauan pembangunan daerah.'],
            ['nama' => 'Nurul Hidayah, S.T.', 'pekerjaan' => 'Konsultan Perencana', 'layanan' => 'Bidang Perencanaan Pembangunan & Evaluasi', 'u' => [4,5,5,4,5], 'score' => 92.0, 'saran' => 'Koordinasi dan keterbukaan data perencanaan sangat baik.'],
            ['nama' => 'M. Rusdi Malan', 'pekerjaan' => 'Masyarakat Tobelo', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [5,4,5,5,5], 'score' => 96.0, 'saran' => 'Tampilan portal modern dan berita pembangunan selalu diperbarui.'],
            ['nama' => 'Grace F. Manopo', 'pekerjaan' => 'Tenaga Pendidik', 'layanan' => 'Bidang Pembangunan Manusia & Masyarakat (PMM)', 'u' => [5,5,5,4,5], 'score' => 96.0, 'saran' => 'Sangat mengapresiasi publikasi capaian indikator makro daerah.'],
            ['nama' => 'Yance Kakauhe', 'pekerjaan' => 'Petani / Wiraswasta', 'layanan' => 'Bidang Ekonomi & Sumber Daya Alam (SDA)', 'u' => [4,4,5,5,4], 'score' => 88.0, 'saran' => 'Informasi program ketahanan pangan sangat bermanfaat bagi petani lokal.'],
            ['nama' => 'Fadli Abubakar', 'pekerjaan' => 'Mahasiswa / Akademisi', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [5,5,4,4,5], 'score' => 92.0, 'saran' => 'Data statistik dan dokumen perencanaan sangat lengkap untuk riset ilmiah.'],
            ['nama' => 'Rosita Dodengo', 'pekerjaan' => 'Warga Kao Barat', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [5,5,5,5,5], 'score' => 100.0, 'saran' => 'Akses informasi publik kini jauh lebih cepat tanpa harus ke kantor.'],
            ['nama' => 'dr. Benny Pattirane', 'pekerjaan' => 'Tenaga Kesehatan', 'layanan' => 'Bidang Pembangunan Manusia & Masyarakat (PMM)', 'u' => [4,5,4,5,5], 'score' => 92.0, 'saran' => 'Sinkronisasi program penurunan stunting daerah terpantau dengan transparan.'],
            ['nama' => 'Jonas R. Baura', 'pekerjaan' => 'Masyarakat Malifut', 'layanan' => 'Bidang Infrastruktur & Pengembangan Wilayah (IPW)', 'u' => [5,4,4,5,4], 'score' => 88.0, 'saran' => 'Informasi proyek infrastruktur jalan dan jembatan transparan.'],
            ['nama' => 'Siti Aminah', 'pekerjaan' => 'Ibu Rumah Tangga', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [5,5,5,5,4], 'score' => 96.0, 'saran' => 'Portal sangat mudah dibaca dan navigasinya jelas.'],
            ['nama' => 'Arnoldus Jansen', 'pekerjaan' => 'Pelaku UMKM Tobelo', 'layanan' => 'Bidang Ekonomi & Sumber Daya Alam (SDA)', 'u' => [4,5,4,4,5], 'score' => 88.0, 'saran' => 'Arah kebijakan ekonomi daerah dipaparkan dengan sangat informatif.'],
            ['nama' => 'Dewi Sartika', 'pekerjaan' => 'Masyarakat Galela', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [5,4,5,5,5], 'score' => 96.0, 'saran' => 'Sangat ramah pengguna dan informasi agenda kegiatan selalu terkini.'],
            ['nama' => 'Samuel P. Lahi', 'pekerjaan' => 'ASN BAPPEDA', 'layanan' => 'BAPPEDA Halmahera Utara (Kantor Utama)', 'u' => [5,5,5,5,5], 'score' => 100.0, 'saran' => 'Sinergi perencanaan pembangunan daerah semakin solid dan transparan.'],
            ['nama' => 'Yunita K. Salama', 'pekerjaan' => 'Mahasiswi', 'layanan' => 'Layanan Informasi Publik & GIS Peta Spasial', 'u' => [5,5,4,5,4], 'score' => 92.0, 'saran' => 'Peta WebGIS sangat interaktif dan responsif di smartphone.'],
            ['nama' => 'Victor M. Ngato', 'pekerjaan' => 'Kontraktor Fisik', 'layanan' => 'Bidang Infrastruktur & Pengembangan Wilayah (IPW)', 'u' => [4,4,4,5,5], 'score' => 88.0, 'saran' => 'Transparansi lokasi proyek sangat membantu evaluasi di lapangan.'],
            ['nama' => 'Kornelia D. Rore', 'pekerjaan' => 'Masyarakat Kao', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [5,5,5,4,5], 'score' => 96.0, 'saran' => 'Sangat memuaskan, tampilan rapi dan modern.'],
            ['nama' => 'Irfan Hi. Saleh', 'pekerjaan' => 'Warga Loloda Utara', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [4,4,5,5,4], 'score' => 88.0, 'saran' => 'Membantu warga wilayah pulau terluar memantau rencana pembangunan.'],
            ['nama' => 'Meiske B. Loleo', 'pekerjaan' => 'Warga Tobelo Tengah', 'layanan' => 'Sekretariat BAPPEDA', 'u' => [5,5,5,5,5], 'score' => 100.0, 'saran' => 'Layanan administrasi dan informasi publik sangat profesional.'],

            // CUKUP MEMUASKAN (8 responses - score 60-79)
            ['nama' => 'Johan F. Bunga', 'pekerjaan' => 'Warga Tobelo Selatan', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [4,4,3,3,4], 'score' => 72.0, 'saran' => 'Kecepatan akses data dokumen PDF berukuran besar mohon dapat lebih dioptimalkan.'],
            ['nama' => 'Rahmatia S. Taba', 'pekerjaan' => 'Masyarakat Umum', 'layanan' => 'Layanan Informasi Publik & GIS Peta Spasial', 'u' => [3,4,3,4,4], 'score' => 72.0, 'saran' => 'Tampilan peta interaktif cukup bagus, namun perlu penambahan panduan penggunaan bagi warga awam.'],
            ['nama' => 'Paulus D. Gura', 'pekerjaan' => 'Pekerja Swasta', 'layanan' => 'Bidang Perencanaan Pembangunan & Evaluasi', 'u' => [4,3,4,3,4], 'score' => 72.0, 'saran' => 'Prosedur pengusulan aspirasi sudah baik, mohon waktu respon feedback dipercepat.'],
            ['nama' => 'Ester M. Piga', 'pekerjaan' => 'Masyarakat Galela Barat', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [4,3,3,4,4], 'score' => 72.0, 'saran' => 'Tampilan informasi cukup lengkap, mohon infografis statistik diperbanyak.'],
            ['nama' => 'Zulkifli Hasan', 'pekerjaan' => 'Warga Malifut', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [3,4,4,3,3], 'score' => 68.0, 'saran' => 'Cukup memuaskan, semoga ke depan ada fitur notifikasi pengumuman via WhatsApp.'],
            ['nama' => 'Martha L. Silo', 'pekerjaan' => 'Warga Kao Utara', 'layanan' => 'Sekretariat BAPPEDA', 'u' => [4,4,3,4,3], 'score' => 72.0, 'saran' => 'Pelayanan informasi sudah memadai, tingkatkan kecepatan upload arsip regulasi.'],
            ['nama' => 'Hendrik K. Tolon', 'pekerjaan' => 'Warga Tobelo Barat', 'layanan' => 'Bidang Infrastruktur & Pengembangan Wilayah (IPW)', 'u' => [4,3,4,3,4], 'score' => 72.0, 'saran' => 'Cukup baik dan transparan dalam menyajikan peta proyek.'],
            ['nama' => 'Nurjana M. Kilo', 'pekerjaan' => 'Pedagang Pasar', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [3,4,3,4,4], 'score' => 72.0, 'saran' => 'Cukup memuaskan untuk mengetahui informasi kegiatan pemerintah daerah.'],

            // KURANG MEMUASKAN (7 responses - score < 60)
            ['nama' => 'Marten T. Luwu', 'pekerjaan' => 'Warga Tobelo', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [2,2,2,3,2], 'score' => 44.0, 'saran' => 'Informasi lampiran dokumen teknis sempat tidak bisa dibuka saat jaringan internet lambat.'],
            ['nama' => 'Karisma P. Galela', 'pekerjaan' => 'Wiraswasta', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [3,2,2,2,3], 'score' => 48.0, 'saran' => 'Navigasi pencarian dokumen di HP sempat agak membingungkan, mohon disederhanakan.'],
            ['nama' => 'Soni S. Malifut', 'pekerjaan' => 'Masyarakat', 'layanan' => 'Layanan Informasi Publik & GIS Peta Spasial', 'u' => [2,3,2,2,2], 'score' => 44.0, 'saran' => 'Loading peta spasial terasa lambat ketika dibuka pada koneksi seluler 3G/4G minim kuota.'],
            ['nama' => 'Yuliana R. Kao', 'pekerjaan' => 'Mahasiswi', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [2,2,3,2,2], 'score' => 44.0, 'saran' => 'Format file dokumen beberapa masih terlalu besar sehingga unduhan terputus.'],
            ['nama' => 'Daud B. Loloda', 'pekerjaan' => 'Nelayan', 'layanan' => 'Bidang Ekonomi & Sumber Daya Alam (SDA)', 'u' => [3,2,2,3,2], 'score' => 48.0, 'saran' => 'Belum menemukan informasi jadwal sosialisasi bantuan nelayan di portal ini.'],
            ['nama' => 'Hasanudin K. Tobelo', 'pekerjaan' => 'Warga', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [2,2,2,2,3], 'score' => 44.0, 'saran' => 'Perlu tombol bantuan cepat atau kontak petugas yang langsung terhubung ke WhatsApp.'],
            ['nama' => 'Novita S. Gura', 'pekerjaan' => 'Pelajar', 'layanan' => 'Layanan Informasi Publik & Portal Website BAPPEDA', 'u' => [2,3,2,2,2], 'score' => 44.0, 'saran' => 'Loading halaman berita terkadang butuh waktu beberapa detik.'],
        ];

        foreach ($samples as $s) {
            Survey::query()->create([
                'nama_responden' => $s['nama'],
                'email' => null,
                'pekerjaan' => $s['pekerjaan'],
                'jenis_layanan' => $s['layanan'],
                'u1_persyaratan' => $s['u'][0],
                'u2_prosedur' => $s['u'][1],
                'u3_kecepatan' => $s['u'][2],
                'u4_produk' => $s['u'][3],
                'u5_sikap' => $s['u'][4],
                'ikm_score' => $s['score'],
                'saran_masukan' => $s['saran'],
                'created_at' => now()->subDays(rand(1, 45)),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // No destructive rollback needed
    }
};
