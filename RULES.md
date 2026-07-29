# DEVELOPMENT RULES & STANDARDS — BAPPEDA HALUT

---

## ⚡ Core Engineering & UI Standards
Dokumen aturan ini wajib dipatuhi oleh seluruh AI Agent dan Developer selama proses pengembangan aplikasi **Smart BAPPEDA Halmahera Utara**.

---

## 📜 Rule 1: Component Modularization & File Size Limit
1. **Max File Limit**: Setiap file komponen React/Next.js TIDAK BOLEH melebihi 250 baris kode.
2. **Feature Isolation**: Komponen spesifik ditaruh di `src/components/<feature>/`.
3. **Single Responsibility**: Pisahkan logika data (`custom hooks`), styling (`Tailwind`), dan UI markup (`JSX`).

---

## 📜 Rule 2: Strict Type Safety & Clean Code
1. **Zero `any` Types**: Dilarang keras menggunakan tipe `any`. Semua tipe data API & props wajib didefinisikan di `src/types/`.
2. **Descriptive Naming**: Naming variabel & fungsi harus eksplisit (contoh: `fetchExecutiveStats()` bukan `getData()`).
3. **No Unused Code**: Hapus import, variabel, atau komentar kotor sebelum melakukan build.

---

## 📜 Rule 3: Brand Theme Identity (Royal Blue & Amber Gold)
1. **Primary Palette**: Wajib menggunakan **Royal Blue** (`blue-950`, `blue-900`, `blue-700`, `blue-50`) & **Amber Gold** (`amber-400`, `amber-500`, `yellow-400`).
2. **No Emerald/Green Leftovers**: Dilarang keras menyisakan elemen hijau (`emerald`) pada badge, button, modal, atau highlight.
3. **Executive Contrast**: Gunakan teks putih/navy pada latar belakang Amber Gold untuk kontras tinggi yang sesuai standar aksesibilitas.

---

## 📜 Rule 4: Public Read-Only Upload Policy
1. **Public Landing & GIS Page**: Halaman publik dan GIS Map View **100% READ-ONLY**.
2. **No Public Upload Buttons**: Dilarang menampilkan tombol upload foto/berkas di bagian publik.
3. **Admin Dashboard Only**: Fitur pengunggahan foto realisasi lapangan & dokumen resmi hanya diizinkan melalui Admin Dashboard terproteksi.

---

## 📜 Rule 5: Image Lazy Loading & Skeleton Loader Standard
1. **Intersection Observer Lazy Loading**: Semua komponen gambar wajib dibungkus dengan `SkeletonImage` yang menerapkan `IntersectionObserver` (`rootMargin: "250px 0px"`).
2. **Zero Initial Load Overhead**: Gambar di area bawah yang belum terlihat **tidak boleh diunduh by default** pada initial page load untuk menghemat data & mempercepat render awal (0ms delay).
3. **Industry Standard Library**: Wajib menggunakan `react-loading-skeleton` (`SkeletonTheme`) untuk animasi gelombang *wave shimmer* 60fps yang mulus tanpa *layout shift*.
4. **React Cache Fix**: `SkeletonImage` wajib menyertakan pengecekan `imgRef.current.complete` & `naturalWidth > 0` pada `useEffect` agar gambar yang di-cache browser langsung tampil instan tanpa tertahan.

---

## 📜 Rule 6: GIS Map & Spatial Standard
1. **Official Government Boundary**: Peta GIS wajib memuat data vektor poligon resmi BPS / Permendagri No. 137 / OpenStreetMap (`src/data/halut-boundary.json`).
2. **Fine Line Styling**: Garis batas merah putus-putus berukuran halus (`color: "#ef4444"`, `weight: 2px`, `dashArray: "3, 3"`).
3. **Compact Scaling Micro-Pin Markers**: Pin lokasi proyek wajib berukuran mikro (`16px`) dengan ikon SVG MapPin (bukan angka/gelembung besar) saat mode zoom out, dan membesar secara mulus (`26px + Amber Gold Glow`) saat proyek dipilih.
4. **Interactive Wheel Zoom**: `scrollWheelZoom: true` agar scroll/pinch di atas peta langsung melakukan perbesaran peta.
5. **Left Card Dynamic State**: Kartu sebelah kiri wajib menampilkan **Ringkasan Geospasial Wilayah Halut** ketika `selectedId === null` dan beralih ke **Detail Foto & Anggaran Proyek** ketika `selectedId !== null`.

---

## 📜 Rule 7: Isolated Container Scroll Behavior
1. **Scroll Containment**: Seluruh kontainer daftar berkategori/scrollable (seperti daftar proyek GIS) WAJIB menggunakan `overscrollBehavior: "contain"` (CSS `overscroll-contain`).
2. **No Window Scroll Chaining**: Penggulungan kursor mouse di dalam daftar tidak boleh memicu penggulungan halaman utama.

---

## 📜 Rule 8: Accessibility (A11y) & Voice Compliance
1. **Semantic HTML**: Wajib menggunakan tag HTML5 semantik (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`).
2. **Keyboard Navigable**: Setiap tombol, link, dan modal (termasuk `Cmd+K` Global Search) harus bisa dikendalikan via keyboard.
3. **A11y Toolbar**: Menyediakan floating toolbar untuk resize teks, mode kontras tinggi, font disleksia, dan pembaca suara Text-to-Speech.

---

## 📜 Rule 9: Verification & Auto-Documentation
1. **Auto-Verification**: Setiap perubahan kode wajib dites via `npm run build` sebelum dinyatakan selesai.
2. **Walkthrough & Docs Sync**: Selalu perbarui `walkthrough.md` dan berkas dokumentasi `.md` jika terjadi pembaruan fitur atau arsitektur baru.
