# Dokumentasi Dashboard Eksekutif BAPPEDA Halmahera Utara

## 1. Deskripsi Umum
Halaman Ikhtisar Dashboard (`/dashboard`) dirancang sebagai Executive Control Center yang menyatukan metrik makro anggaran APBD, realisasi fisik dan serapan proyek lapangan (Geotagging), keterlibatan publik (unduhan dokumen perencanaan), serta kepuasan warga (IKM).

---

## 2. Struktur Visual & Metrik
Dashboard terbagi dalam beberapa komponen utama:

### A. 4 Kartu Metrik Ringkasan Utama
1. **Pengguna Sistem**: Total pengguna terdaftar di seluruh tingkatan peran (SuperAdmin, Admin Umum, Admin Bidang).
2. **Dokumen Perencanaan**: Total dokumen induk (RPJPD, RPJMD, RKPD, Data Sektoral, dll.) beserta akumulasi unduhan warga secara publik.
3. **Proyek Geotagging**: Jumlah titik proyek riil di lapangan, rasio serapan anggaran (total realisasi / total pagu), serta tautan ke pemantauan proyek sektoral.
4. **Kepuasan Warga (IKM)**: Nilai Indeks Kepuasan Masyarakat dari survei online beserta predikat mutu pelayanan publik (A - Sangat Baik).

### B. Baris Grafik 1 (Makro APBD & Geotagging Operasional)
- **Kiri (7 Kolom)**: Grafik Batang Kumulatif Realisasi Keuangan vs. Fisik Bulanan APBD (Januari - Juli). Dilengkapi indikator tooltip dan status kuartal aktif.
- **Kanan (5 Kolom)**: Ringkasan Monitoring Proyek Geotagging Lapangan, meliputi pagu vs realisasi riil, progres rata-rata fisik (%), dan rincian status proyek (*Selesai, Dalam Proses, Belum Mulai, Terkendala*).

### C. Baris Grafik 2 (Target Sektoral & Minat Publik)
- **Kiri (6 Kolom)**: Progres Capaian Program Strategis Sektoral (Infrastruktur, Kesehatan/Stunting, Pendidikan, Pertanian/Perikanan, Pariwisata/Ekraf) dengan bar target vs realisasi.
- **Kanan (6 Kolom)**: 5 Dokumen Perencanaan Paling Banyak Diunduh Warga (RPJPD, RPJMD, RKPD, P-RKPD, Data Sektoral) lengkap dengan progress bar proporsional dan jumlah unduhan.

### D. Modal Pengelolaan Grafik Dinamis (SuperAdmin)
SuperAdmin dapat memperbarui nilai persentase realisasi bulanan dan target sektoral secara instan melalui modal portal terintegrasi tanpa perlu membuka database secara manual.

---

## 3. Endpoint API Backend

### `GET /api/v1/dashboard/charts`
- **Akses**: Publik / Admin
- **Response Structure**:
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "monthly_trends": [
      { "id": 1, "month": "Jan", "keuangan": 24, "fisik": 28 }
    ],
    "program_performance": [
      { "id": 1, "sector": "Infrastruktur & Aksesibilitas", "realisasi": 88, "target": 90, "color": "bg-blue-600", "textColor": "text-blue-700" }
    ],
    "projects_summary": {
      "total_projects": 6,
      "status_counts": { "selesai": 2, "dalam_proses": 3, "belum_mulai": 1, "terkendala": 0 },
      "total_pagu": 4900000000,
      "total_realisasi": 2355000000,
      "serapan_persen": 48.1,
      "avg_progress": 59.2,
      "by_bidang": [ ... ]
    },
    "public_engagement": {
      "total_downloads": 7266,
      "top_documents": [ ... ],
      "survey_count": 4,
      "avg_ikm": 96
    },
    "meta": {
      "source_text": "Sistem Informasi Akuntansi Keuangan Daerah & Geotagging BAPPEDA Halut",
      "status_text": "Q3 2026 Status: 89.4% (On-Track)",
      "total_target_met": 5
    }
  }
}
```

### `POST /api/v1/dashboard/charts/batch-update`
- **Akses**: `auth:sanctum`, `permission:manage_dashboard`
- **Audit**: Tercatat otomatis dalam `AuditAdminMutation`
- **Payload**:
```json
{
  "monthly": [
    { "id": 1, "keuangan": 25, "fisik": 30 }
  ],
  "programs": [
    { "id": 1, "realisasi": 89, "target": 90 }
  ]
}
```
