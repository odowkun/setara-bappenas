# Dokumentasi Fitur Manajemen Batas Spasial Kabupaten (.KMZ / .KML) & Sinkronisasi Database

## 1. Ringkasan
Fitur ini memungkinkan Administrator BAPPEDA Halmahera Utara untuk mengunggah dan mengganti garis batas resmi wilayah kabupaten menggunakan file spasial kustom (`.kmz`, `.kml`, atau `.geojson`), misalnya hasil pemetaan definitif BIG/BPN atau pembaruan Perda RTRW terbaru. Sistem juga menyediakan mekanisme reset aman satu-klik untuk mengembalikan garis batas ke standar resmi bawaan BPS (Permendagri No. 137 Tahun 2017).

## 2. Arsitektur & Sinkronisasi Database
Sistem menggunakan pendekatan **Persistent Server-Side (Option A)**:
1. **Frontend Parsing**:
   - Komponen `KmzUploader` (`src/components/gis/KmzUploader.tsx`) mengekstrak file `.kmz` menggunakan `JSZip` dan mengurai dokumen `.kml` menggunakan `@tmcw/togeojson` secara langsung di browser tanpa membebani backend.
   - Menghitung statistik spasial: total fitur, jumlah poligon, serta estimasi luas wilayah (Hektare) dan panjang koridor (Km).
2. **Backend Persistensi**:
   - Tabel `geo_settings` diperluas dengan kolom:
     - `custom_boundary_name`: Nama file asli yang diunggah.
     - `custom_boundary_path`: Path penyimpanan file GeoJSON kustom di storage (`spasial/custom_halut_boundary.geojson`).
     - `custom_boundary_geojson`: Salinan GeoJSON FeatureCollection kustom untuk serving instan.
     - `custom_boundary_features_count`: Jumlah geometri objek spasial.
     - `custom_boundary_area_ha`: Luas area terhitung dalam Hektare.
     - `custom_boundary_length_km`: Panjang keliling/koridor terhitung dalam Km.
     - `custom_boundary_color`: Warna garis batas (default `#ef4444`).
     - `custom_boundary_uploaded_at`: Waktu unggah.
3. **API Endpoints**:
   - `GET /api/v1/geo-settings`: Mengambil status aktif dan data batas kustom jika ada.
   - `POST /api/v1/geo-settings/boundary`: Menyimpan file/GeoJSON batas kustom baru.
   - `DELETE /api/v1/geo-settings/boundary`: Menghapus batas kustom dan mereset ke default bawaan BPS.
4. **Visualisasi Peta (Fail-Safe Fallback)**:
   - Komponen `GeotaggingMapPicker` dan `EsriLeafletMap` mendukung prop `customBoundaryGeoJson`.
   - Jika batas kustom aktif di database, peta menayangkan poligon kustom tersebut.
   - Jika batas kustom di-reset (`null`), peta secara otomatis kembali ke poligon bawaan resmi di `src/data/halut-boundary.json`.

## 3. Alur Penggunaan
1. Buka menu **Dashboard $\rightarrow$ Pengaturan Spasial $\rightarrow$ Batas Administrasi & RTRW** (`/dashboard/pengaturan-spasial/rtrw-batas`).
2. Di seksi **Garis Batas Utama Kabupaten Halmahera Utara**, pilih file `.kmz` atau `.kml` pada area upload.
3. Sistem mengurai file dan menampilkan ringkasan data spasial.
4. Klik **Simpan & Sinkronkan Batas Resmi** untuk menyimpan ke database. Seluruh peta WebGIS publik dan dashboard akan langsung menggunakan batas ini.
5. Untuk mengembalikan ke batas bawaan, klik tombol **Reset ke Default BPS** dengan konfirmasi dialog SweetAlert2.
