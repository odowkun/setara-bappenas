# Standar Struktur Navigasi Publik & Menu Inovasi (Frontend Navbar)

Status Implementasi: 21 September 2026.

Dokumen ini mengatur arsitektur tata letak dan struktur navigasi publik portal BAPPEDA Halmahera Utara (`frontend/src/components/layout/Navbar.tsx`).

---

## 1. Perubahan Menu Inovasi & Integrasi POPEDA

### Konteks
Sebelumnya, portal **POPEDA** (Pojok Perencanaan Daerah) diletakkan sebagai tautan langsung (*direct external link pill*) di navbar desktop dan menu mobile. Seiring dengan kebutuhan ekspansi program inovasi daerah Bappeda Halmahera Utara, struktur menu disederhanakan dan dikelompokkan ke dalam dropdown **"Inovasi"**.

### Struktur Menu Navbar Terkini
Urutan menu pada bilah navigasi utama (Desktop & Mobile):

1. **Beranda** (`/`)
2. **Profil** (Dropdown)
   - Tentang Bappeda (`/profil/tentang`)
   - Tugas & Fungsi (`/profil/tugas-fungsi`)
   - Dasar Hukum (`/profil/dasar-hukum`)
   - Struktur Organisasi (`/profil/struktur`)
3. **Dokumen** (`/dokumen`)
4. **Berita & Agenda** (Dropdown)
   - Berita & Artikel (`/berita`)
   - Pengumuman Resmi (`/pengumuman`)
   - Galeri Foto & Video (`/galeri`)
   - Agenda Kerja & Kalender (`/agenda`)
   - Infografis Pembangunan (`/infografis`)
5. **Inovasi** (Dropdown Baru)
   - **POPEDA** (Pojok Perencanaan Daerah)
     - Tautan: `https://sites.google.com/view/popeda` (External Link, target `_blank`)
     - Ikon: `Lightbulb` (dengan indikator `ExternalLink`)
     - Subtitle deskriptif: *Pojok Perencanaan Daerah*
6. **Layanan Publik** (Dropdown)
   - LAPOR! (`https://www.lapor.go.id`)
   - Kritik & Saran (`/kritik-saran`)
   - Survey Kepuasan (`/survey-kepuasan`)

---

## 2. Implementasi Teknis

### Desktop Header Capsule
- Menghadirkan state dropdown `activeDropdown === "inovasi"` dengan timeout mouse hover (`handleMouseEnter` & `handleMouseLeave`) yang konsisten dengan dropdown lain.
- Panel popover dilengkapi transisi `animate-in fade-in zoom-in-95 duration-200` dengan border `border-slate-200` dan shadow elegan `shadow-2xl shadow-slate-950/20`.
- Tautan eksternal ke POPEDA menggunakan atribut keamanan rel standar: `target="_blank" rel="noreferrer"`.

### Mobile Drawer Navigation
- Menggunakan handler state toggle `toggleMobileSubmenu("inovasi")`.
- Menampilkan chevron dengan rotasi animasi `rotate-180` ketika sub-menu terbuka.
- Tautan menutup drawer mobile secara otomatis melalui handler `onClick={() => setMobileMenuOpen(false)}`.
