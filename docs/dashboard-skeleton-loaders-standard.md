# Standar Skeleton Loaders & State Transition Dashboard Bappeda Halut

## 1. Latar Belakang & Tujuan
Untuk memberikan pengalaman pengguna (UX) yang halus (*smooth transition*) tanpa kedipan, lonjakan tata letak (*cumulative layout shift* / CLS), atau tampilan layar kosong saat proses penarikan data asinkron dari backend API, seluruh komponen kartu (*card grid*) dan tabel data (*data table*) pada modul dashboard mengadopsi standar **Skeleton Loaders**.

Selain itu, dokumen ini mendokumentasikan spesifikasi pemilihan dokumen induk pada modul Geotagging Proyek yang mensyaratkan pemilihan manual aktif oleh pengguna (*no auto-select*).

---

## 2. Arsitektur & Prinsip Skeleton Loaders

### 2.1. In-Place Structural Preservation
1. **Preserve Container Geometry**:
   - Dimensi, padding, dan struktur baris/kolom skeleton harus mencerminkan komponen aslinya (misal: kartu dengan tinggi `min-h-[220px]`, sel tabel dengan padding `py-3.5 px-4` atau `p-3`).
   - Tidak menggunakan pemutar/spinner tunggal berukuran besar di tengah tabel karena menyebabkan pergeseran tata letak saat data selesai dimuat.

2. **Animasi Berkelanjutan**:
   - Menggunakan utilitas bawaan Tailwind `animate-pulse`.
   - Warna latar placeholder: `bg-slate-200` untuk elemen kontras tinggi dan `bg-slate-100` untuk elemen pendukung/sekunder. Dalam mode gelap (*dark mode*), gunakan `dark:bg-slate-800` dan `dark:bg-slate-800/60`.

3. **Manajemen Tiga Keadaan Data (*Three-State Rendering*)**:
   Setiap tampilan data asinkron wajib menangani tiga status secara berurutan:
   - **Status 1 (Memuat / `loading === true`)**: Tampilkan Skeleton Loader.
   - **Status 2 (Kosong / `!loading && items.length === 0`)**: Tampilkan kartu/baris *Empty State* yang informatif.
   - **Status 3 (Tersedia / `!loading && items.length > 0`)**: Tampilkan item/baris data sebenarnya.

---

## 3. Implementasi pada Komponen Kartu (Card Grid)

### Halaman: `/dashboard/dokumen`
- **Tampilan Grid**: 2 kolom pada desktop (`grid grid-cols-1 md:grid-cols-2 gap-4`).
- **Pola Skeleton**: 4 kartu tiruan dengan icon box berukuran `w-11 h-11`, placeholder badge pil, garis judul beranimasi, dan tombol aksi bawah.
- **Implementasi**:
  ```tsx
  {loading ? (
    [1, 2, 3, 4].map((n) => (
      <div
        key={n}
        className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4 animate-pulse flex flex-col justify-between min-h-[220px]"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-200 shrink-0" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              <div className="h-5 w-12 bg-slate-200 rounded-full" />
              <div className="h-5 w-14 bg-slate-200 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
          </div>
        </div>
        ...
      </div>
    ))
  ) : filteredDocs.length === 0 ? (
    <EmptyStateMessage />
  ) : (
    filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
  )}
  ```

---

## 4. Implementasi pada Tabel Data (Data Tables)

Skeleton loader tabel wajib dirender di dalam elemen `<tbody>` dengan jumlah sel (`<td>`) yang persis sama dengan jumlah kolom header (`<thead>`).

### 4.1. Halaman yang Telah Diterapkan
1. **`/dashboard/update-progres` (Tabel Progres Fisik & ESRI)**:
   - 9 kolom: Ref OBJECTID, Status ESRI, Nama Proyek, Bidang, Pagu, Realisasi, Progres Bar, Status, dan Tombol Aksi.
   - 5 baris skeleton saat `loading === true`.
2. **`/dashboard/dokumen/jenis-dokumen` (Tabel Manajemen Jenis Dokumen)**:
   - 6 kolom: Nomor, Nama Jenis Dokumen, Kode Unik, Scope Role, Pembuat, dan Aksi.
   - 5 baris skeleton saat `loading === true`.
3. **`/dashboard/audit-logs` (Tabel Audit Log Keamanan SPBE)**:
   - 5 kolom: Waktu Timestamp, Pengelola SPBE, Jenis Aksi, Detail Rincian, dan IP Address.
   - 5 baris skeleton saat `loading === true`.
4. **`/dashboard/users` (Tabel Pengguna & Kartu Mobile)**:
   - **Desktop**: 5 kolom tabel pengguna dengan avatar box `w-10 h-10`, teks nama, email, badge role, dan tombol aksi.
   - **Mobile**: 3 kartu skeleton responsif khusus perangkat genggam.
5. **`/dashboard/running-text` (Tabel Teks Berjalan)**:
   - Menggantikan spinner tengah dengan 4 baris skeleton pada struktur tabel utuh.
6. **`/dashboard/survey-kepuasan` (Tabel Hasil Responden Survei IKM)**:
   - 5 kolom: Avatar responden, Jenis Layanan, Badge Mutu IKM, Tanggal Submit, dan Tombol Detail.
7. **`/dashboard/kritik-saran` (Tabel Kritik & Saran Publik)**:
   - 5 kolom: Pengirim, SKPD Tujuan, Subjek/Pesan, Status Tanggapan, dan Tombol Aksi Balas.
8. **`/dashboard/agenda` (Tabel Agenda Kegiatan)**:
   - 6 kolom: Rentang Tanggal, Judul Agenda, Kategori, Lokasi, Status, dan Tombol Aksi.

---

## 5. Standar Pemilihan Geotagging Proyek (No Auto-Select)

### Halaman: `/dashboard/geotagging-proyek`
- **Aturan**: Modul geotagging **tidak boleh** melakukan auto-select terhadap dokumen pertama (`docs[0]`) saat halaman pertama kali dibuka tanpa query parameter `documentId`.
- **Kondisi Default**:
  - `selectedDocId` bernilai string kosong (`""`).
  - Halaman menampilkan kartu placeholder panduan:
    > *"Silakan Pilih Dokumen Induk Terlebih Dahulu"*
    > *"Pilih salah satu Dokumen Induk pada menu pencarian di atas untuk membuka Form Input Titik Geotagging Baru & Peta Interaktif Penentuan Lokasi Proyek."*
  - Form koordinat proyek dan peta interaktif Leaflet baru akan dimunculkan setelah pengguna memilih dokumen induk secara aktif.
