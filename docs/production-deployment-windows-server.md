# Panduan Deployment Server Windows — Smart Bappeda Halut

Dokumentasi arsitektur dan panduan operasional deployment aplikasi SMART BAPPEDA HALUT pada Windows Server menggunakan arsitektur port kustom terisolasi.

---

## 1. Pemetaan Port Kustom (Zero Conflict)

Untuk menjamin sistem lain di server tidak terganggu, seluruh port standar diganti dengan port kustom:

| Komponen | Port Standar | Port Kustom Produksi | Protokol | URL Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (Next.js SSR)** | `3000` | **`3100`** | TCP/HTTP | `http://202.65.234.118:3100` |
| **Backend API (Laravel)** | `8000` / `80` | **`8100`** | TCP/HTTP | `http://202.65.234.118:8100/api` |
| **Database (MariaDB/MySQL)** | `3306` | **`3308`** | TCP/Internal | `127.0.0.1:3308` (db_bappeda_halut) |

---

## 2. Arsitektur Runtime Server

1. **Node.js**: v20.18.0 (LTS) x64 + PM2 Process Manager
2. **PHP**: v8.3.33 (Thread Safe x64) diletakkan di `C:\php83` (terpisah dari PHP 7.4 XAMPP)
3. **Composer**: v2.11 diletakkan di `C:\php83\composer.bat`
4. **Database Service**: Windows Service `MySQL_Bappeda` berjalan dari `C:\xampp\mysql\bin\mysqld.exe` menggunakan konfigurasi port `3308` pada `my.ini`.

---

## 3. Struktur Direktori Produksi (`C:\bappeda-halut`)

```
C:\bappeda-halut\
├── frontend\
│   ├── server.js             # Standalone production server Next.js
│   ├── package.json
│   ├── node_modules\         # Minimal bundled dependencies
│   ├── public\               # Assets & gambar publik
│   └── .next\
│       └── static\           # Static bundle CSS/JS
├── backend\
│   ├── .env                  # Pre-configured produksi (port 3308 & 8100)
│   ├── app\
│   ├── config\
│   ├── database\
│   └── vendor\
└── start-server.ps1          # One-click startup & PM2 daemon launcher
```

---

## 4. Perintah Operasional Harian (PowerShell)

### Status Layanan
```powershell
pm2 list
netstat -ano | findstr 3100
netstat -ano | findstr 8100
netstat -ano | findstr 3308
```

### Restart Layanan
```powershell
pm2 restart bappeda-fe
pm2 restart bappeda-api
```

### Memeriksa Log
```powershell
pm2 logs bappeda-fe
pm2 logs bappeda-api
```
