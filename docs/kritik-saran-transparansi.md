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

### D. Ekspor Rekapitulasi Kritik & Saran ke Excel (`.xlsx` & `.xls`) Terdesain Rapi
1. **Fitur Ekspor Lengkap dengan Penanggung Jawab & Jawaban Resmi**:
   - Menambahkan tombol ekspor Excel pada dashboard admin (`/dashboard/kritik-saran`):
     - Tombol **"Export Excel Rekapitulasi"** di Header Bar halaman.
     - Tombol cepat **"Export Excel"** berdampingan dengan kotak pencarian tabel.
   - Kolom lembar kerja Excel dirancang presisi dengan 13 atribut data:
     1. `NO`: Nomor urut berformat angka.
     2. `TANGGAL MASUK`: Waktu pengiriman masukan warga (format `DD/MM/YYYY HH:mm WIT`).
     3. `NAMA PENGIRIM`: Nama lengkap pelapor (terdekripsi resmi untuk admin).
     4. `EMAIL`: Alamat email korespondensi pelapor.
     5. `NO. TELEPON / WA`: Nomor kontak WhatsApp atau telepon pelapor.
     6. `UNIT SKPD TUJUAN`: Unit perangkat daerah / bidang yang bertanggung jawab menjawab masukan.
     7. `SUBJEK MASUKAN`: Judul aspirasi atau perihal saran warga.
     8. `ISI PESAN KRITIK & SARAN`: Rincian isi keluhan, saran, atau masukan (dilengkapi `wrapText: true` agar teks panjang tidak tumpah ke sel lain).
     9. `STATUS TINDAK LANJUT`: Status penanganan dengan badge warna (Hijau: *Sudah Ditanggapi*, Biru: *Dalam Proses*, Kuning: *Menunggu Tanggapan*).
     10. `PETUGAS / PEJABAT PENJAWAB`: Nama admin, staf, atau pejabat SKPD yang memberikan tanggapan resmi (tersimpan via `dijawab_oleh`).
     11. `ISI JAWABAN / TANGGAPAN RESMI`: Tanggapan resmi dari BAPPEDA atau SKPD terkait (dilengkapi `wrapText: true`).
     12. `TANGGAL DIJAWAB`: Waktu ketika tanggapan resmi disimpan (`tgl_dijawab`).
     13. `VISIBILITAS PUBLIK`: Keterangan status publik (*Tayang Publik* / *Disembunyikan SARA/Spam*).

2. **Desain Visual Lembar Kerja Excel Eksekutif**:
   - **Kop Surat Banner Resmi**:
     - Baris 1: `PEMERINTAH KABUPATEN HALMAHERA UTARA` (14pt Bold, Navy Blue `#1E3A8A`).
     - Baris 2: `BADAN PERENCANAAN PEMBANGUNAN DAERAH (BAPPEDA)` (12pt Bold, Slate `#0F172A`).
     - Baris 3: `REKAPITULASI LAPORAN KRITIK, SARAN & ASPIRASI MASYARAKAT` (11pt Bold, Navy `#1E3A8A`).
     - Baris 4: Informasi metadata waktu cetak, cakupan filter, dan jumlah total baris.
   - **Header Kolom Resmi**:
     - Background Deep Navy Blue (`#1E3A8A`), font warna putih tebal, rata tengah vertikal & horizontal.
   - **Format Lebar Kolom Proporsional**:
     - Setiap kolom diatur lebarnya secara manual (lebar 6 untuk nomor urut hingga 45 untuk kolom saran & jawaban), menghilangkan masalah sel terpotong atau tumpang tindih.
   - **Gaya Baris Data**:
     - Zebra striping (bergantian putih dan slate lembut `#F8FAFC`).
     - Border sel rapi di semua sisi (`#CBD5E1`).
     - Rata atas (`vertical: top`) sehingga teks multi-baris sejajar dengan rapi.
   - **Ringkasan Footer**:
     - Baris rekapitulasi jumlah masukan (*Sudah Ditanggapi*, *Dalam Proses*, dan *Menunggu Tanggapan*).

3. **Penyimpanan Petugas Penjawab pada Modal Tanggapan**:
   - Form modal tanggapan admin menyediakan input: **"Petugas / Pejabat Penjawab"**.
   - Secara default terisi otomatis dengan nama dan jabatan admin yang login (misal `Super Admin BAPPEDA Halut`), namun dapat disesuaikan secara dinamis jika didelegasikan ke pejabat/kepala bidang terkait.
   - Database migration `2026_10_01_000004_add_dijawab_oleh_and_tgl_dijawab_to_kritiks_table.php` menambahkan kolom `dijawab_oleh` dan `tgl_dijawab` pada tabel `kritiks`.
   - Endpoint backend `GET /api/v1/kritik/export-excel` juga tersedia untuk mengunduh spreadsheet langsung dari server.

### E. Keamanan & Sensor Data Responden
- **Sensor Nama Responden (`***`)**: Setiap nama pelapor disensor di level backend (`KritikController@publicFeed`) dan di-format ulang pada frontend (`formatMaskedName`), misalnya `Budi Santoso` menjadi `B*** S***`.
- **Perlindungan Data Pribadi**: Email dan nomor telepon pelapor dienkripsi (`encrypted` cast) dan tidak pernah diekspos di endpoint publik.

---

## 2. Struktur Berkas Terkait

| Berkas | Peran |
| :--- | :--- |
| `backend/database/migrations/2026_09_21_000007_add_is_hidden_to_kritiks_table.php` | Migration kolom `is_hidden` dengan indeks. |
| `backend/database/migrations/2026_10_01_000004_add_dijawab_oleh_and_tgl_dijawab_to_kritiks_table.php` | Migration kolom `dijawab_oleh` dan `tgl_dijawab` pada tabel `kritiks`. |
| `backend/app/Models/Kritik.php` | Model Kritik dengan fillable dan cast enkripsi, boolean, dan datetime. |
| `backend/app/Http/Controllers/Api/KritikController.php` | Controller index, publicFeed, updateTanggapan (responder tracking), exportExcel, toggleHide, dan destroy. |
| `backend/routes/api.php` | Rute API publik & admin (`GET /api/v1/kritik/export-excel`, `PUT /api/v1/kritik/{id}/tanggapan`). |
| `backend/tests/Feature/SecurityRbacPrivacyTest.php` | Pengujian otomatis enkripsi, sensor nama, eksklusi pesan hidden, dan aksi delete kritik. |
| `frontend/src/services/surveyService.ts` | Interface `KritikSaranItem` dengan `dijawab_oleh` & `tgl_dijawab`. |
| `frontend/src/app/kritik-saran/page.tsx` | Halaman publik dengan layout scrollable ~3 cards dan urutan descending. |
| `frontend/src/app/dashboard/kritik-saran/page.tsx` | Dashboard admin dengan tombol Export Excel, modal tanggapan ber-responder, dan status SKPD. |

