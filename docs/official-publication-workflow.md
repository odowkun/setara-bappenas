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

Form tambah/edit dapat menyimpan draf. Dashboard menampilkan status dan menyediakan publish/unpublish melalui route khusus. Lampiran Pengumuman disimpan pada disk privat; `GET /pengumuman/{id}/attachment` hanya mengirim berkas jika Pengumuman telah terbit dan belum kedaluwarsa.

### Galeri

Tambah/edit mengunggah media ke server terlebih dahulu, kemudian hanya menyimpan URL hasil upload. URL `blob:`, `data:`, media Unsplash, dan video contoh ditolak/dihapus. Daftar admin memakai endpoint admin dan penghapusan benar-benar menghapus record database.

### Dokumen

Dokumen baru default menjadi draf. Jenis dokumen baru dibuat melalui API database, bukan ditambahkan ke state browser saja. Frontend tidak membuat ID `Date.now()` atau nilai file palsu. Dokumen hanya dapat diterbitkan jika berkas watermark privat tersedia.

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
3. **Pencegahan Broken Image (Fallback & Error Handlers)**:
   - Frontend (`adminService.ts`, `dashboard/berita`, `berita`, `berita/[slug]`, `LatestNewsCarousel`) menerapkan `normalizeMediaUrl` dan fallback bawaan `/images/bappeda/logo-halut.png` saat gambar belum ada atau gagal dimuat via event `onError`.
   - `TambahBeritaPage` melarang penyimpanan ketika proses unggah masih berlangsung (`isImageUploading` guard) dan menjamin artikel baru tidak pernah tersimpan dengan path gambar kosong.
4. **Otomasi Storage Symlink di Server**:
   - Skrip deployment produksi `scripts/deploy-prod.ps1` menyertakan `php artisan storage:link` untuk memastikan symlink storage selalu aktif.

## Penjaga regresi

- `OfficialPublicationWorkflowTest` menguji draf, publish, unpublish, filter publik, route edit nyata, lampiran privat, dokumen, proyek tanpa default palsu, pola mock frontend, serta URL root-relative upload media dan normalisasi gambar di model `News`.
- `DatabaseSourceOfTruthTest` dan `OfficialDatabaseSourceTest` menjaga agar frontend tidak kembali memakai record browser/mock.
- `npm run build` memvalidasi route dan TypeScript seluruh halaman.


