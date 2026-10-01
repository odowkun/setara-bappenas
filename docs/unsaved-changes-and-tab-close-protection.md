# Standarisasi Proteksi Form Belum Tersimpan & Peringatan Tutup Tab (Unsaved Changes Guard)

Dokumentasi implementasi sistem proteksi kehilangan data saat pengguna sedang berada di halaman Tambah atau Edit (`/tambah`, `/edit`, dan form profil) di Dashboard BAPPEDA Halmahera Utara.

## Latar Belakang & Kebutuhan

Pengguna sering kali tanpa sengaja menutup tab browser (`Cmd+W` / `Ctrl+W` / klik tombol silang tab), memuat ulang halaman (`F5` / `Cmd+R`), atau mengklik menu sidebar saat sedang mengetik artikel berita, pengumuman, agenda, dokumen perencanaan, atau konfigurasi akun. Tanpa proteksi, data formulir yang panjang akan langsung hilang.

## Arsitektur Solusi Terintegrasi

Sistem mengkombinasikan dua lapisan proteksi:

```
                                  [Pengguna Mengedit Formulir]
                                               │
                                  [isDirty = true Terdeteksi]
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    ▼                                                     ▼
     [Aksi Browser: Tutup Tab / Reload]                 [Aksi In-App: Klik Menu Sidebar / Back]
                    │                                                     │
     [Event: window "beforeunload"]                     [Event: Capturing Phase "click" on <a>]
                    │                                                     │
                    ▼                                                     ▼
     [Dialog Asli Browser (Native Modal)]                [Dialog SweetAlert2 (showConfirm)]
  "Leave site? Changes you made may not be saved."     "Tinggalkan Halaman? Perubahan belum disimpan"
          [Cancel]          [Leave]                           [Tetap di Halaman]      [Ya, Tinggalkan]
             │                 │                                      │                      │
             ▼                 ▼                                      ▼                      ▼
       Tetap di Tab       Tab Ditutup                          Batal Navigasi         Lanjut Navigasi
```

---

## 1. Lapisan A: Proteksi Tutup Tab / Reload Browser (`beforeunload`)

Sesuai standar keamanan peramban modern (Google Chrome, Safari, Firefox, Microsoft Edge), kode JavaScript di halaman web tidak diizinkan merender modal DOM kustom saat peramban sedang mematikan/menutup tab. Sebagai gantinya, peramban menampilkan dialog sistem bawaan (*browser native modal*):

```ts
// frontend/src/context/UnsavedChangesContext.tsx
useEffect(() => {
  if (!isDirty) return;

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = ""; // Memicu modal asli browser "Leave site? Changes you made may not be saved."
    return "";
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [isDirty]);
```

**Karakteristik**:
- **Tampilan**: Modal resmi browser (Chrome popup: *"Leave site? Changes you made may not be saved. [Cancel] [Leave]"*).
- **Pemicu**: Klik tanda silang (X) tab, pintasan keyboard tutup tab (`Ctrl+W` / `Cmd+W`), tombol reload browser, atau mengetik URL baru di bilah alamat browser.
- **Kondisi**: Hanya aktif jika pengguna telah mengubah/mengetik isian pada form (`isDirty === true`). Jika form masih kosong/belum diubah, tab dapat ditutup seketika tanpa hambatan.

---

## 2. Lapisan B: Proteksi Navigasi Internal Aplikasi (SweetAlert2 `showConfirm`)

Saat berpindah halaman di dalam aplikasi Single Page Application (Next.js App Router), klik tautan internal tidak memicu `beforeunload`. Untuk itu, sistem mengintersepsi klik pada fase penangkapan (*capturing phase*):

```ts
// Intersepsi klik tautan internal (Sidebar, Breadcrumb, Tombol Kembali)
const handleAnchorClick = async (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  const anchor = target?.closest?.("a");
  if (!anchor || !anchor.href) return;

  const currentUrl = window.location.href;
  if (anchor.href === currentUrl || anchor.href.startsWith("javascript:")) return;

  // Hentikan navigasi langsung
  e.preventDefault();
  e.stopPropagation();

  const result = await showConfirm({
    title: "Tinggalkan Halaman?",
    text: "Perubahan yang Anda ketik belum disimpan. Data yang belum disimpan akan hilang jika Anda meninggalkan halaman ini.",
    confirmButtonText: "Ya, Tinggalkan",
    cancelButtonText: "Tetap di Halaman",
    icon: "warning",
  });

  if (result.isConfirmed) {
    setIsDirty(false);
    if (anchor.target === "_blank") {
      window.open(anchor.href, "_blank");
    } else {
      router.push(anchor.href);
    }
  }
};

window.addEventListener("click", handleAnchorClick, true);
```

**Karakteristik**:
- Mematuhi aturan proyek: Tidak menggunakan `confirm()` bawaan browser, melainkan wrapper modal **SweetAlert2** (`showConfirm`) dengan gaya BAPPEDA Halut.
- Berlaku untuk: Menu sidebar, tombol kembali (*back arrow*), tautan header *"Lihat Web Utama"*, dan tombol batal berupa `Link`.
- Menghalangi tombol Back/Forward browser via penanganan event `popstate`.

---

## 3. Deteksi Otomatis & Pembersihan Status (`isDirty`)

1. **Deteksi Otomatis (Auto-Detect)**:
   - Terpasang global di `UnsavedChangesProvider` pada `DashboardLayout`.
   - Mendengarkan event `input` dan `change` dari elemen `HTMLInputElement`, `HTMLTextAreaElement`, `HTMLSelectElement`, dan editor rich-text TipTap (`.ProseMirror`).
   - Otomatis mengabaikan kotak pencarian data tabel (`type="search"` atau input dengan placeholder *"cari"* / *"search"*).
2. **Pembersihan Status Otomatis (`markClean`)**:
   - Event `submit` pada elemen `<form>` otomatis menyetel `isDirty = false`.
   - Form-form utama (`TambahBeritaPage`, `TambahPengumumanPage`, `TambahAgendaPage`, `TambahDokumenPage`, `TambahUserPage`, `EditUserPage`) memanggil fungsi `markClean()` sesaat setelah respons API sukses sebelum melakukan `router.push(...)` agar tidak ada dialog konfirmasi keliru saat redirect berhasil.
