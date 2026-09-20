# Sinkronisasi Data Profil Kelembagaan, Kontak & Jam Kerja

Dokumentasi standarisasi pengelolaan dan sinkronisasi informasi profil instansi BAPPEDA Kabupaten Halmahera Utara.

## Sumber Data Tunggal (Single Source of Truth)

Seluruh metadata institusi disimpan terpusat pada tabel `profils` dengan `key = 'tentang'` dan kolom `meta_json`:
- `tahun_berdiri`: Tahun legalitas pendirian Bappeda Halmahera Utara (contoh: `"2003"`).
- `alamat`: Alamat fisik sekretariat kantor (contoh: `"Jl. Ir. Hein Namotemo M.SP 2 Tobelo, Halmahera Utara, Maluku Utara"`).
- `telepon`: Saluran telepon resmi (contoh: `"+62 821 4810 7771"`).
- `email`: Alamat surat elektronik resmi (contoh: `"info@bappeda.halmaherautarakab.go.id"`).
- `jam_kerja`: Format jadwal layanan operasional (contoh: `"Senin - Jumat: 08:00 - 16:00 WIT"`).

## Sinkronisasi Frontend

1. **Dashboard Pengelola (`frontend/src/app/dashboard/profil/tentang/page.tsx`)**:
   - Dilengkapi 3 tab pengelolaan:
     1. Profil & Sejarah Singkat (WYSIWYG Rich Text Editor).
     2. Visi & Misi Pemerintah Daerah.
     3. Informasi Instansi, Jam Kerja & Kontak.
   - Menggunakan komponen standar `SearchableSelect` dari `@/components/ui/SearchableSelect` untuk pemilihan tahun berdiri dan jam layanan tanpa native `<select>`.
   - Menggunakan pelindung ref (`isLoadedRef`) saat `fetchTentangData` memuat data jam kerja agar nilai tersimpan dari database tidak ditimpa oleh default builder pada initial render.

2. **Halaman Publik Profil Bappeda (`frontend/src/app/profil/tentang/page.tsx`)**:
   - Menampilkan 3 seksi komprehensif:
     - Seksi 1: Sejarah & Pembentukan Instansi
     - Seksi 2: Visi & Misi Pemerintah Daerah
     - Seksi 3: Informasi Kelembagaan, Jam Kerja & Kontak (Grid kartu responsif menampilkan Tahun Berdiri, Jam Layanan, Telepon klik `tel:`, Email klik `mailto:`, dan Alamat lengkap sekretariat).

3. **Footer Global Portal (`frontend/src/components/layout/Footer.tsx`)**:
   - Mengambil data kontak secara dinamis melalui `API_BASE_URL + "/profil/tentang"`.
   - Menampilkan Alamat, Nomor Telepon, dan Email terkini sesuai pembaruan dari dashboard, dengan nilai fallback otomatis jika data belum dimuat.
