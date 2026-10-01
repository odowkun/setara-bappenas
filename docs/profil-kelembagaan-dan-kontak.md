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

3. **Fitur Buka-Tutup Cabang Hierarki (Expand / Collapse Accordion Tree)**:
   - Dilengkapi bilah kontrol atas: tombol **Buka Semua** (`ChevronsDown`) dan **Tutup Semua** (`ChevronsUp`) beserta indikator jumlah posisi terlihat dan jumlah cabang yang sedang ditutup.
   - Setiap node yang memiliki bawahan (`hasChildren: true`) memiliki tombol chevron interaktif (`ChevronDown` saat terbuka dan `ChevronRight` dengan aksen biru terang saat tertutup).
   - Saat sebuah cabang ditutup, seluruh rantai anak di bawahnya disembunyikan dan muncul pill interaktif `+{childCount} Bawahan (Tertutup)` yang dapat diklik langsung untuk membuka kembali cabang tersebut.
   - Posisi ujung (leaf node) diberikan dot spacer presisi agar perataan vertikal avatar tetap sejajar.
   - Berlaku pada Tab 1 (Posisi Jabatan) dan Tab 2 (Penugasan Pejabat Struktural). Opsi pemilih atasan pada modal pop-up tetap menyajikan daftar pohon lengkap (`fullTreeList`) agar seluruh posisi dapat dipilih sebagai atasan.

## Standarisasi Kelompok Jabatan Fungsional Terpadu (Unified Grouping Box)

Sesuai regulasi kelembagaan pemerintah (PermenPAN-RB), Jabatan Fungsional pada BAPPEDA tidak lagi disebar sebagai simpul hierarki struktural di bawah tiap Kasubag/Kabid, melainkan dikelompokkan menjadi satu bagan terpadu (**Kelompok Jabatan Fungsional**) di bagian bawah bagan organisasi:

1. **Model Data Terpisah (`pejabat_fungsionals`)**:
   - Tabel mandiri `pejabat_fungsionals` (`id`, `name`, `position`, `nip`, `avatar`, `order_index`, timestamps).
   - Seluruh simpul lama posisi `FUNGSIONAL` yang sebelumnya menempel pada rantai `pejabats` telah dibersihkan secara otomatis via migrasi dan filter kueri backend.
   - Endpoint CRUD mandiri: `/api/v1/pejabat-fungsional` dengan otentikasi Sanctum dan izin `manage_struktur`.

2. **Visualisasi Bagan Terpadu & Standar Tata Letak List ke Bawah**:
   - **Bagan Vertikal (`RenderVerticalNode`)**: Kotak mandiri *Kelompok Jabatan Fungsional* ditempatkan di bagian bawah hirarki, memuat daftar personel per baris vertikal (*vertical row list ke bawah*) lengkap dengan nomor urut, foto/inisial ber-badge kontras tinggi, nama lengkap, NIP, serta badge nama jabatan fungsional adaptif (`max-w-[48%]`, `whitespace-normal break-words`).
   - **Bagan Kanvas Interaktif (`InteractiveCanvasOrgChart`)**:
     - Menggunakan tata letak **List ke Bawah (`space-y-3`)** dengan lebar terstandarisasi (`880px`) menggantikan tata letak grid multi-kolom yang sebelumnya dapat menekan teks nama menjadi 1 karakter vertikal saat judul jabatan fungsional panjang.
     - Setiap baris personel membentang penuh (*full-width row item*) dengan nomor urut (`idx + 1`), avatar/initials dengan ukuran tetap (`shrink-0`), nama pejabat tebal dan NIP (`flex-1 min-w-0`), serta badge jabatan fungsional biru yang melipat kata secara rapi (`whitespace-normal break-words max-w-[50%]`).
     - Tinggi kanvas dihitung dinamis (`canvasBounds`) menyesuaikan jumlah personel fungsional (`fungsionalEstimatedHeight = 140 + length * 85`) agar tidak ada kartu atau garis vektor yang terpotong.
   - Terhubung dengan garis vektor ortogonal putus-putus biru (`strokeDasharray="6 4"`) dari pusat bawah pohon ke pucuk kotak kelompok fungsional.

3. **Pengelolaan 3-Langkah di Dashboard (`/dashboard/profil/struktur`)**:
   - **Langkah 1**: Susun Posisi Struktural (Kepala Badan, Sekretaris, Kasubag, Kabid, Subid).
   - **Langkah 2**: Pejabat Struktural & NIP.
   - **Langkah 3**: Kelompok Jabatan Fungsional (Tambah, Edit, Hapus personel fungsional dengan dialog konfirmasi SweetAlert2 `showDeleteConfirm` dan toast feedback).
   - Placeholder input nama terstandarisasi `"Contoh: Agustino Hermanus, S.T."`.

## Standarisasi Kanvas Interaktif: Smart Routing Ortogonal, Snap-to-Grid & Auto-Align

Pada bagan kanvas interaktif (`InteractiveCanvasOrgChart`), implementasi sistem routing garis dan penataan posisi dirancang menyerupai standar diagramming profesional (Draw.io / Lucidchart):

1. **Smart Orthogonal Bus Corridor Routing (Garis Ortogonal Bebas Tabrakan)**:
   - **Masalah Lama**: Jalur garis lama menghubungkan sisi kiri parent ke sisi kanan child secara horizontal melintang, sehingga garis menembus langsung di tengah-tengah kartu Kabid lain di antara keduanya.
   - **Solusi Koridor Bebas**:
     - Titik keluar: Bagian tengah bawah kartu atasan (`pCenterX, pBottom`).
     - Jalur vertikal: Garis turun lurus ke area koridor kosong (`corridorY = pBottom + Math.max(25, Math.min(verticalGap / 2, 45))`).
     - Jalur horizontal (Bus corridor): Garis bergerak mendatar di ruang hampa antar-tingkat hierarki tanpa pernah memotong kartu pejabat mana pun.
     - Titik masuk: Garis turun tegak lurus (90 derajat ortogonal) ke bagian tengah atas kartu bawahan (`cCenterX, cTop`).
     - Jalur vektor SVG: `M ${pCenterX} ${pBottom} V ${corridorY} H ${cCenterX} V ${cTop}`.

2. **Snap-to-Grid Otomatis (Grid 20px)**:
   - Pada saat admin melakukan drag & drop kartu menggunakan mouse maupun layar sentuh mobile/tablet, koordinat `x` dan `y` otomatis dikunci ke kelipatan terdekat dari `GRID_SIZE = 20px` (`Math.round(raw / 20) * 20`).
   - Menghasilkan penataan kartu yang lurus presisi, sejajar, dan simetris tanpa goyangan offset beberapa piksel.

3. **Mesin Tata Letak Kanonis & Tombol "Rapikan Bagan" (`computeCanonicalBappedaLayout`)**:
   - Menghitung posisi hierarkis ideal secara otomatis sesuai tata letak resmi BAPPEDA (Dua Pilar: Teknis & Sekretariat):
     - **Pucuk Pimpinan**: Kepala Badan di bagian tengah atas (`y: 40`).
     - **Pilar Kiri**: 4 Kepala Bidang Teknis berjejer rapi horizontal (`y: 360`, `x: 60, 380, 700, 1020`).
     - **Pilar Kanan**: Sekretaris Badan (`y: 190`, `x: 1710`), menaungi 3 Kasubag di bawahnya pada tier yang sejajar persis dengan para Kabid (`y: 360`, `x: 1390, 1710, 2030`).
     - **Sub-bidang**: Tersusun vertikal ke bawah di bawah masing-masing Bidang (`y: 520, 660, ...`).
   - Tombol **"Rapikan Bagan"** (`Sparkles`) pada toolbar kanvas admin memungkinkan reset posisi 1-klik kembali ke tata letak simetris resmi BAPPEDA, disertai notifikasi toast dan kamera otomatis memusat ke Kepala Badan.
   - Tombol **"Simpan Tata Letak"** (`Save`) mengirimkan array koordinat final ke endpoint `/pejabat/save-positions` untuk disinkronkan ke database publik.

4. **Sistem Bus Koordinasi Penuh ke Seluruh Struktural (Full-Structural Coordination Bus)**:
   - **Eliminasi Garis Menggantung**: Menghilangkan bug garis putus-putus tunggal yang sebelumnya melayang di ruang hampa antara Kabid 4 dan Kasubag 1 tanpa terhubung ke kartu pejabat mana pun.
   - **Koneksi Menyeluruh ke Seluruh Unit Struktural**:
     - Mengidentifikasi seluruh simpul struktural unit kerja yang berhadapan ke bawah (`structuralLeafNodes`: 4 Kepala Bidang dan 3 Kasubag).
     - Dari bagian tengah bawah setiap kartu unit kerja struktural, ditarik garis *feeder* putus-putus vertikal (`M ${leafCenterX} ${leafBottom} V ${fungsionalCorridorY}`).
     - Seluruh garis *feeder* bermuara ke sebuah garis bus koordinasi horizontal (`fungsional-horizontal-bus`) yang membentang di koridor aman antar-tingkat dari ujung kiri struktural (`minLeafCenterX`) hingga ujung kanan struktural (`maxLeafCenterX`).
     - Dari titik tengah bus horizontal tersebut, garis putus-putus utama turun tegak lurus (`M ${fungsionalTopCenterX} ${fungsionalCorridorY} V ${fungsionalBoxY}`) tepat ke pucuk atas kotak **KELOMPOK JABATAN FUNGSIONAL**.
   - Secara visual dan fungsional menggambarkan kedudukan tenaga fungsional BAPPEDA yang berkoordinasi dan memberikan dukungan keahlian teknis kepada **seluruh unit struktural** organisasi.

5. **Interaktivitas Geser Bebas Kelompok Jabatan Fungsional (Draggable Functional Box)**:
   - **Fitur Drag & Drop**: Kotak besar Kelompok Jabatan Fungsional kini mendukung drag & drop menggunakan mouse atau layar sentuh sama seperti kartu pejabat struktural lainnya.
   - **Snap-to-Grid Terintegrasi**: Mengikuti kelipatan `20px` (`GRID_SIZE = 20`) agar posisi tetap tegak lurus dan simetris terhadap struktur pohon.
   - **Garis Bus Adaptif Real-time**: Jalur bus horizontal dan garis drop vertikal mengikuti pergeseran koordinat kotak secara dinamis (*real-time reactive*) tanpa putus.
   - **Penyimpanan Koordinat ke Database**: Posisi `fungsional-box` disimpan ke database Laravel via endpoint `/api/v1/pejabat/save-positions` dan dimuat kembali secara otomatis pada portal publik maupun halaman editor admin.



