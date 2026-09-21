# Dokumentasi Modul Infografis Pembangunan Daerah

## 1. Ikhtisar (Overview)
Modul **Infografis Pembangunan** dirancang untuk menyajikan data visual, ringkasan statistik capaian, dan indikator strategis pembangunan Kabupaten Halmahera Utara kepada publik secara interaktif, modern, dan mudah dipahami.

Fitur ini terdiri dari 3 pilar utama:
1. **Homepage 5 Pinned Infographics (`PinnedInfographicsSection`)**: 
   - Ditampilkan tepat di atas kartu pengumuman resmi (*pinned announcement card*) pada beranda.
   - Menampilkan maksimal 5 infografis unggulan yang di-pin oleh admin secara langsung tanpa baris header teks terpisah (tampilan minimalis & elegan).
   - Dilengkapi counter impresi dinamis (`{viewCount} dilihat`) yang otomatis bertambah saat pengguna mengklik dan membuka infografis.
   - Dilengkapi fitur interaktif Lightbox (pembesaran gambar resolusi tinggi) & tombol unduh langsung HD.
2. **Halaman Galeri Publik (`/infografis`)**:
   - Dapat diakses melalui navigasi dropdown **Berita & Agenda > Infografis Pembangunan**.
   - Menyediakan filter kategori visual (Semua, Statistik & Capaian, Perekonomian & Fiskal, Spasial & Wilayah, Sosial & SDM, Regulasi & Rencana).
   - Pencarian real-time berdasarkan judul/deskripsi.
   - Counter impresi dinamis terintegrasi (`recordView` via `GET /api/v1/infografis/{id}` yang otomatis memicu `$infografis->increment('view_count')` di database server).
   - Modal Lightbox interaktif lengkap dengan unduhan gambar HD dan tombol bagikan tautan.
3. **Manajemen Dinamis di Dashboard Admin (`/dashboard/infografis`)**:
   - Terintegrasi di menu sidebar admin: **Media, Pengumuman & Agenda > Infografis Daerah**.
   - CRUD lengkap (Tambah, Edit, Hapus dengan konfirmasi SweetAlert2).
   - Toggle instan status Publish dan Pin (dengan proteksi batas maksimal 5 infografis ter-pin).
   - Upload media terintegrasi dengan pipeline optimasi WebP/thumbnail.

---

## 2. Struktur Basis Data (Database Schema)

Tabel: `infografis`
Migration: `backend/database/migrations/2026_09_21_000003_create_infografis_table.php`

| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | Primary Key |
| `title` | `VARCHAR(255)` | Judul infografis |
| `slug` | `VARCHAR(255) UNIQUE` | URL slug ramah SEO |
| `category` | `VARCHAR(100)` | Kategori tematik (misal: Perekonomian & Investasi, Sosial, Tata Ruang) |
| `image_url` | `VARCHAR(500)` | URL file gambar resolusi tinggi |
| `thumbnail_url` | `VARCHAR(500) NULL` | URL thumbnail teroptimasi |
| `description` | `TEXT NULL` | Penjelasan ringkas konteks data/infografis |
| `source_agency` | `VARCHAR(255) NULL` | Sumber data resmi (misal: BPS / Bappeda Halut) |
| `is_pinned` | `BOOLEAN DEFAULT FALSE` | Flag infografis ter-pin di homepage (maksimal 5 item aktif) |
| `is_published` | `BOOLEAN DEFAULT TRUE` | Flag status rilis publik |
| `order_index` | `INT DEFAULT 0` | Urutan visual tampilan |
| `views_count` | `INT UNSIGNED DEFAULT 0` | Penghitung impresi tayangan |
| `created_at` / `updated_at` | `TIMESTAMP` | Timestamps audit Laravel |

---

## 3. Spesifikasi API (Backend Endpoints)

Controller: `App\Http\Controllers\Api\InfografisController`

### Publik
- `GET /api/v1/infografis`
  - Parameter Query: `pinned=1` (khusus 5 infografis ter-pin), `category=...`, `search=...`, `limit=...`
  - Response: Daftar infografis dengan status `is_published = true`.
- `GET /api/v1/infografis/{id_or_slug}`
  - Detail infografis publik dan penambahan otomatis `views_count`.

### Admin (Memerlukan Autentikasi Sanctum & Hak Akses `manage_berita`)
- `GET /api/v1/admin/infografis`
  - Mengambil seluruh daftar infografis (termasuk draft/unpublished) untuk tabel admin.
- `POST /api/v1/admin/infografis`
  - Menyimpan data infografis baru.
- `PUT /api/v1/admin/infografis/{id}`
  - Memperbarui data infografis.
- `PATCH /api/v1/admin/infografis/{id}/pin`
  - Mengubah status pin. Terdapat validasi ketat: jika sudah ada 5 infografis ter-pin dan mencoba menambah pin baru, sistem akan mengembalikan status 422 Unprocessable Entity.
- `PATCH /api/v1/admin/infografis/{id}/publish`
  - Mengubah status publikasi secara cepat.
- `DELETE /api/v1/admin/infografis/{id}`
  - Menghapus rekaman infografis.

---

## 4. Implementasi Frontend

1. **Komponen Pinned Homepage**:
   - `frontend/src/components/home/PinnedInfographicsSection.tsx`
   - Diletakkan di `frontend/src/components/home/GeospatialSection.tsx` tepat sebelum kartu pengumuman resmi.
   - Menampilkan poster infografis murni (*pure image poster*) tanpa blok teks deskripsi di kartu.
   - Dilengkapi tombol overlay hover zoom dan modal Lightbox interaktif dengan kontrol pembesaran bertahap (100% - 300%) & unduhan gambar HD.

2. **Halaman Galeri Publik**:
   - `frontend/src/app/infografis/page.tsx`
   - Menampilkan kartu infografis murni berupa gambar poster resolusi tinggi (bebas dari teks judul/deskripsi di bawah kartu agar visual fokus dan bersih).
   - Dilengkapi interaktivitas klik untuk memperbesar (*zoom-in*), navigasi pan/scroll saat perbesaran aktif, persentase zoom (100%–300%), reset ukuran, dan tombol unduh HD.

3. **Menu Navigasi**:
   - `frontend/src/components/layout/Navbar.tsx`
   - Menu desktop & mobile di bawah dropdown **Berita & Agenda > Infografis Pembangunan**.

4. **Halaman Dashboard**:
   - `frontend/src/app/dashboard/infografis/page.tsx`
   - Menerapkan standar layout dashboard: `w-full space-y-6 font-sans pb-12`.
   - Menggunakan `@/lib/swal` untuk notifikasi Toast dan konfirmasi hapus (`showDeleteConfirm`).
   - Menggunakan komponen custom `SearchableSelect` dengan dukungan *creatable*: admin dapat memilih kategori/badge yang tersedia, atau mengetikkan kategori baru secara dinamis jika belum terdaftar.
   - Pola yang sama diterapkan pada dashboard Teks Berjalan (`frontend/src/app/dashboard/running-text/page.tsx`).

5. **Optimasi Responsif Mobile (Mobile Snap Carousel & 2-Column Grid)**:
   - **Homepage Snap Carousel (`PinnedInfographicsSection.tsx`)**:
     - Menggantikan tumpukan 1 kolom vertikal yang berukuran terlalu raksasa di layar ponsel dengan **Horizontal Snap Carousel** yang elegan.
     - Kartu mobile berukuran proporsional (`w-[72vw] max-w-[270px] aspect-[4/5]`) dengan efek *peek* (kartu berikutnya tampak sebagian di sisi kanan untuk memancing gestur swipe).
     - Dilengkapi header mini dengan slide counter dinamis (`1 / 5`), tombol panah geser navigasi (Prev / Next), dan titik pagination (*dots*) interaktif.
     - Menggunakan React `createPortal(..., document.body)` untuk modal Lightbox HD agar tidak terhalang batas container maupun bilah navigasi bawah (*floating dock*).
   - **Halaman Katalog (`/infografis`)**:
     - Ditata menjadi 2 kolom rapi di mobile (`grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6`) dengan badge dan tombol perbesar yang proporsional.

---

## 6. Resolusi Kesalahan Payload Unggah Gambar Infografis (`Dual-Variant Optimization URL Mapping`)

Status pembaruan: 21 September 2026.

### A. Akar Penyebab Masalah (Root Cause)
1. **Ketidaksesuaian Kontrak JSON Response**:
   - Endpoint `POST /api/v1/media/upload-optimized` mengembalikan payload dengan kunci `data.web_url`, `data.master_url`, dan `data.thumb_url` sebagai bagian dari pipeline Dual-Variant Optimization (Master HD + WebP/AVIF Web).
   - Pada `frontend/src/services/infografisService.ts` method `uploadImage` dan `heroVideoService.ts` method `uploadFile`, pengecekan dilakukan secara restriktif menggunakan kondisi:
     ```typescript
     if (res.ok && json.data?.url)
     ```
   - Karena kunci `url` tidak ada di tingkat pertama `data` (hanya ada `web_url` dan `master_url`), ekspresi kondisi bernilai `false`.
2. **Efek Paradoks Pesan Sukses Ditampilkan sebagai Error**:
   - Fungsi service menganggap unggahan gagal dan mengembalikan `{ success: false, message: json.message }`.
   - `json.message` berisi teks sukses resmi dari server: `"Media berhasil diunggah dengan Dual-Variant Optimization (Master HD + WebP/AVIF Web)"`.
   - Halaman `dashboard/infografis/page.tsx` memanggil `toast.error(res.message)`, sehingga memunculkan toast merah berlambang tanda silang (X) yang menampilkan teks pesan sukses unggahan, dan mencegah URL gambar terisi ke dalam form.

### B. Solusi Teknis & Resolusi Menyeluruh
1. **Penyelarasan Backend (`MediaController.php`)**:
   - Menambahkan field `'url' => $webUrl ?: $masterUrl` ke dalam array response `data` untuk menjamin kompatibilitas backward dengan klien yang mengekspektasikan kunci generik `url`.
2. **Penyelarasan Frontend Client (`infografisService.ts` & `heroVideoService.ts`)**:
   - Mengambil URL gambar dengan fallback berjenjang:
     ```typescript
     const fileUrl = json.data?.web_url || json.data?.url || json.data?.master_url;
     if (res.ok && fileUrl) {
       return { success: true, url: fileUrl };
     }
     ```
   - Memastikan form dashboard menerima URL WebP teroptimasi dan menampilkan toast sukses hijau (`toast.success("Gambar infografis berhasil diunggah!")`).
3. **Automated Feature Test**:
   - Menambahkan unit/feature test `backend/tests/Feature/MediaAndInfografisTest.php` untuk memvalidasi endpoint `/media/upload-optimized`, `POST /admin/infografis`, dan `PUT /admin/infografis/{id}`. Seluruh test lulus 100%.
