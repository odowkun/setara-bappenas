# Keamanan, RBAC, dan Privasi

Status implementasi: 29 Juli 2026.

Dokumen ini menjelaskan kontrol keamanan yang benar-benar diterapkan pada Portal BAPPEDA Halmahera Utara, dampaknya terhadap pengguna, serta cara operasional dan rollback.

## Hasil akhir

- Seluruh mutasi dashboard wajib menggunakan Bearer token Laravel Sanctum dan permission yang sesuai.
- Pengelolaan akun hanya dapat dilakukan oleh pengguna dengan role `superadmin`, bukan sekadar permission langsung.
- Role dan permission selalu dihitung server; data user dari `localStorage` tidak lagi dipercaya.
- Admin Bidang hanya dapat membaca atau mengubah dokumen dan proyek milik bidangnya.
- Dokumen, proyek, dan berita draft/nonpublik tidak muncul pada endpoint atau pencarian publik.
- Data pribadi survei, kritik/saran, dan email pengunduh dienkripsi dengan `APP_KEY`.
- Hash SHA-256 email digunakan untuk hitungan unik dan filter tepat tanpa membuka ciphertext.
- IP dan user-agent pengunduh tidak lagi dikumpulkan karena kebutuhan bisnis hanya memerlukan email dan waktu unduh.
- Dokumen unggahan lokal dipindahkan dari storage publik ke storage privat. API publik hanya menampilkan endpoint preview, bukan lokasi file asli.
- Setelah email tercatat, server memberikan tautan unduh bertanda tangan yang berlaku lima menit; URL tanpa signature ditolak.
- Respons PII memakai `Cache-Control: no-store, private`.
- HTML berita dan profil dibersihkan dengan allowlist sebelum disimpan untuk mencegah stored XSS.
- Semua mutasi admin yang berhasil dicatat oleh middleware server. Nama aktor tidak lagi dipercaya dari payload browser.
- Login dibatasi 5 percobaan/menit; survei/kritik, preview, download, pencarian, dan counter berita juga dibatasi.
- Token memiliki masa berlaku default 480 menit.

## Matriks Role dan Permission (14 Modul Granular Portal)

Sesuai Surat Keputusan / Matriks Penugasan Resmi BAPPEDA Kabupaten Halmahera Utara, hak akses dipetakan ke dalam 14 modul permission Spatie secara granular:

| No | Nama Modul Permission | Slug Spatie | Cakupan & Otoritas Akses |
|:---:|---|---|---|
| 1 | Kelola Profil & Kelembagaan | `manage_profil` | Visi-misi, tugas-fungsi, dasar hukum, profil kepala bappeda & struktur organisasi |
| 2 | Kelola Pengumuman Resmi & Edaran | `manage_pengumuman` | Publikasi surat edaran resmi, pengumuman lelang/tender, lampiran PDF |
| 3 | Kelola Tautan OPD & Aplikasi | `manage_tautan_opd` | Kartu direktori website OPD & aplikasi daerah di beranda |
| 4 | Kelola Editor Peta Spasial GIS | `manage_gis` | Layer peta interaktif, batas wilayah kecamatan/desa, proyek spasial RTRW |
| 5 | Kelola Statistik Dashboard | `manage_dashboard` | Metrik indikator makro, realisasi APBD daerah, capaian sasaran pembangunan |
| 6 | Lihat Audit Log Sistem | `view_audit_logs` | Catatan forensik mutasi data server, alamat IP, waktu kejadian & aktor |
| 7 | Kelola Berita & Artikel Humas | `manage_berita` | Rilis siaran pers, artikel berita daerah, kategori topik berita portal |
| 8 | Kelola Galeri Dokumentasi | `manage_galeri` | Album foto kegiatan BAPPEDA, video YouTube liputan perencana |
| 9 | Kelola Repository Dokumen | `manage_dokumen` | Upload, arsip, dan penerbitan dokumen perencanaan daerah/bidang |
| 10 | Kelola Pengguna & Hak Akses | `manage_users` | Manajemen akun admin, penetapan role, dan modul izin (Khusus SuperAdmin) |
| 11 | Kelola Survei Kepuasan (IKM) | `manage_survey` | Manajemen kuesioner responden survei kepuasan layanan publik BAPPEDA |
| 12 | Lihat Riwayat Pengunduh Dokumen | `view_download_logs` | Audit trail email pengunduh dokumen publik dan metadata unduhan |
| 13 | Kelola Master Jenis Dokumen | `manage_document_types` | Master jenis dokumen dan konfigurasi scope bidang perizinan dokumen |
| 14 | Kelola Kritik, Saran & Aspirasi | `manage_kritik` | Kotak aspirasi masyarakat, moderasi masukan, dan pemberian tanggapan |

### Alur 2-Step Wizard & 7 Profil Template Penugasan Pegawai
Manajemen pengguna (`/dashboard/users/tambah` dan `/dashboard/users/edit/[id]`) menerapkan arsitektur **2-Step Wizard** yang intuitif dan terfokus:

1. **Langkah 1: Pemilihan Profil / Template Penugasan (Fokus Utama)**:
   - Menampilkan antarmuka grid 7 kartu template interaktif dengan ikon bidang, tupoksi, dan jumlah modul aktif.
   - Dilengkapi panel preview visual putih bersih yang menampilkan peran, bidang, cakupan jenis dokumen, dan nomor modul Spatie (1–14).
   - Opsi default adalah **Kustom / Fleksibel Manual** yang memungkinkan konfigurasi bebas tanpa batasan template.
   - Tombol *Lanjutkan ke Pengisian Formulir Akun* secara otomatis menerapkan template dan membuka langkah berikutnya.

2. **Langkah 2: Kelola Biodata & Rincian Hak Akses**:
   - Menampilkan banner status template penugasan aktif dengan opsi cepat *Ganti / Terapkan Template* untuk kembali ke Langkah 1 kapan saja.
   - Formulir 5 Card terstruktur:
     - Card 1: Informasi Identitas Kedinasan & Jabatan Struktural Bappeda.
     - Card 2: Pengaturan Password Akun (wajib minimal 12 karakter alfanumerik; opsional saat edit).
     - Card 3: Peran Pengguna & Penugasan Bidang Bappeda.
     - Card 4: Hak Akses Upload Dokumen Perencanaan (otomatis terisi & terbuka default, dilengkapi tombol reset standar bidang).
     - Card 5: Granular Spatie RBAC Permissions (14 Modul Berurutan Sesuai SK Resmi).

Tujuh opsi profil template penugasan yang tersedia:
- **Kustom / Fleksibel Manual** (Default): Konfigurasi bebas untuk staf fungsional atau kebutuhan penugasan khusus.
- **IPW (Infrastruktur & Pengembangan Wilayah)**: Modul 2, 3, 8, 9, 10 + Scope Dokumen IPW & Bersama (KLHS, RTRW, RDTR, Renstra, Renja, Data Sektoral).
- **MONEV / RENVAL (Perencanaan & Evaluasi)**: Modul 2, 3, 4, 8, 9, 10 + Scope Dokumen Monev (LKPJ, RKPD, Evaluasi RKPD).
- **EKONOMI & SDA**: Modul 2, 3, 8, 9, 10 + Scope Dokumen Ekonomi (TPID, Ketahanan Pangan, Renstra, Renja).
- **SOSBUD (Pembangunan Manusia)**: Modul 1, 7, 11, 13, 14 + Scope Dokumen Sosbud (Stunting, Kemiskinan Ekstrem, PPM).
- **SEKRETARIAT UMUM**: Modul 2, 3, 8, 9, 10, 12 + Dokumen Makro Daerah (RPJPD, RPJMD, Renja Sekretariat).
- **SUPER ADMIN**: Akses Penuh (Seluruh 14 Modul & Semua Dokumen Perencanaan).

## Dynamic Bidang-Scoped Document Authorization

Tabel master `jenis_dokuments` memiliki kolom `scope_role` bertipe string dinamis untuk menghubungkan jenis dokumen dengan bidang pengunggah tanpa bentrok:
- `semua`: Dapat diunggah oleh semua admin bidang dan admin umum (contoh: *Renstra, Renja, Data Sektoral*).
- `admin_umum`: Dokumen makro strategis yang hanya boleh dikelola oleh Sekretariat/Super Admin (*RPJPD, RPJMD, RKPD*).
- `infrastruktur`: Dokumen teknis spesifik Bidang IPW (*RTRW, RDTR, KLHS, Masterplan Drainase*).
- `sosbud`: Dokumen teknis spesifik Bidang Sosbud (*Stunting, Kemiskinan Ekstrem, Indeks SPM*).
- `perekonomian`: Dokumen teknis spesifik Bidang Ekonomi (*TPID, PDRB, Neraca Bahan Makanan*).
- `renval`: Dokumen teknis spesifik Bidang Monev (*LKPJ, Evaluasi Triwulan, Capaian Renja*).

Jika `allowed_document_permissions` pengguna disetel `null`, sistem secara otomatis mengizinkan seluruh dokumen yang ber-scope `semua` plus dokumen yang ber-scope bidang pengguna tersebut. SuperAdmin tetap dapat memberikan izin dokumen kustom jika ada penugasan silang.

## Batas publik dan admin

Data yang boleh dibaca publik:

- Dokumen dengan `is_public = true`.
- Proyek yang dokumen induknya publik.
- Berita dengan `is_published = true`.
- Profil, pejabat, galeri, grafik dashboard publik, jenis dokumen, dan konfigurasi survei.
- Ringkasan survei dalam bentuk agregat angka tanpa nama, email, pekerjaan, atau saran.

Endpoint publik yang menerima data:

- `POST /surveys`
- `POST /kritik`
- `POST /documents/{id}/preview`
- `POST /documents/{id}/download`
- `POST /news/{id}/increment-views`

Endpoint tersebut dibatasi rate limit. Semua mutasi konten dan seluruh endpoint berisi PII dilindungi Sanctum serta permission.

Alur file dokumen:

1. Preview membuka `GET /documents/{id}/preview-file` dengan disposisi `inline`. Header khusus mengizinkan PDF ditampilkan oleh frontend lintas port tanpa mematikan proteksi frame pada respons lain.
2. Form unduhan mengirim email ke `POST /documents/{id}/download`.
3. Server menyimpan log terenkripsi dan mengembalikan URL `GET /documents/{id}/file` bertanda tangan.
4. Signature kedaluwarsa setelah lima menit. Mengakses URL file tanpa signature menghasilkan `403`.

Dokumen lama yang masih berada pada Google Drive atau server eksternal tetap diteruskan oleh endpoint terkontrol. Agar kontrol file sepenuhnya berada di BAPPEDA, dokumen eksternal tersebut sebaiknya diimpor ke storage privat pada tahap migrasi konten berikutnya.

## Alur autentikasi

1. Browser mengirim email dan password ke `POST /auth/login`.
2. Backend menormalkan email dan memverifikasi hash password.
3. Jika valid, backend membuat token Sanctum. Token kedaluwarsa setelah `SANCTUM_EXPIRATION`, default 480 menit.
4. Saat aplikasi dimuat ulang, frontend memanggil `GET /auth/me`. User, role, dan permission baru dipakai setelah server mengonfirmasi token.
5. Logout mencabut token aktif. Perubahan password mencabut seluruh sesi lain.

Password baru minimal 12 karakter dan wajib mempunyai huruf besar, huruf kecil, dan angka. Akun tidak lagi dibuat dengan password tetap `password123`.

## Bootstrap Super Admin

Seeder tidak membuat akun dengan kredensial publik. Isi variabel berikut hanya pada environment tujuan:

```dotenv
BAPPEDA_SEED_SUPERADMIN_NAME="Super Admin BAPPEDA Halut"
BAPPEDA_SEED_SUPERADMIN_EMAIL=admin@example.go.id
BAPPEDA_SEED_SUPERADMIN_PASSWORD=GantiDenganPasswordKuat123
```

Lalu jalankan:

```bash
cd backend
php artisan db:seed --class=UserSeeder
```

Jangan menaruh password aktual pada `.env.example`, repository, tiket, atau dokumentasi.

## Perlindungan data pribadi

Kolom berikut menggunakan Laravel encrypted cast:

- Survei: nama, email, pekerjaan, dan saran.
- Kritik/saran: nama, email, telepon, subjek, pesan, dan catatan balasan.
- Riwayat unduhan: email.

Konsekuensinya:

- Data mentah database tidak dapat dibaca tanpa `APP_KEY`.
- Admin yang memiliki permission tetap menerima plaintext melalui aplikasi.
- Pencarian parsial email di database tidak tersedia; filter server menggunakan kecocokan email tepat melalui `email_hash`.
- `APP_KEY` wajib dicadangkan secara aman. Kehilangan key berarti data terenkripsi tidak dapat dipulihkan.
- Saat rotasi key, simpan key lama di `APP_PREVIOUS_KEYS` sampai seluruh data selesai dienkripsi ulang.

## Sanitasi rich text

Konten berita dan profil diproses oleh `HtmlSanitizer`. Tag presentasi umum dipertahankan, sementara:

- `script`, `iframe`, `object`, `embed`, `style`, dan konten aktif dibuang.
- Atribut event seperti `onclick` dan `onerror` dibuang.
- URL `javascript:` dan skema tidak aman dibuang.
- Tautan `_blank` mendapat `rel="noopener noreferrer"`.

Kontrol ini penting karena token dashboard masih disimpan di browser. Stored XSS yang tidak dibersihkan dapat mencuri token.

## Audit trail

Middleware `AuditAdminMutation` mencatat mutasi admin yang berhasil:

- aktor dan role dari sesi server;
- nama route/action;
- method, path, status HTTP;
- alamat IP audit;
- waktu kejadian.

Body request tidak disalin ke audit log agar password dan PII tidak ikut tersimpan. Login berhasil dan gagal juga dicatat; email pada login gagal dimasking.

## Migrasi dan deployment

Sebelum deployment:

1. Cadangkan database dan `APP_KEY`.
2. Pastikan production memakai HTTPS, `APP_DEBUG=false`, `SESSION_ENCRYPT=true`, dan `SESSION_SECURE_COOKIE=true`.
3. Jalankan:

```bash
cd backend
php artisan migrate --force
php artisan permission:cache-reset
php artisan test
```

4. Jalankan build frontend:

```bash
cd frontend
npm ci
npm audit --omit=dev
npm run build
```

Frontend memerlukan Node.js minimal 20.9. Next.js dinaikkan ke 15.5.22, sementara PostCSS dan Sharp dipin melalui `overrides` ke versi yang sudah menutup advisory dependency terbaru.

5. Login menggunakan Super Admin, periksa menu sesuai role, lalu uji 401/403 pada akun dengan akses lebih rendah.

Migrasi terkait:

- `2026_07_29_000001_configure_rbac_permissions.php`
- `2026_07_29_000002_encrypt_personal_data.php`
- `2026_07_29_000003_add_summary_to_news_table.php`
- `2026_07_29_000004_move_documents_to_private_storage.php`

## Pro, kontra, dan efek perubahan

| Perubahan | Pro | Kontra/biaya | Efek yang terlihat |
|---|---|---|---|
| RBAC server-side | Tidak dapat dilewati dengan mengubah browser | Perlu mengelola permission dengan disiplin | Menu dan request yang tidak berizin menghasilkan 403 |
| Scope Admin Bidang | Mencegah perubahan lintas bidang | Admin Bidang tidak melihat data bidang lain | Daftar dokumen/proyek otomatis terbatas |
| Enkripsi PII | Dump database tidak langsung membuka data warga | Filter parsial lebih sulit; `APP_KEY` menjadi kritis | Admin tetap melihat data normal melalui aplikasi |
| Tidak menyimpan IP/UA unduhan | Data yang dikumpulkan lebih minimal | Analisis perangkat/lokasi tidak tersedia | Riwayat hanya fokus pada email, dokumen, dan waktu |
| Storage privat + signed URL | URL publik tidak dapat melewati form email | URL berlaku singkat; dokumen eksternal tetap bergantung host asal | Unduhan tanpa signature mendapat 403 |
| Audit server-side | Aktor tidak dapat dipalsukan dari payload | Tabel audit bertambah terus dan perlu kebijakan retensi | Mutasi sukses muncul pada Audit Log |
| Sanitasi HTML | Menutup stored XSS | Sebagian HTML/style yang tidak diizinkan akan dibuang | Konten aman tetap mempertahankan format umum |
| Password kuat dan seed via env | Tidak ada kredensial demo universal | Bootstrap awal perlu konfigurasi | Admin harus memakai password unik |
| Token kedaluwarsa | Mengurangi risiko token lama | Admin perlu login kembali setelah 8 jam | Sesi lama otomatis tidak berlaku |

## Rollback

Rollback paling aman adalah mengembalikan backup database dan versi aplikasi yang sepasang. Rollback migrasi enkripsi akan mendekripsi PII kembali menjadi plaintext.

Untuk environment uji yang baru saja menjalankan ketiga migrasi dalam satu batch:

```bash
cd backend
php artisan migrate:rollback --step=3
```

Jangan rollback jika `APP_KEY` yang mengenkripsi data tidak tersedia. Selalu uji rollback pada salinan database terlebih dahulu.

## Dual-Layer Hybrid Authentication (HttpOnly Secure Cookie + Bearer Token Fallback)

Status implementasi: Oktober 2026.

Sebagai pemenuhan standar SPBE tertinggi dan pengamanan terhadap risiko pencurian kredensial via Cross-Site Scripting (XSS):
1. **HttpOnly Cookie Shield**:
   - Saat login (`/api/v1/auth/login`), backend Laravel menerbitkan cookie `bappeda_sanctum_token` dengan flag:
     - `HttpOnly = true`: Browser melarang JavaScript (`localStorage` maupun `document.cookie`) untuk mengakses nilai token.
     - `SameSite = Lax`: Mencegah serangan CSRF lintas domain.
     - `Secure = true` (pada produksi HTTPS).
     - Durasi kedaluwarsa 7 hari.
2. **Middleware Interceptor (`AuthenticateWithHttpOnlyCookie`)**:
   - Jika request dari browser tidak memuat header `Authorization: Bearer`, middleware otomatis membaca cookie `bappeda_sanctum_token` dan menginjeksinya ke header autentikasi Laravel Sanctum.
3. **CORS & Credentials Security**:
   - Backend `config/cors.php` mengaktifkan `supports_credentials => true` dengan pembatasan domain asal (*allowed origins*) kedinasan yang ketat.
   - Frontend `apiClient.ts` dan `AuthContext.tsx` mengirimkan opsi `credentials: "include"` pada seluruh request autentikasi dan mutasi data.
4. **Proteksi Sesi Terverifikasi (Fail-Fast)**:
   - Jika cookie atau token kedaluwarsa/ditolak (HTTP 401), sistem frontend langsung menghentikan animasi loading, mengubah indikator menjadi merah ("Ditolak"), dan membersihkan sesi.

## Risiko tersisa

- Belum ada kebijakan retensi formal untuk survei, kritik/saran, email unduhan, dan audit log. Durasi penghapusan harus ditetapkan pejabat pengendali data sebelum job penghapusan otomatis diaktifkan.
- MFA belum diterapkan. MFA disarankan khusus Super Admin setelah kanal email/OTP resmi tersedia.
- Backup database harus dienkripsi dan diatur masa simpannya di lingkungan produksi.
- Dokumen eksternal belum berada di bawah kendali storage BAPPEDA; salin ke storage privat bila izin dan berkas sumber tersedia.
- Preview menampilkan isi PDF penuh, sehingga pengguna teknis tetap dapat menyimpan byte dari respons preview. Form email dan signed URL mengendalikan aksi unduh resmi serta pencatatannya, tetapi bukan DRM. Jika larangan penyalinan mutlak diperlukan, preview harus diganti menjadi gambar beresolusi rendah/per halaman atau dihilangkan.
