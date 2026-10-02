# Standar OpenGraph & Thumbnail Preview Media Sosial (WhatsApp, Telegram, Twitter/X, Facebook)

## 1. Latar Belakang Masalah
Ketika tautan berita publik (`/berita/[slug]`) dibagikan ke WhatsApp atau media sosial lainnya, preview yang muncul sebelumnya adalah kartu default portal utama BAPPEDA dengan thumbnail logo website (`apple-icon.png`), bukan foto sampul berita, judul spesifik, ataupun ringkasan artikel.

Penyebab teknis:
1. **Client Component Tanpa SSR Metadata**: Halaman `/berita/[slug]/page.tsx` sebelumnya menggunakan direktif `"use client"`. Perayap (*crawler/bot*) WhatsApp (`WhatsApp/2.x.x` atau `facebookexternalhit/1.1`) dan Telegram tidak mengeksekusi JavaScript pada browser. Akibatnya, perayap hanya membaca metadata fallback statis dari root `layout.tsx`.
2. **Ketiadaan `generateMetadata` Dinamis**: Next.js App Router memerlukan fungsi `generateMetadata({ params })` di Server Component untuk merender meta tag `<meta property="og:..." />` secara tepat pada saat server merespons permintaan bot.
3. **URL Gambar Relatif vs Absolut**: WhatsApp mensyaratkan `og:image` berupa URL absolut penuh (`https://...`) dengan protokol HTTPS. URL relatif (misalnya `/storage/...` atau `/images/...`) ditolak atau diabaikan oleh parser media sosial.

---

## 2. Arsitektur Solusi

### A. Pemisahan Server Component & Client Component
- **`frontend/src/app/berita/[slug]/page.tsx` (Server Component)**:
  - Berjalan di server (tanpa `"use client"`).
  - Mengekspor `export async function generateMetadata({ params }): Promise<Metadata>`.
  - Mengambil data artikel berita secara langsung di server menggunakan helper `getArticle(slug)` dengan strategi multi-tier fallback API (`INTERNAL_API_URL`, `NEXT_PUBLIC_API_BASE_URL`, `http://127.0.0.1:8100/api`, dan domain publik).
  - Membersihkan ringkasan konten berita dari tag HTML menggunakan regex `replace(/<[^>]+>/g, ' ')` untuk tag `description` dan `og:description` (maksimal 160 karakter).
  - Mengonversi path gambar sampul berita (`image_url` atau `thumbnail_url`) menjadi URL absolut yang valid (`https://bappeda.halmaherautarakab.go.id/storage/...`).
  - Merender komponen interaktif `<NewsDetailClient article={article} />`.

- **`frontend/src/app/berita/[slug]/NewsDetailClient.tsx` (Client Component)**:
  - Memiliki direktif `"use client"`.
  - Menangani seluruh interaktivitas sisi peramban:
    - Lightbox pembesar gambar resolusi tinggi via React `createPortal` ke `document.body` (bebas stacking context & anti-clipping).
    - Slider zoom in/zoom out gambar, tombol reset, dan navigasi keyboard (`ESC`).
    - Tombol *Bagikan Tautan* (Copy link dengan notifikasi `toast.success` dan integrasi Web Share API jika didukung perangkat).
    - Optimasi rendering `ProgressiveImage`.

### B. Konfigurasi `metadataBase` pada Root Layout
- Pada `frontend/src/app/layout.tsx`:
  ```typescript
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bappeda.halmaherautarakab.go.id";

  export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    // ...
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: "BAPPEDA Kabupaten Halmahera Utara",
      // ...
    },
    twitter: {
      card: "summary_large_image",
      // ...
    },
  };
  ```

---

## 3. Spesifikasi Meta Tag yang Dihasilkan pada Rute `/berita/[slug]`

| Meta Tag | Sumber Data | Contoh Output |
| :--- | :--- | :--- |
| `og:title` | `article.title` | *"BAPPEDA Halut Gelar Forum Konsultasi Publik Rancangan Awal RKPD 2026"* |
| `og:description` | Ringkasan teks berita bersih | *"Pemerintah Kabupaten Halmahera Utara melalui Bappeda menggelar Forum Konsultasi Publik..."* |
| `og:image` | URL absolut foto sampul berita | `https://bappeda.halmaherautarakab.go.id/storage/news/rkpd-2026.jpg` |
| `og:image:width` | Standar rasio lanskap optimal | `1200` |
| `og:image:height` | Standar rasio lanskap optimal | `630` |
| `og:type` | Tipe OpenGraph artikel | `article` |
| `article:published_time`| `article.published_at` | `2026-10-01T08:00:00.000Z` |
| `article:author` | `article.author` | *"Tim Redaksi BAPPEDA Halut"* |
| `twitter:card` | Tipe kartu Twitter/X | `summary_large_image` |

---

## 4. Verifikasi dan Pengujian
1. **Kompilasi Next.js**: Rute `/berita/[slug]` terkompilasi sebagai Server Component dinamis `ƒ (Dynamic)` tanpa error kompilasi (`npm run build`).
2. **Pengujian Bot WhatsApp**: Ketika tautan berita dikirim ke ruang percakapan WhatsApp, bot mengunduh meta tag statis HTML langsung dari server dan menampilkan kartu preview besar dengan gambar sampul berita, judul lengkap, dan nama domain `bappeda.halmaherautarakab.go.id`.
