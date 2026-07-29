# Walkthrough Fitur Watermark Dokumen

## Ringkasan

Setiap dokumen baru yang diunggah melalui Dashboard BAPPEDA diproses oleh backend sebelum dapat disimpan sebagai arsip resmi. Watermark teks `BAPPEDA HALUT` ditempatkan berulang dalam pola 3 x 4 secara diagonal pada setiap halaman, dengan opacity rendah agar isi dokumen tetap terbaca.

## Alur

1. Admin memilih PDF, dokumen Office, atau gambar pada halaman unggah dokumen.
2. Berkas dikirim melalui mekanisme chunk upload yang dapat dilanjutkan.
3. Setelah seluruh chunk digabungkan, backend menormalisasi berkas menjadi PDF.
4. Backend menambahkan watermark pada setiap halaman dan hanya menyimpan hasil akhir berakhiran `_watermarked.pdf`.
5. Entri database hanya dapat dibuat bila berkas ber-watermark tersebut benar-benar tersedia di penyimpanan publik.

Dokumen Office memerlukan LibreOffice (`soffice`) pada server. Lokasi executable dapat diatur melalui `LIBREOFFICE_BINARY`. Opacity, sudut, teks, jumlah baris dan kolom watermark, serta timeout konversi dapat disesuaikan melalui konfigurasi `document-watermark.php`.

## Jaminan

- Dokumen baru tidak dapat disimpan dari PDF contoh atau alamat eksternal yang belum diverifikasi.
- PDF asli tetap berupa konten PDF; watermark ditambahkan sebagai lapisan transparan sehingga teks tidak dirasterisasi.
- PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG, JPEG, dan PNG didukung.
- Bila konversi atau watermark gagal, server mengembalikan error dan tidak menerbitkan berkas tanpa watermark.

## Statistik Preview dan Unduhan

1. Setiap kali masyarakat membuka preview, frontend memanggil endpoint preview dan kolom `documents.views` bertambah di database.
2. Tombol unduh tidak lagi mengarah langsung ke berkas. Masyarakat wajib mengisi alamat email yang valid.
3. Backend menyimpan email, dokumen, waktu, IP, dan browser ke tabel `document_download_logs`.
4. Counter `documents.downloads` bertambah dalam transaksi database yang sama dengan pembuatan log.
5. Admin dapat melihat statistik dan daftar email melalui halaman `/dashboard/dokumen/riwayat-unduhan`.
6. Endpoint riwayat email dilindungi token Sanctum dan tidak dapat diakses oleh masyarakat.

## Quick Menu dan Filter Dokumen

1. Homepage menampilkan quick menu dokumen berisi RKPD, RTRW, RPJPD, RPJMD, LKPJ, dan Dokumen Publik Lainnya.
2. Setelah quick menu terlewati saat halaman digulir, menu masuk dengan animasi slide sebagai bubble mengambang di pojok kanan bawah.
3. Bubble dapat dibuka untuk mengakses seluruh kategori tanpa kembali ke bagian hero.
4. Bubble Menu Aksesibilitas ditempatkan di pojok kiri bawah agar tidak bertabrakan dengan bubble dokumen.
5. Menu yang sama digunakan sebagai filter pada halaman `/dokumen`. Kategori Dokumen Publik Lainnya menampilkan seluruh jenis di luar lima kategori utama.
6. Animasi menghormati preferensi `prefers-reduced-motion`, sedangkan seluruh tombol dan tautan tetap dapat diakses melalui keyboard.

## Pembersihan Fitur Aspirasi

Fitur Aspirasi telah dinonaktifkan karena tidak digunakan. Halaman pengajuan dan pelacakan publik, halaman pengelolaan dashboard, menu, notifikasi, hak akses, service frontend, controller serta route API telah dihapus. Migrasi `2026_07_28_000002_drop_aspirasis_table.php` menghapus tabel `aspirasis`; data Aspirasi lama tidak dipindahkan ke layanan lain.
