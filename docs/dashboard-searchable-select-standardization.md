# Standarisasi Komponen Dropdown Dashboard (SearchableSelect Migration)

Status implementasi: 21 September 2026.

Dokumen ini mencatat audit menyeluruh dan migrasi penuh seluruh elemen dropdown di seluruh panel dashboard admin BAPPEDA Halmahera Utara menuju komponen terstandarisasi **`SearchableSelect`** (`frontend/src/components/ui/SearchableSelect.tsx`).

---

## 1. Aturan & Standar Arsitektur

Sesuai aturan baku proyek:
1. **Dilarang Menggunakan Native HTML `<select>`**:
   - Seluruh form input, filter tabel, modal dialog, dan pengatur baris pagination dilarang menggunakan elemen native `<select>`.
   - Native select browser memiliki keterbatasan visual, tidak mendukung pencarian teks (filtering), serta rentan terpotong oleh `overflow: hidden` pada container induk.
2. **Karakteristik Wajib `SearchableSelect`**:
   - **Real-time Search Filtering**: Pengguna dapat mencari opsi secara instan dengan mengetik kata kunci.
   - **React Portal Rendering**: Dropdown dirender via `createPortal` ke `document.body` dengan z-index tinggi (`z-[999999]`), mencegah pemotongan stacking context pada tabel atau modal.
   - **Indikator Checkmark**: Menampilkan ikon centang (`Check`) jelas pada opsi yang sedang aktif terpilih.
   - **Creatable Support**: Mendukung penambahan opsi baru langsung dari bilah pencarian jika diaktifkan (`creatable={true}`).

---

## 2. Hasil Audit & Migrasi Halaman Dashboard

Audit menyeluruh memeriksa seluruh file di bawah direktori `frontend/src/app/dashboard`:

| No | Modul / Halaman Dashboard | Lokasi File | Elemen yang Dimigrasi | Keterangan Pembaruan |
|---|---|---|---|---|
| 1 | **Manajemen Galeri** | `dashboard/galeri/page.tsx` | Filter Kategori Album | Menggantikan native `<select>` dengan `SearchableSelect` real-time filter kategori album. |
| 2 | **Manajemen Pengumuman** | `dashboard/pengumuman/page.tsx` | Filter Tipe & Selector Baris Pagination | Dua native select (filter tipe & baris per halaman) dimigrasi ke `SearchableSelect`. |
| 3 | **Update Progres Pembangunan** | `dashboard/update-progres/page.tsx` | Modal Status Progres Pembangunan | Status pengerjaan (*belum mulai, dalam proses, selesai 100%, terkendala*) kini menggunakan `SearchableSelect`. |
| 4 | **Tambah & Edit Berita** | `dashboard/berita/tambah/page.tsx` | Dropdown Kategori Berita | Menggantikan native select dan mengaktifkan fitur `creatable` langsung dari dropdown. |
| 5 | **Edit Agenda Kegiatan** | `dashboard/agenda/edit/[id]/page.tsx` | Kategori Kegiatan & Penyelenggara OPD | Menyelaraskan dengan halaman tambah agenda, menggunakan `SearchableSelect` dengan opsi custom. |
| 6 | **Manajemen Berita** | `dashboard/berita/page.tsx` | Filter Kategori, Filter Status, & Pagination | Tiga native select diubah menjadi `SearchableSelect` responsif. |
| 7 | **Detail Dokumen & Lampiran Teknis** | `dashboard/dokumen/[id]/page.tsx` | Modal Status Progres & Kategori Dokumen Teknis | Dua dropdown modal (status proyek dan jenis lampiran teknis) menggunakan `SearchableSelect`. |
| 8 | **Halaman Publik Pengumuman & Berita** | `pengumuman/page.tsx` & `berita/page.tsx` | Selector Baris Data Pagination | Turut diseragamkan ke `SearchableSelect` untuk konsistensi seluruh aplikasi. |

---

## 3. Status Verifikasi

- **Pencarian Kode Sumber**: `grep_search` memastikan `0` native `<select>` tersisa di seluruh direktori `frontend/src/app/dashboard`.
- **Kompilasi Next.js**: `npm run build` dijalankan dan sukses 100% tanpa error TypeScript maupun linting pada seluruh route halaman.
