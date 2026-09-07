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
