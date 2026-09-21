# Standarisasi Progressive Image Loading & Skeleton Shimmer

Status implementasi: 21 September 2026.

Dokumen ini mencatat standarisasi pemuatan aset gambar (progressive image loading), optimasi ukuran berkas statis, dan peniadaan efek gambar terpotong (*scanline glitch*) di seluruh website publik dan dashboard BAPPEDA Halmahera Utara.

---

## 1. Latar Belakang & Masalah

1. **Ukuran Berkas Mentah Ekstrem (Hingga 11,6 MB)**:
   - Sejumlah aset foto dokumentasi yang diambil dari kamera resolusi tinggi tersimpan di `frontend/public/images/bappeda/` tanpa kompresi (misalnya `penilaian-ppd.jpg` berukuran **11.637.697 bytes** atau 11,6 MB dengan resolusi 6667x5001 px).
   - Pada kartu grid berita atau carousel, browser terpaksa mengunduh berkas sebesar belasan megabyte tersebut melalui koneksi HTTP.
2. **Efek Gambar Terpotong (*Scanline / Top-to-Bottom Render Glitch*)**:
   - Format JPEG diunduh secara bertahap (*progressive chunk*). Ketika baru 10-20% data diterima, browser hanya menampilkan bagian atas foto dan membiarkan 80% bagian bawah kosong abu-abu (`bg-slate-100`), memberi kesan tampilan rusak.
3. **Penggunaan Tag HTML Mentah (`<img>`)**:
   - Komponen sebelumnya menggunakan `<img src="..." />` tanpa state loading, tanpa efek transisi, dan tanpa indikator skeleton shimmer saat data masih ditarik.

---

## 2. Solusi & Standar Teknis yang Diterapkan

### A. Kompresi Batch Aset Gambar Statis (`frontend/public/images/bappeda/`)
- Seluruh gambar JPG/PNG dikompresi dan di-resample ke batas lebar maksimal 1600px (kualitas 80%) menggunakan utilitas native `sips`.
- **Hasil**:
  - `penilaian-ppd.jpg`: Turun dari **11,6 MB menjadi 391 KB** (penghematan 96,6% bandwidth).
  - Total ukuran direktori foto berkurang dari **77 MB menjadi 23 MB**, tanpa degradasi visual pada layar Retina/4K.

### B. Komponen Reusable `ProgressiveImage` (`frontend/src/components/ui/ProgressiveImage.tsx`)
Komponen modern yang menggabungkan:
1. **IntersectionObserver Viewport Pre-fetching**:
   - Hanya mulai mengunduh gambar ketika elemen berada dalam jarak 350px dari viewport (`rootMargin: "350px 0px"`).
   - Mendukung prop `priority={true}` untuk gambar di atas lipatan layar (*above-the-fold* seperti Headline dan Cover Berita).
2. **Shimmer Skeleton Placeholder**:
   - Selama status `!isLoaded`, menampilkan skeleton animatif berbasis CSS (`bg-slate-200/80 animate-pulse` dengan wave gradient shimmer) yang rapi dan elegan.
3. **Smooth Fade-in & Blur-up Transition**:
   - Saat event `onLoad` selesai, gambar bertransisi secara halus:
     `opacity-0 blur-xs scale-102` ➔ `opacity-100 blur-0 scale-100 duration-700 ease-out`.
4. **Graceful Error Fallback**:
   - Jika berkas gagal dimuat (404/network drop), otomatis berpindah ke `fallbackSrc` (`default-news-cover.jpg` atau kustom SVG) tanpa menampilkan ikon patah dari browser bawaan.
5. **Backward Compatibility**:
   - Komponen lama `SkeletonImage.tsx` diperbarui untuk membungkus `ProgressiveImage`, sehingga semua kode yang telah mengimpor `SkeletonImage` langsung mendapatkan peningkatan ini.

### C. Sistem Dual-Variant Thumbnail Cerdas (`getThumbnailUrl`)
- Untuk kartu beranda, grid berita, dan slider mobile, gambar berukuran besar tidak perlu dimuat langsung.
- Helper `getThumbnailUrl(url)` otomatis mengarahkan permintaan ke varian thumbnail ringan berlebar 420px (~25–45 KB):
  - Berkas statis: `/images/bappeda/XYZ.jpg` ➔ `/images/bappeda/thumbs/XYZ.jpg`.
  - Berkas upload: `/storage/media/web/XYZ.webp` ➔ `/storage/media/thumbs/XYZ.webp`.
  - Backend Eloquent model `News.php` menyematkan accessor virtual `thumbnail_url`.
- **Hasil**: Kartu berita di beranda dan halaman indeks terunduh dalam waktu < 20 milidetik.

### D. Full-Resolution Lightbox Zoom On-Demand
- Pada halaman detail berita (`frontend/src/app/berita/[slug]/page.tsx`):
  - Cover artikel berita dilengkapi indikator hover *"Klik untuk Melihat Resolusi Penuh (Full HD)"*.
  - Saat diklik, membuka Lightbox Modal Full HD interaktif dengan rendering `createPortal`.
  - Dilengkapi kontrol Zoom Toggle (1x / 1.75x pan zoom), tombol unduh HD asli, keyboard accessibility (`Esc` untuk menutup), dan backdrop darkroom blur.

---

## 3. Cakupan Implementasi Komponen

| Halaman / Komponen | File | Implementasi |
|---|---|---|
| **Beranda News Carousel** | `LatestNewsCarousel.tsx` | Kartu carousel berita beranda menggunakan `getThumbnailUrl` (~35 KB) dengan rasio 16:10. |
| **Halaman Berita Publik** | `app/berita/page.tsx` | Kartu headline utama (Full HD) & grid semua artikel menggunakan `thumbnailImage` (~30-45 KB). |
| **Detail Berita Publik** | `app/berita/[slug]/page.tsx` | Cover artikel berita Full HD + Interactive Lightbox Zoom Modal (1x/1.75x pan, Unduh HD, Esc key). |
| **Beranda Galeri Grid** | `GalleryGrid.tsx` | Album thumbnail foto kegiatan di beranda dengan efek zoom hover. |
| **Halaman Galeri Publik** | `app/galeri/page.tsx` | Grid album galeri multi-media (foto dan video) dengan modal album interaktif. |
| **Infografis Tersemat** | `PinnedInfographicsSection.tsx` | Slider mobile snap-center dan desktop grid infografis pembangunan. |
| **Peta Spasial Proyek** | `GeospatialSection.tsx` | Popup foto dokumentasi lapangan proyek realisasi fisik dan mobile bar preview. |
| **Dashboard Kelola Berita** | `app/dashboard/berita/page.tsx` | Kolom thumbnail berita pada tabel data admin BAPPEDA. |

---

## 4. Verifikasi & Pengujian
- **Next.js Production Build**: `npm run build` berhasil 100% tanpa error TypeScript/lint (66 dari 66 rute terkompilasi optimal).
- **Network Performance**: Pemuatan halaman grid berita turun dari beberapa detik menjadi < 20ms per kartu (~30 KB vs 11,6 MB).
- **CLS (Cumulative Layout Shift)**: 0, karena container menjaga aspect-ratio secara konsisten selama proses loading.

