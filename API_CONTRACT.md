# API CONTRACT SPECIFICATION — BAPPEDA HALUT

## 🌐 Protocol & Base URL
- **Base Endpoint**: `https://api.bappeda.halmaherautarakab.go.id/api/v1`
- **Development**: `http://localhost:8000/api/v1`
- **Format**: JSON (UTF-8)

---

## 📦 Standard Response Envelope Protocol

### Success Response (`200 OK`, `201 Created`)
```json
{
  "status": "success",
  "code": 200,
  "message": "Data berhasil diambil",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 120
  }
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `500 Server Error`)
```json
{
  "status": "error",
  "code": 400,
  "message": "Validasi input gagal",
  "errors": [
    {
      "field": "title",
      "message": "Judul berita tidak boleh kosong"
    }
  ]
}
```

---

## 🔑 Endpoint Contracts

### 1. Global Instant Search
- `GET /search` — Instant search query serentak (Query: `q=rkpd`, `type=all|news|doc|gis`).

### 2. Executive Dashboard Widgets & Export Data
- `GET /dashboard/macro-stats` — Mengambil data real-time stunting, inflasi, kemiskinan, & IPM Halut.
- `GET /dashboard/budget-realization` — Mengambil persentase realisasi fisik vs keuangan APBD per bulan.
- `GET /export/dashboard/pdf` — Stream download PDF laporan statistik eksekutif.
- `GET /export/realization/excel` — Stream download Excel data realisasi anggaran OPD.

### 3. Portal Publik (Berita, Pengumuman, Galeri)
- `GET /news` — Daftar berita terbaru Bappeda (Query: `search`, `category`, `page`).
- `GET /news/:slug` — Detail artikel berita.
- `GET /announcements` — Daftar pengumuman resmi (contoh: Renstra, Musrenbang).
- `GET /gallery` — Album foto & video (Query: `category_id`).

### 4. Repository Dokumen Publik
- `GET /documents` — Daftar dokumen terpublikasi (RPJMD, RKPD, Popeda).
- `POST /documents/:id/preview` — Mencatat satu pembukaan preview dan mengembalikan total tayangan terbaru.
- `POST /documents/:id/download` — Memvalidasi email masyarakat, mencatat log, menaikkan total unduhan, dan mengembalikan URL berkas.
- `GET /document-download-logs` — Riwayat email pengunduh dan ringkasan statistik. Wajib Bearer token admin Sanctum.

Payload unduhan:

```json
{
  "email": "masyarakat@example.com"
}
```

Setiap log unduhan menyimpan ID dokumen, email, waktu unduh, alamat IP, dan user agent.

### 5. Esri GIS Spatial Map Layers
- `GET /gis/projects` — Data GeoJSON / titik spasial proyek pembangunan & infrastruktur.
- `GET /gis/districts` — Poligon GeoJSON batas wilayah 17 kecamatan di Halmahera Utara.
- `GET /export/gis/geojson` — Export file GeoJSON peta proyek publik.

### 6. SPBE Security & Audit Logs (Admin Only)
- `GET /admin/audit-logs` — Mengambil log aktivitas perubahan data oleh admin/staff.
