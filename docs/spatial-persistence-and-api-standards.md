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

