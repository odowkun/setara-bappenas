# Standar Kategori Dokumen Perencanaan Daerah & Ticker Bar

Dokumentasi standarisasi klasifikasi dokumen perencanaan pembangunan daerah, penyesuaian ticker navigasi cepat, dan tagline resmi BAPPEDA Kabupaten Halmahera Utara.

## 1. Klasifikasi Kategori Dokumen Perencanaan Daerah

Kategori dokumen perencanaan daerah diperbarui dan diperinci agar mengakomodasi pemisahan dokumen tingkat provinsi dan kabupaten serta dokumen nasional:

| Kode Kategori | Label Publik | Deskripsi Resmi | Lingkup |
|---|---|---|---|
| `RPJPD` | **RPJPD** | Rencana Pembangunan Jangka Panjang Daerah (20 Tahun) | Daerah (Halut) |
| `RPJMN` | **RPJMN** | Rencana Pembangunan Jangka Menengah Nasional (5 Tahun) | Nasional |
| `RPJMD_PROV` | **RPJMD Prov** | Rencana Pembangunan Jangka Menengah Daerah Provinsi (5 Tahun) | Provinsi Maluku Utara |
| `RPJMD_KAB` | **RPJMD Kab** | Rencana Pembangunan Jangka Menengah Daerah Kabupaten (5 Tahun) | Daerah (Halut) |
| `RKPD` | **RKPD** | Rencana Kerja Pemerintah Daerah (Tahunan) | Daerah (Halut) |
| `LAINNYA` | **Lainnya** | Dokumen Perencanaan dan Laporan Teknis Lainnya (Renstra, Renja, LKPJ, Data Sektoral) | Lintas Bidang |

### Sinkronisasi Database (`backend/database/migrations`)
- Migration `2026_09_21_000006_update_document_categories.php`:
  1. Menambahkan entri `rpjmn`, `rpjmd_prov`, dan `rpjmd_kab` ke dalam tabel master `jenis_dokuments`.
  2. Melakukan migrasi data dokumen historis bertipe `rpjmd` menjadi `rpjmd_kab` (Kabupaten Halmahera Utara).

### Filter Repository Dokumen Publik (`/dokumen`)
- Filter dokumen publik menampilkan 6 pilihan utama (`RPJPD`, `RPJMN`, `RPJMD Prov`, `RPJMD Kab`, `RKPD`, `Lainnya`).
- Mendukung query parameter cerdas `?jenis=...` baik format snake_case (`rpjmd_kab`, `rpjmd_prov`) maupun kebab-case (`rpjmd-kab`, `rpjmd-prov`).
- Pencarian dokumen `RPJMD Prov` dan `RPJMD Kab` menyertakan backward-compatibility pada data eksisting.

### Manajemen Dokumen Dashboard (`/dashboard/dokumen`)
- Dropdown jenis dokumen pada filter list dokumen dashboard menyertakan pemisahan:
  - `rpjmd_prov`: RPJMD Prov (Provinsi)
  - `rpjmd_kab`: RPJMD Kab (Kabupaten)
  - `rpjmn`: RPJMN (Nasional)
  - Serta `rpjpd`, `rkpd`, `renstra`, `renja`, dan `data_sektoral`.

---

## 2. Navigasi Cepat Ticker Bar (`DocumentQuickMenu.tsx`)

Pada mode floating ticker yang tampil melayang di bagian bawah halaman beranda (`HeroSection.tsx`):
- Keempat tombol pil kategori sebelumnya dihilangkan sesuai arahan penyederhanaan antarmuka.
- Digantikan dengan satu tautan elegan berprofil ramping:
  **Teks "Dokumen" dengan panah ke kanan (`Dokumen ➔`)** mengarah langsung ke `/dokumen`.
- Memberikan ruang horizontal yang lebih lega bagi running text berita/agenda terkini, sekaligus menyajikan Call-to-Action (CTA) yang jelas dan ramah pengguna di perangkat mobile maupun desktop.

---

## 3. Tagline Resmi Beranda (`HeroSection.tsx`)

Tepat di bawah judul headline utama *"Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara"*, disematkan tagline resmi:

> **SINERGI LOKAL, SOLUSI GLOBAL**

- Menggunakan tipografi emas/amber berjarak renggang (`text-amber-300 font-bold uppercase tracking-wider text-xs sm:text-sm md:text-base drop-shadow-sm`) untuk visibilitas kontras tinggi di atas latar belakang video Pulau Meti dan gradien biru laut Halmahera Utara.
