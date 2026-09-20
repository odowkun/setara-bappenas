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
   - Diletakkan di `frontend/src/components/home/GeospatialSection.tsx` tepat sebelum kartu `dalev` pengumuman resmi.
   - Memiliki styling bento-grid / carousel responsif dengan badge kategori, tombol zoom, dan pintasan menuju galeri lengkap.

2. **Halaman Publik**:
   - `frontend/src/app/infografis/page.tsx`
   - Menggunakan Glassmorphism & palet Bappeda (Navy `#0A192F`, Biru `#1E3A8A`, Emas `#F59E0B`).
   - Modal Lightbox resolusi penuh tanpa distorsi rasio aspek.

3. **Menu Navigasi**:
   - `frontend/src/components/layout/Navbar.tsx`
   - Menu desktop & mobile di bawah dropdown **Berita & Agenda > Infografis Pembangunan**.

4. **Halaman Dashboard**:
   - `frontend/src/app/dashboard/infografis/page.tsx`
   - Menerapkan standar layout dashboard: `w-full space-y-6 font-sans pb-12`.
   - Menggunakan `@/lib/swal` untuk notifikasi Toast dan konfirmasi hapus (`showDeleteConfirm`).
   - Menggunakan komponen custom `SearchableSelect` dengan dukungan *creatable*: admin dapat memilih kategori/badge yang tersedia, atau mengetikkan kategori baru secara dinamis jika belum terdaftar.
   - Pola yang sama diterapkan pada dashboard Teks Berjalan (`frontend/src/app/dashboard/running-text/page.tsx`).
