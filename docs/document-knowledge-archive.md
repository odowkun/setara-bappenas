# Dokumen Privat, Terukur, dan Arsip Pengetahuan

Status implementasi: 29 Juli 2026.

Dokumen ini adalah referensi arsitektur dan runbook operasional untuk modul arsip pengetahuan dokumen BAPPEDA Halmahera Utara. Isinya mengikuti implementasi aktual pada migration `2026_07_29_000010_create_document_knowledge_archive.php`, bukan rancangan konseptual.

## Tujuan

Modul ini memastikan bahwa:

- berkas asli tidak tersedia melalui public storage atau URL eksternal;
- dokumen mempunyai identitas arsip, metadata, klasifikasi, versi, checksum, dan histori persetujuan;
- versi baru tidak menimpa versi resmi yang sedang berlaku;
- pembuat/pengaju tidak dapat menyetujui dokumennya sendiri dalam alur normal;
- hanya versi yang disetujui, berintegritas valid, berkategori publik, dan sedang diterbitkan yang dapat dibaca masyarakat;
- preview dan unduhan memakai grant bertanda tangan yang terikat pada dokumen serta versi;
- log unduhan hanya dihitung setelah signed stream benar-benar dipakai;
- isi PDF dapat diindeks melalui `pdftotext` atau OCR Tesseract;
- retensi menandai arsip untuk review tanpa menghapus berkas otomatis;
- legal hold mencegah pengarsipan;
- dokumen lama yang belum berada di bawah kendali storage BAPPEDA dikarantina, bukan dianggap sebagai publikasi resmi.

## Sebelum dan sesudah

| Area | Sebelum | Sesudah |
|---|---|---|
| Storage | Sebagian path lokal privat, sebagian URL Google Drive/server eksternal | Versi resmi harus berada pada disk privat; URL eksternal berstatus `legacy_external` dan tidak publik |
| Akses file | Preview PDF publik dapat dibuka melalui endpoint tetap | Preview dan unduhan memakai signed URL singkat, grant acak, dan ikatan versi |
| Unduhan | Log/counter dapat dibuat sebelum transfer file terjadi | Email membuat grant; log dan counter dibuat sekali saat signed stream dikonsumsi |
| Versi | Satu `file_path` pada record dokumen | `document_versions` menyimpan v1, v2, dan seterusnya tanpa overwrite |
| Persetujuan | Pemilik permission dokumen dapat langsung menerbitkan | Upload → submit → review → approve → publish; approval normal memakai prinsip four-eyes |
| Klasifikasi | Publik/nonpublik hanya melalui boolean | `public`, `internal`, `confidential`, atau `restricted` |
| Integritas | Tidak ada bukti isi berkas tetap sama | SHA-256 dihitung server dan diverifikasi sebelum submit, approve, preview, download, ekstraksi, dan publikasi |
| Pencarian | Judul/jenis/bidang | Metadata, keyword, nomor dokumen, kode arsip, serta `full_text` versi aktif |
| Retensi | Delete menghapus record | Delete menjadi lifecycle archive; record, versi, checksum, dan log approval dipertahankan |
| Statistik | Total view/download sederhana | Total view, unique view per visitor/hari, versi yang diunduh, dan email terenkripsi |
| Dokumen lama | URL eksternal dapat tetap terlihat publik | Dokumen yang belum dapat diverifikasi menjadi `pending_migration`, `internal`, dan `is_public=false` |

## Model data

### `documents`

Record induk dan metadata tata kelola:

- identitas: `archive_code`, `document_number`, `title`, `jenis`, `bidang`, `owner_opd`;
- klasifikasi: `classification`, `keywords`;
- lifecycle: `governance_status`, `submitted_at`, `approved_at`, `archived_at`;
- storage: `storage_status`, `current_version_id`;
- retensi: `retention_policy`, `retention_until`, `retention_status`, `legal_hold`;
- publikasi: `is_public`, `published_at`;
- analytics: `views`, `unique_views`, `downloads`;
- aktor: pembuat, pengaju, penyetuju, penerbit, dan pengarsip.

Kode arsip dibuat dengan pola `BPH-DOC-00000001`. Prefix dapat diganti melalui `DOCUMENT_ARCHIVE_CODE_PREFIX`.

### `document_versions`

Satu row untuk setiap revisi berkas:

- `version_number` dan `version_label`, misalnya `1` / `v1.0`;
- nama, path privat, disk, MIME type, dan ukuran byte;
- `checksum_sha256` serta status integritas;
- `full_text`, metode ekstraksi, jumlah halaman, status, dan error ekstraksi;
- ringkasan perubahan;
- status review, waktu, dan aktor pembuat/pengaju/penyetuju.

`documents.current_version_id` hanya menunjuk versi yang sudah disetujui. Pada dokumen baru, field ini tetap `NULL` sampai reviewer menyetujui v1.

### Tabel histori dan akses

| Tabel | Fungsi |
|---|---|
| `document_approval_logs` | Histori submit, approve, reject, perubahan governance, jatuh tempo retensi, dan archive |
| `document_access_grants` | Hash token preview/download, versi, tujuan, kedaluwarsa, email terenkripsi, dan waktu konsumsi |
| `document_view_logs` | Unique view berdasarkan hash visitor per dokumen per tanggal |
| `document_download_logs` | Versi dan grant yang benar-benar dikonsumsi, email terenkripsi/hash, serta waktu unduh |

Raw grant tidak disimpan di database; yang disimpan hanya SHA-256 token. Email disimpan memakai Laravel encrypted cast dan hash email digunakan untuk filter tepat serta statistik unik.

## Status resmi

### Governance dokumen

| Status | Arti |
|---|---|
| `draft` | Metadata dan versi terbaru masih dikerjakan |
| `pending_review` | Versi awal diajukan dan belum ada versi aktif yang disetujui |
| `approved` | Dokumen mempunyai versi aktif yang disetujui; belum tentu diterbitkan |
| `rejected` | Versi awal ditolak dan belum ada versi aktif |
| `pending_migration` | Berkas tidak tersedia pada storage privat atau belum dapat diverifikasi |
| `archived` | Dokumen ditutup dari publikasi, tetapi record dan berkas dipertahankan |

Pada dokumen yang sudah mempunyai versi aktif, penambahan/review revisi tidak menurunkan status induk dari `approved`. Status revisi dilihat pada `latest_version.status`, sedangkan `current_version` tetap melayani versi resmi lama sampai revisi baru disetujui.

### Status versi

```text
draft ──submit──> pending_review ──approve──> approved
  ▲                       │
  └──────── reject <──────┘

approved ──archive dokumen──> archived
```

Versi yang ditolak dapat diperbaiki dan diajukan ulang. Approval revisi mengganti `current_version_id` secara transaksional; versi lama tetap tersimpan untuk audit.

### Status lain

| Domain | Nilai |
|---|---|
| `classification` | `public`, `internal`, `confidential`, `restricted` |
| `storage_status` | `private`, `legacy_external`, `missing` |
| `integrity_status` | `pending`, `valid`, `mismatch`, `missing` |
| `extraction_status` | `pending`, `processing`, `completed`, `unavailable`, `failed` |
| `retention_status` | `active`, `held`, `due`, `archived` |
| `retention_policy` | `permanent`, `active_5_years`, `active_10_years`, `custom` |

## Lifecycle resmi

### Dokumen baru

```text
Upload PDF resmi (.pdf)
        ↓
Watermark BAPPEDA HALUT (FPDI + FPDF murni)
        ↓
berkas *_watermarked.pdf pada disk privat
        ↓
POST /documents
        ↓
documents: internal + draft + is_public=false
document_versions: v1.0 + draft + checksum valid
current_version_id: NULL
        ↓
Admin Bidang/Admin pengelola submit
        ↓
Reviewer berbeda approve
        ↓
current_version_id = v1
governance_status = approved
        ↓
Petugas klasifikasi menetapkan public
        ↓
Publisher menerbitkan
        ↓
is_public=true dan tampil pada katalog/search publik
```

Flag legacy `is_public=true` pada saat create tidak melewati review; backend hanya mengubahnya menjadi permintaan submit.

### Revisi

1. Berkas revisi diproses melalui pipeline watermark yang sama.
2. `POST /documents/{document}/versions` menambahkan v2 sebagai `draft`.
3. `current_version_id` tetap menunjuk v1.
4. Submit mengajukan v2.
5. Jika v2 ditolak, v1 tetap menjadi versi aktif dan publik.
6. Jika v2 disetujui, `current_version_id` berpindah ke v2.
7. Jika dokumen sebelumnya di-unpublish, publisher harus menerbitkannya kembali.

Isi berkas yang checksum-nya sama dengan versi terbaru ditolak agar histori tidak dipenuhi duplikasi.

### Publikasi

Approval dan publikasi adalah dua keputusan berbeda. `PATCH /documents/{id}/publication` hanya berhasil jika:

- klasifikasi `public`;
- governance `approved`;
- storage `private`;
- current version tersedia dan berstatus `approved`;
- integritas current version `valid`;
- file benar-benar ada pada disk privat;
- checksum aktual sama dengan checksum database.

Unpublish hanya menutup akses publik. Record, versi, checksum, OCR, dan approval log tetap tersedia untuk admin.

### Archive

`DELETE /documents/{id}` tidak melakukan hard delete. Operasi ini:

- menolak request apabila `legal_hold=true`;
- mengubah governance dan retention menjadi `archived`;
- mengosongkan `current_version_id`;
- melakukan unpublish;
- mencatat waktu, aktor, alasan, dan approval log;
- mempertahankan record dokumen, semua versi, checksum, full text, dan berkas.

## Matriks role dan kewenangan

| Kemampuan | Masyarakat | Admin Bidang | Admin Umum | Super Admin |
|---|---:|---:|---:|---:|
| Melihat katalog publik | Ya | Ya | Ya | Ya |
| Preview/unduh versi publik aktif | Ya, signed grant | Ya | Ya | Ya |
| Melihat repository admin | Tidak | Bidang sendiri | Semua | Semua |
| Upload dokumen/versi | Tidak | Bidang sendiri | Ya | Ya |
| Submit untuk review | Tidak | Bidang sendiri | Ya | Ya |
| Review approve/reject | Tidak | Tidak | Ya | Ya |
| Publish/unpublish | Tidak | Tidak | Ya | Ya |
| Ubah klasifikasi | Tidak | Tidak | Ya | Ya |
| Kelola retensi/legal hold | Tidak | Tidak | Ya | Ya |
| Verifikasi checksum manual | Tidak | Tidak | Ya | Ya |
| Lihat log email unduhan | Tidak | Tidak | Ya | Ya |
| Archive | Tidak | Tidak | Ya | Ya |

Permission baru:

- `review_documents`
- `publish_documents`
- `classify_documents`
- `manage_document_retention`
- `verify_document_integrity`

Migration memberi permission tersebut kepada `admin_umum` dan `superadmin`. `admin_bidang` tetap memakai `manage_dokumen` pada scope bidang sendiri.

### Four-eyes

Admin selain Super Admin tidak dapat menyetujui versi yang dibuat atau diajukannya sendiri, walaupun user tersebut mendapat permission review secara langsung. Reviewer harus merupakan akun lain.

Implementasi saat ini mengizinkan Super Admin melewati larangan self-approval sebagai jalur break-glass. Setiap review tetap masuk ke `document_approval_logs`. Secara operasional, gunakan pengecualian ini hanya saat insiden dan isi catatan review; sistem saat ini belum mewajibkan alasan khusus untuk override Super Admin.

Admin Bidang tidak dapat mengakses dokumen bidang lain. Dokumen `confidential` dan `restricted` juga disembunyikan dari Admin Bidang, termasuk ketika bidangnya sama.

## Private storage dan signed grant

### Preview

1. Client memanggil `POST /documents/{id}/preview` dengan `visitor_id` opsional.
2. Server memastikan dokumen masih publik, current version disetujui, dan checksum valid.
3. Server membuat grant `purpose=preview` dan signed URL yang terikat pada ID dokumen serta ID versi.
4. Total `views` bertambah setiap request preview.
5. `unique_views` bertambah satu kali per kombinasi dokumen, hash visitor, dan tanggal.
6. Signed stream memakai `Cache-Control: no-store, private`.

Grant preview dapat digunakan selama TTL, default lima menit. Ia bukan grant download dan tidak dapat dipakai pada endpoint attachment.

### Download

1. Client mengirim email ke `POST /documents/{id}/download`.
2. Email dinormalisasi menjadi lowercase dan trim.
3. Server membuat grant download, tetapi belum menambah counter/log.
4. Client membuka signed URL versi.
5. Saat stream berhasil dikonsumsi pertama kali, grant diberi `consumed_at`, log dibuat, dan counter bertambah.
6. Pemakaian ulang menghasilkan `410 Gone`.

Signed URL tanpa signature/grant, yang kedaluwarsa, bertujuan salah, berbeda dokumen, atau berbeda versi ditolak. Pemeriksaan status publik dan checksum diulang saat stream, sehingga URL lama tidak dapat dipakai setelah unpublish, archive, perubahan klasifikasi, atau kerusakan file.

TTL dikendalikan oleh:

```dotenv
DOCUMENT_PREVIEW_TTL_MINUTES=5
DOCUMENT_DOWNLOAD_TTL_MINUTES=5
```

Catatan batas teknis: preview mengirim PDF penuh ke browser. Pengguna teknis tetap dapat menyimpan byte preview. Sistem mengendalikan akses dan mencatat jalur layanan resmi, tetapi bukan DRM. Bila preview tidak boleh disalin sama sekali, gunakan render gambar beresolusi rendah/per halaman atau hilangkan preview PDF penuh.

## Versioning, approval, dan audit

Setiap transisi dijalankan dalam transaction dan document row dikunci. Tujuannya:

- dua request tidak membuat nomor versi yang sama;
- `current_version_id` tidak menunjuk versi setengah jadi;
- approval log dan status berubah sebagai satu unit;
- v1 tetap tersedia jika v2 gagal atau ditolak.

`document_approval_logs` mencatat:

- versi terkait;
- aktor;
- action;
- status asal/tujuan;
- catatan;
- waktu.

Audit mutation global tetap mencatat route admin. Approval log menyediakan detail lifecycle domain yang tidak ada pada audit HTTP umum.

## Klasifikasi

| Klasifikasi | Penggunaan | Akses publik |
|---|---|---:|
| `public` | Dokumen yang telah diputuskan layak diumumkan | Dapat diterbitkan setelah approval |
| `internal` | Bahan kerja internal umum | Tidak |
| `confidential` | Informasi sensitif dengan akses sangat terbatas | Tidak |
| `restricted` | Informasi terbatas sesuai kewenangan | Tidak |

Dokumen baru default `internal`. Upload oleh Admin Bidang selalu dipaksa menjadi `internal`, walaupun payload meminta `public`. Perubahan dari `public` ke klasifikasi lain otomatis melakukan unpublish dan mencabut akses publik secara efektif.

Klasifikasi bukan pengganti approval. Mengubah dokumen menjadi `public` tidak otomatis menerbitkannya.

## OCR dan full-text search

Ekstraksi selalu memeriksa checksum terlebih dahulu.

1. `pdftotext -layout -enc UTF-8` dicoba untuk PDF yang mempunyai text layer.
2. Jika tidak ada teks dan OCR dinonaktifkan, status menjadi `unavailable`.
3. Jika OCR aktif, `pdftoppm` merender halaman ke PNG.
4. Tesseract menjalankan bahasa `ind+eng` per halaman.
5. Teks dinormalisasi dan disimpan pada `document_versions.full_text`.
6. File gambar sementara dihapus pada blok `finally`.

Default:

- OCR nonaktif sampai binary/language pack diverifikasi;
- resolusi 200 DPI;
- maksimal 100 halaman;
- timeout ekstraksi 120 detik;
- timeout Tesseract 60 detik per halaman.

Pencarian global hanya join ke `current_version_id` dan hanya mengembalikan dokumen:

- `is_public=true`;
- klasifikasi `public`;
- governance `approved`;
- storage `private`;
- versi `approved`;
- checksum `valid`.

`full_text` tidak dikembalikan mentah melalui API. Hasil search hanya memakai ringkasan/snippet maksimal 150 karakter.

## Checksum dan respons insiden

SHA-256 dihitung server dari byte pada disk privat; checksum kiriman client tidak dipercaya.

Checksum diverifikasi sebelum:

- submit;
- approve;
- publish;
- menerbitkan grant preview/download;
- mengirim signed stream;
- mengekstrak teks;
- verifikasi manual.

Jika file hilang:

- versi menjadi `missing`;
- dokumen menjadi `pending_migration`;
- storage menjadi `missing`;
- dokumen langsung di-unpublish.

Jika file berubah:

- versi menjadi `mismatch`;
- dokumen langsung di-unpublish;
- preview/download/publish menghasilkan konflik atau validation error;
- file tidak otomatis ditimpa atau dihapus agar dapat diinvestigasi.

## Retention dan legal hold

Kebijakan:

- `permanent`: tidak mempunyai tanggal jatuh tempo;
- `active_5_years`: tanggal dihitung lima tahun dari `effective_at` atau tanggal penerapan;
- `active_10_years`: sama untuk sepuluh tahun;
- `custom`: `retention_until` wajib diisi.

Scanner harian hanya menandai `retention_status=due` dan membuat approval log. Scanner tidak menghapus file atau record.

`legal_hold=true`:

- mengubah retention status menjadi `held`;
- membutuhkan `review_note`;
- mengecualikan dokumen dari scanner;
- membuat operasi archive ditolak `422`.

Melepas legal hold juga wajib disertai alasan.

## Analytics dan privasi

- Email pada access grant dan download log dienkripsi menggunakan `APP_KEY`.
- SHA-256 email lowercase dipakai untuk pencocokan tepat dan unique email.
- IP address serta user-agent tidak dikumpulkan.
- Grant download hanya dapat menghasilkan satu download log karena `access_grant_id` unik.
- Unique preview memakai hash `visitor_id` per tanggal.
- Raw storage path, full text, token hash, dan ID aktor internal disembunyikan dari response publik.
- `APP_KEY` wajib disimpan bersama backup terenkripsi. Kehilangan key membuat email terenkripsi tidak dapat dipulihkan.

Tanpa `visitor_id`, server membuat UUID acak sehingga setiap request dihitung sebagai unique view baru. Frontend sebaiknya mempertahankan identifier pseudonim stabil yang tidak berisi email/nama.

## Endpoint API

Base path: `/api/v1`.

### Publik

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/documents` | Katalog versi aktif yang lolos seluruh filter publik |
| `POST` | `/documents/{id}/preview` | Membuat grant preview dan mencatat statistik |
| `GET` | `/documents/{document}/versions/{version}/preview-file` | Signed inline stream |
| `POST` | `/documents/{id}/download` | Memvalidasi email dan membuat grant satu kali |
| `GET` | `/documents/{document}/versions/{version}/file` | Signed one-time attachment stream |
| `GET` | `/search?q=...` | Pencarian metadata dan full text versi publik aktif |

### Admin

| Method | Endpoint | Permission/fungsi |
|---|---|---|
| `GET` | `/admin/documents` | `manage_dokumen`; repository sesuai scope |
| `GET` | `/admin/documents/{id}/governance` | Detail metadata, versi, dan approval log |
| `GET` | `/admin/documents/{id}/versions/{version}/preview-file` | Temporary signed URL preview inline dokumen untuk admin |
| `PUT` | `/admin/documents/{id}/governance` | Klasifikasi/retensi/legal hold |
| `POST` | `/documents` | Membuat dokumen dan v1 privat |
| `POST` | `/documents/{id}/versions` | Menambah path hasil pipeline watermark sebagai revisi |
| `PATCH` | `/documents/{id}/workflow/submit` | Mengajukan latest version |
| `PATCH` | `/documents/{id}/workflow/review` | Approve/reject oleh reviewer |
| `POST` | `/documents/{id}/integrity` | Verifikasi checksum latest version |
| `POST` | `/documents/{id}/versions/{version}/extract` | Ekstraksi teks versi tertentu |
| `PATCH` | `/documents/{id}/publication` | Publish/unpublish |
| `DELETE` | `/documents/{id}` | Lifecycle archive, bukan hard delete |
| `GET` | `/document-download-logs` | Riwayat unduhan terukur |

Penambahan versi menerima `file_path` hasil upload/watermark privat dan `change_summary`. Raw file tidak boleh langsung masuk endpoint versi karena akan melewati pipeline konversi/watermark.

Submit menerima `note` atau alias `notes`. Review menerima:

```json
{
  "decision": "approved",
  "notes": "Metadata dan checksum telah diperiksa."
}
```

Kontrak lama `{ "action": "approve", "note": "..." }` juga diterima.

## Dampak migrasi aktual

Hasil verifikasi database lokal setelah migration batch 9:

| Kondisi | Jumlah | Hasil |
|---|---:|---|
| Total dokumen | 13 | Seluruhnya mempunyai `archive_code` dan row versi |
| Legacy external | 10 | `storage_status=legacy_external`, `governance_status=pending_migration`, `classification=internal`, tidak publik |
| File privat valid | 3 | Tetap `approved`, `public`, dan `is_public=true`; v1 mempunyai checksum valid |
| Total versi hasil backfill | 13 | 10 placeholder `v1.0-legacy`, 3 versi privat valid |

Keputusan ini sengaja fail-closed:

- sepuluh link eksternal tidak dianggap sebagai bukti berkas resmi yang dikuasai BAPPEDA;
- link tersebut tidak diteruskan dan tidak muncul pada katalog/search;
- placeholder versi mempertahankan alamat lama hanya untuk proses remediasi admin;
- tiga file privat yang benar-benar ada tidak mengalami downtime publik;
- migration tidak mengunduh data eksternal secara otomatis karena asal, izin, isi, dan checksum belum diverifikasi.

## Remediasi dokumen legacy

Lakukan satu per satu:

1. Buka repository admin dan filter `pending_migration` atau `legacy_external`.
2. Catat `archive_code`, judul, nomor dokumen, URL lama, pemilik OPD, dan keputusan klasifikasi.
3. Dapatkan salinan dari sumber kedinasan yang sah. Jangan mengunduh ulang dari link yang tidak lagi dipercaya tanpa verifikasi pemilik.
4. Cocokkan judul, nomor, tahun, penandatangan, jumlah halaman, dan status final.
5. Unggah melalui dashboard/pipeline chunk upload agar file dinormalisasi menjadi PDF dan diberi watermark.
6. Ambil `file_path` privat hasil pipeline.
7. Tambahkan versi baru pada record legacy yang sama:

   ```http
   POST /api/v1/documents/{id}/versions
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "file_path": "documents/2026/07/..._watermarked.pdf",
     "change_summary": "Remediasi arsip legacy dari sumber resmi OPD"
   }
   ```

8. Lengkapi metadata melalui `PUT /admin/documents/{id}/governance`.
9. Submit versi.
10. Gunakan akun reviewer yang berbeda untuk approve.
11. Jika layak publik, tetapkan klasifikasi `public` dan panggil endpoint publication.
12. Jalankan integritas dan ekstraksi teks.
13. Pastikan record muncul pada katalog/search dan URL lama tidak digunakan oleh response.

Jangan mengganti `file_path`, checksum, status, atau `current_version_id` langsung melalui SQL. Jalur service memastikan transaksi, histori, four-eyes, dan validasi integritas tetap berlaku.

## Deployment

### 1. Backup dan preflight

Wajib cadangkan:

- database;
- `storage/app/private/documents`;
- `APP_KEY` dan `APP_PREVIOUS_KEYS`;
- `.env` produksi melalui secret manager;
- release aplikasi sebelumnya.

Contoh SQLite:

```bash
cd backend
sqlite3 database/database.sqlite ".backup '/backup/bappeda-before-archive.sqlite'"
tar -C storage/app/private -czf /backup/bappeda-private-documents.tgz documents
```

Contoh MySQL:

```bash
mysqldump --single-transaction --routines --triggers \
  -u <user> -p <database> > /backup/bappeda-before-archive.sql
```

Validasi backup di host terpisah sebelum migrasi. Pastikan ruang storage cukup untuk versi baru, file OCR sementara, database `full_text`, dan backup.

### 2. Dependensi sistem

Untuk PDF text layer:

```bash
command -v pdftotext
command -v pdfinfo
```

Untuk OCR:

```bash
command -v pdftoppm
command -v tesseract
tesseract --list-langs
```

Daftar bahasa harus memuat `ind` dan `eng`. LibreOffice tetap dibutuhkan untuk konversi DOCX/XLSX/PPTX sebelum watermark.

Contoh paket Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install poppler-utils tesseract-ocr tesseract-ocr-ind tesseract-ocr-eng libreoffice
```

Pemasangan paket server harus mengikuti prosedur perubahan infrastruktur organisasi.

### 3. Environment

```dotenv
DOCUMENT_ARCHIVE_DISK=local
DOCUMENT_ARCHIVE_CODE_PREFIX=BPH-DOC
DOCUMENT_PREVIEW_TTL_MINUTES=5
DOCUMENT_DOWNLOAD_TTL_MINUTES=5
DOCUMENT_EXTRACTION_TIMEOUT=120
DOCUMENT_OCR_PAGE_TIMEOUT=60
DOCUMENT_OCR_ENABLED=false
DOCUMENT_OCR_LANGUAGE=ind+eng
DOCUMENT_OCR_RESOLUTION=200
DOCUMENT_OCR_MAX_PAGES=100
DOCUMENT_RETENTION_SCAN_LIMIT=500
PDFTOTEXT_BINARY=
PDFINFO_BINARY=
PDFTOPPM_BINARY=
TESSERACT_BINARY=
```

Biarkan path binary kosong jika program tersedia pada `PATH`. Aktifkan OCR hanya setelah bahasa, waktu proses, CPU, RAM, dan batas halaman diuji.

### 4. Deploy dan migrate

```bash
cd backend
php artisan down
php artisan config:clear
php artisan migrate --force
php artisan permission:cache-reset
php artisan route:list --path=documents
php artisan config:cache
php artisan up
```

Migration membuat tabel versi/log/grant, permission baru, dan melakukan backfill. Deploy backend harus selesai sebelum frontend governance diaktifkan.

### 5. Verifikasi pascamigrasi

```bash
php artisan migrate:status
php artisan schedule:list
php artisan documents:archive-retention-scan --dry-run
php artisan documents:archive-extract
php artisan test --compact tests/Feature/DocumentKnowledgeArchiveTest.php
```

Verifikasi manual:

1. dokumen baru menjadi internal/draft;
2. v1 mempunyai SHA-256;
3. akun pembuat tidak dapat approve sendiri;
4. reviewer dapat approve;
5. dokumen internal tidak dapat dipublish;
6. signed URL tanpa signature ditolak;
7. grant download hanya dapat digunakan satu kali;
8. perubahan byte file membuat stream/publish ditolak;
9. legal hold memblokir archive;
10. search tidak membocorkan full text internal.

### 6. Ekstraksi dan scheduler

Jalankan ekstraksi pertama dengan OCR nonaktif untuk memproses PDF yang sudah memiliki text layer:

```bash
php artisan documents:archive-extract
```

Setelah OCR tervalidasi:

```bash
php artisan config:clear
php artisan documents:archive-extract --force
```

Scheduler:

- retention scan: setiap hari pukul 01:30;
- text extraction: setiap hari pukul 02:00.

Production membutuhkan satu cron:

```cron
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

## Command operasional

```bash
# Daftar schedule
php artisan schedule:list

# Preview dokumen jatuh tempo tanpa mutasi
php artisan documents:archive-retention-scan --dry-run

# Tandai maksimal 100 arsip jatuh tempo sebagai due
php artisan documents:archive-retention-scan --limit=100

# Ekstrak semua versi yang pending/failed/unavailable pada storage privat
php artisan documents:archive-extract

# Ekstrak satu dokumen berdasarkan ID atau archive_code
php artisan documents:archive-extract BPH-DOC-00000013

# Ekstrak versi tertentu
php artisan documents:archive-extract --version-id=13

# Paksa ekstraksi ulang
php artisan documents:archive-extract BPH-DOC-00000013 --force

# Verifikasi route dan migration
php artisan route:list --path=documents
php artisan migrate:status
```

Gunakan endpoint `POST /documents/{id}/integrity` untuk verifikasi checksum latest version dari dashboard.

## Pro, kontra, dan dampak tiap perubahan

| Perubahan | Pro | Kontra/biaya | Dampak operasional |
|---|---|---|---|
| Storage privat | Path asli tidak dapat dibuka langsung | Semua transfer melewati backend; I/O server naik | Bookmark file lama berhenti; proxy/PHP harus mampu stream PDF |
| Signed grant terikat versi | URL bocor berumur pendek dan tidak dapat dipindah ke versi lain | URL kedaluwarsa dan perlu dibuat ulang | Frontend selalu meminta grant sebelum membuka file |
| One-time download | Counter/log mencerminkan konsumsi aktual | Retry setelah konsumsi memerlukan grant baru | Link unduh menghasilkan `410` setelah dipakai |
| Versioning immutable | Histori revisi dan bukti dokumen lama tetap ada | Storage dan database bertambah | Perlu monitoring kapasitas serta kebijakan preservasi |
| Four-eyes approval | Mengurangi publikasi sepihak/salah | Membutuhkan minimal dua akun aktif | Admin Bidang hanya submit; Admin Umum/Super Admin review |
| Klasifikasi | Batas publik/internal lebih eksplisit | Metadata wajib dirawat | Turun dari `public` otomatis unpublish |
| Checksum SHA-256 | Perubahan byte terdeteksi | Hashing file besar menambah I/O | Mismatch/missing langsung menghentikan distribusi |
| OCR/full text | Dokumen gambar dapat dicari | CPU/RAM tinggi; hasil OCR tidak selalu akurat | Perlu Poppler/Tesseract, bahasa, timeout, dan review hasil |
| Retention scan aman | Jatuh tempo terlihat tanpa penghapusan otomatis | Disposisi akhir masih memerlukan keputusan manusia | Scheduler hanya menandai `due` |
| Legal hold | Mencegah archive ketika ada perkara/pemeriksaan | Perlu alasan dan disiplin melepas hold | Archive menghasilkan `422` selama hold aktif |
| Lifecycle archive | Tidak kehilangan versi/checksum/histori | Data tidak langsung menghemat storage | Tombol hapus berarti archive, bukan hard delete |
| Analytics minimal | View/download terukur dengan pengumpulan data minimum | Tidak ada analisis IP/perangkat | Email dan visitor pseudonim menjadi dasar statistik |
| Karantina legacy | Tidak menyatakan link luar sebagai arsip resmi | Sepuluh dokumen hilang sementara dari portal | Admin harus melakukan remediasi satu per satu |

## Rollback aman

### Prinsip

Rollback yang aman adalah restore pasangan:

1. release aplikasi sebelumnya;
2. snapshot database sebelum migration;
3. snapshot storage privat pada waktu yang sama;
4. `APP_KEY` yang sama.

Jangan hanya menjalankan `migrate:rollback` setelah modul menerima dokumen/versi baru. Migration down menghapus tabel versi, approval, access grant, view log, full text, checksum, dan permission baru. Data tersebut tidak dapat direkonstruksi hanya dari `documents`.

### Jika migration baru saja dijalankan dan belum ada mutasi

1. `php artisan down`.
2. Simpan salinan database/storage saat ini untuk forensik.
3. Rollback release.
4. Restore snapshot database dan storage pra-deploy.
5. Clear config/permission cache.
6. Jalankan smoke test versi lama.
7. `php artisan up`.

`php artisan migrate:rollback --step=1` hanya boleh digunakan pada salinan uji atau deployment window yang dipastikan belum menerima mutasi. Down migration tidak mengembalikan nilai publikasi external legacy ke keadaan awal; ini fail-closed tetapi bukan pemulihan penuh.

### Jika sudah ada versi baru

- jangan rollback destructive;
- pertahankan backend baru dan rollback frontend saja bila perlu;
- atau export seluruh `documents`, `document_versions`, approval logs, grants/logs, dan file baru sebelum restore;
- lakukan rekonsiliasi dengan daftar archive code;
- minta persetujuan pemilik data sebelum kehilangan histori.

Signed URL lama dapat menjadi tidak valid setelah rollback, perubahan `APP_URL`, atau perubahan `APP_KEY`. Jangan mengganti `APP_KEY` sebagai bagian rollback biasa.

## Troubleshooting

### Dokumen tidak muncul di publik

Periksa berurutan:

- `is_public=true`;
- `classification=public`;
- `governance_status=approved`;
- `storage_status=private`;
- `current_version_id` terisi;
- current version `status=approved`;
- current version `integrity_status=valid`;
- file ada pada disk lokal.

Jangan memperbaiki dengan update SQL langsung. Gunakan governance, review, integrity, dan publication endpoint.

### Preview/download menghasilkan 403

- URL tidak mempunyai signature;
- signature berubah karena parameter diedit;
- grant salah tujuan/dokumen/versi;
- reverse proxy mengubah host/path;
- `APP_URL` tidak sesuai;
- signed URL sudah kedaluwarsa.

Buat grant baru dan pastikan aplikasi menggunakan relative signed URL sebagaimana response API.

### Download menghasilkan 410

Grant telah dipakai atau kedaluwarsa. Minta grant baru dengan mengirim ulang email. Jangan mengosongkan `consumed_at` secara manual.

### Stream/publish menghasilkan 409 atau 422 integritas

```bash
php artisan documents:archive-extract --version-id=<id> --force
```

Ekstraksi bukan perbaikan checksum. Bandingkan file dengan sumber resmi, unggah sebagai versi baru, submit, dan review. Jangan mengganti checksum database agar cocok dengan file yang belum diverifikasi.

### `pdftotext`/OCR unavailable

```bash
command -v pdftotext pdfinfo pdftoppm tesseract
tesseract --list-langs
php artisan config:show document-archive
```

Pastikan user proses PHP mempunyai izin execute binary dan read/write pada storage temporary. OCR tetap `unavailable` bila `DOCUMENT_OCR_ENABLED=false`.

### OCR terlalu lambat

- turunkan `DOCUMENT_OCR_MAX_PAGES`;
- turunkan resolusi dari 200 secara terukur;
- proses dokumen tertentu, bukan seluruh arsip;
- jalankan pada jam rendah;
- monitor CPU/RAM/disk;
- jangan menaikkan timeout tanpa mengukur kapasitas.

### Retention scan tidak berjalan

```bash
php artisan schedule:list
php artisan documents:archive-retention-scan --dry-run
```

Periksa cron scheduler, timezone server, `retention_until`, `retention_policy`, legal hold, dan lock `withoutOverlapping`.

### Legacy tetap `pending_migration`

Hal ini normal sampai versi privat baru diunggah, submit, dan disetujui. Menambahkan file ke storage tanpa melalui endpoint tidak cukup karena current version, checksum, approval, dan audit belum terbentuk.

## Penjaga regresi

Suite utama:

```bash
cd backend
php artisan test --compact tests/Feature/DocumentKnowledgeArchiveTest.php
```

Suite menjaga secure default, filter publik, reviewer workflow, scope bidang, signed stream, unique view, one-time download, revision swap, checksum tamper, legal hold, dan full-text isolation.

## Troubleshooting & Mitigasi Frontend (Preview & Download Modal)

### Error Boundary "Terjadi Kendala Memuat Halaman" pada Preview Dokumen
- **Penyebab**:
  1. **Variable Shadowing**: Parameter prop bernama `document` pada `DocumentPreviewModal` atau `DocumentDownloadModal` menimpa objek global browser `window.document`. Saat komponen memanggil `document.body.style.overflow`, JavaScript mengevaluasi `(AdminDocument).body`, menghasilkan `undefined`, sehingga throw `TypeError: Cannot read properties of undefined (reading 'style')` yang memicu fallback `frontend/src/app/error.tsx`.
  2. **Unchecked String Operations**: Pemanggilan `.toUpperCase()` atau `.replace()` langsung pada field opsional/null seperti `doc.jenis` pada grid publik atau filter kategori tanpa fallback `doc.jenis || ""`.
  3. **Null File URL**: `resolveDocumentUrl(url)` melempar exception jika menerima `null` / `undefined`.
- **Solusi Standar Arsitektur**:
  - Selalu rename prop `document` menjadi `document: doc` dalam destructuring komponen modal.
  - Akses DOM secara eksplisit melalui `window.document.body` dengan pengecekan `typeof window !== "undefined"`.
  - Gunakan helper defensif `resolveDocumentUrl(url?: string | null): string` yang mengembalikan string kosong jika URL tidak tersedia.
  - Sediakan UI Fallback ramah pengguna di dalam modal pratinjau apabila dokumen belum memiliki tautan berkas digital, dilengkapi opsi "Tab Baru" dan tombol unduh.


