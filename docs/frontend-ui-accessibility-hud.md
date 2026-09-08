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
  - Penyesuaian ukuran teks (A- / Reset / A+) dan spasi/jarak baris teks.
  - Palet multi-mode warna & kontras (Kontras Tinggi, Monokrom, Invert, Sepia).
  - Garis bantu baca kursor (Reading Guide Ruler).
  - Kursor ekstra besar (Big Cursor).
  - Sorot semua tautan (Highlight Links).
  - Tipografi Ramah Disleksia (Lexend font).
  - Jeda animasi gerak (Pause Motion).
  - Pembaca Suara (Smart Voice Reader) dengan Web Speech API.
  - *(Catatan: Tombol "Cari Cepat Dokumen" ditiadakan dari toolbar ini agar fokus murni pada aksesibilitas dan tidak duplikasi dengan filter kategori dokumen di sebelah kanan)*.

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

---

## 6. Arsitektur Super-A11y Pro Suite (Native Multi-Sensory Accessibility)

Status pembaruan: 8 September 2026.

Menu Aksesibilitas (`A11yToolbar.tsx`) ditingkatkan menjadi suite aksesibilitas terpadu berstandar WCAG tanpa memerlukan library/widget eksternal pihak ketiga:

### A. Fitur Interaktif Terpadu
1. **Penyesuaian Teks**:
   - Skala Ukuran Huruf: `A-` (85%), `100%`, `A+` (s.d. 145%) via CSS Variable `--font-scale`.
   - Spasi & Jarak Baris: Mengaktifkan `body.a11y-text-spacing` (`letter-spacing: 0.12em`, `line-height: 1.95`).
2. **Palet Warna & Kontras Multi-Mode**:
   - `Normal`: Skema warna asli aplikasi.
   - `Kontras Tinggi`: Latar belakang hitam pekat dengan teks kuning terang (`body.high-contrast`).
   - `Monokrom / Grayscale`: Menghilangkan saturasi warna bagi pengguna dengan sensitivitas warna (`body.a11y-grayscale`).
   - `Invert Color`: Membalikkan luminance warna untuk visibilitas malam hari (`body.a11y-invert`).
   - `Sepia Warm`: Mode hangat redup untuk kenyamanan membaca di ruang gelap (`body.a11y-sepia`).
3. **Alat Bantu Fokus & Navigasi**:
   - **Garis Pandu Baca (Reading Guide Ruler)**: Garis horizontal semi-transparan yang bergerak mengikuti kursor mouse via React Portal (`ReadingGuideRuler`) untuk membantu fokus baris teks.
   - **Kursor Ekstra Besar (Big Cursor)**: Mengganti kursor mouse sistem menjadi kursor SVG kontras tinggi berukuran 36px (`body.a11y-big-cursor`).
   - **Sorot Semua Tautan (Highlight Links)**: Menyorot semua tautan dan tombol yang dapat diklik dengan outline tebal 2.5px (`body.a11y-highlight-links`).
   - **Font Ramah Disleksia**: Mengaktifkan font *Lexend* (`body.dyslexia-font`).
   - **Hentikan Animasi (Pause Motion)**: Mematikan seluruh CSS keyframes dan transisi (`body.a11y-pause-motion`).
4. **Bantuan Audio Narasi (Smart Voice Reader)**:
   - Terintegrasi dengan Web Speech API (`SpeechSynthesisUtterance`).
   - Mendukung pembacaan teks yang diblok/diseleksi langsung oleh pengguna, atau ringkasan paragraf pembuka.
5. **Persistensi & Reset**:
   - Seluruh preferensi disimpan ke `localStorage` (`bappeda_a11y_settings`) sehingga tetap aktif saat warga berpindah halaman.
   - Tombol **"Kembalikan ke Setelan Normal"** menghapus pengaturan tersimpan dan mengembalikan tampilan ke default dalam 1 klik dengan feedback toast.

### B. Pencegahan Hilangnya Tombol Fixed Saat Mode Filter Aktif (Portal Backdrop Architecture)
- **Masalah**: Sesuai spesifikasi CSS W3C, jika properti `filter` diterapkan pada elemen `<body>`, elemen tersebut otomatis menjadi *containing block* baru bagi seluruh elemen turunan berposisi `position: fixed`. Akibatnya, tombol `A11yToolbar` yang berposisi `fixed bottom-6` tergeser ke ujung paling bawah halaman (di atas footer ~5.500px ke bawah) sehingga tampak menghilang dari layar pengguna di bagian atas.
- **Solusi Arsitektur**:
  1. `document.body` dibebaskan dari segala properti `filter` CSS.
  2. Mode filter visual (*Invert*, *Grayscale*, *Sepia*) dirender melalui **Fullscreen Portal Overlay** (`createPortal(..., document.body)`) dengan `fixed inset-0 pointer-events-none z-[55]` dan `backdrop-filter`.
  3. `A11yToolbar` berada pada layer `z-[60]` di atas overlay filter.
  4. Hasilnya: Efek filter tetap menyelimuti 100% halaman situs tanpa merusak koordinat `position: fixed`, dan tombol aksesibilitas tetap selalu tampak di pojok kiri bawah layar dalam kondisi apapun.


