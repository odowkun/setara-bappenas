# Modul Tautan OPD

Modul ini mengelola daftar tautan OPD dan aplikasi terkait yang tampil di beranda portal.

## Data

Tabel `tautan_opds` menyimpan:

- `name`: nama OPD atau aplikasi.
- `logo_url`: URL logo yang tampil di kartu publik.
- `url`: tautan eksternal opsional. Jika kosong, kartu tetap tampil tetapi tidak dapat diklik.
- `order_index`: urutan tampil.
- `is_active`: status tampil di beranda.

## API

- `GET /api/v1/tautan-opd`
- `GET /api/v1/tautan-opd?public=1`
- `POST /api/v1/tautan-opd`
- `PUT /api/v1/tautan-opd/{id}`
- `DELETE /api/v1/tautan-opd/{id}`

Logo dapat diunggah melalui endpoint khusus: `POST /api/v1/tautan-opd/upload-logo`.

## UI & Tata Letak Responsif

- Beranda: `frontend/src/components/home/OpdLinksGrid.tsx`
- Dashboard admin: `frontend/src/app/dashboard/tautan-opd/page.tsx`
  - **Desktop (`xl:`)**:
    - Kolom form kiri menerapkan `xl:sticky xl:top-4 self-start` dengan tinggi адапtif `xl:max-h-[calc(100dvh-6.5rem)]`.
    - Struktur form terbagi menjadi:
      - Header (`shrink-0`): Judul modul dan tombol batal edit jika dalam mode edit.
      - Body (`flex-1 overflow-y-auto`): Form input nama, upload logo ergonomis (`h-16 w-16` thumbnail), URL, urutan, dan status aktif.
      - Footer (`shrink-0 pt-3.5 border-t border-slate-100 bg-white mt-auto`): Tombol aksi utama "Simpan Tautan OPD" / "Perbarui Tautan OPD" yang selalu terlihat (pinned/non-clipped) ketika daftar kartu kanan di-scroll ke bawah.
  - **Mobile (`< xl`)**:
    - Kontainer form mengalir secara alami (`max-h-none`, non-sticky) untuk mencegah nested scroll trap.
    - Tombol "Input Tautan Baru" dan aksi "Edit" secara otomatis memicu smooth scroll ke form input (`formRef.current?.scrollIntoView({ behavior: 'smooth' })`).

## Akses

Secara default modul dashboard Tautan OPD hanya dapat diakses oleh `superadmin`.
Admin lain dapat mengakses modul ini jika diberi permission `manage_tautan_opd`
melalui halaman Manajemen Pengguna.

## Upload Logo & Resolusi Jalur Berkas

Form dashboard mendukung unggah logo melalui area pilih/tarik berkas, lalu
menyimpan URL hasil upload ke kolom `logo_url`. Terdapat preview logo responsif serta opsi "Hapus Logo" dan "Ganti Berkas Logo".

### Standardisasi Penyesuaian Lingkaran Logo (`CircularImageCropperModal`)
1. **Penyelarasan Tampilan Lingkaran Profil**:
   - Pada grid beranda (`OpdLinksGrid.tsx`), logo OPD ditampilkan di dalam lingkaran penuh (`rounded-full`). Banyak berkas logo asli berbentuk persegi panjang dengan tulisan teks atau logo yang tidak proporsional bila langsung dipotong tanpa penyesuaian.
   - Komponen interaktif `CircularImageCropperModal` (`frontend/src/components/ui/CircularImageCropperModal.tsx`) secara otomatis memotong dan menyesuaikan logo ke format lingkaran sempurna sebelum diunggah ke server:
     - **Interaksi Kanvas**: Pengguna dapat menggeser/drag posisi logo dengan mouse atau layar sentuh.
     - **Skala Zoom**: Slider skala perbesaran (0.4x hingga 3.5x) serta pinch-to-zoom dan wheel zoom.
     - **Fitur Cepat**:
       - *Paskan Lingkaran*: Menyesuaikan skala otomatis agar logo berada rapi di dalam 88% diameter lingkaran tanpa terpotong.
       - *Isi Penuh*: Memperbesar logo hingga mengisi penuh lingkaran.
       - *Pusatkan*: Mengembalikan koordinat geser ke titik tengah.
       - *Putar 90°*: Merotasi logo searah jarum jam untuk orientasi berkas yang miring.
       - *Pilihan Latar Belakang*: Opsi latar putih (`#ffffff`) atau transparan untuk format PNG/SVG.
     - **Export Berkualitas Tinggi**: Hasil potongan diekspor dalam kanvas beresolusi tinggi 512×512 px PNG berformat lingkaran bersih (`arc clip`).
     - **Tombol "Sesuaikan Lingkaran"**: Pengguna dapat sewaktu-waktu membuka kembali pemotong untuk logo yang sedang aktif tanpa perlu mengunggah ulang berkas mentah.
2. **Kesesuaian Kartu Dashboard**:
   - Kartu daftar tautan OPD di `frontend/src/app/dashboard/tautan-opd/page.tsx` dan pratinjau form kiri kini sama-sama menggunakan format lingkaran (`rounded-full`) untuk menjamin konsistensi visual 1:1 dengan halaman publik.

### Standar Penyajian Berkas Windows Server:
1. **Server Routing (`backend/server.php` & `backend/routes/web.php`)**:
   - `backend/server.php` memprioritaskan penanganan prefix `/storage/*` langsung ke kandidat lokasi `storage/app/public` dan `public/storage` sebelum mengembalikan `false`. Hal ini memastikan server bawaan PHP (`php artisan serve`) di Windows tidak mengembalikan status 404 ketika melayani aset gambar upload.
2. **Penyajian URL Frontend**:
   - URL logo di normalisasi oleh `tautanOpdService.ts` dan diprefix dengan `STORAGE_BASE_URL` baik di grid publik `OpdLinksGrid.tsx` maupun kartu admin `dashboard/tautan-opd/page.tsx`.

