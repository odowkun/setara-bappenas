# Standarisasi Header Card dan Layout Dashboard SPBE Bappeda Halmahera Utara

## Ringkasan Standar
Dokumen ini mendefinisikan standar resmi tata letak antarmuka (UI layout) dan kartu header (*Header Card*) pada seluruh halaman menu dashboard pengelola (`/dashboard/*`) Bappeda Halmahera Utara. Standarisasi ini dibuat untuk mengeliminasi inkonsistensi visual ("compang-camping"), seperti penggunaan banner dark navy gradien yang kontras dengan modul lain, ketiadaan pembungkus kartu, ataupun penyempitan kontainer (`max-w-*`).

---

## 1. Aturan Struktur Root Kontainer Halaman
Setiap halaman modul dashboard diwajibkan menggunakan struktur kontainer *full-width* fleksibel:
```tsx
<div className="w-full space-y-6 font-sans pb-12">
  {/* Konten Halaman */}
</div>
```
- **Larangan**: DILARANG KERAS menggunakan `max-w-4xl mx-auto`, `max-w-3xl mx-auto`, atau `max-w-[1400px] mx-auto` pada pembungkus root halaman dashboard karena menimbulkan celah offset kosong yang canggung di samping sidebar kiri.

---

## 2. Standar Kartu Header (*White Card Header*)
Seluruh halaman modul utama maupun sub-halaman dashboard menggunakan format kartu putih bersih seragam:

```tsx
<div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div className="space-y-1">
    {/* 1. Judul Modul */}
    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
      <MainIcon className="w-6 h-6 text-blue-600 shrink-0" />
      <span>{JudulHalaman}</span>
    </h1>

    {/* 2. Deskripsi Subjudul */}
    <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
      {DeskripsiFungsiModul}
    </p>
  </div>

  {/* 4. Action Buttons / Metric Indicators */}
  <div className="flex flex-wrap items-center gap-3">
    {/* Tombol Utama */}
    <button className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 shrink-0">
      <Plus className="w-4 h-4" />
      <span>{LabelAksi}</span>
    </button>
  </div>
</div>
```

---

## 3. Modul yang Telah Distandarisasi
Berikut daftar modul dashboard yang telah diselaraskan 100% mengikuti standar di atas:
1. **Jenis Dokumen Perencanaan** (`/dashboard/dokumen/jenis-dokumen`):
   - Sebelumnya: Banner dark navy gradient dengan tombol/badge kuning mencolok.
   - Sekarang: White Card Header seragam dengan badge `Administrator Management` dan tombol biru solid.
2. **Infografis Pembangunan** (`/dashboard/infografis`):
   - Sebelumnya: Banner dark gradient biru-indigo dengan blur blob.
   - Sekarang: White Card Header dengan badge `Visual Data & Infographics Manager` dan counter tersemat beranda.
3. **Teks Berjalan (Running Text)** (`/dashboard/running-text`):
   - Sebelumnya: Banner dark gradient biru-indigo.
   - Sekarang: White Card Header dengan badge `Floating Bar Marquee Controller`.
4. **Survei Kepuasan Masyarakat (IKM)** (`/dashboard/survey-kepuasan`):
   - Sebelumnya: Header teks melayang tanpa kontainer card.
   - Sekarang: White Card Header lengkap dengan badge `IKM & Dynamic Form Builder` dan tombol akses form publik.
5. **Kritik & Saran** (`/dashboard/kritik-saran`):
   - Sebelumnya: Header teks melayang tanpa padding standar.
   - Sekarang: White Card Header lengkap dengan badge `Manajemen Masukan & Layanan Publik` dan tombol aksi ke form publik.
6. **Audit Log Security** (`/dashboard/audit-logs`):
   - Sebelumnya: Header teks polos melayang.
   - Sekarang: White Card Header dengan badge `Modul SuperAdmin SPBE` dan indikator total aktivitas terekam.
7. **Agenda Kerja** (`/dashboard/agenda` & subpages):
   - Sekarang: White Card Header lengkap dengan badge `Manajemen Agenda & Kalender Kegiatan` dan tombol tambah agenda.
8. **Portal Berita** (`/dashboard/berita` & subpages):
   - Sekarang: White Card Header lengkap dengan badge `Portal Publikasi & Pers Daerah` dan tombol tulis artikel.
9. **Pengumuman Resmi** (`/dashboard/pengumuman` & subpages):
   - Sekarang: White Card Header lengkap dengan badge `Pemberitahuan & Edaran Daerah` dan tombol tambah pengumuman.
10. **Manajemen Pengguna SPBE** (`/dashboard/users` & subpages):
    - Sekarang: White Card Header lengkap dengan badge `Matriks Hak Akses & Otoritas` dan tombol tambah pengguna.
11. **Profil Lembaga** (`/dashboard/profil/*`):
    - Seluruh sub-editor (Tentang/Sejarah, Struktur Organisasi, Tupoksi, Dasar Hukum) diselaraskan ke kontainer *full-width* dan White Card Header dengan badge tematik.
12. **Dokumen Perencanaan & Lampiran** (`/dashboard/dokumen`, `riwayat-unduhan`, `lampiran-teknis`, `arsip`):
    - Diselaraskan ke White Card Header dengan badge fungsional masing-masing.
13. **Geospasial & Pemetaan** (`/dashboard/geotagging-proyek`, `geoprocessing-analisis`, `update-progres`):
    - Diselaraskan ke White Card Header dengan badge GIS & Geoprocessing.
