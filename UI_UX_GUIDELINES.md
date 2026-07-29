# UI / UX DESIGN GUIDELINES — BAPPEDA HALUT

## 🎨 Theme Identity: "Royal Blue & Amber Gold"
Tema desain BAPPEDA Halmahera Utara memadukan nuansa **Royal Blue** (`blue-950`, `blue-900`, `blue-700`) yang mencerminkan profesionalisme eksekutif, wibawa pemerintahan, dan maritim Halmahera Utara dengan **Amber Gold** (`amber-400`, `amber-500`, `yellow-400`) yang melambangkan keemasan pembangunan daerah.

> ⚠️ **Strict Rule**: Dilarang menggunakan warna hijau (`emerald`) pada elemen UI apapun.

---

## 🎨 Color Palette Tokens

```css
:root {
  /* Primary Brand Color: Royal Blue */
  --blue-950: #172554;     /* Deep Royal Blue Navbar/Hero Base */
  --blue-900: #1e3a8a;     /* Core Royal Blue Header & Buttons */
  --blue-700: #1d4ed8;     /* Primary Active Brand Color */
  --blue-50:  #eff6ff;     /* Soft Blue Card Highlight */

  /* Secondary Accent Color: Amber Gold */
  --amber-500: #f59e0b;    /* Highlight Badge & Active Ring */
  --amber-400: #fbbf24;    /* Glowing Accent & Marker Border */
  --amber-100: #fef3c7;    /* Soft Pill Tag Background */

  /* High Contrast Accessibility Overrides */
  --a11y-hc-bg: #000000;
  --a11y-hc-text: #ffff00;
  --a11y-hc-border: #ffffff;
}
```

---

## 🖼️ Image Skeleton & Lazy Loading Specification
- **Component**: `SkeletonImage` (`src/components/ui/SkeletonImage.tsx`).
- **Library Engine**: `react-loading-skeleton` (`SkeletonTheme baseColor="#e2e8f0" highlightColor="#f8fafc"`).
- **Scroll-Triggered Download**: Ditenagai `IntersectionObserver` (`rootMargin: "250px 0px"`). Gambar baru diunduh ketika kursor/scroll pengguna berjarak 250px sebelum elemen sampai di layar.
- **Cache Resilience**: Deteksi `imgRef.current.complete` untuk langsung menampilkan foto tanpa hambatan loader.

---

## 🗺️ Interactive Esri GIS Map & Micro-Pin Specification
1. **Official Boundary Line**: Garis merah putus-putus berukuran halus (`color: "#ef4444"`, `weight: 2px`, `dashArray: "3, 3"`).
2. **Compact Micro-Pin Markers**: Pin lokasi proyek berukuran mikro (`16px`) dengan ikon SVG MapPin (bukan angka/gelembung besar) saat mode zoom out, dan membesar secara mulus (`26px + Amber Gold Glow`) saat proyek dipilih.
3. **Interactive Basemap Popover**: Selector popover melayang dengan ikon `Layers` untuk memilih `Esri Satelit HD`, `Esri Topografi`, `Google Satelit + Batas`, atau `Google Maps Jalan`.
4. **Pure Icon Boundary Toggle**: Tombol `Shield` icon di kanan atas untuk menyembunyikan/menampilkan garis batas.
5. **Scroll Containment**: List proyek GIS menggunakan `overscrollBehavior: "contain"` agar penggulungan mouse di dalam daftar tidak mengganggu scroll halaman utama.

---

## ♿ Accessibility (A11y) & Voice Toolbar Specification
Widget Aksesibilitas melayang (*Floating Widget*) yang dapat diakses di semua halaman:

1. **Fitur Text Resize**: Tombol `A-` dan `A+` untuk mengubah skala font (100%, 115%, 130%).
2. **High Contrast Toggle**: Mengubah skema warna menjadi hitam-kuning kontras tinggi untuk gangguan penglihatan.
3. **Dyslexia Font Toggle**: Mengubah font utama menjadi font ramah disleksia (*Lexend*).
4. **Voice Reader (Text-to-Speech)**: Tombol *Play/Pause Read Aloud* yang membacakan teks berita/pengumuman secara audio.
5. **Screen Reader Focus Ring**: Visual ring tegas (`ring-4 ring-amber-400 outline-none`) saat menavigasi via Tab.

---

## 🔍 Global Instant Search Modal (`Cmd + K`)
- Modal pencarian melayang dengan efek `backdrop-blur-xl bg-blue-950/90`.
- Input besar dengan icon pencarian + badge pintasan keyboard `Cmd K`.
- Hasil terbagi dalam kelompok kategori: **Dokumen**, **Berita**, **Proyek GIS**, dan **Pengumuman**.

---

## 💎 Glassmorphism Card System & Executive Widgets

### Executive Stat Widget Card
- **Background**: `bg-blue-950/80 backdrop-blur-md border border-slate-200/20 rounded-2xl p-6 shadow-xl hover:border-amber-400/50 transition-all duration-300`
- **Header**: Icon melingkar dengan latar soft blue/amber glow + Judul Indikator Makro.
- **Value**: Font besar bold (`text-3xl font-extrabold text-white`).
- **Footer**: Sparkline chart kecil + Trend Badge.

---

## 🌀 Motion & Micro-interactions
- **Page Entrance**: Fade-in & Slide-up (`initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}`).
- **Button Micro-hover**: Scale up halus (`whileHover={{ scale: 1.02 }}` & `whileTap={{ scale: 0.98 }}`).
- **Card Stagger Animation**: List berita dan galeri muncul berurutan secara bertahap.
