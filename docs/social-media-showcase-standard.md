# Dokumentasi Seksi Media Sosial Beranda (YouTube & Instagram)

## 1. Ikhtisar (Overview)
Seksi **Media Sosial BAPPEDA** (`SocialMediaSection.tsx`) dirancang untuk menyajikan integrasi publikasi multimedia daerah secara elegan di beranda utama, diletakkan tepat di bawah deretan Infografis Pembangunan Daerah.

Fitur ini menghadirkan dua pilar utama saluran komunikasi publik Pemkab Halmahera Utara dengan tata letak proporsional dan responsif:
1. **Pemutar Video YouTube Resmi (Sisi Kiri / 5 Kolom Desktop)**:
   - Menampilkan siaran resmi kegiatan rapat koordinasi, musrenbang, dan rilis kebijakan pembangunan.
   - **Tinggi Selaras Desktop (Desktop Equal Height)**: Di layar desktop, card YouTube sebelah kiri mengikuti tinggi card Instagram di sebelah kanan (`items-stretch`, `h-full` dengan flex container `lg:flex-1` pada video player).
   - Menggunakan cover thumbnail YouTube resolusi tinggi (`maxresdefault`), animasi tombol play, dan transisi mulus ke pemutar iframe YouTube tanpa cookie (`youtube-nocookie.com`).
   - Dilengkapi metadata judul siaran, tanggal, lokasi agenda, dan tombol tautan langsung ke kanal YouTube Bappeda Halut.
   - **Dukungan Manajemen Dinamis di Dashboard**: Administrator dapat mengganti link YouTube, judul, tanggal, lokasi, dan deskripsi secara langsung dari dashboard tanpa edit kode sumber.
2. **Feed Postingan Instagram Interaktif (Sisi Kanan / 7 Kolom Desktop - 6 Postingan)**:
   - Header profil Instagram resmi `@bappeda_halut` dengan foto avatar terverifikasi, tagline "Sinergi Lokal, Solusi Global", dan tombol `Ikuti`.
   - **6 Kartu Postingan Feed (3 Kolom x 2 Baris)**: Menampilkan 6 postingan warta terkini dengan kategori, judul, tanggal, dan cover gambar rasio 4:3.
   - **Modal Popup Ala Instagram (Instagram-Style Modal)**:
     - Saat salah satu kartu postingan diklik, muncul dialog modal 2 kolom ala Instagram.
     - **Sisi Kiri**: Galeri foto resolusi tinggi dengan navigasi carousel panah (jika multi-foto) dan titik pagination.
     - **Sisi Kanan**: Profil pengunggah `@bappeda_halut`, tanggal, teks narasi caption lengkap yang dapat discroll, jumlah suka, dan tombol aksi `Buka di Instagram ↗`.
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
