# PROJECT CONTEXT — SMART BAPPEDA HALMAHERA UTARA

## 📌 Overview Project
**Smart BAPPEDA HALUT** adalah proyek peremajaan total (renewal) dari website resmi Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara (`https://bappeda.halmaherautarakab.go.id/`). 

Proyek ini mentransformasi website lama menjadi **Portal Digital Terintegrasi Modern, Kekinian (Vibes 2026), High-Performance, & Standar SPBE Nasional** dengan menyatukan layanan publik, widget eksekutif, pemetaan spasial, dan fitur aksesibilitas inklusif.

---

## 🎯 Core Objectives & Key Pillars
1. **Visual Renewal & Modern UX**: Tampilan fresh berkelas dengan skema warna **Royal Blue & Amber Gold**, glassmorphism UI, dan animasi halus.
2. **Executive Data Widgets**: Ringkasan real-time indikator makro daerah (Stunting, Kemiskinan Ekstrem, Inflasi, IPM) serta capaian realisasi fisik & keuangan APBD.
3. **Portal Publik Terpadu**: Berita resmi pimpinan/Bappeda, Pengumuman, Galeri Foto/Video, Repository Dokumen Publik (RPJMD, RKPD, Popeda).
4. **Interactive Esri GIS Mapping**: Pemetaan proyek infrastruktur & potensi wilayah Halmahera Utara yang terintegrasi dengan teknologi **Esri ArcGIS** dan data batas resmi BPS / Permendagri No. 137.
5. **Dynamic Regional Overview & Project Detail**: Tampilan spasial pintar yang menampilkan Ringkasan Geospasial Wilayah Halut saat awal dibuka dan beralih ke Detail Foto Lapangan & Pagu Anggaran ketika proyek dipilih.
6. **High Performance & Scroll Lazy Loading**: Pengunduhan gambar berbasis `IntersectionObserver` & `react-loading-skeleton` (250px prefetch buffer) untuk memastikan kecepatan buka halaman instan (0ms delay).
7. **Menu Aksesibilitas (A11y Toolbar)**: Fitur inklusif lansia & disabilitas (Text resize, mode kontras tinggi, font disleksia, & screen reader support).
8. **Global Instant Search (`Cmd + K`)**: Modal pencarian cepat serentak untuk Berita, Dokumen, Pengumuman, & Proyek GIS.
9. **Voice Reader (Text-to-Speech)**: Fitur pembaca suara otomatis untuk membacakan pengumuman & berita publik.
10. **Kebijakan Read-Only Publik**: Halaman depan dan GIS publik 100% read-only; pengunggahan foto realisasi hanya dilakukan dari Admin Dashboard terproteksi.
11. **Standar Keamanan SPBE & Audit Log**: Sistem pengamanan data bertingkat, inspeksi audit trail admin, serta enkripsi SSL/TLS.
12. **Sumber Data Resmi Tunggal**: Seluruh record publik dan admin berasal dari database melalui Laravel API; frontend tidak menyertifikasi cache atau mock sebagai data resmi.
13. **Workflow Publikasi Resmi**: Berita, Agenda, Pengumuman, Galeri, dan Dokumen melewati state draf-terbit-unpublish dengan aktor serta waktu publikasi tercatat di database.
14. **Arsip Pengetahuan Dokumen**: Dokumen dikelola pada private storage dengan versi immutable, approval four-eyes, klasifikasi, signed preview/download, checksum SHA-256, OCR/full-text, retensi, legal hold, dan analytics yang menjaga privasi.

## Document Knowledge Archive

- Dokumen baru aman secara default: `internal`, `draft`, dan tidak publik.
- Approval menetapkan versi aktif; publish adalah keputusan terpisah.
- Admin Bidang mengunggah dan submit dokumen bidang sendiri, sedangkan Admin Umum/Super Admin menangani review, klasifikasi, publikasi, integritas, dan retensi.
- Sepuluh dokumen legacy eksternal dikarantina sebagai `pending_migration`; tiga file privat valid tetap approved/public.
- Detail lifecycle, endpoint, pro/kontra, deployment, remediasi legacy, rollback, command, dan troubleshooting tersedia di [docs/document-knowledge-archive.md](docs/document-knowledge-archive.md).

---

## 🏗️ Technical Stack
- **Frontend Framework**: Next.js (App Router, TypeScript)
- **Backend Service**: Laravel REST API (Laravel Sanctum Auth, MySQL + PostGIS)
- **Styling**: Tailwind CSS + Custom Design System (Royal Blue & Amber Gold)
- **Animations**: Framer Motion & GSAP
- **Image Skeleton & Lazy Loading**: `react-loading-skeleton` + `IntersectionObserver`
- **State & Caching**: TanStack Query (React Query) + Zustand
- **GIS Engine**: Leaflet JS + Esri ArcGIS Tile Service + BPS Official GeoJSON Dataset
- **Accessibility & Voice Engine**: Custom A11y React Context + Web Speech API

---

## 👥 User Roles & Stakeholders
1. **Masyarakat Publik & Media**: Mengakses berita, unduh dokumen, pantau peta GIS geospasial, gunakan voice reader & fitur aksesibilitas.
2. **Eksekutif / Bupati / Kepala Bappeda**: Pemantauan langsung widget statistik makro, grafik APBD, & export laporan PDF/Excel.
3. **Admin OPD & Redaksi Bappeda**: Pengelolaan berita, dokumen, survei layanan, kritik/saran, pengunggahan foto realisasi fisik, & data spasial GIS via backend Laravel dengan audit log.
