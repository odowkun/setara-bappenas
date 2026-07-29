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

## 🔑 Akun Demo Quick Login SPBE (3 Role):
- **👑 Administrator (SuperAdmin)**: `admin@halmaherautarakab.go.id` (Pass: `password123`)
- **📰 Admin Umum**: `umum@halmaherautarakab.go.id` (Pass: `password123`)
- **🏗️ Admin Bidang**: `infrastruktur@halmaherautarakab.go.id` (Pass: `password123`)

## Watermark Dokumen Otomatis

Dokumen resmi yang diunggah melalui dashboard otomatis dinormalisasi menjadi PDF dan diberi watermark transparan `BAPPEDA HALUT` pada setiap halaman. Detail alur dan kebutuhan LibreOffice tersedia di [walkthrough.md](walkthrough.md).
