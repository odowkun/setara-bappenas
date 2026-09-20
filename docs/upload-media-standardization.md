# Standarisasi Dropzone Upload Media & Auto-Scroll Regulasi

Status implementasi: 20 September 2026.

Dokumen ini mencatat standarisasi visual dan interaksi formulir unggah media (berkas PDF, foto, dan video) di seluruh panel dashboard admin BAPPEDA Halmahera Utara agar seragam dengan standar estetika **Dokumen Perencanaan**, serta penambahan fitur interaksi auto-scroll pada halaman Editor Dasar Hukum.

---

## 1. Latar Belakang & Masalah

Sebelumnya, beberapa modul dashboard menggunakan antarmuka upload berkas yang tidak seragam:
1. **Dasar Hukum & Regulasi**: Menggunakan inline bar kecil dengan tombol "Unggah PDF" yang belum terhubung ke upload chunk server dan tidak memiliki dropzone drag-and-drop. Tombol "Tambah Regulasi" juga tidak melakukan scroll ke card baru yang ditambahkan di bagian bawah.
2. **Pengumuman (Tambah & Edit)**: Menggunakan inline bar sempit dengan ikon monokrom kecil.
3. **Galeri Dokumentasi (Tambah & Edit)**: Menggunakan dropzone dengan ikon flat standar tanpa efek luminous gradient container dan badge extension pills.
4. **Layout Container**: Sebagian halaman masih menggunakan `max-w-[1400px] mx-auto` yang bertentangan dengan *Dashboard Container Spacing & Alignment Standard* (`w-full space-y-6 font-sans pb-12`).

---

## 2. Fitur & Perubahan yang Diterapkan

### A. Editor Dasar Hukum & Regulasi (`frontend/src/app/dashboard/profil/dasar-hukum/page.tsx`)

1. **Auto-Scroll ke Card Regulasi Baru**:
   - Setiap card memiliki target ID dinamis `regulasi-card-${idx}`.
   - Saat tombol **"Tambah Regulasi"** ditekan, fungsi `handleAddRegulasi` otomatis menjalankan `scrollIntoView({ behavior: "smooth", block: "center" })` dan memfokuskan input judul peraturan baru secara otomatis.
2. **Unggah Dokumen PDF Resmi dengan Watermark**:
   - Terhubung langsung ke endpoint `/documents/upload-chunk` yang memproses berkas PDF ke storage dan menerapkan watermark resmi BAPPEDA HALUT.
   - Dilengkapi dropzone interaktif drag-and-drop dengan glow accent dan badge pill *"Hanya Menerima Dokumen PDF (*.pdf)"*.
   - Saat terunggah, menampilkan kartu dokumen lengkap dengan nama berkas, badge status watermark terverifikasi, tombol **Buka PDF**, **Ganti PDF**, dan **Hapus**.
3. **Layout**: Container diperbarui ke `w-full space-y-6 font-sans pb-12`.

### B. Pengumuman Resmi (`frontend/src/app/dashboard/pengumuman/tambah/page.tsx` & `edit/[id]/page.tsx`)

1. **Dropzone Standar Dokumen Perencanaan**:
   - Area drag-and-drop responsif dengan gradient icon container `from-blue-700 to-indigo-600`, shadow glow biru, dan border dashed interaktif.
   - Extension badges multi-format: **PDF**, **DOCX**, **JPG / PNG**, dan **MP4 / WEBM**.
2. **Selected File Card**:
   - Menampilkan ikon spesifik sesuai tipe berkas (`FileText`, `ImageIcon`, atau `Video`), label ekstensi, tombol buka berkas, ganti berkas, dan hapus.
3. **Layout**: Container diperbarui ke `w-full space-y-6 font-sans pb-12`.

### C. Galeri Dokumentasi (`frontend/src/app/dashboard/galeri/tambah/page.tsx` & `edit/[id]/page.tsx`)

1. **Visual Upgrade Dropzone**:
   - Mengadopsi gradient icon container `w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600` dengan ikon awan unggah (`UploadCloud`).
   - Penambahan extension pills berwarna untuk format media foto dan video: **JPG**, **PNG**, **WEBP**, **MP4 / WEBM**.
   - Indikator proses unggah dengan spinner `Loader2` dan teks informatif.
2. **Layout**: Container diperbarui ke `w-full space-y-6 font-sans pb-12`.

### D. Upload Lampiran Teknis (`frontend/src/app/dashboard/lampiran-teknis/page.tsx`)

1. **Dropzone Elevation**:
   - Peningkatan estetika dropzone dengan gradient icon container dan extension pills (PDF, DED / AMDAL, JPG / PNG).
   - Mendukung multi-file drag-and-drop dan kompresi gambar otomatis di sisi klien.

---

## 3. Matriks Konsistensi Komponen Upload

| Halaman | Tipe Berkas | Drag & Drop | Gradient Icon Container | Extension Pills | Watermark / Status Badge |
|---|---|---|---|---|---|
| **Dokumen Perencanaan** | PDF | Ya | Ya (`blue-700` → `indigo-600`) | Ya | Ya (Watermark Resmi) |
| **Dasar Hukum & Regulasi** | PDF | Ya | Ya (`blue-700` → `indigo-600`) | Ya | Ya (Watermark Terverifikasi) |
| **Pengumuman (Tambah/Edit)** | PDF, Dokumen, Foto, Video | Ya | Ya (`blue-700` → `indigo-600`) | Ya | Ya (Berkas Siap / Terlampir) |
| **Galeri (Tambah/Edit)** | Foto, Video | Ya | Ya (`blue-700` → `indigo-600`) | Ya | Ya (Cover Badge & Preview) |
| **Lampiran Teknis Spasial** | PDF, DED, Foto | Ya | Ya (`blue-700` → `indigo-600`) | Ya | Ya (Auto Compression) |

---

## 4. Verifikasi & Build

- Pengujian kompilasi Next.js produksi: `npm run build` dijalankan dan selesai tanpa error (`Compiled successfully`, 63/63 halaman static/dynamic lulus tanpa linting/type warning).
