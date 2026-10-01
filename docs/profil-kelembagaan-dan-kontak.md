# Sinkronisasi Data Profil Kelembagaan, Kontak & Jam Kerja

Dokumentasi standarisasi pengelolaan dan sinkronisasi informasi profil instansi BAPPEDA Kabupaten Halmahera Utara.

## Sumber Data Tunggal (Single Source of Truth)

Seluruh metadata institusi disimpan terpusat pada tabel `profils` dengan `key = 'tentang'` dan kolom `meta_json`:
- `tahun_berdiri`: Tahun legalitas pendirian Bappeda Halmahera Utara (contoh: `"2003"`).
- `alamat`: Alamat fisik sekretariat kantor (contoh: `"Jl. Ir. Hein Namotemo M.SP 2 Tobelo, Halmahera Utara, Maluku Utara"`).
- `telepon`: Saluran telepon resmi (contoh: `"+62 821 4810 7771"`).
- `email`: Alamat surat elektronik resmi (contoh: `"info@bappeda.halmaherautarakab.go.id"`).
- `jam_kerja`: Format jadwal layanan operasional (contoh: `"Senin - Jumat: 08:00 - 16:00 WIT"`).
- `youtube`: Tautan channel YouTube resmi BAPPEDA (contoh: `"https://www.youtube.com/@bappedahalut"`).
- `instagram`: Tautan profil Instagram resmi BAPPEDA (contoh: `"https://www.instagram.com/bappedahalut"`).
- `facebook`: Tautan halaman Facebook resmi BAPPEDA (contoh: `"https://www.facebook.com/bappedahalut"`).
- `tiktok`: Tautan akun TikTok resmi BAPPEDA (contoh: `"https://www.tiktok.com/@bappedahalut"`).
- `x`: Tautan profil X/Twitter resmi BAPPEDA (contoh: `"https://x.com/bappedahalut"`).

## Sinkronisasi Frontend

1. **Dashboard Pengelola (`/dashboard/profil/tentang` & `/dashboard/pengaturan-profil`)**:
   - Dilengkapi tab pengelolaan profil serta formulir **Pengaturan Media Sosial Resmi BAPPEDA**:
     - Kolom URL valid untuk YouTube, Instagram, Facebook, TikTok, dan X (Twitter).
     - Dapat diakses baik melalui menu *Tentang Bappeda* maupun langsung via *Pengaturan Profil* di dashboard.
     - Menyimpan data secara atomik ke endpoint `/profil/tentang` pada kolom `meta_json`.

2. **Footer Global Portal (`frontend/src/components/layout/Footer.tsx`)**:
   - Mengambil data kontak dan tautan media sosial secara dinamis melalui `API_BASE_URL + "/profil/tentang"`.
   - Menampilkan Alamat, Telepon, Email, serta ikon resmi beranimasi mikro untuk 5 platform media sosial (YouTube, Instagram, Facebook, TikTok, X) dengan warna tema merek resmi saat di-hover. Fallback otomatis aktif jika koneksi lambat.

## Bagan Struktur Organisasi & Aksesibilitas Kontras (`StrukturOrganisasiChart.tsx`)

Bagan Struktur Organisasi (`/profil/struktur` dan `/dashboard/profil/struktur`) mengadopsi standar visual tingkat tinggi dan aksesibilitas:

1. **Aksesibilitas Kontras Tinggi (High Contrast)**:
   - **Kartu Root (Kepala Badan)**: Menggunakan background gradient biru tua (`from-blue-950 via-slate-900 to-blue-900`) dengan teks nama resmi wajib **putih cerah (`text-white font-black drop-shadow-xs`)** dan NIP berwarna sky terang (`text-sky-200 font-semibold`) untuk mencegah teks gelap yang tidak terbaca pada background gelap.
   - **Pill Badge Jabatan**:
     - Root: `bg-blue-600 text-white border-blue-400/50 shadow-xs`.
     - Sekretaris: `bg-blue-700 text-white border-blue-800 shadow-xs`.
     - Bidang: `bg-sky-100 text-blue-950 border-sky-300`.
     - Subag/Subid: `bg-blue-100/90 text-blue-900 border-blue-200`.

2. **Dukungan Penuh Responsif Mobile (Mobile Responsiveness)**:
   - **Auto-Center Kamera Kanvas**: Kanvas interaktif secara otomatis memusatkan kamera langsung pada kartu Kepala Badan saat pertama kali dimuat (`centerOnRoot`), sehingga pengguna mobile tidak disajikan layar kosong di koordinat (0,0).
   - **Tombol Pusatkan (Pusatkan Bagan)**: Dilengkapi tombol target (`Target` icon) pada toolbar kanvas untuk memusatkan kembali tampilan ke pucuk pimpinan dengan 1 ketukan.
   - **Skala Zoom Otomatis**: Pada viewport kecil (< 640px), tingkat zoom default disetel ke 60% agar struktur kelembagaan langsung muat dan terbaca di layar ponsel.
   - **Touch Pan & Mobile Gestures**: Kontainer kanvas mengaktifkan `touch-pan-x touch-pan-y` untuk navigasi usap (swipe) yang mulus serta dukungan drag sentuh (`onTouchStart`, `onTouchMove`, `onTouchEnd`). Dilengkapi pill petunjuk navigasi mobile: *"↔ Geser layar untuk menjelajah bagan"*.
   - **Bagan Vertikal Mobile-Friendly**: Indentasi hierarki berjenjang (`RenderVerticalNode`) disesuaikan menjadi `pl-3.5 ml-3 sm:pl-8 sm:ml-8` untuk mencegah pemotongan kartu pada smartphone berlayar sempit.

## Standar Rendering Teks Kaya (Rich Text & Sanitasi Tag HTML)

Untuk mencegah tag HTML (seperti `<p>`, `</p>`, `<ul>`, dll.) terlihat secara mentah (raw string) di halaman publik:

1. **Konten Utama / Detail**:
   - Konten yang dikelola melalui TipTap/WYSIWYG Rich Text Editor (`profil`, `tugas-fungsi`, `tentang`, `pengumuman`, `berita`) WAJIB dirender menggunakan `dangerouslySetInnerHTML={{ __html: content }}` dengan pembungkus styling typography Tailwind (`prose prose-slate max-w-none text-slate-800 leading-relaxed`).
   - Dilarang merender variabel HTML sebagai text node langsung (misal: `{data?.content}`) karena React akan melakukan HTML entity escaping yang menyebabkan tag HTML tampil sebagai teks biasa.

2. **Ringkasan / Kartu Pratinjau / Excerpt**:
   - Komponen daftar, kartu ringkasan, atau modal pendek yang menggunakan `line-clamp` WAJIB membersihkan tag HTML terlebih dahulu menggunakan pembersih ekspresi reguler:
     ```ts
     const cleanText = rawContent ? rawContent.replace(/<[^>]*>/g, "").trim() : "";
     ```
   - Berlaku pada: `/profil/tentang` (kutipan Visi), `/profil/tugas-fungsi` (daftar fungsi), `/pengumuman` (ringkasan kartu & headline), `/berita` (ringkasan artikel & carousel beranda).

## Standarisasi Pengelolaan Dasar Hukum & Kategori Regulasi Dinamis

Pada halaman Editor Dasar Hukum (`/dashboard/profil/dasar-hukum`), dropdown pemilihan kategori regulasi dikonfigurasi secara adaptif:

1. **Kelengkapan Hierarki Kategori Regulasi**:
   - **Tingkat Pusat / Nasional**: Undang-Undang, Peraturan Pemerintah, Peraturan Presiden, Peraturan Menteri, **Instruksi Menteri**, **Keputusan Menteri**, **Surat Edaran Menteri**.
   - **Tingkat Daerah Provinsi**: Peraturan Daerah, Peraturan Gubernur, Keputusan Gubernur, Instruksi Gubernur.
   - **Tingkat Daerah Kabupaten**: Peraturan Bupati, Keputusan Bupati, **Instruksi Bupati**, **Surat Edaran Bupati**.

2. **Dukungan Kategori Kustom (Creatable SearchableSelect)**:
   - Komponen `SearchableSelect` diaktifkan dengan `creatable={true}` dan `createLabelPrefix="Tambah kategori baru:"`.
   - Admin dapat langsung mengetik kategori baru di bilah pencarian jika nama kategori khusus belum tersedia di opsi default.
   - Kategori kustom yang baru ditambahkan secara otomatis disimpan ke state `kategoriOptions` dan dirender langsung di badge halaman publik `/profil/dasar-hukum`.
   - Data kategori kustom tersimpan persisten di database Laravel melalui kolom JSON `meta_json.regulasi` pada tabel `profils`.

## Standarisasi Tampilan Daftar Hierarki Posisi & Pejabat (`/dashboard/profil/struktur`)

Pada halaman editor struktur organisasi BAPPEDA Halmahera Utara (`/dashboard/profil/struktur`), tampilan daftar posisi (Tab 1) dan penugasan pejabat (Tab 2) menerapkan prinsip visual hierarki berjenjang (stair-step tree hierarchy):

1. **Indentasi Bertingkat Dinamis Bebas-Klem (Dynamic Hierarchy Indentation)**:
   - Indentasi kiri (`paddingLeft`) dihitung dinamis berdasarkan kedalaman hierarki node (`depth`):
     ```tsx
     style={{ paddingLeft: `calc(1.25rem + ${Math.min(depth, 6)} * clamp(28px, 4vw, 52px))` }}
     ```
   - Menghilangkan pembatasan statis (clamp 48px lama) yang sebelumnya menyebabkan posisi Kasubag dan Fungsional berada di garis vertikal yang sama dengan Sekretaris.
   - Di desktop, setiap level bawahan bergeser 52px lebih ke kanan (Level 0: 20px, Level 1: 72px, Level 2: 124px, Level 3: 176px). Pada layar mobile/tablet, nilai clamp (28px - 44px) memastikan tata letak tetap proporsional tanpa terpotong.

2. **Indikator Visual Percabangan Subordinat**:
   - Seluruh posisi bawahan (`depth > 0`) dilengkapi ikon percabangan hierarki `CornerDownRight` (`↳`) berwarna biru sebelum avatar posisi/pejabat.
   - Ditambahkan badge tingkatan hierarki (`Tingkat {depth}`) berdampingan dengan badge atasan langsung (`Atasan: [Nama Posisi Atasan]`).
   - Posisi pimpinan utama (`depth === 0`) diberikan aksen gradient biru transparan (`bg-gradient-to-r from-blue-50/50 via-white to-transparent`) serta badge `Root (Pimpinan Utama)` agar langsung terbaca sebagai simpul pucuk tertinggi.
