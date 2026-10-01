# Standar Tipografi Rich Text Editor & Penayangan Artikel (Visual Parity)

## 1. Latar Belakang Masalah

Sebelum pembaruan ini, terjadi perbedaan tampilan (visual disparity) yang signifikan antara teks yang ditulis oleh admin di **RichTextEditor (Tiptap)** dan hasil penayangannya di halaman pembaca publik (`/berita/[slug]`, `/pengumuman`, `/profil/tentang`, `/profil/tugas-fungsi`):

1. **Reset Preflight Tailwind CSS**:
   - Tailwind CSS menerapkan CSS Reset bawaan (`preflight`) yang memaksa `p { margin: 0; }` di seluruh halaman.
   - Karena `@tailwindcss/typography` tidak diinstal dan kelas `.prose` sebelumnya tidak memiliki definisi styling mandiri di `globals.css`, seluruh tag `<p>` yang dirender dari database melalui `dangerouslySetInnerHTML` kehilangan margin atas dan bawah.
   - Akibatnya, seluruh paragraf berita menempel rapat satu sama lain (zero margin) menyerupai blok teks padat yang sulit dibaca.

2. **Perilaku Editor vs Penayangan**:
   - Di dalam editor Tiptap (`.ProseMirror`), tag `<p>` kosong hasil penekanan Enter dua kali memiliki tinggi visual karena keberadaan elemen internal `ProseMirror-trailingBreak`.
   - Namun ketika disimpan ke database dan dirender di penayangan publik, tag `<p></p>` atau `<p><br></p>` runtuh menjadi 0px (`height: 0`), sehingga spasi visual yang terlihat di editor hilang total di penayangan.

3. **Pop-up Native URL**:
   - Fitur tautan link pada editor sebelumnya menggunakan `window.prompt()`, yang melanggar aturan arsitektur sistem bahwa seluruh prompt/notifikasi wajib menggunakan SweetAlert2 (`@/lib/swal`).

---

## 2. Arsitektur & Standar Solusi

Untuk mencapai **100% Visual Parity (WYSIWYG Sejati)**, dibuat sistem tipografi terpadu yang membagikan aturan CSS yang sama persis antara editor Tiptap (`.ProseMirror`) dan penayang publik (`.prose`, `.article-content`).

### A. Token Spasi & Tipografi Terpadu (`frontend/src/app/globals.css`)

Semua aturan CSS diselaraskan menggunakan selektor bersama `.ProseMirror, .prose, .article-content`:

```css
/* Tipografi Utama */
.ProseMirror,
.prose,
.article-content {
  outline: none !important;
  font-size: 1rem;
  line-height: 1.85; /* Kenyamanan membaca tinggi */
  color: #334155;    /* Slate-700 kontras elegan */
  word-wrap: break-word;
}

/* Paragraf & Jarak Antar Paragraf */
.ProseMirror p,
.prose p,
.article-content p {
  margin-top: 0;
  margin-bottom: 1.25rem; /* 20px breathing space konsisten */
  line-height: 1.85;
  color: #334155;
}

/* Penanganan Paragraf Kosong */
.ProseMirror p:empty,
.prose p:empty,
.article-content p:empty,
.ProseMirror p:has(> br:only-child),
.prose p:has(> br:only-child),
.article-content p:has(> br:only-child) {
  min-height: 1.25rem;
  margin-bottom: 0.75rem;
}

/* Mencegah tumpukan paragraf kosong berlebihan */
.ProseMirror p:empty + p:empty,
.prose p:empty + p:empty,
.article-content p:empty + p:empty,
.ProseMirror p:has(> br:only-child) + p:has(> br:only-child),
.prose p:has(> br:only-child) + p:has(> br:only-child),
.article-content p:has(> br:only-child) + p:has(> br:only-child) {
  display: none;
}

/* Normalisasi paragraf berurutan */
.ProseMirror p + p:empty,
.prose p + p:empty,
.article-content p + p:empty,
.ProseMirror p + p:has(> br:only-child),
.prose p + p:has(> br:only-child),
.article-content p + p:has(> br:only-child) {
  margin-bottom: 0.5rem;
}
```

### B. Elemen Rich Text Lengkap

Sistem ini mendukung dan menstandarkan tampilan:
- **Heading (H1 - H4)**: Skala ukuran proporsional (`1.875rem` hingga `1.125rem`), `font-weight: 800/700`, warna `#0f172a`, margin atas-bawah proporsional.
- **Daftar Berpoin & Bernomor (`ul`, `ol`, `li`)**: Memaksa `list-style-type: disc !important` dan `decimal !important`, indentasi `padding-left: 1.75rem`, dan jarak vertikal antar butir yang lega.
- **Kutipan (`blockquote`)**: Aksen garis vertikal `border-left: 4px solid #2563eb`, latar lembut `#f8fafc`, sudut melengkung `rounded-r-xl`, dan gaya font italic.
- **Perataan Teks (`left`, `center`, `right`, `justify`)**: Dukungan inline style Tiptap `text-align: justify` dengan `text-justify: inter-word` agar artikel rata kanan-kiri tampil rapi layaknya koran/jurnal.
- **Tautan (`a`)**: Warna `#2563eb`, garis bawah dengan offset 3px, dan efek hover `#1d4ed8`.
- **Kode & Blok Kode (`code`, `pre`)**: Monospace elegan dengan palet slate gelap `#0f172a` pada blok pre dan slate terang `#f1f5f9` pada inline code.
- **Gambar (`img`)**: Responsif dengan `border-radius: 16px` dan bayangan lembut.
- **Tabel (`table`, `th`, `td`)**: Tampilan tabel modern bergaris border slate-200 dengan header slate-50.

---

## 3. Komponen Editor & Dialog Modern (`RichTextEditor.tsx`)

1. **Kelas Terikat (`editorProps`)**:
   ```tsx
   editorProps: {
     attributes: {
       class: "article-content prose max-w-none focus:outline-none min-h-[inherit]",
     },
   }
   ```
   Memastikan container editor Tiptap menerima kelas `.article-content.prose` yang sama persis dengan halaman publik.

2. **Dialog Penautan Link Menggunakan SweetAlert2**:
   - Menghapus penggunaan `window.prompt()`.
   - Menggunakan helper baru `showPrompt(...)` dari `@/lib/swal` yang menampilkan modal SweetAlert2 berdesain rounded modern dan tombol kustom.

---

## 4. Standar Halaman Penayangan Publik

Semua halaman yang merender konten HTML dinamis dari database wajib menyematkan kelas:
`article-content prose max-w-none`

Contoh implementasi:
- **Berita Detail (`frontend/src/app/berita/[slug]/page.tsx`)**:
  ```tsx
  <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xs">
    <div
      className="article-content prose max-w-none text-slate-800 font-sans"
      dangerouslySetInnerHTML={{ __html: displayData.content || "" }}
    />
  </div>
  ```
- **Pengumuman (`frontend/src/app/pengumuman/page.tsx`)**:
  ```tsx
  <div
    className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-sm font-medium text-slate-700 leading-relaxed article-content prose max-w-none"
    dangerouslySetInnerHTML={{ __html: activeDoc.content }}
  />
  ```
- **Profil Instansi (`profil/tentang` & `profil/tugas-fungsi`)**:
  Menggunakan `article-content prose max-w-none` untuk menjamin konsistensi visual seluruh konten kelembagaan.
