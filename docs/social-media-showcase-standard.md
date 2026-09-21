# Dokumentasi Seksi Media Sosial Beranda (YouTube & Instagram)

## 1. Ikhtisar (Overview)
Seksi **Media Sosial BAPPEDA** (`SocialMediaSection.tsx`) dirancang untuk menyajikan integrasi publikasi multimedia daerah secara elegan dan proporsional di beranda utama, diletakkan tepat di bawah deretan Infografis Pembangunan Daerah.

Fitur ini menghadirkan dua pilar utama saluran komunikasi publik Pemkab Halmahera Utara dengan tata letak berdampingan (side-by-side) seimbang dan proporsional:
- **Header Standar Konsisten**: Menggunakan badge biru selaras tema utama (`bg-blue-50 border-blue-200/80 text-blue-700`) bertuliskan *"Publikasi Multimedia & Media Sosial"* dengan deskripsi ringkas tanpa tombol duplikat di header agar fokus pandangan langsung tertuju ke card utama.
1. **Sisi Kiri: Pemutar Video YouTube Murni (6 Kolom Desktop / 16:9 Widescreen Asli)**:
   - **Tampilan Bersih & Nol White Space**: Frame pemutar video berdiri mandiri tanpa teks penjelasan/deskripsi di bawahnya (`bg-white rounded-3xl border border-slate-200/90 shadow-lg p-3 sm:p-4`), menghilangkan seluruh area kosong/whitespace.
   - **Rasio Layar Lebar 16:9 Alami (`aspect-video`)**: Pemutar video dikunci pada rasio murni 16:9 (`aspect-video w-full`) sehingga thumbnail resolusi tinggi (`maxresdefault`) dan pemutar video tidak pernah terpotong (*uncropped*) ataupun terkompresi vertikal ("anti-gepeng").
   - **Interaktif & Siap Putar**: Dilengkapi overlay status siaran resmi, badge HD Video, animasi tombol play di tengah, dan dukungan pemutaran inline iframe (`youtube-nocookie.com`).
2. **Sisi Kanan: Feed Postingan Instagram Interaktif (6 Kolom Desktop / 2 Postingan Seimbang)**:
   - **Tinggi Selaras & Seimbang Presisi**: Menggunakan formasi 2 postingan berdampingan (`grid-cols-1 sm:grid-cols-2 gap-3`) sehingga total tinggi card Instagram sejajar presisi dengan tinggi pemutar video YouTube 16:9 di sebelah kiri (~340px).
   - **Branding Akun Resmi**: Header profil Instagram resmi `@bappeda_halut` dengan avatar berbingkai gradien, centang terverifikasi, tagline *"Sinergi Lokal, Solusi Global"*, dan tombol aksi `Ikuti`.
   - **Modal Popup Interaktif Ala Instagram (Portaled & Anti-Scroll Jump)**:
     - **React `createPortal`**: Modal di-mount langsung ke `document.body` dengan `z-[999999]`, sehingga bebas dari stacking context maupun clipping navbar (`z-50`).
     - **Pencegahan Flexbox Negative Scroll Bug**: Menggunakan pembungkus `min-h-full` dengan `my-auto` dan batas tinggi proporsional (`max-h-[85vh] md:h-[560px] lg:h-[600px]`), mencegah modal terdorong ke atas atau terpotong.
     - **Pencegahan Scroll Jump (Lenis Integration)**: Dilengkapi `data-lenis-prevent="true"`, `data-lenis-prevent-wheel="true"`, dan `data-lenis-prevent-touch="true"` agar interaksi mouse/touch di dalam modal tidak memicu pergeseran scroll pada halaman utama.
     - **Sisi Kiri**: Galeri foto resolusi tinggi dengan navigasi carousel panah dan titik pagination.
     - **Sisi Kanan**: Profil pengunggah `@bappeda_halut`, tanggal, teks narasi caption lengkap, jumlah suka, dan tombol aksi `Buka di Instagram ↗`.
     - Mendukung penutupan via tombol silang (X), tombol keyboard `ESC`, dan klik di luar area modal (backdrop blur).
---

## 2. Struktur Berkas & Komponen Terkait

| Berkas | Peran |
| :--- | :--- |
| `frontend/src/data/socialMediaData.ts` | Data default untuk video YouTube resmi dan 6 postingan feed Instagram (judul, gambar, narasi, URL). |
| `frontend/src/components/home/SocialMediaSection.tsx` | Komponen presentasi UI beranda: video player murni 16:9, grid postingan Instagram, dan dialog modal popup 2 kolom ter-portal. |
| `frontend/src/components/admin/YouTubeSocialMediaSettingsPanel.tsx` | Panel dashboard untuk mengelola link YouTube unggulan, judul, tanggal, lokasi, dan deskripsi dengan validasi ID otomatis dan live preview. |
| `frontend/src/components/admin/InstagramSocialMediaSettingsPanel.tsx` | Panel dashboard untuk mengelola feed Instagram: unggah foto multi-slide, edit caption, tanggal, likes, kategori, urutan, serta profil resmi. |
| `frontend/src/app/dashboard/galeri/page.tsx` | Halaman dashboard galeri dengan tab khusus `"youtube-media"` dan `"instagram-media"`. |
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

---

## 4. Panduan Pengelolaan & Unggah Feed Instagram via Dashboard Admin
Administrator dapat mengunggah postingan baru maupun mengelola feed Instagram beranda melalui menu:
1. Buka halaman **Dashboard Bappeda** -> Menu **Galeri & Dokumentasi** (`/dashboard/galeri`).
2. Pilih tab keempat: **Feed Instagram Media Sosial** (`?tab=instagram-media`).
3. **Mengunggah Postingan Baru (Mendukung Tarik Otomatis via Link Instagram)**:
   - Klik tombol **+ Tambah Postingan via Link** (atau tombol *Tarik dari Link IG*).
   - Di dalam formulir modal, terdapat input utama bertanda khusus: **Tautan Postingan Instagram**.
   - Masukkan URL postingan Instagram resmi (contoh: `https://www.instagram.com/p/DFxyz.../` atau `https://www.instagram.com/reel/...`).
   - Klik tombol **Tarik Data Otomatis**:
     - Sistem backend (`POST /api/social-media/instagram/extract`) akan membaca data publik Instagram (Open Graph & oEmbed).
     - Gambar sampul, judul kegiatan, narasi caption lengkap, dan tanggal postingan otomatis terisi ke form formulir tanpa perlu input manual.
   - Admin dapat memeriksa preview foto dan menyesuaikan judul, kategori, atau tanggal jika diinginkan.
   - Klik tombol **Simpan Postingan** untuk menerbitkan ke sistem.
4. **Mengatur Urutan & Tampilan Beranda**:
   - Dua postingan teratas (urutan #1 dan #2) otomatis berstatus **Tayang di Beranda** berdampingan dengan video YouTube.
   - Gunakan tombol panah **Naik / Turun** pada setiap kartu untuk mengatur postingan mana yang diprioritaskan tampil di beranda utama.
   - Tombol **Ganti via Link** / **Edit** memungkinkan penggantian link atau revisi data kapan saja.
   - Tombol **Hapus** (dengan konfirmasi SweetAlert2) untuk mencabut postingan.
5. **Pengaturan Profil Akun**:
   - Perbarui display name, username `@bappeda_halut`, tautan profil, dan tagline instansi pada kartu atas lalu klik **Simpan Profil**.

