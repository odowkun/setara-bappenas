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

## 3. Fitur Preview Isian KMZ & Inspeksi Placemark (Terbaru)
Pada pembaruan ini, seluruh proses unggah file spasial (`.kmz`, `.kml`, `.geojson`, `.json`) dilengkapi dengan **Preview Isian Spasial Real-Time**:
1. **Multi-Format Parsing Langsung di Browser**:
   - Mendukung `.kmz` (arsip zip KML), `.kml` (dokumen XML Google Earth), serta `.geojson` dan `.json` (Ina-Geoportal, QGIS, ArcGIS).
   - Mengurai koordinat poligon, garis, dan titik secara otomatis ke proyeksi WGS84 (EPSG:4326).
2. **Komponen Preview (`KmzFeaturePreview` & `KmzMiniMapPreview`)**:
   - **Tab 1: Preview Peta Interaktif**: Mini map Leaflet dengan switch basemap (Satelit Esri vs OpenStreetMap/Carto) yang langsung menayangkan geometri hasil urai dengan warna layer yang dipilih, lengkap dengan popup informasi dan tooltip nama placemark.
   - **Tab 2: Isian Placemark & Fitur**: Menampilkan daftar seluruh objek spasial dengan badge tipe geometri (`Polygon`, `LineString`, `Point`), estimasi luas (Ha) / panjang (km), serta filter pencarian instan nama objek.
   - **Tab 3: Tabel Atribut Lengkap**: Menampilkan tabel properti KML `ExtendedData` / tag HTML yang telah diekstrak secara otomatis menjadi pasangan kunci-nilai (key-value), serta tombol salin format GeoJSON.
   - **Inspeksi Layer Tersimpan**: Pada kolom master data layer aktif, tersedia tombol aksi *Eye* untuk menginspeksi kembali peta dan data dari setiap layer spasial yang telah tersimpan di database.

## 4. Alur Penggunaan
1. Buka menu **Dashboard $\rightarrow$ Pengaturan Spasial $\rightarrow$ Batas Administrasi & RTRW** (`/dashboard/pengaturan-spasial/rtrw-batas`).
2. Di seksi **Unggah Layer Spasial Sub-Wilayah / RTRW**:
   - Pilih atau drag file `.kmz`, `.kml`, atau `.geojson`.
   - Sistem seketika mengurai file dan menampilkan kartu **Preview Isian KMZ** (Peta mini interaktif, daftar placemark, dan tabel atribut).
   - Nama layer spasial otomatis terisi cerdas dari nama file jika belum diisi.
3. Klik **+ Simpan Layer Spasial Tambahan** untuk menyimpan data spasial dan GeoJSON ke database server.
4. Di seksi **Garis Batas Utama Kabupaten Halmahera Utara**, file KMZ batas resmi juga dapat diinspeksi isian placemark-nya sebelum disinkronkan ke database.
5. Untuk mengembalikan batas kabupaten ke standar BPS, gunakan tombol **Reset ke Default BPS** dengan konfirmasi SweetAlert2.

