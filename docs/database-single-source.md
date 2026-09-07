# Database sebagai Sumber Data Resmi Tunggal

## Keputusan

MySQL melalui Laravel API adalah satu-satunya sumber record resmi. Frontend tidak boleh membuat, menyimpan, atau menampilkan salinan record domain dari `localStorage`, konstanta demo, object URL, atau fallback mock.

Pengecualian browser storage hanya untuk:

- token sesi dashboard;
- preferensi aksesibilitas;
- checkpoint teknis unggah bertahap yang bukan record domain.

Jika API gagal, UI menampilkan keadaan kosong/pesan gagal. UI tidak boleh mengganti data gagal dengan record yang terlihat resmi.

## Perubahan yang diterapkan

| Domain | Sumber resmi | Endpoint baca | Mutasi |
|---|---|---|---|
| Agenda | `agendas`, `agenda_categories` | `/agendas`, `/agenda-categories` | Admin berizin `manage_pengumuman` |
| Pengumuman | `announcements`, `announcement_types` | `/pengumuman`, `/announcement-types` | Admin berizin `manage_pengumuman` |
| Kategori berita | `news_categories` | `/news-categories` | Admin berizin `manage_berita` |
| Survei | `survey_questions`, `survey_services`, `surveys` | `/surveys/config`, `/surveys/summary` | Sesuai permission survei |
| Proyek | `proyek_details`, `proyek_attachments` | `/proyek-details` | Admin berizin `manage_gis` |
| Geoprocessing | `geoprocessing_analyses` | `/gis/geoprocessing/analyses` | Admin berizin `manage_gis` |
| Jenis dokumen | `jenis_dokuments` | `/jenis-dokumen` | Admin berizin `manage_document_types` |
| Berita/profil/chart/pejabat | Tabel domain masing-masing | API domain masing-masing | Permission domain masing-masing |

Agenda dan Pengumuman mempunyai endpoint publik yang hanya mengembalikan record terbit. Pengumuman kedaluwarsa tidak masuk daftar publik. Kategori yang sudah dipakai tidak dihapus secara merusak; kategori dinonaktifkan.

## Integrasi ESRI

Database tetap otoritatif ketika ESRI tidak dikonfigurasi atau gagal:

- proyek tersimpan di database dengan `esri_objectid = null`;
- kegagalan sinkronisasi dilaporkan sebagai `success: false`;
- sistem tidak membuat `OBJECTID` atau attachment ID acak;
- buffer yang dihitung server lokal diberi `result_source=local_calculation`;
- hasil GeoJSON beserta sumbernya disimpan pada `geoprocessing_analyses`.

Dengan demikian, “berhasil disimpan” dan “berhasil sinkron ke ESRI” adalah dua status berbeda.

## Dampak dan trade-off

### Pro

- admin dan masyarakat membaca record yang sama;
- refresh, perangkat berbeda, dan sesi berbeda menghasilkan data konsisten;
- RBAC, audit mutation, validasi, sanitasi, dan backup berlaku pada semua mutasi;
- record demo tidak dapat muncul sebagai publikasi resmi saat API mati;
- kegagalan ESRI tidak lagi menghasilkan identitas spasial palsu.

### Kontra

- saat API/database tidak tersedia, UI tidak menampilkan cache record lama;
- tambah/edit memerlukan koneksi server aktif;
- tabel baru perlu dimigrasikan sebelum frontend baru dipasang;
- fitur notifikasi yang sebelumnya hanya berisi contoh sekarang kosong sampai memiliki tabel/endpoint resmi.

### Apa yang terjadi setelah perubahan

- data yang dibuat pada satu browser langsung tersedia di perangkat lain setelah API berhasil;
- menghapus data melalui dashboard menghapus record database, bukan hanya state tab;
- artikel, agenda, atau pengumuman kosong tetap kosong; frontend tidak menyisipkan contoh;
- file yang belum berhasil diunggah tidak mendapat URL seolah-olah sudah tersimpan;
- kategori master dibuat sekali di database dan direferensikan oleh form.

## Audit data browser lama

Salinan LevelDB Chrome untuk origin pengembangan diperiksa sebelum fallback dihapus:

- tidak ditemukan Agenda, kategori Agenda, tipe Pengumuman, kategori Berita, atau konfigurasi Survei lokal;
- ditemukan empat riwayat Geoprocessing: tiga merupakan seeded demo lama;
- satu record lain mengacu ke proyek yang sudah tidak ada di database dan memiliki label uji.

Tidak ada record tersebut yang diimpor. Mengimpor record orphan/test akan menaikkan data tidak terverifikasi menjadi data resmi. Salinan recovery tetap berada di direktori sementara lokal, bukan repository.

## Deployment

1. Backup database beserta `APP_KEY`.
2. Pasang backend.
3. Jalankan:

   ```bash
   cd backend
   php artisan migrate --force
   php artisan test
   ```

4. Pastikan variabel `ESRI_FEATURE_SERVICE_URL` dan `ESRI_GEOPROCESSING_URL` diisi jika sinkronisasi ESRI digunakan.
5. Pasang frontend setelah migration sukses.
6. Jalankan `npm run build`, lalu uji baca publik dan CRUD admin.

## Rollback

Rollback aplikasi sebaiknya dilakukan dengan mengembalikan kode versi sebelumnya tanpa menghapus tabel baru. Jika migration `000005` di-rollback, seluruh Agenda, Pengumuman, master kategori, dan riwayat Geoprocessing pada tabel baru akan terhapus. Karena itu rollback migration hanya boleh dilakukan setelah backup dan keputusan eksplisit.

## Penjaga regresi

- `DatabaseSourceOfTruthTest` melarang key browser-storage resmi serta fallback mock/ESRI palsu.
- `OfficialDatabaseSourceTest` menguji filter publik, autentikasi mutasi, persistensi Agenda/Pengumuman, masa berlaku Pengumuman, dan persistensi sumber Geoprocessing.

