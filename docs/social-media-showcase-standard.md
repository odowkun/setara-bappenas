# Dokumentasi Seksi Media Sosial Beranda (YouTube & Instagram)

## 1. Ikhtisar (Overview)
Seksi **Media Sosial BAPPEDA** (`SocialMediaSection.tsx`) dirancang untuk menyajikan integrasi publikasi multimedia daerah secara elegan dan proporsional di beranda utama, diletakkan tepat di bawah deretan Infografis Pembangunan Daerah.

Fitur ini menghadirkan dua pilar utama saluran komunikasi publik Pemkab Halmahera Utara dengan tata letak berdampingan (side-by-side) seimbang dan proporsional:
- **Header Standar Konsisten**: Menggunakan badge biru selaras tema utama (`bg-blue-50 border-blue-200/80 text-blue-700`) bertuliskan *"Publikasi Multimedia & Media Sosial"* dengan deskripsi ringkas tanpa tombol duplikat di header agar fokus pandangan langsung tertuju ke card utama.
1. **Sisi Kiri: Sorotan Video YouTube Resmi (6 Kolom Desktop / 16:9 Widescreen Asli)**:
   - **Tampilan Terang Bersih & Elegan**: Menggunakan card berlatar putih (`bg-white border-slate-200/90 shadow-lg p-5 sm:p-6`) dengan tipografi gelap kontras (`text-slate-900`) selaras tema portal.
   - **Rasio Layar Lebar 16:9 Alami (`aspect-video`)**: Pemutar video dikunci pada rasio murni 16:9 (`aspect-video w-full`) sehingga thumbnail resolusi tinggi (`maxresdefault`) dan pemutar video tidak pernah terpotong (*uncropped*) ataupun terkompresi vertikal ("anti-gepeng").
   - **Detail & Aksi**: Dilengkapi tanggal rilis, lokasi agenda, judul video, deskripsi ringkas, dan tombol aksi merah *"Tonton di YouTube ↗"*.
   - **Dukungan Manajemen Dinamis di Dashboard**: Administrator dapat mengganti link YouTube, judul, tanggal, lokasi, dan deskripsi secara langsung dari dashboard (`/dashboard/galeri?tab=youtube-media`).
2. **Sisi Kanan: Feed Postingan Instagram Interaktif (6 Kolom Desktop / 4 Postingan Seimbang 2x2)**:
   - **Tinggi Selaras & Seimbang**: Menggunakan grid 4 postingan dalam formasi 2 kolom x 2 baris (`grid-cols-2 gap-3.5`) dengan cover foto rasio 16:10 sehingga total tinggi card Instagram sejajar presisi dengan card YouTube di sebelah kiri.
   - **Branding Akun Resmi**: Header profil Instagram resmi `@bappeda_halut` dengan avatar berbingkai gradien, centang terverifikasi, tagline *"Sinergi Lokal, Solusi Global"*, dan tombol aksi `Ikuti`.
   - **Modal Popup Interaktif Ala Instagram**:
     - Saat salah satu kartu postingan diklik, muncul dialog modal 2 kolom ala Instagram.
     - **Sisi Kiri**: Galeri foto resolusi tinggi dengan navigasi carousel panah dan titik pagination.
     - **Sisi Kanan**: Profil pengunggah `@bappeda_halut`, tanggal, teks narasi caption lengkap, jumlah suka, dan tombol aksi `Buka di Instagram ↗`.
     - Mendukung penutupan via tombol silang (X), tombol keyboard `ESC`, dan klik di luar area modal (backdrop blur).
---

## 2. Struktur Berkas & Komponen Terkait

| Berkas | Peran |
| :--- | :--- |
| `frontend/src/data/socialMediaData.ts` | Data default untuk video YouTube resmi dan 6 postingan feed Instagram (judul, gambar, narasi, URL). |
| `frontend/src/components/home/SocialMediaSection.tsx` | Komponen presentasi UI beranda: video player (equal-height), grid 6 kartu Instagram, dan dialog modal popup 2 kolom. |
| `frontend/src/components/admin/YouTubeSocialMediaSettingsPanel.tsx` | Panel dashboard untuk mengelola link YouTube unggulan, judul, tanggal, lokasi, dan deskripsi dengan validasi ID otomatis dan live preview. |
| `frontend/src/app/dashboard/galeri/page.tsx` | Halaman dashboard galeri dengan tab khusus `"youtube-media"` (*Video YouTube Media Sosial*). |
| `frontend/src/components/home/GeospatialSection.tsx` | Tempat integrasi komponen di beranda (tepat di bawah `PinnedInfographicsSection`). |

---

## 3. Panduan Pengelolaan Konten YouTube via Dashboard Admin
Administrator dapat memperbarui video YouTube unggulan yang tampil di beranda melalui menu:
1. Buka halaman **Dashboard Bappeda** -> Menu **Galeri & Dokumentasi** (`/dashboard/galeri`).
2. Pilih tab ketiga: **Video YouTube Media Sosial** (`?tab=youtube-media`).
3. Masukkan link video YouTube (mendukung format `youtube.com/watch?v=...`, `youtu.be/...`, YouTube Shorts, atau Siaran Langsung).
4. Lengkapi judul siaran, tanggal rilis, lokasi agenda, dan ringkasan siaran.
5. Tinjau tampilan pada kotak **Preview Kartu Beranda (Live)** di sebelah kanan formulir.
6. Klik tombol **Simpan Konfigurasi YouTube**. Perubahan langsung tersimpan ke backend `/profil/tentang` (`meta_json.youtube_featured_*`) dan langsung tayang di beranda.
