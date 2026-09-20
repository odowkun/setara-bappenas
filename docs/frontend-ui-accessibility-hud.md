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

### B. `DocumentQuickMenu.tsx` (Filter & Pencarian Cepat Dokumen)
- **Lokasi**: Sisi kanan bawah (`bottom-6 right-6 sm:bottom-8 sm:right-8`).
- **Aksen Warna**: Amber/Emas (`text-amber-700`, `bg-amber-50`, border `border-amber-200/70`).
- **Fitur Interaktif**:
  - **Embedded Real-time Document Search Box**: Dilengkapi ikon 3D Zoom (`zoom-dynamic-color.png`), input pencarian real-time untuk memfilter daftar kategori dokumen langsung saat mengetik.
  - **Direct Submit & Navigation**: Menekan Enter atau mengirim query langsung mengarahkan user ke `/dokumen?q=<query>`.
  - **Shortcut ⌘K Badge**: Tombol cepat untuk memicu dialog pencarian global modal (`setIsSearchOpen(true)`).
  - **Fallback State**: Saat tidak ada kategori yang cocok dengan kata kunci pencarian, menampilkan pesan ramah dan tombol "Cari di semua dokumen &rarr;".
  - Drawer vertikal muncul dengan animasi smooth saat ditekan.
  - Rotasi `ChevronUp` 180° saat drawer terbuka.
  - Daftar filter cepat terstandardisasi: **RPJPD, RPJMD, RKPD, dan Lainnya**.
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
5. **Tata Letak Beranda Bersih (`GalleryGrid.tsx`)**: Menghilangkan banner CTA ganda di bagian bawah grid galeri untuk menjaga proporsi ruang beranda tetap ramping dan elegan, dengan tombol navigasi utama terpusat di header seksi (`Buka Seluruh Galeri Foto & Video`).

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

---

## 7. Standar Keamanan Akses DOM & Leaflet Lifecycle (`classList` Undefined Guard)

Status pembaruan: 8 September 2026.

### A. Latar Belakang Masalah (`Cannot read properties of undefined (reading 'classList')`)
Pesan error runtime Next.js:
```
Runtime TypeError: Cannot read properties of undefined (reading 'classList')
at removeClass (node_modules/leaflet/dist/leaflet-src.js:2447:1)
at NewClass._onPanTransitionEnd (node_modules/leaflet/dist/leaflet-src.js:4712:1)
```
Dua titik kerentanan yang teridentifikasi:
1. **Hydration & Re-render Pass di React**: Pada `AccessibilityContext.tsx`, hook `useEffect` memanggil `document.body.classList.toggle(...)` tanpa pengecekan ketersediaan elemen DOM `document?.body`.
2. **Leaflet Animation Transition saat Unmount**: Pada komponen peta spasial (`EsriLeafletMap.tsx`), saat animasi pan (`fitHalutBounds`, `panTo`, atau `flyTo`) sedang berjalan dan komponen di-unmount, Leaflet memanggil `_onPanTransitionEnd` yang mengeksekusi `removeClass(this._mapPane, 'leaflet-pan-anim')`. Karena `map.remove()` telah menghapus `this._mapPane`, Leaflet internal memanggil `el.classList` pada elemen `undefined`.

### B. Solusi & Standar Implementasi:
1. **DOM Access Guard (`AccessibilityContext.tsx`)**:
   Seluruh efek DOM wajib diawali dengan:
   ```typescript
   if (typeof document === "undefined" || !document?.body) return;
   ```
2. **Global Leaflet Defensive Monkey-Patch (`lib/gis/leafletPatch.ts`)**:
   - `L.DomUtil.addClass`, `L.DomUtil.removeClass`, `L.DomUtil.hasClass`, dan `L.DomUtil.setClass` diproteksi terhadap argumen `!el` atau `!el.classList`.
   - `L.Map.prototype._onPanTransitionEnd` diproteksi untuk memeriksa `this._mapPane` sebelum memanggil `removeClass`.
   - `L.Control.Zoom.prototype._updateDisabled` diproteksi jika tombol zoom unmounted.
3. **Pembersihan Timer Peta (`EsriLeafletMap.tsx`)**:
   - Timer `setTimeout` untuk auto-fit wilayah Halut dilacak menggunakan `fitBoundsTimeoutRef` dan dibatalkan (`clearTimeout`) saat unmount.
   - Pemanggilan `map.stop()` dieksekusi sebelum `map.remove()` untuk menghentikan seluruh `requestAnimationFrame` dan transisi inersia secara bersih.

---

## 8. Standar Modal Popup Scroll Lock & Overscroll Containment

Status pembaruan: 20 September 2026.

### A. Latar Belakang Masalah (Scroll Chaining & Background Bleed)
Ketika pengguna membuka modal dialog (misal: pratinjau dokumen resmi pada `/pengumuman`, modal detail agenda pada `/agenda` atau `/dashboard/agenda`, Global Search, dan modal unduhan dokumen), jika pengguna melakukan scroll menggunakan mousewheel, gesture touchpad, atau swipe sentuh pada mobile, scroll event dapat merembet (*scroll chaining*) ke halaman latar belakang (`window` / `document.body`) alih-alih menggulir isi modal itu sendiri.

### B. Standar Implementasi Solusi
1. **React DOM Portal (`createPortal`)**:
   Seluruh modal wajib dirender langsung di root `document.body` menggunakan `createPortal(..., document.body)` setelah komponen `mounted` (`useState(false)` -> `useEffect setMounted(true)`). Ini mencegah pemotongan stacking context CSS transform / overflow dari parent container.
2. **Body Scroll Lock dengan Kompensasi Scrollbar**:
   Saat modal aktif, kunci scroll halaman utama:
   ```typescript
   const originalOverflow = document.body.style.overflow;
   const originalPaddingRight = document.body.style.paddingRight;
   const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
   document.body.style.overflow = "hidden";
   if (scrollBarWidth > 0) {
     document.body.style.paddingRight = `${scrollBarWidth}px`;
   }
   ```
   Saat modal ditutup atau unmount, kembalikan `overflow` dan `paddingRight` ke nilai awal.
3. **Overscroll Containment (`overscroll-contain`)**:
   Tambahkan utility class `overscroll-contain` pada:
   - Lapisan backdrop modal (`fixed inset-0 ... overscroll-contain`).
   - Kartu modal container (`w-full max-w-... overscroll-contain`).
   - Wadah konten internal yang memiliki scrollbar (`overflow-y-auto overscroll-contain`).
4. **Auto-Focus Target (`ref.current.focus()`)**:
   Wadah scrollable internal diberikan atribut `tabIndex={0}` dan difokuskan secara otomatis setelah modal dibuka, memastikan event keyboard (`PageDown`, panah) dan mousewheel langsung mengontrol scrollbar modal.
5. **Aksesibilitas & Keyboard Escape**:
   Modal wajib menyertakan atribut ARIA `role="dialog"` dan `aria-modal="true"`, serta event listener tombol `Escape` untuk menutup modal.

---

## 8. Evolusi Hero: Penggantian Menu Aksesibilitas Menjadi Running Text Full-Width & Transisi Kategori Dokumen

Status pembaruan: 21 September 2026.

### A. Latar Belakang & Persyaratan Desain
1. **Penghapusan Tombol Menu Aksesibilitas**:
   Tombol floating "Menu Aksesibilitas" pada sisi kiri bawah dinonaktifkan dari tampilan UI publik agar tampilan bersih dan tidak menghalangi viewport pengguna.
2. **Penyelarasan Lebar Penuh Setara Navbar & Floating Bar di Bagian Bawah Layar**:
   Komponen `DocumentQuickMenu.tsx` dijadikan floating bar mengambang di bawah layar (`fixed bottom-3 sm:bottom-6 left-0 right-0 max-w-7xl mx-auto px-3 sm:px-6 z-[60]`) dengan backdrop blur (`bg-white/95 backdrop-blur-2xl shadow-2xl`).
3. **Running Text Dinamis & Penghapusan Teks "INFO HALUT"**:
   - Teks "INFO HALUT" ditiadakan, diganti dengan live pulsing indicator minimalis.
   - Konten teks berjalan bersifat dinamis, diambil via `runningTextService.getPublicItems()` dari endpoint `GET /api/v1/running-texts`.
   - Modul pengelolaan teks berjalan tersedia di Dashboard Admin (`/dashboard/running-text`) yang terletak persis di bawah menu **Agenda Kerja & Kalender**.
4. **Efek Animasi Transisi Masuk ("Mengecil ke Kiri")**:
   - Saat awal render (0–1.3 detik), running text membentang penuh 100% (`w-full`) hingga ke ujung kanan bar.
   - Setelah jeda ~1.3 detik, running text mengecil dengan transisi fluid `transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]` ke arah kiri (`flex-1 min-w-0`), memberi ruang bagi Kategori Dokumen (RPJPD, RPJMD, RKPD, Lainnya) yang meluncur dan mengembang mulus dari kanan ke kiri (`max-w-0` &rarr; `max-w-[760px]`).
   - Running text dilengkapi fitur auto-pause saat di-hover pengguna (`hover:[animation-play-state:paused]`) untuk kenyamanan membaca.
5. **Desain Responsif Mobile 2 Baris (2-Line Responsive Dock)**:
   - Pada layar desktop/tablet (`sm:` ke atas), floating dock tetap tampil dalam 1 baris ramping yang menyatukan running text (sisi kiri) dan pills kategori dokumen (sisi kanan).
   - Pada layar smartphone/mobile (`< sm`), dock otomatis bertransformasi menjadi 2 baris terpisah secara rapi:
     - **Baris Atas (Line 1)**: Teks berjalan (running marquee ticker) dengan live pulsing dot membentang penuh selebar layar (`w-full`), sehingga warta/informasi terkini dapat dibaca jelas tanpa terpotong atau terdesak.
     - **Baris Bawah (Line 2)**: 4 tombol dokumen publik (`RPJPD`, `RPJMD`, `RKPD`, `Lainnya`) tersusun presisi dalam 4 kolom (`grid grid-cols-4`) lengkap dengan visual ikon 3D dan label tebal, dipisahkan pembatas halus (`border-t border-slate-200/70`).
6. **Penyederhanaan Visual Hero Section (`HeroSection.tsx`)**:
   - Menghapus tombol CTA kuning `Jelajahi Portal Sekarang` di bawah judul utama beranda agar area hero tampil lebih bersih, berwibawa, dan langsung terfokus pada headline kelembagaan serta video profil tanpa gangguan tombol yang berlebihan.

### B. Resolusi Bug Floating Menghilang Saat Di-scroll (Safari & Nested Overflow Fix)

1. **Penyebab Masalah (Safari / WebKit Compositor Clipping)**:
   - Pada Safari (macOS & iOS), elemen dengan `position: fixed` yang bersarang di dalam container induk dengan `overflow: hidden` (seperti `section` pada `HeroSection.tsx` dan `page.tsx`) akan otomatis di-*clip* atau dihilangkan oleh engine WebKit saat container induk tergulung keluar dari viewport.
   - Selain itu, z-index lokal di dalam section induk tertutupi oleh elemen-elemen seksi berikutnya yang memiliki stacking context sendiri (`motion.div` dengan transform & opacity dari `ScrollReveal`).
2. **Solusi Arsitektur (`createPortal`)**:
   - Komponen `DocumentQuickMenu.tsx` pada mode `isTickerMode` kini di-*render* langsung ke `document.body` menggunakan React `createPortal(..., document.body)`.
   - Dengan *portal rendering*, elemen floating bar berada di root level viewport tanpa hambatan `overflow: hidden` atau *stacking context clipping* dari container manapun.
   - Menaikkan z-index ke `z-[70]` sehingga stabil mengambang di atas semua layer halaman tanpa menimpa modal global dialog (`z-[999999]`).
   - Menambahkan padding bawah ekstra pada `Footer.tsx` (`pb-24 sm:pb-28`) agar floating bar tidak menutupi baris hak cipta / tautan footer di bagian paling bawah halaman.
   - Melewatkan *unnecessary observer* saat `isTickerMode` aktif untuk optimasi konsumsi CPU dan render pipeline.
