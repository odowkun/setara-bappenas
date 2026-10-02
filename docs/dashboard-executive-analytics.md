# Dokumentasi Dashboard Eksekutif BAPPEDA Halmahera Utara

## 1. Deskripsi Umum
Halaman Ikhtisar Dashboard (`/dashboard`) dirancang sebagai Executive Control Center yang menyatukan metrik makro anggaran APBD, realisasi fisik dan serapan proyek lapangan (Geotagging), keterlibatan publik (unduhan dokumen perencanaan), serta kepuasan warga (IKM).

---

## 2. Struktur Visual & Metrik
Dashboard terbagi dalam beberapa komponen utama:

### A. 5 Kartu Metrik Ringkasan Utama
1. **Pengguna Sistem**: Total pengguna terdaftar di seluruh tingkatan peran (SuperAdmin, Admin Umum, Admin Bidang).
2. **Dokumen Perencanaan**: Total dokumen induk (RPJPD, RPJMD, RKPD, Data Sektoral, dll.) beserta akumulasi unduhan warga secara publik.
3. **Proyek Geotagging**: Jumlah titik proyek riil di lapangan, rasio serapan anggaran (total realisasi / total pagu), serta tautan ke pemantauan proyek sektoral.
4. **Kepuasan Warga (IKM)**: Nilai Indeks Kepuasan Masyarakat dari survei online beserta predikat mutu pelayanan publik (A - Sangat Baik).
5. **Kritik & Saran Warga**: Total kritik & saran masuk dari masyarakat dilengkapi badge indikator jumlah aduan yang **Belum Dijawab** (menunggu tindak lanjut) serta tautan langsung ke halaman manajemen tanggapan. Pada Admin Sidebar juga terpasang counter badge notifikasi otomatis.

### B. Baris Grafik 1 (Kinerja Sektoral Proyek Riil & Monitoring Geotagging)
- **Kiri (7 Kolom)**: Kinerja Sektoral Proyek Riil per Bidang (Infrastruktur, Perekonomian, Sosial Budaya, Perencanaan). Menampilkan perbandingan Pagu vs Realisasi Keuangan dan Rata-rata Progres Fisik yang dihitung otomatis dari akumulasi titik proyek lapangan.
- **Kanan (5 Kolom)**: Ringkasan Monitoring Proyek Geotagging Lapangan, meliputi pagu vs realisasi riil, progres rata-rata fisik (%), dan rincian status proyek (*Selesai, Dalam Proses, Belum Mulai, Terkendala*).

### C. Baris Grafik 2 (Distribusi Repositori Dokumen & Minat Publik)
- **Kiri (6 Kolom)**: Distribusi Koleksi Dokumen Perencanaan per Kategori (RPJPD, RPJMD, RKPD, Renstra, Renja, LAKIP, Data Sektoral) lengkap dengan jumlah dokumen dan akumulasi unduhan warga.
- **Kanan (6 Kolom)**: 5 Dokumen Perencanaan Paling Banyak Diunduh Warga lengkap dengan progress bar proporsional dan jumlah unduhan.

### D. Baris Ringkasan Modul Publikasi Portal (Sub-Menu Publik)
- 4 Kartu metrik cepat: Berita Daerah, Agenda Kegiatan, Galeri Foto/Video, dan Pengumuman & Edaran Resmi yang terhubung langsung ke sub-menu masing-masing.

### E. Otomasi 100% (Tanpa Input Manual)
- Seluruh grafik dan metrik ditarik secara dinamis dari tabel operasional database (`proyek_details`, `documents`, `surveys`, `kritiks`, `news`, `agendas`, `galeri`, `announcements`). Modal input manual persentase APBD telah dieliminasi demi integritas data tunggal (*single source of truth*).

---

## 3. Endpoint API Backend

### `GET /api/v1/dashboard/charts`
- **Akses**: Publik / Admin
- **Struktur Response**:
  - `projects_summary`: Total pagu, realisasi, serapan persen, avg progress fisik, status counts riil (`selesai`, `dalam_proses`, `belum_mulai`, `terkendala`), dan breakdown riil `by_bidang`.
  - `documents_by_type`: Koleksi dokumen per jenis dan akumulasi unduhannya.
  - `portal_stats`: Jumlah artikel berita, agenda kegiatan, galeri dokumentasi, dan pengumuman resmi.
  - `public_engagement`: Total unduhan dokumen, top 5 dokumen terpopuler, skor rata-rata IKM survei, dan status kritik saran.

---

## 4. Perbaikan Sinkronisasi Dinamis Kinerja Sektoral & Geotagging (02 Oktober 2026)

### A. Penyebab Ketidaksinkronan Sebelumnya
1. **Query Exception Nama Tabel**: Pada `DashboardChartController.php`, pemanggilan jumlah galeri menggunakan nama tabel `galleries` (bawaan jamak Laravel) padahal nama tabel migrasi adalah `galeri`. Hal ini menyebabkan endpoint `GET /api/v1/dashboard/charts` gagal (HTTP 500), sehingga state `projectsSummary` di frontend gagal termuat (`null`).
2. **Hardcoded Fallback**: Karena data gagal termuat, kartu monitoring lapangan menampilkan angka statis lama (Pagu Rp 4,90 M, Realisasi Rp 2,35 M, Rasio 48.1%, Fisik 59.2%) namun badge statusnya menghasilkan angka 0 (`projectsSummary?.status_counts.selesai ?? 0`). Kartu kiri juga tertahan dalam state `"Memuat data kinerja sektoral per bidang..."`.
3. **Pemetaan Slug Bidang**: Slug bidang `sosbud` dan `renval` pada database belum terpetakan ke label resmi Bappeda.

### B. Solusi & Verifikasi
1. **Perbaikan Backend**: Memperbaiki nama tabel menjadi `galeri` pada `DashboardChartController.php` dan menambahkan automated feature test `DashboardChartTest.php` untuk menjamin response status 200 dan kalkulasi metrik proyek berjalan akurat.
2. **Sinkronisasi Frontend (`dashboard/page.tsx`)**:
   - Menggunakan `authenticatedFetch` dengan header cache `no-store` untuk mencegah stale caching.
   - Menghilangkan angka hardcoded fallback, menggantinya dengan state reaktif murni dari database.
   - Menambahkan pemetaan nama bidang untuk `sosbud` (*Bidang Pemerintahan & Pembangunan Manusia*) dan `renval` (*Bidang Perencanaan, Pengendalian & Evaluasi*).

---

## 5. Standardisasi Resiliensi Ikhtisar Portal & Routing Alias (02 Oktober 2026)

### A. Latar Belakang Kendala Angka 0 pada Modul Konten Publik
Kartu ringkasan modul publikasi (*Berita Daerah, Agenda Kegiatan, Galeri Foto/Video, Pengumuman & Surat*) sempat menampilkan angka `0` saat data masih dalam proses pengambilan awal atau bila endpoint belum selesai dimuat.

### B. Tindakan Perbaikan Komprehensif
1. **Global Route Alias di Backend (`routes/api.php`)**:
   - Menambahkan alias rute langsung `GET /api/dashboard/charts` di samping `GET /api/v1/dashboard/charts` sehingga seluruh variasi URL dasar klien (baik yang berakhiran `/api` maupun `/api/v1`) selalu merespons sukses 200 OK.
   - Menghitung total seluruh artikel berita yang dikelola di CMS (`DB::table('news')->count()`).
2. **Normalisasi Otomatis URL Dasar (`apiClient.ts`)**:
   - Menambahkan fungsi helper `normalizeApiBaseUrl` agar konfigurasi variabel lingkungan yang hanya mencantumkan `/api` secara otomatis dinormalisasi ke `/api/v1`.
3. **Metode Terpusat `adminService.fetchDashboardCharts()`**:
   - Mengintegrasikan penarikan data chart ke dalam `adminService.ts` dengan skema parsing error seragam bersama service lainnya.
4. **State Skeleton Loading & Tombol Sinkronisasi Interaktif**:
   - Menghilangkan angka statis `0` saat data masih dalam proses pengambilan; digantikan dengan animasi skeleton pulse.
   - Menambahkan tombol interaktif berputar (*RefreshCw*) pada banner selamat datang bertuliskan *"Sinkronisasi Otomatis Sub-Menu"* yang memungkinkan admin memicu refresh metrik secara instan tanpa perlu reload halaman penuh.



