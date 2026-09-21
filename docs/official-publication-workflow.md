# Workflow Publikasi Resmi

## Tujuan dan keputusan

Konten publik hanya boleh berasal dari record database yang berstatus terbit. Semua form admin melakukan mutasi nyata melalui Laravel API; tidak ada `setTimeout` yang berpura-pura menyimpan, ID buatan frontend, media contoh, atau fallback record ketika API gagal.

Alur baku:

```text
Admin mengisi data
        ↓
POST/PUT API + validasi + audit
        ↓
Database menyimpan DRAF
        ↓
Admin memilih Terbitkan
        ↓
PATCH /{resource}/{id}/publication
        ↓
Validasi kelengkapan + aktor server + waktu terbit
        ↓
Endpoint publik dapat membaca record
        ↓
Jika dibatalkan: status kembali DRAF dan hilang dari publik
```

Database adalah otoritas status. Frontend hanya menampilkan respons API dan tidak boleh menganggap klik tombol sebagai keberhasilan sebelum server mengembalikan respons sukses.

## Domain dan state resmi

| Domain | Tabel | Field status | Audit publikasi | Syarat minimum terbit |
|---|---|---|---|---|
| Berita | `news` | `is_published` | `published_at`, `created_by_user_id`, `published_by_user_id` | isi berita |
| Agenda | `agendas` | `is_published` | `published_at`, `created_by_user_id`, `published_by_user_id` | judul, kategori, mulai, selesai |
| Pengumuman | `announcements` | `is_published` | `published_at`, `created_by_user_id`, `published_by_user_id` | judul, tipe, isi atau lampiran |
| Galeri | `galeri` | `is_published` | `published_at`, `created_by_user_id`, `published_by_user_id` | judul, tanggal, sampul, media |
| Dokumen | `documents` | `is_public` | `published_at`, `created_by_user_id`, `published_by_user_id` | judul, jenis, berkas watermark |

`OfficialPublicationService` menerapkan transisi dan validasi yang sama untuk seluruh domain. Saat unpublish, `published_at` dan `published_by_user_id` dikosongkan. Aktor selalu berasal dari token Sanctum, bukan nama yang dikirim browser.

## Route yang benar-benar tersedia

| Domain | Baca publik | Baca admin | Simpan | Ubah | Transisi publikasi |
|---|---|---|---|---|---|
| Berita | `GET /news` | `GET /admin/news`, `GET /admin/news/{id}` | `POST /news` | `PUT /news/{id}` | `PATCH /news/{id}/publication` |
| Agenda | `GET /agendas` | `GET /admin/agendas`, `GET /admin/agendas/{id}` | `POST /agendas` | `PUT /agendas/{id}` | `PATCH /agendas/{id}/publication` |
| Pengumuman | `GET /pengumuman` | `GET /admin/pengumuman`, `GET /admin/pengumuman/{id}` | `POST /pengumuman` | `PUT /pengumuman/{id}` | `PATCH /pengumuman/{id}/publication` |
| Galeri | `GET /galeri` | `GET /admin/galeri`, `GET /admin/galeri/{id}` | `POST /galeri` | `PUT /galeri/{id}` | `PATCH /galeri/{id}/publication` |
| Dokumen | `GET /documents` | `GET /admin/documents` | `POST /documents` | — | `PATCH /documents/{id}/publication` |

Semua mutasi memerlukan autentikasi, permission domain, dan `AuditAdminMutation`. Endpoint publik menerapkan filter status di query backend sehingga draf tetap tidak terlihat meskipun frontend dimodifikasi.

## Perubahan nyata pada setiap alur

### Berita

Halaman tambah juga menjadi halaman edit ketika menerima `?edit={id}`. Data edit dimuat dari `GET /admin/news/{id}` dan disimpan dengan `PUT`, bukan membuat berita baru. Tombol **Simpan Draf** dan **Terbitkan** mengirim status eksplisit. Penulis dan aktor audit diturunkan dari sesi server.

### Agenda dan Pengumuman

Form tambah/edit dapat menyimpan draf. Dashboard menampilkan status dan menyediakan publish/unpublish melalui route khusus. Fitur Sematkan / Pin (`PATCH /pengumuman/{id}/pin`) memungkinkan admin memilih Pengumuman Resmi Utama yang langsung tampil di banner Beranda dan Hero Card Pengumuman Publik.

**Aturan Penayangan & Arsip Pengumuman Resmi**:
1. **Prioritas Sematan Beranda (PIN)**: Pengumuman yang ditandai `is_important = true` selalu diprioritaskan dan ditampilkan pada banner Beranda tanpa terhalang filter tanggal kedaluwarsa (`valid_until`), sampai administrator secara sadar melepas pin.
2. **Arsip Publik Lengkap**: Halaman publik `/pengumuman` mengakses `GET /api/v1/pengumuman?all=1` untuk menampilkan seluruh arsip dokumen resmi yang telah diterbitkan (termasuk yang telah melampaui tanggal berlaku dengan penanda status arsip/kedaluwarsa).
3. **Masa Berlaku Permanen secara Default**: Form tambah pengumuman menetapkan masa berlaku secara opsional (default tanpa kedaluwarsa / permanen) untuk mencegah pengumuman langsung menghilang saat tanggal server berganti (misalnya zona waktu WIT UTC+9).
4. **Akses Lampiran Arsip**: Lampiran pengumuman yang berstatus terbit (`is_published = true`) tetap dapat diunduh oleh masyarakat umum (`GET /pengumuman/{id}/attachment`) meskipun telah melewati `valid_until`, guna menjamin keterbukaan informasi publik dan keutuhan riwayat regulasi/surat edaran.
5. **Draf Privat**: Hak akses lampiran untuk pengumuman yang berstatus draf tetap terlindungi dan hanya dapat diakses atau dipratinjau oleh administrator terautentikasi.

### Galeri

Tambah/edit mengunggah media ke server terlebih dahulu, kemudian hanya menyimpan URL hasil upload. URL `blob:`, `data:`, media Unsplash, dan video contoh ditolak/dihapus. Daftar admin memakai endpoint admin dan penghapusan benar-benar menghapus record database.

### Dokumen

Dokumen perencanaan dan arsip resmi mengikuti tata kelola arsip pengetahuan:
1. **Kriteria Tayang Publik (`scopePubliclyAvailable`)**: Dokumen hanya tampil di portal publik `/dokumen` jika:
   - `is_public = true`
   - `classification` bernilai `public` (atau null)
   - `governance_status` bernilai `approved` (atau null)
   - Memiliki file versi resmi yang disetujui (`current_version_id` atau versi v1.0).
2. **SuperAdmin Direct Publication**: SuperAdmin/Administrator yang mengunggah dokumen dengan opsi publik atau menekan tombol **"Terbitkan ke Publik"** di dashboard akan otomatis menyetujui versi dokumen (`governance_status = 'approved'`), menetapkan klasifikasi `public`, dan mengaktifkannya ke publik tanpa terhalang siklus bertahap four-eyes.
3. **Migrasi Sinkronisasi Otomatis**: Migration `2026_09_21_000004_fix_published_documents_visibility.php` menyinkronkan seluruh dokumen master (RKPD, RPJMD, dll.) yang sebelumnya tersimpan sebagai `internal/draft` agar otomatis berstatus `public/approved` dan langsung tayang di portal publik.

### Proyek spasial yang tampil ke publik

Nama proyek, bidang, kecamatan, pagu, OPD, dan titik peta wajib diisi secara sadar. Backend tidak lagi mengisi Tobelo, Infrastruktur, Bappeda/PUPR, atau nominal contoh. Kode proyek memakai ULID unik. Database dapat berhasil walaupun ESRI gagal; UI melaporkan kedua status secara terpisah dan tidak membuat `OBJECTID` palsu.

## Pro

- Draf dapat direview tanpa bocor ke masyarakat atau pencarian global.
- Waktu dan akun penerbit dapat diaudit dari database.
- Admin mengetahui apakah perubahan benar-benar tersimpan.
- Satu transisi khusus mengurangi ketidakkonsistenan antarform.
- Lampiran draf tidak dapat diakses melalui URL publik.
- Kegagalan API/media/ESRI terlihat jujur dan tidak diganti data contoh.

## Kontra

- Publikasi memerlukan satu tindakan tambahan setelah menyimpan draf.
- Migrasi baru wajib dijalankan sebelum frontend baru digunakan.
- Konten lama yang tidak lengkap tidak dapat diterbitkan sampai dilengkapi.
- Saat API gagal, daftar tampil kosong/gagal; tidak ada fallback yang terlihat nyaman.
- Sinkronisasi ESRI dapat berstatus gagal walaupun database berhasil, sehingga admin perlu menindaklanjuti integrasi.

## Apa yang terjadi setelah perubahan

- **Simpan Draf:** record masuk database dan dashboard, tetapi tidak muncul di portal publik.
- **Terbitkan:** backend memvalidasi isi, mencatat waktu/aktor, lalu record muncul di endpoint publik.
- **Batalkan Publikasi:** record tetap ada untuk admin, tetapi langsung hilang dari portal dan pencarian.
- **API menolak/gagal:** UI menampilkan kesalahan; tidak ada pesan sukses atau perubahan lokal palsu.
- **Upload media gagal:** media tidak dimasukkan ke konten sebagai URL `blob:`.
- **ESRI gagal:** proyek tetap tersimpan dengan `esri_objectid = null` dan status sinkron gagal.

## Deployment

1. Backup database, storage privat, dan `APP_KEY`.
2. Deploy backend terlebih dahulu.
3. Jalankan:

   ```bash
   cd backend
   php artisan migrate --force
   php artisan route:list --path=api/v1
   php artisan test
   ```

4. Pastikan migration `000007`, `000008`, dan `000009` berhasil.
5. Deploy frontend lalu jalankan `npm run build`.
6. Uji untuk setiap domain: simpan draf, pastikan tidak ada di publik, terbitkan, pastikan muncul, lalu unpublish.
7. Uji lampiran Pengumuman draf menghasilkan `404`.

## Rollback

Utamakan rollback kode tanpa menghapus kolom audit. Kolom status dan audit aman dibiarkan ketika versi aplikasi sebelumnya dipasang kembali. Jangan rollback migration publikasi jika record produksi sudah memakai `published_at` atau `published_by_user_id`, kecuali backup sudah diverifikasi dan kehilangan audit telah disetujui.

Jika frontend harus di-rollback sendiri, backend baru tetap kompatibel untuk pembacaan. Namun frontend lama yang selalu mengirim status publik dapat melewati kebiasaan “draf dahulu”, sehingga frontend dan backend sebaiknya dipasang sebagai satu release.

## Optimasi Media Sampul Berita & Pencegahan Broken Image

1. **Auto-Upload & Dual-Variant Processing**:
   - `OptimizedMediaUploader` langsung memicu pengunggahan otomatis saat pengguna memilih gambar (`handleSelectFile`), tanpa memerlukan klik tombol terpisah.
   - Menggunakan Intervention Image v3 untuk menghasilkan 2 varian:
     - Master HD Asli di `/storage/media/originals/`
     - Varian WebP Teroptimasi di `/storage/media/web/` (skala max-width 1920px, kualitas 80%, ukuran berkurang hingga 95%).
     - Varian Thumbnail WebP di `/storage/media/thumbs/` (skala max-width 400px, kualitas 75%).
2. **Root-Relative Storage URLs**:
   - Backend `MediaController` mengembalikan path root-relative (`/storage/media/...`) untuk menghindari domain/port absolut lokal (`http://127.0.0.1:8100` atau `http://localhost:8000`) yang menyebabkan mixed-content block di browser HTTPS.
   - Model `News` menyematkan accessor/mutator `getImageAttribute` & `setImageAttribute` untuk otomatis membersihkan URL absolut host lokal yang usang.
3. **Pencegahan Broken Image (Fallback & Modern Editorial Cover)**:
   - Frontend (`adminService.ts`, `dashboard/berita`, `berita`, `berita/[slug]`, `LatestNewsCarousel`) menerapkan `normalizeMediaUrl` dan fallback visual modern `/images/bappeda/default-news-cover.jpg` (bukan flat dark logo) saat gambar belum ada atau gagal dimuat via event `onError`.
   - Di Beranda (`LatestNewsCarousel.tsx`), pemetaan payload API wajib menyertakan `image: normalizeMediaUrl(item.image || item.featured_image || item.image_url)` dan `views: Number(item.views) || 0` agar cover gambar dan statistik pembaca tampil proporsional.
   - `TambahBeritaPage` melarang penyimpanan ketika proses unggah masih berlangsung (`isImageUploading` guard) dan menjamin artikel baru tidak pernah tersimpan dengan path gambar kosong.
4. **Otomasi Storage Symlink di Server**:
   - Skrip deployment produksi `scripts/deploy-prod.ps1` menyertakan `php artisan storage:link` untuk memastikan symlink storage selalu aktif.

## Penjaga regresi

- `OfficialPublicationWorkflowTest` menguji draf, publish, unpublish, filter publik, route edit nyata, lampiran privat, dokumen, proyek tanpa default palsu, pola mock frontend, serta URL root-relative upload media dan normalisasi gambar di model `News`.
- `HeroVideoTest` menguji pengambilan video publik (`GET /api/v1/hero-video`), pengambilan konfigurasi admin (`GET /api/v1/admin/hero-video`), serta pembaharuan konfigurasi admin dengan tautan YouTube dan berkas video lokal (`PUT /api/v1/admin/hero-video`).
- `DatabaseSourceOfTruthTest` dan `OfficialDatabaseSourceTest` menjaga agar frontend tidak kembali memakai record browser/mock.
- `npm run build` memvalidasi route dan TypeScript seluruh halaman.

---

## Standar Video Sambutan Utama Beranda & Dukungan Multi-Format (YouTube + Direct MP4)

Status implementasi: 21 September 2026.

### 1. Masalah & Temuan
1. Ketika admin memasukkan tautan YouTube (misal: `https://youtu.be/ABs7uaqojsY?si=mocXO85Nkj6MABIK`) ke form pengaturan video sambutan:
   - Tag HTML5 `<video><source src="..." type="video/mp4" /></video>` pada Live Preview dan Beranda (`HeroSection.tsx`) gagal memutar URL YouTube karena format YouTube bukan file MP4 langsung.
   - Hal ini menyebabkan video tidak pernah terputar/terganti saat tombol Play ditekan (hanya diam di poster gambar).
2. Ketika admin mengganti dengan berkas video MP4/WebM baru:
   - Tag `<video>` tanpa atribut `key` dinamis atau `src` langsung mengabaikan perubahan elemen anak `<source>` setelah inisialisasi awal DOM (spesifikasi standar browser HTML5).

### 2. Solusi & Standar Teknis
1. **Helper Parser YouTube (`heroVideoService.ts`)**:
   - `extractYouTubeId(url)`: Mendukung seluruh format YouTube (`youtu.be/ID`, `youtube.com/watch?v=ID`, `youtube.com/embed/ID`, `youtube.com/shorts/ID`, query params `?si=...`, dsb.).
   - `getYouTubeEmbedUrl(videoId, autoplay)`: Menghasilkan URL embed `https://www.youtube-nocookie.com/embed/${videoId}` yang aman, tanpa cookie pelacak, dan responsif.
   - `getYouTubeThumbnailUrl(videoId, quality)`: Menghasilkan URL thumbnail resolusi tinggi YouTube secara instan.
2. **Interactive Live Preview di Dashboard Admin (`HeroVideoSettingsPanel.tsx`)**:
   - Deteksi real-time input URL YouTube dengan indikator visual dan tombol 1-klik `Pasang Thumbnail YouTube Otomatis`.
   - Pratinjau langsung memutar iframe YouTube saat admin menekan tombol Play, dengan kontrol `Tutup Pratinjau`.
   - Menjaga sinkronisasi state saat penyimpanan berhasil (`setVideoUrl`, `setPosterUrl`, dll.).
3. **Penyajian Responsif di Halaman Depan Publik (`HeroSection.tsx`)**:
   - Menggunakan `isYouTube` untuk membedakan mode rendering:
     - Jika YouTube: menampilkan poster cover kustom/YouTube thumbnail, badge judul, dan tombol 3D Play. Saat diputar, iframe YouTube aktif dengan tombol `Tutup Video` untuk kembali ke cover poster.
     - Jika Berkas Video Langsung: `<video key={currentVideoUrl} src={currentVideoUrl}>` memastikan browser langsung memuat video baru setiap kali setting diperbarui.
4. **Backend API & Hak Akses (`routes/api.php` & `GaleriController.php`)**:
   - Route `PUT /admin/hero-video` mendukung permission `manage_galeri|manage_dashboard` dan diaudit oleh `AuditAdminMutation`.
   - Validasi dan pembersihan data (`trim`, handling nullable poster dengan benar).



