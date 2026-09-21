# Dokumentasi Fitur Kritik, Saran & Transparansi Tanggapan BAPPEDA

## 1. Ringkasan Perubahan & Fitur Terbaru

### A. Pembatasan Tinggi & Scroll Halus Halaman Publik (`/kritik-saran`)
1. **Urutan Terbaru di Atas**:
   - Seluruh masukan publik diurutkan secara descending (`latest` / `created_at` DESC) sehingga aspirasi warga paling baru selalu berada di baris pertama.
2. **Kontainer Maksimal Tinggi ~3 Card dengan Scroll & Isolasi Lenis Smooth Scroll**:
   - Untuk mencegah halaman menjadi terlalu panjang saat jumlah masukan bertambah, kontainer feed dibatasi setinggi ~3 kartu (`max-h-[650px] sm:max-h-[720px] overflow-y-auto`).
   - Dilengkapi notifikasi panduan scroll di atas kontainer jika jumlah masukan melebihi 3: *"Menampilkan X aspirasi warga (terbaru berada di atas) — Gulir ke bawah untuk melihat masukan lainnya ↓"*.
   - **Bebas Tabrakan dengan Lenis Smooth Scroll**:
     - Ditambahkan atribut `data-lenis-prevent="true"`, `data-lenis-prevent-wheel="true"`, dan `data-lenis-prevent-touch="true"` pada kontainer.
     - Event listener wheel internal menghentikan perambatan (*stopPropagation*) agar saat kursor mouse berada di dalam area card feed, scroll roda mouse secara mulus menggulir daftar masukan dan tidak membajak scroll halaman global (*anti-scroll collision*).
     - Provider Lenis global (`SmoothScrollProvider.tsx`) diaktifkan `allowNestedScroll: true`.
     - Menggunakan `overscroll-contain` untuk kenyamanan navigasi mobile dan desktop.

### B. Moderasi Konten SARA / Spam & Fitur Sembunyikan (Hide/Unhide) pada Dashboard Admin (`/dashboard/kritik-saran`)
1. **Penyaringan Konten Tidak Layak (SARA / Hoax / Spam)**:
   - Administrator memiliki kontrol penuh untuk menyembunyikan masukan yang melanggar norma atau tidak pantas.
   - Kolom `is_hidden` (boolean, indexed) ditambahkan pada tabel database `kritiks`.
   - Endpoint publik `GET /api/v1/kritik/public` secara ketat memfilter `where('is_hidden', false)` sehingga masukan yang disembunyikan **100% tidak akan pernah muncul ke publik**.
2. **Aksi Cepat & Konfirmasi SweetAlert2 pada Dashboard**:
   - Di tabel daftar pesan, tersedia tombol aksi cepat:
     - Ikon `EyeOff` (merah): **Sembunyikan** masukan (dilengkapi konfirmasi `showConfirm`).
     - Ikon `Eye` (hijau): **Tampilkan kembali** masukan jika sudah diverifikasi aman.
   - Pada modal tanggapan admin, tersedia juga checkbox: *"Sembunyikan Pesan dari Halaman Publik (Filter SARA / Spam)"*.
3. **Filter Visibilitas Khusus Admin**:
   - Tersedia tombol filter visibilitas:
     - `Semua (Total)`
     - `Tayang Publik` (Hanya yang berstatus tampil)
     - `Disembunyikan / SARA` (Hanya masukan yang di-hide)
   - Kartu statistik ringkasan kini menampilkan 4 metrik: Total Masuk, Menunggu Tanggapan, Sudah Ditanggapi, dan Disembunyikan (SARA/Spam).

### C. Penghapusan Pesan Kritik & Saran (`DELETE /api/v1/kritik/{id}`)
1. **Tombol Hapus pada Baris Tabel & Modal Tanggapan**:
   - Di tabel masukan warga, ditambahkan tombol `Trash2` merah di baris aksi.
   - Di modal detail tanggapan admin, ditambahkan tombol `Hapus Pesan` pada footer sebelah kiri.
2. **Dialog Konfirmasi SweetAlert2 (`showDeleteConfirm`)**:
   - Menggunakan dialog standar `showDeleteConfirm` dengan teks nama pengirim dan subjek pesan sebelum eksekusi penghapusan.
   - Mencegah penghapusan tidak sengaja dan mematuhi aturan tanpa browser native `confirm()`.
3. **Endpoint & Otorisasi Backend**:
   - Rute: `DELETE /api/v1/kritik/{id}`.
   - Middleware: `auth:sanctum`, `permission:manage_kritik`, serta `AuditAdminMutation` untuk mencatat audit log penghapusan data.
4. **Pengujian Otomatis**:
   - Unit test `test_admin_can_delete_kritik_entry` di `SecurityRbacPrivacyTest` memastikan data terhapus permanen dari database.

### D. Keamanan & Sensor Data Responden
- **Sensor Nama Responden (`***`)**: Setiap nama pelapor disensor di level backend (`KritikController@publicFeed`) dan di-format ulang pada frontend (`formatMaskedName`), misalnya `Budi Santoso` menjadi `B*** S***`.
- **Perlindungan Data Pribadi**: Email dan nomor telepon pelapor dienkripsi (`encrypted` cast) dan tidak pernah diekspos di endpoint publik.

---

## 2. Struktur Berkas Terkait

| Berkas | Peran |
| :--- | :--- |
| `backend/database/migrations/2026_09_21_000007_add_is_hidden_to_kritiks_table.php` | Migration kolom `is_hidden` dengan indeks. |
| `backend/app/Models/Kritik.php` | Model Kritik dengan fillable dan cast `is_hidden => boolean`. |
| `backend/app/Http/Controllers/Api/KritikController.php` | Controller index (filter visibility), publicFeed (filter !is_hidden), updateTanggapan, toggleHide, dan destroy. |
| `backend/routes/api.php` | Rute API publik & admin (`PATCH /api/v1/kritik/{id}/toggle-hide`, `DELETE /api/v1/kritik/{id}`). |
| `backend/tests/Feature/SecurityRbacPrivacyTest.php` | Pengujian otomatis enkripsi, sensor nama, eksklusi pesan hidden, dan aksi delete kritik. |
| `frontend/src/services/surveyService.ts` | Interface `KritikSaranItem`, API helper `toggleHideKritik`, dan `deleteKritik`. |
| `frontend/src/app/kritik-saran/page.tsx` | Halaman publik dengan layout scrollable ~3 cards dan urutan descending. |
| `frontend/src/app/dashboard/kritik-saran/page.tsx` | Dashboard admin dengan filter SARA, toggle hide/unhide, tombol hapus, stat card, dan modal detail. |
