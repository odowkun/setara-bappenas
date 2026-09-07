# Standar UI Floating Controls & Aksesibilitas (HUD Glassmorphism)

Status implementasi: 7 September 2026.

Dokumen ini mendokumentasikan pembaruan desain visual dan interaksi pada komponen floating controls di portal BAPPEDA Halmahera Utara, khususnya **Menu Aksesibilitas** (`A11yToolbar.tsx`) dan **Quick Filter Kategori Dokumen** (`DocumentQuickMenu.tsx`).

---

## 1. Latar Belakang & Masalah

Sebelumnya, tombol floating di sisi bawah layar menggunakan desain solid blue standar (`bg-blue-700`) yang terlihat kaku, tidak seragam tinggi vertikalnya, serta berisiko berbenturan dengan elemen UI browser dan overlay dev tools.

| Aspek | Sebelum | Sesudah |
|---|---|---|
| **Visual Style** | Plain blue solid badge (`bg-blue-700`) | Luminous White Frosted Glass (`bg-white/95 backdrop-blur-2xl border-slate-200/90 shadow-xl`) |
| **Aksen Ikon** | Ikon putih standar / Lucide vector | **3dicons.co Open-Source 3D Icons** (PNG assets: Calendar, Travel, Target, Chart, Shield, Folder, Setting, Zoom, Sun, Notebook, Headphone) |
| **Dimensi & Tinggi** | Tidak seragam (`h-13` / `h-14`) | Seragam vertikal `h-12` (`48px`) dengan `rounded-full` |
| **Posisi Floating** | Offset tidak simetris | Simetris pada `bottom-6 left-6 sm:bottom-8 sm:left-8` dan `bottom-6 right-6 sm:bottom-8 sm:right-8` |
| **Interaksi Drawer** | Panel floating terpisah tanpa koordinasi | Terkoordinasi via Custom Event `bappeda:floating-panel-open` (saling menutup otomatis) |
| **Responsivitas Mobile** | Teks panjang memakan area layar sempit | Otomatis berubah menjadi Floating Action Badge (FAB) sirkular ringkas |

---

## 2. Implementasi Komponen

### A. `A11yToolbar.tsx` (Menu Aksesibilitas)
- **Lokasi**: Sisi kiri bawah (`bottom-6 left-6 sm:bottom-8 sm:left-8`).
- **Aksen Warna**: Cyan/Blue (`text-blue-600`, `bg-blue-50`, border `border-blue-200/70`).
- **Fitur Interaktif**:
  - Penyesuaian ukuran teks (A- / Reset / A+).
  - Mode Kontras Tinggi (High Contrast).
  - Tipografi Ramah Disleksia (OpenDyslexic style).
  - Pembaca Suara (Voice Reader) memanfaatkan Web Speech API.
  - Shortcut pencarian instan dokumen (`⌘K`).

### B. `DocumentQuickMenu.tsx` (Filter Cepat Dokumen)
- **Lokasi**: Sisi kanan bawah (`bottom-6 right-6 sm:bottom-8 sm:right-8`).
- **Aksen Warna**: Amber/Emas (`text-amber-700`, `bg-amber-50`, border `border-amber-200/70`).
- **Fitur Interaktif**:
  - Drawer vertikal muncul dengan animasi smooth saat ditekan.
  - Rotasi `ChevronUp` 180° saat drawer terbuka.
  - Daftar filter cepat: RKPD, RTRW, RPJPD, RPJMD, LKPJ, dan Lainnya.
  - Indikator aktif kategori dengan high-contrast background dan shadow.

---

## 3. Verifikasi & Pengujian

- **TypeScript Compilation**: `npx tsc --noEmit` lolos 100% tanpa error.
- **Visual E2E Testing**: Diverifikasi menggunakan `agent-browser` pada resolusi desktop (`1440x900`) dan mobile (`390x844`).
- **Koordinasi Drawer**: Verifikasi event dispatching untuk memastikan saat satu drawer dibuka, drawer lain tertutup otomatis tanpa tumpang tindih.

---

## 4. Standar Layering Lightbox & Modal Portal (`MediaAlbumModal`)

### Masalah Stacking Context
Komponen modal/lightbox yang dirender secara inline dalam pohon DOM section (misalnya di dalam `<section>` halaman) dengan `z-50` rentan mengalami konflik *stacking context*:
- `Navbar` utama berstatus `fixed top-4 z-50`.
- Floating controls (`A11yToolbar` & `DocumentQuickMenu`) berstatus `fixed bottom-6 z-[60]`.
- Akibatnya, overlay/backdrop gelap modal terbuka **di bawah** navbar dan floating buttons, serta teks halaman di belakang modal tampak bocor/tumpang tindih.

### Solusi Standar: `createPortal` ke `document.body`
Semua tampilan modal media dokumentasi, foto lapangan, dan album galeri (`GalleryGrid.tsx`, `app/galeri/page.tsx`) **wajib** menggunakan `MediaAlbumModal`:
1. **React Portal**: Modal dirender ke `document.body` via `createPortal(modalContent, document.body)`.
2. **Elevated Z-Index**: Menggunakan `z-[999999]` dan `backdrop-blur-xl` untuk menjamin overlay menutupi 100% viewport di atas seluruh fixed elements.
3. **Scroll Lock**: Otomatis mengunci scroll body (`document.body.style.overflow = "hidden"`) saat modal terbuka dan melepaskannya saat tertutup.
4. **Keyboard & Touch**: Mendukung navigasi panah keyboard (`Escape`, `ArrowLeft`, `ArrowRight`) dan filmstrip thumbnails.

---

## 5. Standar Dimensi & Pemilihan Aset 3D Icons (`3dicons.co`)

### Penyesuaian Ikon Spasial & Aksesibilitas
- **RTRW (Rencana Tata Ruang Wilayah)**: Diganti dari koper travel (`travel-dynamic-color.png`) menjadi **3D Compass Explorer** (`explorer-dynamic-color.png`) yang sesuai konteks tata ruang, navigasi batas wilayah, dan geospasial.
- **Ukuran Teks**: Dilengkapi ikon 3D **Text Typography** (`text-dynamic-color.png`) dengan tombol segmented control `A-`, `100%`, dan `A+`.
- **Kategori Dokumen**: Menggunakan representasi visual 3D yang kohesif:
  - RKPD: `calender-dynamic-color.png` (Kalender Kerja)
  - RTRW: `explorer-dynamic-color.png` (Kompas Wilayah)
  - RPJPD: `target-dynamic-color.png` (Target 20 Tahun)
  - RPJMD: `chart-dynamic-color.png` (Grafik Pertumbuhan 5 Tahun)
  - LKPJ: `sheild-dynamic-color.png` (Perisai Akuntabilitas)
  - Lainnya: `folder-dynamic-color.png` (Folder Arsip)

### Pencegahan Layout Shift & Ledakan Resolusi (Strict Sizing Standard)
Semua aset PNG resolusi tinggi dari `3dicons.co` (400x400) **wajib**:
1. Menyertakan atribut HTML eksplisit `width={...}` dan `height={...}`.
2. Menyertakan inline CSS constraint `style={{ width: N, height: N, maxWidth: N, maxHeight: N }}`.
3. Ditempatkan di dalam container kartu/badge (`rounded-xl` atau `rounded-lg`) bershadow lembut untuk mencegah gambar meledak melebihi container jika terjadi keterlambatan evaluasi flexbox browser.
4. Header drawer menggunakan badge bertingkat (ikon 3D + judul tebal + subjudul deskriptif) serta tombol tutup `X` standar.


