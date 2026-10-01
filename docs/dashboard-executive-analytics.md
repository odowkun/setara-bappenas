# Dokumentasi Dashboard Eksekutif BAPPEDA Halmahera Utara

## 1. Deskripsi Umum
Halaman Ikhtisar Dashboard (`/dashboard`) dirancang sebagai Executive Control Center yang menyatukan metrik makro anggaran APBD, realisasi fisik dan serapan proyek lapangan (Geotagging), keterlibatan publik (unduhan dokumen perencanaan), serta kepuasan warga (IKM).

---

## 2. Struktur Visual & Metrik
Dashboard terbagi dalam beberapa komponen utama:

### A. 5 Kartu Metrik Ringkasan Utama
1. **Pengguna Sistem**: Total pengguna terdaftar di seluruh tingkatan peran (SuperAdmin, Admin Umum, Admin Bidang).
2. **Dokumen Perencanaan**: Total dokumen induk (RPJPD, RPJMD, RKPD, Data Sektoral, dll.) beserta akumulasi unduhan warga secara publik.
3. **Proyek Geotagging**: Jumlah titik proyek riil di lapangan, rasio serapan anggaran (total realisasi / total pagu), serta tautan ke pemantauan proyek sektoral.
4. **Kepuasan Warga (IKM)**: Nilai Indeks Kepuasan Masyarakat dari survei online beserta predikat mutu pelayanan publik (A - Sangat Baik).
5. **Kritik & Saran Warga**: Total kritik & saran masuk dari masyarakat dilengkapi badge indikator jumlah aduan yang **Belum Dijawab** (menunggu tindak lanjut) serta tautan langsung ke halaman manajemen tanggapan. Pada Admin Sidebar juga terpasang counter badge notifikasi otomatis.

### B. Baris Grafik 1 (Kinerja Sektoral Proyek Riil & Monitoring Geotagging)
- **Kiri (7 Kolom)**: Kinerja Sektoral Proyek Riil per Bidang (Infrastruktur, Perekonomian, Sosial Budaya, Perencanaan). Menampilkan perbandingan Pagu vs Realisasi Keuangan dan Rata-rata Progres Fisik yang dihitung otomatis dari akumulasi titik proyek lapangan.
- **Kanan (5 Kolom)**: Ringkasan Monitoring Proyek Geotagging Lapangan, meliputi pagu vs realisasi riil, progres rata-rata fisik (%), dan rincian status proyek (*Selesai, Dalam Proses, Belum Mulai, Terkendala*).

### C. Baris Grafik 2 (Distribusi Repositori Dokumen & Minat Publik)
- **Kiri (6 Kolom)**: Distribusi Koleksi Dokumen Perencanaan per Kategori (RPJPD, RPJMD, RKPD, Renstra, Renja, LAKIP, Data Sektoral) lengkap dengan jumlah dokumen dan akumulasi unduhan warga.
- **Kanan (6 Kolom)**: 5 Dokumen Perencanaan Paling Banyak Diunduh Warga lengkap dengan progress bar proporsional dan jumlah unduhan.

### D. Baris Ringkasan Modul Publikasi Portal (Sub-Menu Publik)
- 4 Kartu metrik cepat: Berita Daerah, Agenda Kegiatan, Galeri Foto/Video, dan Pengumuman & Edaran Resmi yang terhubung langsung ke sub-menu masing-masing.

### E. Otomasi 100% (Tanpa Input Manual)
- Seluruh grafik dan metrik ditarik secara dinamis dari tabel operasional database (`proyek_details`, `documents`, `surveys`, `kritiks`, `news`, `agendas`, `galleries`, `announcements`). Modal input manual persentase APBD telah dieliminasi demi integritas data tunggal (*single source of truth*).

---

## 3. Endpoint API Backend

### `GET /api/v1/dashboard/charts`
- **Akses**: Publik / Admin
- **Struktur Response**:
  - `projects_summary`: Total pagu, realisasi, serapan persen, avg progress fisik, dan breakdown riil `by_bidang`.
  - `documents_by_type`: Koleksi dokumen per jenis dan akumulasi unduhannya.
  - `portal_stats`: Jumlah artikel berita, agenda kegiatan, galeri dokumentasi, dan pengumuman resmi.
  - `public_engagement`: Total unduhan dokumen, top 5 dokumen terpopuler, skor rata-rata IKM survei, dan status kritik saran.

