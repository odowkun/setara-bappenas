# API CONTRACT — BAPPEDA HALUT

## Protokol

- Production: `https://api.bappeda.halmaherautarakab.go.id/api/v1`
- Development: `http://localhost:8000/api/v1`
- Format: JSON UTF-8, kecuali endpoint berkas.
- Endpoint admin memakai header `Authorization: Bearer <token>` dari Laravel Sanctum.
- Input tidak valid menghasilkan `422`, sesi tidak valid `401`, dan permission tidak cukup `403`.
- Endpoint publik yang menerima input atau mencatat counter memakai rate limit.

## Autentikasi

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `POST` | `/auth/login` | Publik, 5/menit | Membuat token dan mengembalikan user beserta permission dari server |
| `GET` | `/auth/me` | Login | Memvalidasi token dan memuat ulang role/permission |
| `POST` | `/auth/logout` | Login | Mencabut token yang sedang digunakan |
| `PATCH` | `/auth/profile` | Login | Mengubah nama, email, NIP, jabatan |
| `PUT` | `/auth/password` | Login | Mengubah password dan mencabut sesi lain |

Password baru minimal 12 karakter serta mengandung huruf besar, huruf kecil, dan angka. Frontend tidak boleh menentukan role, permission, atau identitas aktor audit.

## Batas data publik dan admin

| Data | Endpoint publik | Endpoint admin | Batas utama |
|---|---|---|---|
| Dokumen | `GET /documents` | `GET /admin/documents` | Publik hanya current version `approved`, klasifikasi `public`, storage privat, checksum valid; Admin Bidang hanya bidang sendiri |
| Proyek | `GET /proyek-details` | `GET /admin/proyek-details` | Publik hanya proyek dari dokumen publik; Admin Bidang hanya bidang sendiri |
| Berita | `GET /news`, `GET /news/{id}` | `GET /admin/news` | Publik hanya berita terbit |
| Survei | `GET /surveys/summary`, `GET /surveys/config` | `GET /surveys` | Ringkasan publik tidak mengandung PII |
| Kritik/saran | `POST /kritik` | `GET /kritik` | Daftar dan tanggapan hanya admin berizin |
| Riwayat unduhan | Tidak ada | `GET /document-download-logs` | Email hanya tersedia untuk admin berizin |
| User | Tidak ada | `/users` | CRUD hanya role `superadmin` |
| Audit | Tidak ada | `GET /audit-logs` | Hanya permission `view_audit_logs` |
| Agenda | `GET /agendas`, `GET /agenda-categories` | `GET /admin/agendas` | Publik hanya agenda terbit |
| Pengumuman | `GET /pengumuman`, `GET /announcement-types` | `GET /admin/pengumuman` | Publik hanya terbit dan belum kedaluwarsa |
| Kategori berita | `GET /news-categories` | endpoint mutasi yang sama | Kategori master berasal dari database |
| Geoprocessing | `GET /gis/geoprocessing/analyses` | endpoint mutasi yang sama | Hasil dan sumber kalkulasi disimpan di database |

Endpoint admin serta seluruh mutasi konten wajib Bearer token dan permission yang sesuai.

## Transisi publikasi resmi

Semua konten baru dapat disimpan sebagai draf. Perubahan status memakai endpoint khusus berikut:

| Method | Endpoint | Permission |
|---|---|---|
| `PATCH` | `/news/{id}/publication` | `manage_berita` |
| `PATCH` | `/agendas/{id}/publication` | `manage_pengumuman` |
| `PATCH` | `/pengumuman/{id}/publication` | `manage_pengumuman` |
| `PATCH` | `/galeri/{id}/publication` | `manage_galeri` |
| `PATCH` | `/documents/{id}/publication` | `publish_documents` |

Payload:

```json
{
  "is_published": true
}
```

Dokumen tetap mengembalikan field domain `is_public`; endpoint menerima `is_published` agar kontrak tombol publikasi konsisten. Publikasi mencatat `published_at` dan `published_by_user_id`; unpublish mengosongkan keduanya. Konten yang belum memenuhi syarat minimum menghasilkan `422`.

## Repository dokumen publik

- `GET /documents` — daftar dokumen dengan current version approved/public/private/valid.
- `POST /documents/{id}/preview` — membuat grant preview terikat versi, mencatat total view dan unique view harian.
- `GET /documents/{document}/versions/{version}/preview-file?...` — signed inline stream.
- `POST /documents/{id}/download` — memvalidasi email dan membuat one-time signed grant; belum menambah counter.
- `GET /documents/{document}/versions/{version}/file?...` — mengirim attachment, lalu mencatat log/counter satu kali saat grant dikonsumsi.

Payload unduhan:

```json
{
  "email": "masyarakat@example.com"
}
```

Riwayat menyimpan ID dokumen, ID versi, grant yang dikonsumsi, email terenkripsi, hash email untuk hitungan unik/filter tepat, dan waktu unduh. IP serta user-agent pengunduh tidak dikumpulkan. Raw path, raw token, checksum, dan full text tidak diekspos publik.

## Tata kelola arsip dokumen

| Method | Endpoint | Permission/fungsi |
|---|---|---|
| `GET` | `/admin/documents/{id}/governance` | `manage_dokumen`; detail metadata, versi, dan approval |
| `PUT` | `/admin/documents/{id}/governance` | `classify_documents` atau `manage_document_retention` |
| `POST` | `/documents/{id}/versions` | `manage_dokumen`; menambah path PDF watermark privat |
| `PATCH` | `/documents/{id}/workflow/submit` | `manage_dokumen` |
| `PATCH` | `/documents/{id}/workflow/review` | `review_documents` |
| `POST` | `/documents/{id}/integrity` | `verify_document_integrity` |
| `POST` | `/documents/{id}/versions/{version}/extract` | `manage_dokumen` |
| `PATCH` | `/documents/{id}/publication` | `publish_documents` |
| `DELETE` | `/documents/{id}` | Lifecycle archive; legal hold menghasilkan `422` |

Governance status: `draft`, `pending_review`, `approved`, `rejected`, `pending_migration`, `archived`. Klasifikasi: `public`, `internal`, `confidential`, `restricted`. Hanya reviewer yang berbeda dari pembuat/pengaju yang dapat approve dalam alur normal; Super Admin merupakan break-glass exception.

## Mutasi konten admin

Mutasi dokumen, jenis dokumen, berita, profil, galeri, pejabat, tautan OPD, survei, kritik/saran, proyek, lampiran, dan grafik dashboard dilindungi middleware Sanctum serta permission. Mutasi yang berhasil dicatat oleh audit middleware dengan identitas aktor dari sesi server; body request tidak disalin ke audit log.

Admin Bidang hanya dapat mengelola dokumen dan proyek yang mempunyai `bidang` sama dengan akun. Super Admin mendapat seluruh permission melalui server-side gate, dan hanya role `superadmin` yang boleh mengelola user.

## Data pribadi dan cache

- Nama/email/pekerjaan/saran survei dienkripsi.
- Nama/email/telepon/subjek/pesan/balasan kritik dienkripsi.
- Email pengunduh dienkripsi.
- Respons autentikasi, user, audit, survei lengkap, kritik, dan riwayat unduhan memakai `Cache-Control: no-store, private`.
- `APP_KEY` adalah bagian wajib dari backup; tanpa key tersebut data terenkripsi tidak dapat dipulihkan.

Detail permission, deployment, rollback, dan dampak perubahan ada di [docs/security-rbac-privacy.md](docs/security-rbac-privacy.md).

Kontrak sumber data tunggal dan perilaku saat API/ESRI gagal ada di [docs/database-single-source.md](docs/database-single-source.md).

Kontrak workflow publikasi lengkap ada di [docs/official-publication-workflow.md](docs/official-publication-workflow.md).

Kontrak lengkap arsip dokumen, status, signed grant, OCR, checksum, retensi, migration, rollback, dan troubleshooting ada di [docs/document-knowledge-archive.md](docs/document-knowledge-archive.md).
