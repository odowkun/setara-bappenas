# Standar UI Floating Controls & Aksesibilitas (HUD Glassmorphism)

Status implementasi: 7 September 2026.

Dokumen ini mendokumentasikan pembaruan desain visual dan interaksi pada komponen floating controls di portal BAPPEDA Halmahera Utara, khususnya **Menu Aksesibilitas** (`A11yToolbar.tsx`) dan **Quick Filter Kategori Dokumen** (`DocumentQuickMenu.tsx`).

---

## 1. Latar Belakang & Masalah

Sebelumnya, tombol floating di sisi bawah layar menggunakan desain solid blue standar (`bg-blue-700`) yang terlihat kaku, tidak seragam tinggi vertikalnya, serta berisiko berbenturan dengan elemen UI browser dan overlay dev tools.

| Aspek | Sebelum | Sesudah |
|---|---|---|
| **Visual Style** | Plain blue solid badge (`bg-blue-700`) | Executive Frosted Glass HUD (`bg-slate-950/90 backdrop-blur-2xl border-slate-700/80`) |
| **Aksen Ikon** | Ikon putih standar tanpa badge container | Glowing circular badge (`bg-blue-500/20` & `bg-amber-500/20`) berborder halus |
| **Dimensi & Tinggi** | Tidak seragam (`h-13` / `h-14`) | Seragam vertikal `h-12` (`48px`) dengan `rounded-full` |
| **Posisi Floating** | Offset tidak simetris | Simetris pada `bottom-5 left-5` dan `bottom-5 right-5` (`sm:bottom-6`) |
| **Interaksi Drawer** | Panel floating terpisah tanpa koordinasi | Terkoordinasi via Custom Event `bappeda:floating-panel-open` (saling menutup otomatis) |
| **Responsivitas Mobile** | Teks panjang memakan area layar sempit | Otomatis berubah menjadi Floating Action Badge (FAB) sirkular ringkas |

---

## 2. Implementasi Komponen

### A. `A11yToolbar.tsx` (Menu Aksesibilitas)
- **Lokasi**: Sisi kiri bawah (`bottom-5 left-5 sm:bottom-6 sm:left-6`).
- **Aksen Warna**: Cyan/Blue (`text-blue-400`, `bg-blue-500/20`, border `border-blue-400/30`).
- **Fitur Interaktif**:
  - Penyesuaian ukuran teks (A- / Reset / A+).
  - Mode Kontras Tinggi (High Contrast).
  - Tipografi Ramah Disleksia (OpenDyslexic style).
  - Pembaca Suara (Voice Reader) memanfaatkan Web Speech API.
  - Shortcut pencarian instan dokumen (`⌘K`).

### B. `DocumentQuickMenu.tsx` (Filter Cepat Dokumen)
- **Lokasi**: Sisi kanan bawah (`bottom-5 right-5 sm:bottom-6 sm:right-6`).
- **Aksen Warna**: Amber/Emas (`text-amber-400`, `bg-amber-500/20`, border `border-amber-400/30`).
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
