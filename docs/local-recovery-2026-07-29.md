# Catatan Pemulihan Database Lokal — 29 Juli 2026

Saat verifikasi migrasi, perintah `migrate:fresh --env=testing` tetap menunjuk SQLite development karena proyek belum mempunyai `.env.testing`. Database lokal ter-reset.

Pemulihan yang dilakukan:

- Menjalankan seluruh seeder untuk data referensi.
- Mengambil metadata terakhir dari Local Storage Chrome untuk origin `http://127.0.0.1:3000`.
- Mengembalikan dokumen ID 13–15: `Vinkaaa`, `testing watermark`, dan `testing watermak ke 2`.
- Mengembalikan proyek ID 6–7 beserta empat lampiran yang file fisiknya masih tersedia.
- Mengembalikan 40 audit log yang tersedia pada cache browser.
- Merotasi seluruh password default dan mencabut seluruh token.
- Menjalankan migrasi RBAC, enkripsi PII, dan pemindahan dokumen lokal ke storage privat.

Hasil verifikasi setelah pemulihan:

| Data | Jumlah |
|---|---:|
| User | 3 |
| Dokumen | 13 |
| Proyek | 6 |
| Lampiran proyek | 4 |
| Audit log | 40 |
| Permission | 14 |

Backup sebelum migrasi enkripsi disimpan dengan mode file `0600` di:

`backend/storage/app/private/database-before-security-20260729.sqlite`

Arsip lima PDF yang sudah dipindahkan ke storage privat disimpan dengan mode file `0600` di:

`backend/storage/app/private/document-private-security-20260729.tar.gz`

SHA-256 arsip: `7ede5c42c9e4303d0a64bfd2591295e3c104f7d96c07ce687b9680805979ef7d`.

Credential Super Admin sementara disimpan dengan mode file `0600` di:

`backend/storage/app/private/dev-superadmin-credential.txt`

Setelah berhasil login, ganti password melalui Pengaturan Profil, reset password dua akun admin lain melalui Manajemen User, lalu hapus file credential. Backup lokal dapat dihapus setelah data dipastikan lengkap dan sudah tersedia backup terenkripsi lain.

Data yang tidak tersedia pada cache browser tidak dapat direkonstruksi. Tidak ditemukan backup SQLite lain. Riwayat unduhan sebelum reset juga tidak tersedia di cache; dokumen uji terakhir pada cache mempunyai 0 unduhan.
