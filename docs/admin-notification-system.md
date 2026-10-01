# Sistem Notifikasi Aktivitas Berbasis Role & Permission (RBAC)

## 1. Latar Belakang & Kebutuhan

Pada antarmuka admin dashboard sebelumnya, tombol lonceng notifikasi pada bilah navigasi atas (`AdminHeader.tsx`) bersifat statis dan belum terhubung ke backend, sehingga selalu menampilkan pesan *"Tidak ada notifikasi aktivitas baru"*.

Pembaruan ini mengimplementasikan sistem notifikasi real-time yang cerdas, berguna, dan terseleksi otomatis (**role & permission-aware**) sesuai tanggung jawab masing-masing akun pengguna:

- **Superadmin**: Mendapatkan visibilitas menyeluruh terhadap seluruh aktivitas berprioritas tinggi di seluruh portal (aspirasi warga, survei IKM, dokumen perlu persetujuan, pendaftaran pengguna baru, mutasi audit keamanan, dsb.).
- **Admin Bidang (IPW, Sosbud, Ekonomi, Renval)**: Hanya menerima notifikasi yang relevan dengan bidang tugasnya (misal: dokumen perencanaan bidang terkait, pengumuman, atau peta GIS), tanpa diganggu notifikasi manajemen user atau bidang lain.
- **Admin Umum**: Hanya menerima notifikasi pada modul-modul granular yang diizinkan pada akunnya.

---

## 2. Arsitektur Backend (`NotificationController.php`)

Endpoint resmi:
`GET /api/v1/admin/notifications`
Middleware: `auth:sanctum`

### Logika Penyaringan Aktivitas per Modul

| Tipe Notifikasi | Modul Sumber | Syarat Otoritas (Permission / Role) | Kriteria Data & Urgensi |
|---|---|---|---|
| `kritik` | Kritik, Saran & Aspirasi | `manage_kritik` atau `superadmin` | Mengambil aspirasi warga terbaru. Ditandai **Perlu Respon** jika status masih *Menunggu Tanggapan* atau belum memiliki catatan balasan. |
| `ikm` | Survei Kepuasan (IKM) | `manage_survey` atau `superadmin` | Menampilkan survei baru warga. Ditandai **Perlu Respon** jika skor IKM di bawah 65 (mutu C/D). |
| `dokumen` | Repository Dokumen | `manage_dokumen` atau `superadmin` | Filter bidang berlaku bagi `admin_bidang`. Ditandai **Perlu Respon** jika status tata kelola masih `draft`, `in_review`, atau `submitted`. |
| `download` | Riwayat Pengunduh | `view_download_logs` atau `superadmin` | Notifikasi riwayat pengunduhan dokumen publik oleh masyarakat/pihak luar. |
| `berita` | Berita & Artikel Humas | `manage_berita` atau `superadmin` | Menampilkan draf berita menunggu rilis atau berita yang baru terbit. |
| `pengumuman` | Pengumuman Resmi | `manage_pengumuman` atau `superadmin` | Rilis surat edaran resmi atau tender baru. |
| `users` | Kelola Pengguna | `manage_users` atau `superadmin` | Pendaftaran atau perubahan data akun staf/pengelola baru. |
| `system` | Audit Log Keamanan | `view_audit_logs` atau `superadmin` | Mutasi penting yang dilakukan oleh pengelola lain (tidak mencantumkan aksi diri sendiri). |

Setiap item notifikasi memiliki format terstruktur:
```json
{
  "id": "kritik-3",
  "type": "kritik",
  "title": "Aspirasi Warga Menunggu Tanggapan",
  "message": "Hendra P. Tani: Usulan Fitur Pengunduhan Laporan Dokumen RKPD",
  "category": "Kritik & Saran",
  "link": "/dashboard/kritik-saran",
  "created_at": "2026-07-29T01:10:59.000000Z",
  "timestamp": 1722215459,
  "is_urgent": true,
  "time": "2 jam yang lalu"
}
```

---

## 3. Antarmuka Pengguna Frontend (`AdminHeader.tsx`)

1. **Indikator Lonceng Real-Time**:
   - Menampilkan badge merah dengan angka unread (`1`, `5`, `9+`).
   - Dilengkapi efek animasi pulsing (`animate-ping`) ketika ada aktivitas baru yang belum dibaca.

2. **Tab Filter Cepat**:
   - **Semua**: Menampilkan seluruh notifikasi relevan.
   - **Belum Dibaca**: Memfilter hanya notifikasi berstatus belum dibaca.
   - **Perlu Respon**: Memfilter hanya notifikasi mendesak (`is_urgent === true`), seperti aspirasi yang belum dibalas atau dokumen menunggu persetujuan.

3. **Status Baca Persisten (`localStorage`)**:
   - Status baca (`isRead`) disimpan per user: `bappeda_read_notifs_{user.id}`.
   - Klik pada salah satu notifikasi otomatis menandainya telah dibaca dan langsung mengarahkan pengguna ke halaman modul yang relevan.
   - Tombol **Tandai Dibaca** menandai seluruh notifikasi yang tampil sebagai terbaca seketika.
   - Tombol **Bersihkan Semua** mengosongkan notifikasi dari pandangan.
   - Tombol **Muat Ulang (Refresh)** dengan animasi putar untuk memperbarui daftar notifikasi secara instan kapan saja.
