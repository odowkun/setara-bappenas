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

## 3. Penyempurnaan Logika Status Progres Pembangunan

Sesuai kebutuhan operasional pelaporan dan pembaruan progres:
- **Penghapusan Opsi "Belum Mulai"**:
  - Pada modal **Update Progres** di `dashboard/dokumen/[id]/page.tsx` dan `dashboard/update-progres/page.tsx`, opsi status `"Belum Mulai"` (`belum_mulai`) dihapus dari pilihan `SearchableSelect`.
  - **Rasional**: Saat admin membuka dan mengedit progres proyek, kegiatan tersebut telah memasuki tahap pelaksanaan (tidak lagi "belum mulai").
- **Default Status Progres**:
  - Nilai default status saat mengedit diatur ke `"Dalam Proses"` (`dalam_proses`).
  - Apabila data proyek awal di database masih bernilai `belum_mulai`, modal secara otomatis mengonversi nilainya ke `dalam_proses` saat dibuka.
  - Opsi status yang tersedia:
    1. `dalam_proses` ("Dalam Proses")
    2. `selesai` ("Selesai 100%")
    3. `terkendala` ("Terkendala / Restrukturisasi")

---

## 4. Migrasi Pemilih Tahun pada CustomDatePicker & Penghapusan Batas Tahun (No Limit)

Sebagai bagian dari eliminasi total elemen native `<select>` di seluruh basis kode:
- **`frontend/src/components/ui/CustomDatePicker.tsx`**:
  - Dropdown pemilih tahun (sebelumnya elemen native `<select>` dengan batas 2020–2035) diganti menjadi **`SearchableSelect`** dengan ukuran ringkas (`size="sm"`).
  - **Dukungan Pencarian & Ketik Bebas (`creatable={true}`)**: Pengguna dapat mencari tahun secara instan atau mengetik tahun berapa saja tanpa batasan buatan.
  - **Rentang Dinamis Luas**: Rentang tahun bawaan diperluas dari `1945` hingga `2099+`, dan secara otomatis memperluas opsi jika nilai tahun dokumen berada di luar rentang tersebut (misal arsip historis atau perencanaan jangka panjang RPJMD/Indonesia Emas).
  - **Auto-Scroll ke Opsi Aktif (Centered Positioning)**: Saat dropdown dibuka, list pilihan otomatis melakukan *instant scroll* sehingga opsi yang sedang terpilih (misal: tahun 2026) langsung berada tepat di tengah viewport dropdown (`centered in viewport`), memudahkan navigasi ke tahun sebelum dan sesudahnya tanpa harus scroll manual dari ujung atas.
  - **Stacking Context & Z-Index**: Popover portal `SearchableSelect` ditingkatkan ke `z-[10000001]` di atas portal kalender `CustomDatePicker` (`z-[999999]`), menjamin interaksi dan klik dropdown tahun bebas tumpang tindih.
- **Pembersihan Pembatas Tahun di Formulir**:
  - Atribut pembatas sempit `minYear={2020}` dan `maxYear={2035}` telah dihapus dari seluruh pemanggil:
    - `frontend/src/app/survey-kepuasan/page.tsx`
    - `frontend/src/components/ui/DateRangePlanner.tsx`
    - `frontend/src/components/documents/archive/ArchiveMetadataForm.tsx`
    - `frontend/src/app/dashboard/galeri/tambah/page.tsx`
    - `frontend/src/app/dashboard/galeri/edit/[id]/page.tsx`
    - `frontend/src/app/dashboard/pengumuman/tambah/page.tsx`
    - `frontend/src/app/dashboard/pengumuman/edit/[id]/page.tsx`

---

## 5. Status Verifikasi

- **Pencarian Kode Sumber**: `grep_search` memastikan `0` native `<select>` dan `0` pembatas `minYear={2020}` / `maxYear={2035}` tersisa di seluruh direktori `frontend/src`.
- **Kompilasi Next.js**: `npm run build` dijalankan dan sukses 100% tanpa error TypeScript maupun linting pada seluruh 66 route halaman.
