# ARCHITECTURE SPECIFICATION — SMART BAPPEDA HALUT

## 🛠️ Stack Overview
- **Framework**: Next.js 15.5.22 (App Router) + React 19
- **Authentication & RBAC**: Laravel Sanctum Bearer token + Spatie Permission + server-authoritative React Auth Context
- **Styling**: Tailwind CSS v3 + Custom Spring Physics Animations
- **Map Engine**: Leaflet 1.9 + Esri Leaflet + ArcGIS REST API Client
- **State & Storage**: Laravel REST API + MySQL sebagai sumber data resmi tunggal; browser storage hanya untuk sesi, aksesibilitas, dan checkpoint unggah non-domain

---

## 👥 Role-Based Access Control (RBAC) System
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      1. Administrator (Super Admin)                         │
│  - /dashboard/users        (CRUD user, role, permission, reset password)    │
│  - /dashboard/profil       (Profil Editor: Sejarah, Visi, Misi, Struktur)   │
│  - /dashboard/audit-logs   (Audit mutasi dari identitas sesi server)        │
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
- **Client Service Layer**: `src/services/adminService.ts` & `src/services/proyekService.ts`.
- **Authenticated Request Layer**: `src/lib/apiClient.ts` menambahkan Bearer token ke endpoint terlindungi.
- **Authorization Source**: role dan permission selalu dimuat melalui `GET /auth/me`; nilai user lama di browser tidak dipercaya.
- **Official Data Source**: tidak ada fallback record admin maupun publik ke Local Storage atau konstanta demo.
- **Public Isolation**: dokumen, proyek, dan berita nonpublik difilter pada backend, termasuk pencarian global.
- **ESRI Boundary**: database tetap otoritatif; kegagalan ESRI tidak menghasilkan ID palsu, sedangkan buffer lokal disimpan dengan label sumber `local_calculation`.
- **Publication Boundary**: berita, agenda, pengumuman, galeri, dan dokumen memakai transisi draf/publikasi server-side; endpoint publik hanya membaca record terbit.
- **Document Knowledge Archive**: dokumen tersimpan sebagai versi immutable pada private storage. Versi terbaru melewati submit/review sebelum menjadi `current_version`; publikasi hanya menerima klasifikasi `public`, governance `approved`, dan checksum `valid`.
- **Measured File Access**: preview/download memakai grant bertanda tangan yang terikat dokumen+versi. Download log/counter dibuat saat one-time stream dikonsumsi, bukan saat email baru disubmit.
- **Knowledge Discovery**: `pdftotext` dan OCR Tesseract opsional mengisi `document_versions.full_text`; global search hanya mengindeks current version yang approved/public.
- **Records Governance**: retention scan hanya menandai `due`; legal hold mencegah archive. Operasi delete dokumen adalah lifecycle archive dan tidak menghapus versi.

## 🔐 Security, Privacy, and Audit Boundary

- Semua mutasi admin memerlukan autentikasi dan permission.
- Role `superadmin` tidak dapat digantikan hanya dengan menyisipkan permission langsung.
- Admin Bidang dibatasi ke dokumen dan proyek bidang sendiri.
- PII survei, kritik/saran, dan email unduhan terenkripsi di database.
- Audit aktor diturunkan dari token server; nama aktor dari payload diabaikan.
- Rich text berita/profil disanitasi sebelum disimpan.
- Respons PII tidak boleh dicache oleh browser atau proxy.

Matriks permission, alur deployment, rollback, pro/kontra, dan risiko tersisa dijelaskan di [docs/security-rbac-privacy.md](docs/security-rbac-privacy.md).

Kebijakan sumber data, tabel resmi, dampak, deployment, dan rollback dijelaskan di [docs/database-single-source.md](docs/database-single-source.md).

Workflow draf-terbit-unpublish, matriks route, validasi, dampak, dan rollback dijelaskan di [docs/official-publication-workflow.md](docs/official-publication-workflow.md).

Arsitektur tabel versi, lifecycle, signed stream, OCR, checksum, retensi, dampak migrasi, operasi, dan rollback arsip dijelaskan di [docs/document-knowledge-archive.md](docs/document-knowledge-archive.md).
