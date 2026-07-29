# ARCHITECTURE SPECIFICATION — SMART BAPPEDA HALUT

## 🛠️ Stack Overview
- **Framework**: Next.js 15.1.6 (App Router) + React 19
- **Authentication & RBAC**: Custom React Auth Context + Sanctum-ready RBAC Token System
- **Styling**: Tailwind CSS v3 + Custom Spring Physics Animations
- **Map Engine**: Leaflet 1.9 + Esri Leaflet + ArcGIS REST API Client
- **State & Storage**: `adminService` & `proyekService` layer with LocalStorage fallback & Laravel REST API integration

---

## 👥 Role-Based Access Control (RBAC) System
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      1. Administrator (Super Admin)                         │
│  - /admin/users        (User Management: CRUD, Assign Role, Reset Pass)    │
│  - /admin/profil       (Profil Editor: Sejarah, Visi, Misi, Struktur Org)   │
│  - /admin/audit-logs   (Audit Logs SPBE: Action, Timestamp, IP Trail)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
      ┌────────────────────────────────┴────────────────────────────────┐
      ▼                                                                 ▼
┌────────────────────────────────┐              ┌────────────────────────────────┐
│         2. Admin Umum          │              │        3. Admin Bidang & Monev │
│ - /admin/berita (Berita/Banner)│              │ - /dashboard/dokumen           │
│ - /admin/dokumen (Public Docs) │              │   (Fitur 1: Upload Dokumen)    │
│ - /admin/survey (Survei IKM)   │              │ - /dashboard/geotagging-proyek │
│ - /admin/gis (Peta Proyek)     │              │   (Fitur 2: Geotagging X/Y)    │
└────────────────────────────────┘              │ - /dashboard/update-progres    │
                                                │   (Fitur 3: Tabular Monev Sync)│
                                                │ - /dashboard/lampiran-teknis   │
                                                │   (Fitur 4: ESRI Attachments)  │
                                                │ - /dashboard/geoprocessing-... │
                                                │   (Fitur 5: Buffer Analysis)   │
                                                └────────────────────────────────┘
```

---

## 🗺️ Integrasi 5 Fitur Spasial Halaman Khusus (Dedicated Pages)

1. **Fitur 1: Upload Dokumen Induk (Non-Spasial)** — `/dashboard/dokumen`
   - Form upload & repository dokumen kebijakan (RPJPD, RPJMD, LKPJ, Renstra, Renja).
   - Tabel MySQL: `documents` (`dokumen_master`). Pure storage server web (No ESRI).

2. **Fitur 2: Geotagging Proyek Pembangunan (Spasial)** — `/dashboard/geotagging-proyek`
   - Input titik fisik proyek pembangunan via Leaflet Map Drop-Pin (X/Y).
   - Sync 2-Arah: Web Backend mengirim `POST /addFeatures` ke ArcGIS REST API $\rightarrow$ Menyimpan `OBJECTID` di kolom `proyek_details.esri_objectid`.

3. **Fitur 3: Update Data Sektoral & Progres (Tabular Update)** — `/dashboard/update-progres`
   - Update persentase progres (0-100%) & status monev.
   - Sync 2-Arah: Web Backend mengirim `POST /updateFeatures` ke ArcGIS REST API (hanya atribut & OBJECTID) $\rightarrow$ Peta ESRI otomatis memperbarui warna/visualisasi.

4. **Fitur 4: Upload Lampiran Spasial Teknis (ESRI Attachments)** — `/dashboard/lampiran-teknis`
   - Upload Foto Lapangan / DED PDF / AMDAL langsung ke ArcGIS Geodatabase.
   - Web Backend mengirim `POST /{objectId}/addAttachment` (Multipart FormData) + menyimpan referensi di `proyek_attachments`.

5. **Fitur 5: Integrasi Geoprocessing Analisis (Opsional/Tingkat Lanjut)** — `/dashboard/geoprocessing-analisis`
   - Simulasi analisis spasial dinamis (Buffer radius pelayanan $X$ meter).
   - Send `POST /execute` ke ArcGIS Geoprocessing Service $\rightarrow$ Frontend Leaflet merender polygon GeoJSON overlay hasil analisis.

---

## 🌐 Dynamic Backend Integration Blueprint
- **Base Endpoint**: `https://api.bappeda.halmaherautarakab.go.id/api/v1`
- **Envelope Protocol**: Standard `{ status, code, message, data, meta }` response object.
- **Client Service Layer**: `src/services/adminService.ts` & `src/services/proyekService.ts`.
