# Standar Skeleton Loaders & State Transition Dashboard Bappeda Halut

## 1. Latar Belakang & Tujuan
Untuk memberikan pengalaman pengguna (UX) yang halus (*smooth transition*) tanpa kedipan, lonjakan tata letak (*cumulative layout shift* / CLS), atau tampilan layar kosong saat proses penarikan data asinkron dari backend API, seluruh komponen kartu (*card grid*) dan tabel data (*data table*) pada modul dashboard mengadopsi standar **Skeleton Loaders**.

Selain itu, dokumen ini mendokumentasikan spesifikasi pemilihan dokumen induk pada modul Geotagging Proyek yang mensyaratkan pemilihan manual aktif oleh pengguna (*no auto-select*).

---

## 2. Arsitektur & Prinsip Skeleton Loaders

### 2.1. In-Place Structural Preservation
1. **Preserve Container Geometry**:
   - Dimensi, padding, dan struktur baris/kolom skeleton harus mencerminkan komponen aslinya (misal: kartu dengan tinggi `min-h-[220px]`, sel tabel dengan padding `py-3.5 px-4` atau `p-3`).
   - Tidak menggunakan pemutar/spinner tunggal berukuran besar di tengah tabel karena menyebabkan pergeseran tata letak saat data selesai dimuat.

2. **Animasi Berkelanjutan**:
   - Menggunakan utilitas bawaan Tailwind `animate-pulse`.
   - Warna latar placeholder: `bg-slate-200` untuk elemen kontras tinggi dan `bg-slate-100` untuk elemen pendukung/sekunder. Dalam mode gelap (*dark mode*), gunakan `dark:bg-slate-800` dan `dark:bg-slate-800/60`.

3. **Manajemen Tiga Keadaan Data (*Three-State Rendering*)**:
   Setiap tampilan data asinkron wajib menangani tiga status secara berurutan:
   - **Status 1 (Memuat / `loading === true`)**: Tampilkan Skeleton Loader.
   - **Status 2 (Kosong / `!loading && items.length === 0`)**: Tampilkan kartu/baris *Empty State* yang informatif.
   - **Status 3 (Tersedia / `!loading && items.length > 0`)**: Tampilkan item/baris data sebenarnya.

---

## 3. Implementasi pada Komponen Kartu (Card Grid)

### Halaman: `/dashboard/dokumen`
- **Tampilan Grid**: 2 kolom pada desktop (`grid grid-cols-1 md:grid-cols-2 gap-4`).
- **Pola Skeleton**: 4 kartu tiruan dengan icon box berukuran `w-11 h-11`, placeholder badge pil, garis judul beranimasi, dan tombol aksi bawah.
- **Implementasi**:
  ```tsx
  {loading ? (
    [1, 2, 3, 4].map((n) => (
      <div
        key={n}
        className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4 animate-pulse flex flex-col justify-between min-h-[220px]"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-200 shrink-0" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              <div className="h-5 w-12 bg-slate-200 rounded-full" />
              <div className="h-5 w-14 bg-slate-200 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
          </div>
        </div>
        ...
      </div>
    ))
  ) : filteredDocs.length === 0 ? (
    <EmptyStateMessage />
  ) : (
    filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
  )}
  ```

---

## 4. Implementasi pada Tabel Data (Data Tables)

Skeleton loader tabel wajib dirender di dalam elemen `<tbody>` dengan jumlah sel (`<td>`) yang persis sama dengan jumlah kolom header (`<thead>`).

### 4.1. Halaman yang Telah Diterapkan
1. **`/dashboard/update-progres` (Tabel Progres Fisik & ESRI)**:
   - 9 kolom: Ref OBJECTID, Status ESRI, Nama Proyek, Bidang, Pagu, Realisasi, Progres Bar, Status, dan Tombol Aksi.
   - 5 baris skeleton saat `loading === true`.
2. **`/dashboard/dokumen/jenis-dokumen` (Tabel Manajemen Jenis Dokumen)**:
   - 6 kolom: Nomor, Nama Jenis Dokumen, Kode Unik, Scope Role, Pembuat, dan Aksi.
   - 5 baris skeleton saat `loading === true`.
3. **`/dashboard/audit-logs` (Tabel Audit Log Keamanan SPBE)**:
   - 5 kolom: Waktu Timestamp, Pengelola SPBE, Jenis Aksi, Detail Rincian, dan IP Address.
   - 5 baris skeleton saat `loading === true`.
4. **`/dashboard/users` (Tabel Pengguna & Kartu Mobile)**:
   - **Desktop**: 5 kolom tabel pengguna dengan avatar box `w-10 h-10`, teks nama, email, badge role, dan tombol aksi.
   - **Mobile**: 3 kartu skeleton responsif khusus perangkat genggam.
5. **`/dashboard/running-text` (Tabel Teks Berjalan)**:
   - Menggantikan spinner tengah dengan 4 baris skeleton pada struktur tabel utuh.
6. **`/dashboard/survey-kepuasan` (Tabel Hasil Responden Survei IKM)**:
   - 5 kolom: Avatar responden, Jenis Layanan, Badge Mutu IKM, Tanggal Submit, dan Tombol Detail.
7. **`/dashboard/kritik-saran` (Tabel Kritik & Saran Publik)**:
   - 5 kolom: Pengirim, SKPD Tujuan, Subjek/Pesan, Status Tanggapan, dan Tombol Aksi Balas.
8. **`/dashboard/agenda` (Tabel Agenda Kegiatan)**:
   - 6 kolom: Rentang Tanggal, Judul Agenda, Kategori, Lokasi, Status, dan Tombol Aksi.
9. **`/dashboard/infografis` (Tabel Manajemen Infografis Pembangunan)**:
   - 7 kolom: Thumbnail Gambar, Judul & Deskripsi, Kategori, Tersemat Beranda, Status Tayang, Urutan, dan Aksi.
   - Menggantikan spinner tengah dengan 5 baris skeleton terstruktur di dalam tabel.
10. **`/dashboard/dokumen/riwayat-unduhan` (Tabel Riwayat Pengunduh Dokumen)**:
    - 4 kolom: Waktu Unduh, Email Masyarakat, Dokumen, dan Jejak Akses IP/Perangkat.
11. **`/dashboard/dokumen/arsip/[id]` (Tata Kelola & Detail Arsip)**:
    - Skeleton loader penuh untuk kartu header, 4 metrik governance, dan metadata form.
12. **`/dashboard/profil/struktur` (Hirarki Posisi & Penugasan Pejabat)**:
    - Skeleton list hierarki terstruktur pada kedua tab (Posisi Jabatan & Daftar Pejabat).
13. **`/dashboard/profil/tentang`, `/dashboard/profil/tugas-fungsi`, `/dashboard/profil/dasar-hukum`**:
    - Form skeleton dengan placeholder heading, textarea, dan rich text editor.
14. **Modul Pengaturan Spasial (`/dashboard/pengaturan-spasial/*`)**:
    - Seluruh sub-halaman (Visual, ESRI, Viewport, Basemap, dan RTRW Batas) menggunakan skeleton card dan grid placeholder tanpa spinner mandiri.

---

## 5. Standar Pemilihan Geotagging Proyek (No Auto-Select)

### Halaman: `/dashboard/geotagging-proyek`
- **Aturan**: Modul geotagging **tidak boleh** melakukan auto-select terhadap dokumen pertama (`docs[0]`) saat halaman pertama kali dibuka tanpa query parameter `documentId`.
- **Kondisi Default**:
  - `selectedDocId` bernilai string kosong (`""`).
  - Halaman menampilkan kartu placeholder panduan:
    > *"Silakan Pilih Dokumen Induk Terlebih Dahulu"*
    > *"Pilih salah satu Dokumen Induk pada menu pencarian di atas untuk membuka Form Input Titik Geotagging Baru & Peta Interaktif Penentuan Lokasi Proyek."*
  - Form koordinat proyek dan peta interaktif Leaflet baru akan dimunculkan setelah pengguna memilih dokumen induk secara aktif.

---

## 6. Standar Tampilan Layar Memuat Sesi Global (`DashboardLoadingScreen`)

Komponen layar memuat sesi (`DashboardLoadingScreen.tsx`) digunakan saat autentikasi global (`AuthContext.tsx`) dan routing dashboard:
1. **Tipografi Bersih & Fokus**:
   - Subtitle bersifat opsional (`subtitle = ""`) dan dirender secara kondisional (`{subtitle ? <p>{subtitle}</p> : null}`).
   - Menghindari teks deskripsi berlebih (seperti singkronisasi izin modul/RBAC) agar tampilan loading kartu glassmorphic tetap bersih, ringkas, dan profesional.
2. **Indikator Progres Dinamis (0% -> 100%)**:
   - **Progress Bar Nyata**: Menggantikan persentase statis 45% dengan pergerakan tahapan dinamis mulai dari 0% hingga tuntas 100% (`0%` -> `18%` -> `38%` -> `68%` -> `90%` -> `100%`).
   - **Label Persentase Aktif**: Dilengkapi indikator angka persen (`%`) bergaya monospaced di pojok kanan atas progress bar dan status transisi kontekstual di sebelah kiri.
   - **Status Penyelesaian**: Saat mencapai 100%, bar bertransformasi dengan palet emerald (`bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500`) disertai ikon konfirmasi `CheckCircle2` ("Sesi Terverifikasi").
3. **Kalibrasi Waktu Minimum UX (No Sudden Flashes)**:
   - Pada `AuthContext.tsx`, validasi sesi menerapkan batasan waktu minimum (`minLoadingDuration = 1350ms`) sebelum `setLoading(false)`. Hal ini mencegah antarmuka langsung hilang seketika saat respons API lokal/cepat (~50-100ms), memberikan umpan balik visual yang utuh dan nyaman bagi pengguna.
4. **Mekanisme Fail-Fast & Feedback Keamanan (Security Reactive Binding)**:
   - Jika verifikasi `/auth/me` mengembalikan HTTP 401 Unauthorized, token tidak sah, atau jaringan bermasalah:
     - Seluruh timer progres sukses langsung dibatalkan (*aborted*).
     - Ambient glow dan ring pulse bertransformasi ke aksen merah `bg-rose-500/20`.
     - Bar progres berubah merah (`bg-gradient-to-r from-rose-500 to-red-600`) dengan label status `"Ditolak"`.
     - Teks pesan error menampilkan alasan penolakan (`"Sesi kredensial tidak valid atau telah berakhir."`) disertai ikon peringatan `AlertCircle`.
     - Pengguna diberi jeda 950ms untuk membaca umpan balik sebelum dipindahkan ke layar login, menghindari ilusi verifikasi sukses palsu.

---

## 7. Standar Skeleton Loader Video Utama Beranda (`HeroSection.tsx`)

Pada bagian beranda publik (*landing page*), video sambutan pembukaan dipanggil secara asinkron dari API `/api/v1/hero-video`.

### Masalah yang Dihindari (*Layout Shift & Dummy Flash*):
Sebelumnya, saat halaman di-refresh, antarmuka sempat menampilkan fallback statis berupa gambar berita lama (FGD Akses Keuangan Daerah) sebelum data sebenarnya dari API selesai diunduh. Hal ini menimbulkan *flash of wrong content* yang membingungkan pengunjung.

### Spesifikasi Solusi (*Zero-Shift Shimmer Skeleton*):
1. **Status Pemuatan (`isLoading`)**:
   - Selama data video sedang diunduh dari API, komponen merender **Skeleton Loader** dengan rasio aspek persis `aspect-video` dan kurvatur bingkai yang identik (`rounded-2xl sm:rounded-[32px]`).
   - Warna latar: `bg-slate-950` dengan gradien gelap shimmer `bg-gradient-to-tr from-slate-900 via-slate-950 to-blue-950/50`.
   - Menggunakan animasi shimmer Tailwind `animate-pulse` dan lintasan cahaya.
2. **Placeholder Geometris Elemen Dalam**:
   - **Badge Header**: Skeleton pil atas kiri (`w-40 sm:w-52`) dan kanan (`w-32 sm:w-40`).
   - **Tombol Putar Tengah**: Lingkaran tengah proporsional (`w-14 h-14 sm:w-20 sm:h-20`) beraksen amber lembut `bg-amber-400/20`.
   - **Metadata Bawah**: Bar judul tiruan (`h-4 sm:h-6 w-3/4`) dan dua baris deskripsi (`w-5/6` dan `w-1/2`).
3. **Penyajian Data Riil**:
   - Begitu data selesai dimuat (`isLoading: false`), card video asli dimunculkan secara instan jika `is_active: true`.
   - Menghapus ketergantungan fallback ke gambar statis lama yang tidak relevan.

---

## 8. Standar Skeleton Loader & Eliminasi Dummy Fallback Beranda

### 8.1. Kanal Publikasi Multimedia & Media Sosial (`SocialMediaSection.tsx`)
1. **Masalah Dummy Nidji**:
   - File data tiruan (`socialMediaData.ts`) sebelumnya memuat `youtubeId: "ABs7uaqojsY"` (video klip Rahasia Hati - Nidji) sebagai fallback.
   - Saat data belum selesai dimuat dari backend atau opsi featured video kosong, komponen sempat menampilkan video Nidji tersebut yang tidak sesuai dengan instansi pemerintah.
2. **Solusi Skeleton Loader Dua Kolom Simetris**:
   - Diterapkan state `loading` (default `true`) saat memanggil `socialMediaService.getFeaturedYoutube()` dan Instagram feed.
   - Kolom kiri (YouTube) dan kolom kanan (Instagram) masing-masing menampilkan placeholder shimmer beranimasi (`animate-pulse`) yang mencerminkan proporsi kartu asli: header avatar akun bulat `w-10 h-10`, frame video 16:9 widescreen pada kiri, dan 2 kotak kartu foto bujur sangkar pada kanan.
3. **Fallback Terarah Resmi**:
   - Jika tidak ada `youtubeId` yang disetel pada pengaturan profil instansi, komponen menampilkan kartu kanal resmi BAPPEDA Halmahera Utara (`@bappedahalut`) lengkap dengan tombol tautan langsung ke YouTube resmi, bukan video klip acak.

### 8.2. Kartu Pengumuman Pinned Beranda (`GeospatialSection.tsx`)
1. **Masalah Flash Renstra Statis**:
   - Sebelumnya komponen merender teks statis Renstra sebelum respons API pengumuman selesai.
2. **Solusi Skeleton Loader Gradien**:
   - Diterapkan state `loadingAnnouncement` (default `true`).
   - Selama proses fetch, kartu pengumuman merender skeleton loader berlatar gradien biru gelap (`bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900`) beranimasi `animate-pulse`, dengan placeholder judul dan dua tombol aksi.

### 8.3. Indeks Kepuasan Masyarakat (`SatisfactionSurvey.tsx`) & Berita Terbaru (`LatestNewsCarousel.tsx`)
1. **Eliminasi Flash Nilai Dummy IKM**:
   - State awal `totalResponden` dan persentase kepuasan (`ikmStats`) diinisialisasi ke 0 dengan state `loadingStats: true`.
   - Badge responden riil dan angka persentase pada 3 kartu emoji merender skeleton pill shimmer sampai data riil dari database tersinkronisasi.
2. **Inisialisasi Pemuatan Berita**:
   - `LatestNewsCarousel.tsx` menginisialisasi `loading: true` secara bawaan agar 4 kartu skeleton loader langsung muncul sejak awal render pertama tanpa flash kotak kosong.



