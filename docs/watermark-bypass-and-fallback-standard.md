# Standarisasi Watermark Dokumen & Mekanisme Bypass / Auto-Fallback

Status implementasi: 21 September 2026.

Dokumen ini mencatat implementasi arsitektur **Opsi C (Hibrida)** untuk penanganan berkas PDF dokumen perencanaan yang telah memiliki watermark manual dari instansi atau memiliki struktur berkas PDF khusus (enkripsi/kompresi PDF v1.5+) di BAPPEDA Kabupaten Halmahera Utara.

---

## 1. Latar Belakang Masalah

Sebelumnya, saat pengelola mengunggah berkas PDF yang telah diberi stempel atau watermark manual oleh instansi/software luar, proses penyimpanan dokumen sering memunculkan pesan kegagalan:
> *"Dokumen Gagal Disimpan: Server tidak dapat memverifikasi berkas ber-watermark. Silakan unggah ulang."*

### Akar Masalah Teknis
1. **Generic Catch-All di Frontend**:
   - Di `frontend/src/app/dashboard/dokumen/tambah/page.tsx`, blok `catch` membungkus pemanggilan API dengan pesan kesalahan statis tersebut, menelan pesan error validasi/server yang sesungguhnya.
   - Fungsi `apiFetch` di `adminService.ts` sebelumnya me-return `null` saat menerima response non-2xx, menghilangkan rincian error HTTP 422/403/500 dari Laravel.
2. **Limitasi Parser PDF (FPDI)**:
   - Berkas PDF yang diekspor oleh aplikasi modern (Adobe Acrobat, Foxit, PDF24, Canva, atau hasil scanner instansi) umumnya menggunakan format **PDF v1.5–1.7** dengan *Compressed Object Streams* atau proteksi hak akses (*permissions*).
   - Parser PHP FPDI gratis tidak dapat membaca *cross-reference streams* tersebut sehingga melempar exception saat membedah halaman untuk menempelkan watermark sistem.
3. **Kebutuhan Dokumen Resmi yang Sudah Ber-watermark**:
   - Banyak dokumen perencanaan dari OPD/kementerian sudah memiliki stempel atau watermark resmi tersertifikasi yang tidak boleh ditimpa atau diubah susunan halamannya.

---

## 2. Arsitektur Solusi (Opsi C: Hibrida)

Solusi menggabungkan **kontrol eksplisit pengelola** dengan **toleransi kesalahan cerdas (auto-fallback)** di backend:

### A. Kontrol UI Eksplisit (Checkbox Bypass)
- **Lokasi**: `frontend/src/app/dashboard/dokumen/tambah/page.tsx`
- **Elemen UI**: Checkbox interaktif di atas area upload:
  - *Label*: **"Dokumen Sudah Ber-watermark Resmi / Lewati Watermark Otomatis"**
  - *Badge Pill*: `Watermark Sistem Dilewati` (aktif saat dicentang).
  - *Deskripsi*: Mengedukasi pengguna bahwa jika berkas PDF sudah memiliki cap/stempel resmi instansi atau proteksi khusus, sistem akan menyimpan berkas asli seutuhnya tanpa penimpaan watermark otomatis.
- **Pengiriman**: Flag `skip_watermark: true` dikirim ke `ResumableChunkUploader` dan disimpan ke endpoint `/documents`.

### B. Backend Processing & Auto-Fallback (`DocumentWatermarkService` & `DocumentController`)
- **Bypass Eksplisit**:
  - Jika `$skipWatermark === true`, `DocumentWatermarkService::process()` melewati `applyWatermark()` (FPDI) sepenuhnya.
  - Berkas asli disalin langsung ke direktori privat dengan konvensi nama `..._watermarked.pdf`, memastikan kelulusan validasi `validateWatermarkedFilePath` tanpa mengubah skema tabel database.
  - Mengembalikan metadata `watermark_applied: false` dan `watermark_bypassed: true`.
- **Auto-Fallback Cerdas**:
  - Jika checkbox tidak dicentang (mode watermark otomatis), namun berkas PDF gagal diproses oleh FPDI (misal karena kompresi object stream atau izin baca), backend **tidak menggugurkan proses unggah dengan error 422**.
  - Sistem menangkap exception parser, mencatat peringatan di log Laravel (`Log::warning`), menyalin berkas asli dengan aman, dan mengembalikan `watermark_bypassed: true`.

### C. Transparansi Pesan Kesalahan di Frontend
- **`frontend/src/services/adminService.ts`**:
  - `apiFetch` kini membaca response body JSON saat terjadi error HTTP (`!res.ok`) dan melempar `Error(errData.message || ...)`.
- **`frontend/src/components/ui/ResumableChunkUploader.tsx`**:
  - Status upload sukses menerima berkas baik dengan `watermark_applied: true` maupun `watermark_bypassed: true` tanpa melempar retry palsu.
  - Menampilkan status informatif: *"✅ Berkas dokumen resmi tersimpan aman (watermark sistem dilewati / sudah ber-watermark)."*
- **`dokumen/tambah/page.tsx`**:
  - Menampilkan pesan error asli dari server di SweetAlert (`err.message`), memberikan diagnosis transparan kepada pengelola jika terdapat field yang belum lengkap atau hak akses tidak memadai.

---

## 3. Hasil Pengujian & Verifikasi

1. **Unit & Feature Test Laravel**:
   - `DocumentWatermarkServiceTest`: 4 tests, 14 assertions lolos 100% (termasuk verifikasi `test_it_skips_watermark_when_skip_watermark_flag_is_true`).
   - `DocumentStoreWatermarkTest`: 4 tests, 14 assertions lolos 100%.
2. **Next.js Production Build**:
   - `npm run build` sukses 100% (seluruh 66 route app terkompilasi tanpa error TypeScript maupun linting).
