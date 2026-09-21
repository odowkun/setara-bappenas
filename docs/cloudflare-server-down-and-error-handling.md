# Standar Penanganan Error: Server Down (Cloudflare) vs Error Sistem (Next.js)

Dokumen ini menjelaskan arsitektur pemisahan dan standardisasi visual tampilan kendala (*error state*) antara **Server Fisik Offline / Mati (Cloudflare Intercept)** dengan **Kendala Aplikasi / Client State (Next.js Error Boundary)** pada portal BAPPEDA Kabupaten Halmahera Utara.

---

## 1. Perbedaan Mendasar Dua Tipe Kendala

| Indikator | 🔴 1. Server Down / Mati (Cloudflare) | 🟡 2. Kendala Aplikasi (Next.js Boundary) |
|---|---|---|
| **Penyebab** | Server fisik HP ProLiant di kantor padam, mati listrik, koneksi internet/tunnel terputus, atau service PM2/Nginx berhenti. | Error runtime JavaScript/React di peramban pengguna, cache chunk build lama saat runner baru selesai deploy, atau kegagalan parsing state lokal. |
| **Pihak yang Menangani** | Cloudflare Edge (Worker / Custom Error Pages) sebelum mencapai server lokal. | Komponen `app/error.tsx` atau `app/dashboard/error.tsx` di sisi frontend client. |
| **Status Kode HTTP** | `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`, `521 Web Server Down`, `522 Connection Timed Out`, `523 Origin Unreachable`. | Status client `200 OK` (namun React melempar exception saat render) atau chunk load timeout. |
| **Judul Layar** | **"Server Utama Sedang Tidak Terhubung"** | **"Terjadi Kendala Memuat Aplikasi"** |
| **Isi Pesan** | *"Koneksi ke server on-premise BAPPEDA sedang terputus, padam, atau dalam pemeliharaan jaringan/daya. Halaman akan otomatis memuat ulang saat server aktif kembali."* | *"Sistem mendeteksi pembaruan versi aplikasi atau kendala rendering data di peramban Anda (Koneksi server utama aktif). Silakan tekan tombol di bawah untuk menyegarkan kembali."* |
| **Badge Khusus** | `Server on-premise BAPPEDA sedang terputus dan dalam pemeliharaan jaringan dan daya` | Tanpa badge server offline. |
| **Tombol Tindakan** | `Periksa Koneksi Server` | `Segarkan Halaman` |
| **Auto-Retry** | Otomatis reload setiap 30 detik untuk mendeteksi hidupnya server kantor. | Otomatis deteksi chunk reload 1x jika terjadi `ChunkLoadError`. |

---

## 2. Implementasi Desain Terpusat (*Dead Center & Elegant Minimalist*)

Kedua tampilan mengadopsi standar visual minimalis seragam yang identik:
1. **Latar Belakang**: `#f8fafc` (Slate-50) yang bersih dan lapang.
2. **Posisi**: Wajib menggunakan `min-height: 100vh` (`min-height: 100dvh`) dengan flexbox `justify-content: center` dan `align-items: center` sehingga elemen berada persis di tengah layar vertikal dan horizontal (*true center*).
3. **Icon Container**: Lingkaran badge bulat `w-16 h-16` berlatar Amber-100 (`#fef3c7`), border Amber-300 (`#fcd34d`), dan ikon `AlertTriangle` amber-600 (`#d97706`).
4. **Tombol**: Pill rounded penuh berlatar Blue-700 (`#1d4ed8`) dengan ikon putar (`RefreshCw`) dan transisi hover yang halus.

---

## 3. Berkas Konfigurasi

1. **Cloudflare Worker (Interceptor Server Down)**:
   - Lokasi: `scripts/cloudflare-maintenance-worker.js`
   - Berjalan di Cloudflare Edge dan mengembalikan status 503 dengan HTML elegan saat server on-premise tidak dapat dijangkau.
2. **Template HTML Statis Cloudflare Custom Pages**:
   - Lokasi: `scripts/cloudflare-custom-error-500.html` dan `frontend/public/cloudflare-error-500.html`
   - Dapat diunggah ke Cloudflare Dashboard pada menu: **Custom Pages > 500 Class Errors**.
3. **Next.js Root Error Boundary**:
   - Lokasi: `frontend/src/app/error.tsx`
4. **Next.js Dashboard Error Boundary**:
   - Lokasi: `frontend/src/app/dashboard/error.tsx`
