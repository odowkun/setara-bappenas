# Dokumentasi Fitur Kritik, Saran & Transparansi Tanggapan BAPPEDA

## 1. Ringkasan Perubahan
1. **Pilihan Status Tanggapan pada Admin Dashboard (`/dashboard/kritik-saran`)**:
   - Status tanggapan disederhanakan hanya menjadi 2 opsi:
     - `Sudah Ditanggapi` (Default)
     - `Dalam Proses Tindak Lanjut`
   - Menggunakan komponen `SearchableSelect` sesuai standar UI aplikasi (tidak menggunakan native HTML `<select>`).
   - Tombol "Tanggapi" otomatis mengatur default status ke `Sudah Ditanggapi`, kecuali jika sebelumnya sudah dalam status `Dalam Proses Tindak Lanjut`.

2. **Tampilan Publik & Sensor Nama (`/kritik-saran`)**:
   - Ditambahkan bagian **Aspirasi Warga & Tanggapan BAPPEDA** pada halaman publik.
   - Menampilkan daftar masukan publik beserta status tindak lanjut dan catatan balasan resmi dari BAPPEDA.
   - **Sensor Nama Responden (`***`)**:
     - Setiap nama pelapor disensor di level backend (`KritikController@publicFeed`) dan di-format ulang pada frontend (`formatMaskedName`), misalnya `Budi Santoso` disensor menjadi `B*** S***`.
     - Data privat seperti alamat email dan nomor telepon responden **tidak pernah** diekspos ke publik (`stripped` dari response endpoint publik).

3. **Endpoint Publik & Pengujian Keamanan**:
   - `GET /api/v1/kritik/public`: Endpoint publik tanpa autentikasi untuk memuat feed aspirasi & tanggapan resmi secara transparan.
   - Pengujian keamanan otomatis ditambahkan pada `SecurityRbacPrivacyTest::test_public_kritik_endpoint_masks_name_and_strips_private_contacts`.
