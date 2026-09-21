# Standarisasi Responsivitas Mobile Dashboard SPBE Bappeda Halmahera Utara

## Ringkasan Eksekutif
Dokumen ini mendefinisikan standar resmi responsivitas seluler (*Mobile Responsiveness Standard*) pada seluruh tata letak antarmuka (*UI layout*), navigasi bilah samping (*Sidebar Drawer*), bilah atas (*Header Popover*), filter, tabel data, serta formulir di seluruh menu dashboard pengelola (`/dashboard/*`) Portal SPBE Bappeda Kabupaten Halmahera Utara.

Standarisasi ini menjamin pengalaman pengguna (UX) yang mulus, bebas distorsi kolom tabel, tanpa *overflow horizontal*, dan mudah dioperasikan dengan jempol (*touch-friendly*) pada berbagai resolusi layar ponsel mulai dari 320px (iPhone SE/Android entry) hingga tablet.

---

## 1. Navigasi Mobile Drawer & Header Popover

### A. AdminSidebar Mobile Drawer
- **Header Khusus Mobile**: Bilah samping pada tampilan seluler dilengkapi dengan header identitas logo BAPPEDA HALUT dan tombol tutup eksplisit `✕` (`onMobileClose`) bersudut bulat lembut.
- **Backdrop Dismissal**: Menyentuh area redup hitam di luar panel sidebar (`bg-slate-950/60 backdrop-blur-xs`) secara otomatis menutup laci navigasi dengan transisi halus.
- **Scroll Containment**: Kontainer laci sidebar menggunakan `overflow-y-auto overscroll-contain` untuk mencegah *page bounce* pada Safari iOS.

### B. AdminHeader Popover Constraints
- **Notifikasi Popover**: Dibatasi dengan lebar responsif `w-[calc(100vw-2rem)] max-w-sm sm:w-96` dan ditempatkan dengan `right-0` agar tidak pernah terpotong di tepi kanan layar ponsel.
- **User Profile Popover**: Dibatasi dengan lebar responsif `w-[calc(100vw-2rem)] max-w-xs sm:w-72` untuk mencegah scrollbar horizontal tak diinginkan pada layar sempit.

---

## 2. Standar Tabel Data Mobile (*Horizontal Touch Scroll*)

### Prinsip Utama
Tabel data dengan banyak kolom (seperti tanggal, status, badge OPD, action button) tidak boleh diperas (*squished*) menjadi lebar sempit tanpa kejelasan teks. 

### Aturan Kode
Setiap pembungkus tabel data diwajibkan menggunakan struktur dua lapis:
1. Lapis luar: `overflow-x-auto rounded-2xl border border-slate-200`
2. Lapis dalam tabel: `min-w-[...]` dengan nilai piksel eksplisit sesuai jumlah kolom.

```tsx
<div className="overflow-x-auto rounded-2xl border border-slate-200">
  <table className="w-full min-w-[700px] text-left text-xs align-middle">
    {/* thead & tbody */}
  </table>
</div>
```

### Panduan `min-w` Rekomendasi
| Modul | Minimal Lebar (`min-w`) | Alasan |
| :--- | :--- | :--- |
| **Audit Logs** | `min-w-[700px]` | Timestamp, user, event badge, IP address, detail modal |
| **Infografis** | `min-w-[760px]` | Thumbnail, judul, kategori, status tayang, pin, aksi |
| **Update Progres Proyek** | `min-w-[850px]` | Nama paket, pagu/realisasi, deviasi, persentase progress bar |
| **Geoprocessing & Analisis** | `min-w-[800px]` | Layer ID, tipe geometri, parameter buffer, status kalkulasi |
| **Jenis Dokumen** | `min-w-[650px]` | Kode jenis, nama dokumen, deskripsi, total arsip, aksi |
| **Running Text** | `min-w-[680px]` | Teks berjalan, jadwal tayang, badge prioritas, aksi |
| **Kritik & Saran** | `min-w-[650px]` | Pengirim, kontak, unit tujuan, status tanggapan, balasan |

---

## 3. Standar Filter, Pencarian, dan Switcher Tab

### A. Search & Filter Bar
- Pada desktop: berjejer horisontal (`flex flex-row items-center justify-between gap-3`).
- Pada mobile: bertumpuk vertikal dengan lebar penuh (`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto`).
- Komponen input pencarian dan `SearchableSelect` mengambil lebar penuh pada mobile (`w-full sm:w-64` atau `w-full sm:w-72`).

### B. Tab & Switcher View (e.g., Agenda Kalender / List)
- Menggunakan `flex flex-col sm:flex-row gap-2 w-full sm:w-auto`.
- Tombol tab aktif memiliki `w-full sm:w-auto text-center justify-center` sehingga mudah ditekan dengan satu jari.

---

## 4. Standar Tombol Aksi Formulir (*Bottom Action Bar*)

### Masalah UX Sebelumnya
Pada layar seluler, tombol aksi yang diletakkan berdampingan dengan `justify-end gap-3` menyebabkan tombol utama ("Simpan & Terbitkan") terdorong ke luar layar kanan atau menumpuk sempit.

### Aturan Standar Baru
Seluruh formulir tambah/edit diwajibkan menggunakan struktur flex tumpuk terbalik pada mobile:

```tsx
{/* Submit Action Buttons */}
<div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
  <button
    type="button"
    onClick={handleCancel}
    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center justify-center flex items-center cursor-pointer"
  >
    Batal
  </button>
  <button
    type="button"
    onClick={handleDraft}
    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-black text-xs border border-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
  >
    <Save className="w-4 h-4" />
    <span>Simpan Draf</span>
  </button>
  <button
    type="submit"
    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
  >
    <CheckCircle2 className="w-4 h-4" />
    <span>Simpan & Terbitkan</span>
  </button>
</div>
```
- **`flex-col-reverse`**: Pada mobile, tombol aksi utama (*primary action*) berada paling atas dekat dengan pandangan pengguna, sementara tombol "Batal" berada paling bawah.
- **`items-stretch`**: Setiap tombol mengisi lebar penuh layar sentuh (target sentuh 100% lebar).
- **`w-full sm:w-auto`**: Mengembalikan ukuran tombol ke lebar alami pada tablet dan desktop.

---

## 5. Kalender & Widget Spesial

### Kalender Bulanan Agenda (`/dashboard/agenda`)
- Tampilan 7 kolom hari kalender memerlukan ruang minimal agar angka tanggal dan pill agenda tidak berhimpitan.
- Dibungkus dengan:
  ```tsx
  <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
    <div className="min-w-[720px] p-4 sm:p-6">
      {/* 7-column calendar grid */}
    </div>
  </div>
  ```
- Pengguna mobile dapat menggeser kalender secara horizontal dengan inersia alami layar sentuh (*momentum scrolling*).

### Struktur Organisasi Hierarki (`/dashboard/profil/struktur`)
- Lekukan garis hierarki anak jabatan dibatasi secara adaptif menggunakan `Math.min(depth * 18 + 12, 48)` pada mobile, sehingga posisi staf tingkat dalam tidak terpotong tepi kanan.

---

## 6. Daftar Modul yang Telah Diperbarui
Seluruh modul berikut telah memenuhi 100% standar responsivitas di atas:
1. `AdminSidebar` & `AdminHeader`
2. `Dashboard Home` (`/dashboard`)
3. `Dokumen Perencanaan` (`/dashboard/dokumen`, `tambah`, `[id]`, `jenis-dokumen`)
4. `Berita & Artikel` (`/dashboard/berita`, `tambah`)
5. `Pengumuman & Edaran` (`/dashboard/pengumuman`, `tambah`, `edit/[id]`)
6. `Agenda & Kalender Kerja` (`/dashboard/agenda`, `tambah`, `edit/[id]`)
7. `Galeri Multimedia` (`/dashboard/galeri`, `tambah`, `edit/[id]`)
8. `Infografis Pembangunan` (`/dashboard/infografis`)
9. `Teks Berjalan / Marquee` (`/dashboard/running-text`)
10. `Survei Kepuasan (IKM)` (`/dashboard/survey-kepuasan`)
11. `Kritik & Saran Publik` (`/dashboard/kritik-saran`)
12. `Audit Logs & Keamanan` (`/dashboard/audit-logs`)
13. `Update Progres Proyek` (`/dashboard/update-progres`)
14. `Geoprocessing & Analisis` (`/dashboard/geoprocessing-analisis`)
15. `Geotagging Proyek` (`/dashboard/geotagging-proyek`)
16. `Manajemen Pengguna SPBE` (`/dashboard/users`, `tambah`, `edit/[id]`)
17. `Profil Lembaga` (`/dashboard/profil/tentang`, `struktur`, `tugas-fungsi`, `dasar-hukum`)
18. `Pengaturan Spasial` (`/dashboard/pengaturan-spasial/visual`, `cetak-layout`, `basemap`, `pin-kategori`, `esri`, `buffer-radius`)
