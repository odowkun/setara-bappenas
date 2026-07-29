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

## UI

- Beranda: `frontend/src/components/home/OpdLinksGrid.tsx`
- Dashboard admin: `frontend/src/app/dashboard/tautan-opd/page.tsx`

## Akses

Secara default modul dashboard Tautan OPD hanya dapat diakses oleh `superadmin`.
Admin lain dapat mengakses modul ini jika diberi permission `manage_tautan_opd`
melalui halaman Manajemen Pengguna.

## Upload Logo

Form dashboard mendukung unggah logo melalui area pilih/tarik berkas, lalu
menyimpan URL hasil upload ke kolom `logo_url`.
