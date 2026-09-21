# Sinkronisasi Database Pengaturan Spasial & Standarisasi API Client

## Ringkasan Eksekutif

Dokumentasi ini mencatat implementasi database single-source untuk seluruh modul pengaturan spasial GIS Bappeda Halmahera Utara serta standardisasi URL API pada frontend Next.js agar tidak lagi menggunakan string hardcoded `http://localhost:8000`.

---

## 1. Migrasi & Skema Database

### A. Tabel `geo_settings`
Menyimpan konfigurasi spasial global singleton (`id = 1`):
- `default_buffer_radius_meter` (integer, default: 1000): Radius buffer default geoprocessing.
- `buffer_color` (string, default: `#7c3aed`): Warna polygon lingkaran buffer.
- `buffer_opacity` (decimal 3,2, default: 0.25): Transparansi buffer.
- `sector_pin_colors_json` (json): Palet warna marker pin berdasarkan dinas/sektor OPD penanggung jawab (PUPR, Kesehatan, Pendidikan, Perhubungan, Bappeda).
- `print_layout_config_json` (json): Konfigurasi template kop cetak peta executive Bupati & Bappeda (judul, subjudul, logo, arah mata angin, legend, orientasi kertas, format ekspor).

### B. Tabel `spatial_layers`
Menyimpan master data layer spasial administratif sekunder:
- `id` (bigint unsigned, auto-increment)
- `name` (string): Nama resmi layer (contoh: "Batas Sub-Wilayah Kecamatan").
- `type` (enum: `kabupaten`, `kecamatan`, `rtrw`): Kategori layer.
- `legal_basis` (string, nullable): Dasar hukum / regulasi (Perda / SK Bupati).
- `feature_count` (integer, default: 1): Jumlah poligon / entitas spasial.
- `color` (string, default: `#0284c7`): Kode warna heksadesimal layer.
- `visible` (boolean, default: true): Status aktif/tampil pada peta.
- `file_name` & `file_path` (string, nullable): Path file KMZ / GeoJSON.
- `geojson` (json, nullable): Payload fitur spasial mentah.
- `created_by` (string, nullable): Username / NIP pembuat.

---

## 2. API Endpoints

### A. Geo Settings (`/api/v1/geo-settings`)
- `GET /api/v1/geo-settings`: Publik/terproteksi membaca pengaturan aktif.
- `PUT /api/v1/geo-settings`: Admin berizin `manage_gis` memperbarui konfigurasi (mendukung pembaruan modular parsial melalui aturan validasi `sometimes`).

### B. Spatial Layers (`/api/v1/spatial-layers`)
- `GET /api/v1/spatial-layers`: Mengambil seluruh layer terdaftar terurut descending.
- `POST /api/v1/spatial-layers`: Mendaftarkan layer baru (Nama, Tipe, Dasar Hukum, Warna, dsb.).
- `PATCH /api/v1/spatial-layers/{id}/toggle`: Mengubah visibilitas layer (on/off).
- `DELETE /api/v1/spatial-layers/{id}`: Menghapus layer dari database.

---

## 3. Integrasi Frontend Halaman Dashboard Spasial

1. **Buffer Radius (`/dashboard/pengaturan-spasial/buffer-radius`)**:
   - Membaca `default_buffer_radius_meter`, `buffer_color`, `buffer_opacity` dari `geo_settings`.
   - Menyimpan pembaruan secara asinkron ke endpoint `PUT /geo-settings`.

2. **Pin Marker OPD (`/dashboard/pengaturan-spasial/pin-kategori`)**:
   - Membaca `sector_pin_colors_json` pada saat komponen dimuat (`useEffect`).
   - Menyimpan kustomisasi palet warna pin per dinas langsung ke database.

3. **Cetak Layout Peta Executive (`/dashboard/pengaturan-spasial/cetak-layout`)**:
   - Membaca dan menyimpan `print_layout_config_json` (kop peta, orientasi, elemen ornamen).

4. **Batas Administrasi & RTRW (`/dashboard/pengaturan-spasial/rtrw-batas`)**:
   - Master data layer sekunder kini dinamis terhubung ke `geoSettingService.getSpatialLayers()`.
   - Tombol tambah, toggle visibilitas, dan hapus layer langsung melakukan mutasi pada tabel `spatial_layers` di database.

---

## 4. Standardisasi API Client & Asset Storage

Seluruh referensi `http://localhost:8000` telah dihapus dari antarmuka frontend:
- Menggunakan `API_BASE_URL` dari `@/lib/apiClient` untuk endpoint REST API.
- Menggunakan `STORAGE_BASE_URL` dari `@/lib/apiClient` untuk lampiran file, avatar pejabat, dan gambar album lapangan.
- `authenticatedFetch` secara otomatis menyematkan base URL ketika diberikan path relatif (misal: `/pejabat`, `/profil/tentang`, `/spatial-layers`).

---

## 5. Perbaikan & Polish UI DocumentQuickMenu

Perbaikan menyeluruh pada bilah navigasi cepat kategori dokumen (`DocumentQuickMenu.tsx`):
- **Eradikasi Text Wrapping 3 Baris**: Mengganti teks panjang "Dokumen Publik Lainnya" yang terpotong menjadi "Lainnya" (`whitespace-nowrap`), sehingga seluruh 6 kategori rapi dalam 1 baris.
- **Ikon Spesifik per Kategori**: Mengganti 6 ikon buku identik menjadi ikon semantik Lucide yang spesifik (RKPD: `CalendarRange`, RTRW: `Map`, RPJPD: `Award`, RPJMD: `Briefcase`, LKPJ: `CheckCircle2`, Lainnya: `FolderArchive`).
- **Active Pill State Elegan**: Mengganti background kotak kaku dengan pill royal blue ber-rounded proporsional (`rounded-xl sm:rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30`), serasi dengan kurva container luar.
- **Layout Responsif Seimbang**: Desktop menampilkan 1 baris 6 kolom seimbang (`lg:grid-cols-6`), sedangkan mobile menampilkan grid 2 baris x 3 kolom yang simetris (`grid-cols-3`).

---

## 6. Standar Zoom Terjauh Peta (MinZoom & MaxBounds Locking)

Status implementasi: 8 September 2026.

Untuk menjamin peta selalu berfokus pada wilayah yurisdiksi Kabupaten Halmahera Utara dan mencegah pengguna melakukan zoom out berlebihan (yang dapat memperlihatkan seluruh peta dunia/pulau lain di luar konteks):

1. **Penguncian Zoom Terjauh (`minZoom: 8`)**:
   - Seluruh peta Leaflet di aplikasi (`EsriLeafletMap.tsx`, `GeotaggingMapPicker.tsx`, `basemap/page.tsx`) dikunci zoom minimumnya ke level zoom `fitBounds` resmi Halmahera Utara (`minZoom: 8`).
   - Pada `EsriLeafletMap.tsx`, fungsi `fitHalutBounds()` menghitung target zoom terluar berdasarkan batas resmi BPS/Kemendagri (`map.getBoundsZoom(bounds, false, L.point(35, 35))`) dan menguncinya via `map.setMinZoom(targetMinZoom)`.
   - Tile layer pada provider Esri, Google Maps, dan OpenStreetMap juga diberikan parameter `minZoom: 8` sehingga browser tidak melakukan request HTTP untuk tile zoom di bawah 8.

2. **Pembatasan Area Geser (`maxBounds`)**:
   - Batas geografis Halut diberikan padding aman `0.6` (`bounds.pad(0.6)`) dengan elastisitas `maxBoundsViscosity: 0.8`.
   - Peta dapat digeser secara leluasa di seluruh perairan dan daratan Halmahera Utara, namun akan kembali membal secara alami jika pengguna mencoba menggeser ke luar wilayah Maluku Utara.

3. **Indikator Tombol Zoom Out (`Minus`)**:
   - Tombol manual `-` (zoom out) mendeteksi level zoom aktif via event `zoomend`.
   - Ketika berada di level zoom terjauh (`currentZoom <= minZoomLevel`), tombol `-` otomatis dinonaktifkan (`disabled`), diberikan styling `opacity-30 cursor-not-allowed`, dan menampilkan tooltip informatif: *"Tampilan terjauh (Terkunci pada batas seluruh Halut)"*.

---

## 7. Standar Penghapusan Proyek Sektoral & Lampiran Teknis

Status implementasi: 20 September 2026.

### A. Titik Akses UI Penghapusan Proyek
1. **Daftar Proyek Fisik & Status Monev (`/dashboard/dokumen/[id]`)**:
   - Setiap kartu proyek kini dilengkapi tombol aksi hapus bersimbol tempat sampah (`Trash2`) merah (`bg-rose-50 text-rose-600 border border-rose-200`).
   - Setiap berkas lampiran teknis yang terunggah juga memiliki tombol hapus cepat per lampiran.
2. **Tabel Sinkronisasi Sektoral & Progres Monev (`/dashboard/update-progres`)**:
   - Kolom **Aksi Update** pada tabel data sektoral kini memiliki tombol hapus proyek (`Trash2`) di samping tombol "Edit Progres" dan "Re-sync ESRI".

### B. Alur Konfirmasi & Interaksi Pengguna
1. **SweetAlert2 Confirmation**:
   - Wajib menggunakan `showDeleteConfirm(projectName)` dari `@/lib/swal`.
   - Melarang penggunaan dialog browser bawaan `confirm()`.
2. **Cascade & Sinkronisasi 2-Way**:
   - Saat dikonfirmasi, frontend memanggil `proyekService.deleteProject(id)` -> `DELETE /api/v1/proyek-details/{id}`.
   - Backend Laravel secara otomatis:
     1. Menghapus berkas lampiran fisik dari penyimpanan `storage/app/public/proyek_attachments/{id}`.
     2. Mengirim request `deleteFeatures` ke endpoint ArcGIS REST API jika proyek memiliki `esri_objectid`.
     3. Menghapus rekaman data proyek dari tabel `proyek_details` MySQL.
3. **Feedback Notifikasi**:
   - Menampilkan `toast.success("Paket proyek/titik proyek berhasil dihapus!")` dan langsung memperbarui state daftar proyek secara lokal tanpa perlu refresh halaman.

---

## 8. Sinkronisasi Status ESRI Real-Time & Visualisasi Spasial Beranda Dinamis

Status implementasi: 21 September 2026.

### A. Penyelarasan Status Sinkronisasi ESRI (Synced vs Pending)
1. **Penyebab Status Pending Sebelumnya**:
   - Kolom `esri_sync_status` pada tabel `proyek_details` memiliki nilai default database `'pending'`.
   - Proses re-sync sebelumnya menggunakan `SyncEsriProjectJob::dispatch()` asinkron pada antrean database (`QUEUE_CONNECTION=database`), yang tidak otomatis tereksekusi tanpa worker queue daemon terdedikasi di server.
2. **Standardisasi Eksekusi Sinkron**:
   - Seluruh mutasi proyek (`store`, `updateProgres`, `resyncEsri`) kini menggunakan `SyncEsriProjectJob::dispatchSync()`.
   - `EsriGisService` secara otomatis memvalidasi apakah endpoint eksternal aktif (`isConfigured()`). Jika endpoint eksternal belum dikonfigurasi / dummy, database internal MySQL secara resmi dijadikan single source of truth spasial dan proyek otomatis berstatus `'synced'` dengan OBJECTID valid.
   - Migration `2026_09_20_000001_sync_existing_proyek_esri_status.php` menyinkronkan seluruh proyek lama yang memiliki `esri_objectid` menjadi `'synced'`.

### B. Pemulihan Tampilan Proyek Publik di Beranda (`GeospatialSection.tsx`)
1. **Eradikasi Filter Ketat Arsip Dokumen**:
   - Endpoint `GET /api/v1/proyek-details` kini menampilkan seluruh proyek spasial aktif tanpa menyaratkan dokumen induk berstatus `approved` arsip privat.
   - Proyek fisik dan titik koordinat publik tetap dapat ditampilkan di peta beranda, sementara berkas dokumen PDF induk tetap terlindungi dengan hak akses terverifikasi.
2. **Kalkulasi Statistik Wilayah Dinamis**:
   - Kartu kiri ringkasan wilayah tidak lagi menggunakan angka statis hardcoded (*"5 Lokasi Terverifikasi"*, *"Rp 27,75 Miliar"*).
   - Menghitung secara otomatis dari data nyata:
     - **Total Proyek**: `${locations.length} Lokasi Terverifikasi`.
     - **Total Pagu**: Penjumlahan nominal pagu anggaran (`pagu_anggaran`) terformat Rupiah Miliar / Juta secara otomatis.
     - **Wilayah**: Jumlah kecamatan unik yang terlibat proyek fisik.

---

## 9. Standar Penentuan Titik Koordinat & Input Manual Wilayah Administratif

Status implementasi: 21 September 2026.

### A. Alur Kerja Penentuan Titik Pin Peta (`GeotaggingProyekPage`)
1. **Penetapan Koordinat Murni via Klik Peta**:
   - Ketika pengguna mengklik atau menggeser pin lokasi pada "Peta Interaktif Penentuan Titik & Delineasi Tapak Proyek", sistem hanya mengabadikan nilai `latitude` dan `longitude`.
   - Sistem **TIDAK** lagi melakukan overwrite otomatis pada kolom *Kecamatan (Kab. Halut)* dan *Desa / Kelurahan*.
2. **Pengisian Manual Wilayah Administratif**:
   - Pengguna bebas memilih Kecamatan dan Desa/Kelurahan secara manual menggunakan komponen `SearchableSelect`.
   - Pemilihan Kecamatan dan Desa manual tidak akan mengubah atau mereset koordinat titik pin presisi yang sebelumnya telah dipilih pengguna di peta.
   - Jika pengguna memilih Kecamatan atau Desa sebelum menentukan pin peta, peta tetap membantu dengan memusatkan tampilan ke koordinat default wilayah terkait.
3. **Reset State Pasca-Simpan**:
   - Setelah proyek berhasil disimpan, seluruh field termasuk koordinat, pagu anggaran, nama proyek, kecamatan, dan desa direset secara bersih untuk persiapan entri paket berikutnya.

---

## 10. Standar Cascade Deletion Dokumen Induk & Pembersihan Proyek, Progres, Lampiran, dan ESRI ArcGIS

Status implementasi: 21 September 2026.

### A. Latar Belakang & Persyaratan
Ketika sebuah dokumen perencanaan induk (RPJPD, RPJMD, RKPD, Renstra, Renja, DIK Sektoral) dihapus secara permanen dari repositori, seluruh entitas turunannya tidak boleh tertinggal (*orphaned records / orphaned files*) baik pada database, sistem berkas lokal/publik, maupun layanan cloud GIS.

### B. Cakupan Cascade Deletion
Penghapusan permanen (`DELETE /api/v1/documents/{id}?permanent=1`) mengeksekusi pembersihan menyeluruh dalam satu transaksi atomik database (`DB::transaction`):

1. **Tagging Proyek Fisik (`proyek_details`)**:
   - Seluruh titik geotagging proyek yang terikat dengan `document_id` dokumen induk dihapus dari database.
2. **Data Progres & Monev Keuangan**:
   - Pagu anggaran (`pagu_anggaran`), realisasi keuangan (`realisasi_anggaran`), persentase progres (`persentase_progres`), dan status pelaksanaan (`status_progres`) terhapus bersama entitas proyek.
3. **Lampiran Teknis & Berkas Fisik (`proyek_attachments`)**:
   - Berkas fisik pada storage (`storage/app/public/proyek_attachments/{proyek_id}/...`) dihapus dari disk penyimpanan fisik.
   - Folder direktori `proyek_attachments/{proyek_id}` dibersihkan secara rekursif (`deleteDirectory`).
   - Record lampiran pada tabel `proyek_attachments` dihapus.
4. **Sinkronisasi Penghapusan Feature ESRI ArcGIS**:
   - Jika proyek memiliki `esri_objectid`, sistem secara otomatis memanggil `EsriGisService::deleteFeature(objectId)` untuk menghapus feature dari ArcGIS Feature Service, mencegah munculnya titik mati/hantu di ArcGIS Online atau portal WebGIS.
5. **Analisis Geoprocessing Spasial (`geoprocessing_analyses`)**:
   - Seluruh buffer zone dan delineasi spasial terkait `proyek_detail_id` dihapus.
6. **Versi Berkas & Log Dokumen Induk**:
   - Berkas PDF dokumen utama dan seluruh versinya (`document_versions`) dihapus dari disk privat lokal.
   - Seluruh riwayat log (`approvalLogs`, `viewLogs`, `accessGrants`, `downloadLogs`) dihapus bersih sebelum penghapusan record dokumen.

### C. Proteksi & Antarmuka UI (SweetAlert2)
- **Legal Hold**: Jika dokumen berstatus `legal_hold = true`, penghapusan permanen otomatis dibatalkan dan mengembalikan HTTP 422 untuk kepatuhan regulasi audit.
- **Konfirmasi Dialog**: Terdapat konfirmasi interaktif SweetAlert2 (`showDeleteConfirm`) yang secara eksplisit memperingatkan pengguna bahwa seluruh tagging proyek fisik, data progres monev, lampiran teknis, dan titik GIS akan ikut terhapus permanen.
- **Dua Aksi Terpisah**:
  - **Arsipkan** (`Archive` icon): Menarik dokumen dari publikasi tetapi mempertahankan versi, hash sha256, dan riwayat audit.
  - **Hapus Permanen** (`Trash2` icon): Menghapus total dokumen induk beserta seluruh data turunan proyek dan lampiran.

---

## 11. Standar Filter Publikasi Proyek Halaman Beranda (100% Progres Sektoral Selesai)

Status implementasi: 21 September 2026.

### A. Latar Belakang & Persyaratan Bisnis
Halaman beranda portal publik BAPPEDA Kabupaten Halmahera Utara difokuskan untuk menyajikan capaian hasil pembangunan daerah yang telah terealisasi penuh (selesai 100%). Proyek yang masih dalam tahap awal (`belum_mulai`), proses tender, atau masih dalam pengerjaan konstruksi menengah (`dalam_proses` < 100%) tetap tersimpan dan dapat dipantau pada modul internal Monev (`/dashboard/update-progres`) atau peta spasial lengkap (`/gis-peta`), namun tidak ditampilkan pada halaman muka beranda.

### B. Implementasi Backend & API Endpoint
1. **Filter Fleksibel `status_progres` pada `ProyekDetailController.php`**:
   - Parameter `status_progres=selesai` atau `status_progres=100` memfilter query database:
     ```php
     $query->where(function ($q) {
         $q->where('status_progres', 'selesai')
           ->orWhere('persentase_progres', '>=', 100);
     });
     ```
   - Mendukung juga parameter boolean `only_completed=1` atau `min_progress=100`.

### C. Integrasi Frontend `GeospatialSection.tsx`
1. **Multi-layer Filtering (Server-side & Client-side)**:
   - Memanggil `proyekService.getProjects(undefined, undefined, false, "selesai")`.
   - Melakukan validasi protektif client-side:
     ```typescript
     const completedOnly = (projects || []).filter(
       (p) => Number(p.persentase_progres) === 100 || p.status_progres === "selesai"
     );
     ```
2. **Sinkronisasi Metrik Ringkasan Wilayah**:
   - **Total Proyek**: Menghitung secara eksklusif jumlah lokasi proyek yang telah selesai 100%.
   - **Total Pagu**: Akumulasi pagu anggaran hanya dari proyek yang selesai 100%.
   - **Sebaran Wilayah**: Daftar kecamatan dihitung dari lokasi proyek yang 100% selesai.
   - **Marker Peta Spasial & Daftar Kanan**: Hanya merender titik marker dan item direktori proyek selesai 100%.

---

## 12. Resolusi Bug Simpan Progres Sektoral (`/dashboard/update-progres`)

Status implementasi: 21 September 2026.

### A. Akar Penyebab Masalah (Root Cause)
1. **PHP Runtime Error (`Undefined variable $actor`)**:
   - Pada `ProyekDetailController@updateProgres`, terdapat deklarasi variabel redundan `$updateData['updated_by'] = $actor->name;` di mana `$actor` belum didefinisikan sebelumnya (sebelumnya hanya memanggil `$request->user()->name`).
   - Pada PHP 8.2+, pemanggilan properti pada variabel yang belum dideklarasikan memicu `Fatal Error: Undefined variable $actor`, sehingga server Laravel merespons dengan HTTP Status 500.
2. **Generic Error Message di Frontend**:
   - Fungsi `proyekService.updateProgress` melempar pesan generic tanpa mengekstrak detail response JSON backend saat status HTTP bukan 200.
   - Komponen halaman `update-progres/page.tsx` menampilkan pesan fallback "Terjadi kesalahan saat memperbarui progres ke server" tanpa meneruskan pesan error sesungguhnya.

### B. Solusi Teknis & Pencegahan (Regression Protection)
1. **Perbaikan Backend (`ProyekDetailController.php`)**:
   - Mendefinisikan `$actor = $request->user();` secara aman di awal alur validasi.
   - Menggunakan operator null-safe: `'updated_by' => $actor?->name ?? 'Admin'`.
   - Mengisolasi pemanggilan `SyncEsriProjectJob::dispatchSync` di dalam blok `try-catch` terproteksi, sehingga apabila sinkronisasi eksternal ArcGIS mengalami timeout atau hambatan jaringan, data progres dan realisasi anggaran proyek di MySQL tetap tersimpan 100% aman dan mengembalikan HTTP 200 ke klien.
2. **Peningkatan Error Handling Frontend**:
   - `proyekService.ts`: Mengurai `errData?.message` dari backend saat request gagal untuk transparansi pelaporan.
   - `update-progres/page.tsx`: Meneruskan `err?.message` langsung ke SweetAlert2 dan toast notification.
3. **Automated Feature Test**:
   - Menambahkan test komprehensif pada `backend/tests/Feature/ProyekDetailProgressTest.php` mencakup pembaruan progres oleh Superadmin, mutasi database `proyek_details`, otorisasi admin bidang, serta isolasi pemblokiran lintas bidang (HTTP 403). Seluruh test lulus 100%.

---

## 13. Standarisasi Direktori Lokasi Proyek & Filter Kategori Dinamis (`GeospatialSection.tsx`)

Status implementasi: 21 September 2026.

### A. Latar Belakang & Persoalan
Pada komponen beranda `GeospatialSection`:
- Filter kategori sebelumnya selalu menginisialisasi pill `[{ name: "Semua", ... }]` secara statis, sehingga ketika database belum memiliki lokasi proyek fisik berstatus selesai (100%), tombol pill "Semua" tetap muncul sendirian di atas kotak kosong.
- Pesan status saat data kosong bersifat generik ("Tidak ada lokasi proyek yang sesuai"), tidak membedakan antara kondisi memang belum ada proyek selesai vs kondisi filter pencarian tidak menemukan hasil.

### B. Solusi & Perbaikan Tampilan
1. **Peniadaan Label Kategori Saat Data Kosong**:
   - Jika `locations.length === 0`, fungsi memoization `categories` mengembalikan array kosong `[]`.
   - Wadah pill kategori tidak dirender sama sekali di antarmuka jika tidak ada data proyek yang tersedia.
   - Bilah pencarian (search bar) disembunyikan saat data kosong agar antarmuka tetap bersih dan rapi.
2. **Pelabelan Kategori Informatif (Count Badge)**:
   - Jika terdapat lebih dari 1 kategori data, label menampilkan jumlah item secara transparan, misal: `Semua (5)`, `Infrastruktur (3)`, `Pemerintahan (2)`.
   - Tombol `Semua` hanya disertakan jika terdapat lebih dari 1 kategori unik yang terdata.
3. **Penyempurnaan Empty State Box**:
   - **Kondisi Belum Ada Proyek Selesai**: Menampilkan ikon peta interaktif dengan teks deskriptif: *"Belum Ada Proyek Selesai - Lokasi proyek fisik pembangunan dengan progres 100% (selesai) akan terdata otomatis pada daftar ini."*
   - **Kondisi Pencarian / Filter Tidak Cocok**: Menampilkan ikon pencarian dengan pesan spesifik *"Lokasi Tidak Ditemukan - Tidak ada proyek yang sesuai dengan pencarian [keyword] pada kategori [kategori]"* beserta tombol *Reset Pencarian*.
