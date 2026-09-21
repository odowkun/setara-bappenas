# Dokumentasi Seksi Media Sosial Beranda (YouTube & Instagram)

## 1. Ikhtisar (Overview)
Seksi **Media Sosial BAPPEDA** (`SocialMediaSection.tsx`) dirancang untuk menyajikan integrasi publikasi multimedia daerah secara elegan di beranda utama, diletakkan tepat di bawah deretan Infografis Pembangunan Daerah.

Fitur ini menghadirkan dua pilar utama saluran komunikasi publik Pemkab Halmahera Utara:
1. **Pemutar Video YouTube Resmi (Sisi Kiri / 7 Kolom)**:
   - Menampilkan siaran resmi kegiatan rapat koordinasi, musrenbang, dan rilis kebijakan pembangunan.
   - Menggunakan pemutar responsif 16:9 dengan cover thumbnail YouTube resolusi tinggi (`maxresdefault`), animasi tombol play, dan transisi mulus ke pemutar iframe YouTube tanpa cookie (`youtube-nocookie.com`).
   - Dilengkapi metadata judul siaran, tanggal, lokasi agenda, dan tombol tautan langsung ke kanal YouTube Bappeda Halut.
2. **Feed Postingan Instagram Interaktif (Sisi Kanan / 5 Kolom)**:
   - Header profil Instagram resmi `@bappeda_halut` dengan foto avatar terverifikasi dan tombol `Ikuti`.
   - Grid 3 kartu postingan dengan kategori warta, judul berita, tanggal, dan thumbnail gambar rasio 4:3.
   - **Modal Popup Ala Instagram (Instagram-Style Modal)**:
     - Saat salah satu kartu postingan diklik, muncul dialog modal 2 kolom (Gambar 3).
     - **Sisi Kiri**: Galeri foto resolusi tinggi dengan navigasi carousel panah (jika multi-foto) dan titik pagination.
     - **Sisi Kanan**: Profil pengunggah `@bappeda_halut`, tanggal, teks narasi caption lengkap yang dapat discroll, jumlah suka, dan tombol aksi `Buka di Instagram ↗`.
     - Mendukung penutupan via tombol silang (X), tombol keyboard `ESC`, dan klik di luar area modal (backdrop blur).

---

## 2. Struktur Berkas & Komponen Terkait

| Berkas | Peran |
| :--- | :--- |
| `frontend/src/data/socialMediaData.ts` | Data terstruktur untuk video YouTube resmi dan postingan feed Instagram (judul, gambar, narasi, URL). |
| `frontend/src/components/home/SocialMediaSection.tsx` | Komponen presentasi UI beranda, video player, kartu Instagram, dan dialog modal popup 2 kolom. |
| `frontend/src/components/home/GeospatialSection.tsx` | Tempat integrasi komponen di beranda (tepat di bawah `PinnedInfographicsSection`). |

---

## 3. Panduan Pembaruan Konten
Untuk memperbarui tautan video YouTube atau menambahkan postingan Instagram terbaru, administrator atau developer dapat memperbarui file konfigurasi di `frontend/src/data/socialMediaData.ts`:
- Ganti `OFFICIAL_YOUTUBE_VIDEO.youtubeId` dengan ID video YouTube baru.
- Tambahkan atau sesuaikan objek pada array `OFFICIAL_INSTAGRAM_POSTS`.
