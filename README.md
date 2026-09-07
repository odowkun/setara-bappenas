# SMART BAPPEDA HALMAHERA UTARA — MONOREPO PROJECT

Proyek terpadu Portal Publik & Dashboard Admin BAPPEDA Kabupaten Halmahera Utara dengan arsitektur terpisah **Frontend Next.js 15** dan **Backend Laravel 11 REST API**.

---

## ⚡ CARA CEPAT MENJALANKAN SELURUH APLIKASI

Cukup jalankan script launcher **`./start.sh`** dari akar folder proyek:

```bash
./start.sh
```

Script ini secara otomatis akan:
- Memeriksa kelengkapan dependensi (`node`, `npm`, `php`, `curl`, `lsof`, `pgrep`).
- Membersihkan port `3000` (Frontend) & `8000` (Backend API) jika sedang terpakai.
- Menjalankan **Laravel 11 REST API** (`http://127.0.0.1:8000`) & **Next.js 15 Frontend** (`http://127.0.0.1:3000`) secara bersamaan.
- Melakukan polling *health check* dan menampilkan tautan aktif di perambah.

---

## 📁 Struktur Folder Utama

```
/Users/mac/Herd/bappeda-halut/
├── start.sh                   # Script Launcher Otomatis (Frontend + Backend)
├── frontend/                  # Next.js 15 App Router Frontend (Port 3000)
│   ├── src/app                # App Router Routes (/dashboard, /dokumen, /gis-peta)
│   ├── src/components         # Modern Light Mode UI Components & Widgets
│   ├── src/services           # AdminService Client REST API Binder
│   └── package.json           # Frontend Dependencies
│
└── backend/                   # Laravel 11 REST API Backend (Port 8000 / Herd)
    ├── app/Http/Controllers   # API Controllers (Auth, User, Document, Survey)
    ├── database/seeders       # Default Seeders untuk 3 Role
    ├── routes/api.php         # 17 Registered REST API v1 Routes
    └── composer.json          # Backend Dependencies
```

---

## 🛠️ Cara Menjalankan Layanan Secara Manual (Alternatif)

### 1. Menjalankan Frontend Next.js saja:
```bash
cd frontend
npm run dev
```
- **URL Public Portal**: `http://localhost:3000`
- **URL Executive Dashboard**: `http://localhost:3000/dashboard/login`

### 2. Menjalankan Backend Laravel 11 saja:
```bash
cd backend
php artisan serve --port=8000
```
- **Base API Endpoint**: `http://localhost:8000/api/v1`
- **Domain Herd**: `http://bappeda-halut.test` (jika menggunakan Laravel Herd)

---

## 🔑 Bootstrap Akun Administrator

Proyek tidak menyediakan akun atau password demo. Untuk membuat Super Admin pertama, isi `BAPPEDA_SEED_SUPERADMIN_NAME`, `BAPPEDA_SEED_SUPERADMIN_EMAIL`, dan `BAPPEDA_SEED_SUPERADMIN_PASSWORD` pada `backend/.env`, lalu jalankan:

```bash
cd backend
php artisan db:seed --class=UserSeeder
```

Password minimal 12 karakter dan wajib mengandung huruf besar, huruf kecil, dan angka. Jangan menyimpan password aktual di repository atau dokumentasi.

Panduan kontrol akses, enkripsi data pribadi, deployment, rollback, pro/kontra, dan risiko tersisa tersedia di [docs/security-rbac-privacy.md](docs/security-rbac-privacy.md).

Aturan database sebagai sumber data resmi tunggal, termasuk Agenda, Pengumuman, kategori, Geoprocessing, ESRI, deployment, dan rollback tersedia di [docs/database-single-source.md](docs/database-single-source.md).

Alur draf, terbit, batalkan publikasi, route resmi, validasi konten, pro/kontra, dampak, deployment, dan rollback tersedia di [docs/official-publication-workflow.md](docs/official-publication-workflow.md).

Arsitektur arsip pengetahuan dokumen—private storage, signed grant, versioning, review four-eyes, klasifikasi, OCR/full-text, checksum, retensi/legal hold, remediasi legacy, deployment, dan troubleshooting—tersedia di [docs/document-knowledge-archive.md](docs/document-knowledge-archive.md).

## Watermark Dokumen Otomatis

Dokumen resmi yang diunggah melalui dashboard otomatis dinormalisasi menjadi PDF dan diberi watermark transparan `BAPPEDA HALUT` pada setiap halaman. Detail alur dan kebutuhan LibreOffice tersedia di [walkthrough.md](walkthrough.md).
