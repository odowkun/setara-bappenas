# Standar Arsitektur SEO, Indexing & Verifikasi Mesin Pencari (Googlebot)

Dokumen ini mengatur arsitektur Search Engine Optimization (SEO), konfigurasi robot crawler (`robots.ts`), peta situs dinamis (`sitemap.ts`), serta integrasi metadata Google Search Console pada portal resmi BAPPEDA Halmahera Utara.

---

## 1. Penyebab Utama Situs Belum Terindeks di Google

Sebelum standardisasi ini diterapkan, situs `https://bappeda.halmaherautarakab.go.id` belum muncul di pencarian Google karena:
1. **Tidak Ada `sitemap.xml`**: Endpoint `/sitemap.xml` mengembalikan respon `404 Not Found` (yang secara otomatis diinjeksi `noindex` oleh framework).
2. **Tidak Ada `robots.txt` Resmi**: Tanpa berkas `robots.txt` valid, bot perayap Google (*Googlebot*) tidak memiliki izin eksplisit untuk membaca jalur publik dan tidak mengetahui lokasi peta situs.
3. **Ketiadaan Metadata Indexing Eksplisit**: Root layout belum mendefinisikan direktif `robots` (`index: true, follow: true`), `alternates: { canonical }`, serta kata kunci strategis instansi.
4. **Belum Terverifikasi di Google Search Console**: Subdomain baru membutuhkan verifikasi kepemilikan dan inspeksi URL manual (*Request Indexing*) agar bot Google memprioritaskan jadwal perayapan.
5. **Ketiadaan JSON-LD Structured Data**: Bot tidak dapat mengasosiasikan situs secara otomatis dengan entitas resmi pemerintah (*GovernmentOrganization*).

---

## 2. Implementasi Teknis & Berkas Konfigurasi

### A. Konfigurasi Crawler (`frontend/src/app/robots.ts`)
- Memberikan izin penuh (`allow: "/"`) untuk perayapan halaman publik.
- Memblokir area privat dan administratif (`disallow: ["/dashboard/", "/api/"]`).
- Mengarahkan bot secara otomatis ke peta situs resmi: `https://bappeda.halmaherautarakab.go.id/sitemap.xml`.

### B. Peta Situs Dinamis (`frontend/src/app/sitemap.ts`)
- Memetakan seluruh halaman statis publik (Beranda, Profil Organisasi, Dokumen Publik, Pengumuman, Agenda, Galeri, GIS Peta, Layanan Publik).
- Mengambil dan mengikutsertakan seluruh artikel berita terbitan dinamis (`/berita/[slug]`) dari REST API backend secara berkala dengan tag frekuensi perubahan (`daily`/`weekly`) dan bobot prioritas SEO (`0.6` hingga `1.0`).

### C. Metadata & Schema.org JSON-LD (`frontend/src/app/layout.tsx`)
- Mendefinisikan `title`: `"BAPPEDA Kabupaten Halmahera Utara — Badan Perencanaan Pembangunan Daerah"`.
- Menghapus penyebutan istilah *"Portal"* dari metadata publik agar penamaan di Google Search (*Site Name Snippet*) identik murni sebagai **BAPPEDA Halmahera Utara**.
- Mendefinisikan `robots: { index: true, follow: true, googleBot: { ... } }`.
- Mendefinisikan URL kanonikal resmi (`alternates.canonical`).
- Mendefinisikan `verification.google`: `o6RSSNYJwgTTL7Hfssaslwa4Q1Zrv7E7P3Tge_AYQrc` untuk verifikasi instan Google Search Console.
- Menyematkan Structured Data Schema.org:
  - `@type: "GovernmentOrganization"`: Mengidentifikasi BAPPEDA Kabupaten Halmahera Utara lengkap dengan logo, gambar cover, dan alamat kantor resmi di Tobelo.
  - `@type: "WebSite"`: Memberikan sinyal eksplisit nama situs (*Site Name*) kepada Google: `name: "BAPPEDA Halmahera Utara"` dan `alternateName: ["BAPPEDA Kabupaten Halmahera Utara", "Badan Perencanaan Pembangunan Daerah Halmahera Utara", "Bappeda Halut"]` tanpa kata *"Portal"*.

---

## 3. Langkah Lanjutan yang Diperlukan (Di Luar Kode)

Untuk mempercepat indeksasi dalam 1x24 jam hingga beberapa hari:
1. **Google Search Console**:
   - Daftarkan properti `https://bappeda.halmaherautarakab.go.id` di [search.google.com/search-console](https://search.google.com/search-console).
   - Masukkan sitemap `https://bappeda.halmaherautarakab.go.id/sitemap.xml` di menu **Sitemaps**.
   - Lakukan **URL Inspection** pada URL beranda (`/`) lalu klik **Request Indexing**.
2. **Backlink dari Portal Utama Kabupaten**:
   - Minta Dinas Kominfo Halut untuk memasang tautan balik (*inbound link*) menuju `https://bappeda.halmaherautarakab.go.id` dari beranda portal induk `halmaherautarakab.go.id`.
3. **Cloudflare WAF / Bot Management**:
   - Pastikan fitur *Bot Fight Mode* pada Cloudflare tidak memblokir atau menantang user-agent *Googlebot* terverifikasi.

