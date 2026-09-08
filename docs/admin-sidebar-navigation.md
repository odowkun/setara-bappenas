# Standar Navigasi & Ikon Sidebar Dashboard Admin SPBE

Status implementasi: 8 September 2026.

Dokumen ini mengatur arsitektur tata letak dan palet visual komponen navigasi utama admin (`AdminSidebar.tsx`) di portal BAPPEDA Halmahera Utara.

---

## 1. Keseragaman Warna Ikon Menu (Icon Uniformity Standard)

### Masalah Sebelumnya
Item menu yang memiliki sub-menu (seperti *Profil & Kelembagaan*, *Media, Pengumuman & Agenda*, *Manajemen Dokumen & ESRI*, *Pengaturan Spasial & WebGIS*, *Layanan & Partisipasi Warga*) sebelumnya memiliki kelas hardcoded `text-blue-700` pada elemen ikonnya. Hal ini membuat ikon-ikon tersebut terlihat mencolok berwarna biru terang meskipun item menu tersebut sedang tidak aktif (*inactive*), sementara menu tanpa sub-menu (*Ikhtisar Dashboard*, *Manajemen Pengguna*, *Audit Logs SPBE*) berwarna slate/abu-abu netral.

### Standar Warna Terbaru
Seluruh ikon navigasi sidebar wajib mengikuti aturan pewarnaan konsisten berikut:

| Kondisi Menu | Tipe Item | Warna Ikon | Latar Belakang & Teks |
|---|---|---|---|
| **Tidak Aktif (Inactive)** | Semua item (dengan atau tanpa sub-menu) | `text-slate-500 group-hover:text-blue-700 transition-colors` | `text-slate-600 hover:text-blue-700 hover:bg-blue-50/80` |
| **Aktif (Active Single Link)** | Menu tunggal (e.g. *Tautan OPD*, *Ikhtisar*) | `text-white` | `bg-blue-700 text-white shadow-md` |
| **Aktif (Parent with Sub-menu)** | Dropdown dengan anak aktif | `text-blue-700` | `bg-blue-50 text-blue-700` |
| **Sub-menu Anak (Inactive)** | Link di dalam dropdown | `text-slate-400` | `text-slate-600 hover:text-blue-700 hover:bg-blue-50/80` |
| **Sub-menu Anak (Active)** | Link di dalam dropdown | `text-white` | `bg-blue-700 text-white shadow-sm` |

---

## 2. Integrasi Mobile Drawer Sidebar

Sidebar admin sekarang mendukung mode drawer responsif pada layar sempit (`< md`):
- `AdminSidebar` menerima properti `mobileOpen?: boolean` dan `onMobileClose?: () => void`.
- Terhubung langsung ke `DashboardLayout` melalui state `mobileSidebarOpen` yang dipicu oleh tombol hamburger di `AdminHeader`.
- Dilengkapi dengan *backdrop blur* gelap (`bg-slate-900/60 backdrop-blur-xs`) dan animasi geser halus (`animate-in slide-in-from-left duration-250`).
- Saat pengguna memilih salah satu menu di mobile, drawer otomatis menutup secara mulus.
