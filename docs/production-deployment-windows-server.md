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

> [!NOTE]
> **Aturan Routing Berkas Publik & Uploads**:
> Cloudflare Tunnel hanya meneruskan path `/api/*` dan `/storage/*` ke port `8100` (Laravel). Oleh karena itu, seluruh upload publik (dokumen, media galeri, dan logo tautan OPD) WAJIB disimpan di disk `public` (`storage/app/public/...`) dan diakses melalui path `/storage/...`.
> Untuk mengatasi limitasi NTFS symlink di Windows Server 2016, berkas `/storage/*` dilayani langsung via `backend/server.php` dan fallback `backend/routes/web.php` langsung dari direktori fisik `storage/app/public/`.

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

---

## 5. Pemeliharaan & Ketahanan Otomatis (Maintenance)

### A. Rotasi Log PM2 (Cegah Disk C: Penuh)
Agar log PM2 tidak membengkak tanpa batas:
```powershell
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 save
```

### B. Auto-Backup Database MariaDB (Harian 02:00 Pagi)
Script backup diletakkan di `C:\bappeda-halut\scripts\auto-backup-db.ps1`.
Jalankan perintah ini di PowerShell (Run as Administrator) untuk mendaftarkan Task Scheduler:
```powershell
schtasks /Create /TN "Bappeda_Daily_DB_Backup" /TR "powershell.exe -ExecutionPolicy Bypass -File C:\bappeda-halut\scripts\auto-backup-db.ps1" /SC DAILY /ST 02:00 /RU "SYSTEM" /RL HIGHEST /F
```

Backup akan tersimpan di `C:\bappeda-halut\backups\database` dalam format `.zip` terkompresi dengan retensi otomatis 14 hari.

### C. Otomasi CI/CD (GitHub Actions Self-Hosted Runner)
Otomatis deploy setiap `git push origin develop` tanpa perlu remote server:
- **Workflow**: `.github/workflows/deploy.yml`
- **Lokasi Agen**: `C:\actions-runner`
- **Tipe Layanan**: Windows Background Scheduled Task (Auto-Start saat server boot)
- **Koneksi Jaringan**: Outbound HTTPS (100% tembus Starlink CGNAT tanpa buka port router)
- **Alur Kerja**: Sinkronisasi kode ➡️ Migrasi database Laravel ➡️ Cache config ➡️ Build frontend ➡️ PM2 Zero-Downtime Reload.
- **Standar Kompatibilitas PowerShell 5.1**: Server menggunakan Windows Server 2016 (PowerShell 5.1). Script deployment (`scripts/deploy-prod.ps1`) TIDAK BOLEH menggunakan operator `||`/`&&` (fitur PowerShell 7+) dan hindari karakter non-ASCII/emoji di file tanpa BOM untuk mencegah parsing error pada Windows code page (CP1252/ANSI).
- **Isolasi Proses PM2 (Cegah Orphan Process Termination)**: GitHub Actions runner secara otomatis membunuh child process yang dibuat selama job (`Cleaning up orphan processes`). Reload PM2 dijalankan secara detached via Windows Task Scheduler (`scripts/reload-pm2.bat`) dengan melepaskan `RUNNER_TRACKING_ID`, sehingga proses Node.js (3100) dan PHP (8100) tetap hidup 24/7.
- **Normalisasi Exit Code Robocopy**: Perintah `robocopy` mengembalikan nilai 1–7 untuk status sukses penyalinan berkas, yang dapat mencemari `$LASTEXITCODE` di PowerShell. Script `deploy-prod.ps1` selalu mereset `$global:LASTEXITCODE = 0` jika nilai `<= 7` sebelum menjalankan `npm run build`.
- **Penanganan ChunkLoadError & Cache Deployment**: Saat deployment baru memperbarui hash chunk frontend Next.js, `error.tsx` dan `global-error.tsx` secara otomatis mendeteksi `ChunkLoadError` dan memicu `window.location.reload()` secara cerdas (debounced) agar browser pengguna segera memuat chunk terbaru tanpa tertahan di layar error boundary.

#### Perintah Auto-Start Runner (Background 24/7):
```powershell
schtasks /Create /TN "GitHub_Actions_Runner" /TR "cmd.exe /c cd /d C:\actions-runner && run.cmd" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F
schtasks /Run /TN "GitHub_Actions_Runner"
```
Cek status berjalan:
```powershell
schtasks /Query /TN "GitHub_Actions_Runner"
```

#### Troubleshooting Handshake / Clock Skew:
Jika runner gagal konek (`Failed to create a session`), sinkronkan jam Windows Server:
```powershell
w32tm /unregister; w32tm /register; net start w32time; w32tm /resync /force; Get-Date
```

### D. Konversi Berkas Office & Watermark Otomatis (LibreOffice)
- **PDF & Gambar (JPG/PNG)**: Diproses 100% secara instan oleh pustaka PHP murni (`FPDI` + `FPDF`) tanpa dependensi software luar.
- **Word/Excel/PowerPoint (.docx/.xlsx/.pptx)**: Membutuhkan LibreOffice Headless untuk merender dokumen ke PDF sebelum ditempeli watermark resmi BAPPEDA HALUT.
- **Lokasi Deteksi Otomatis Backend**:
  - `C:\Program Files\LibreOffice\program\soffice.exe`
  - `C:\Program Files (x86)\LibreOffice\program\soffice.exe`
  - Variabel sistem `PATH`
- **Rekomendasi Operasional**: Standar kearsipan resmi mewajibkan dokumen perencanaan (RPJPD, RPJMD, RKPD, dll.) berformat **PDF**. Jika server belum menginstal LibreOffice, admin/operator OPD wajib menyimpan (Save As / Export) dokumen ke format PDF sebelum mengunggah.


