// Matriks 14 Modul Granular Spatie RBAC dipetakan presisi sesuai Nomor Tabel Resmi BAPPEDA Halut
export const SPATIE_PERMISSIONS_ORDERED = [
  { no: 1, id: "manage_profil", label: "Kelola Profil & Kelembagaan BAPPEDA", desc: "Akses mengedit tentang instansi, visi-misi, tugas-fungsi, & dasar hukum" },
  { no: 2, id: "manage_pengumuman", label: "Kelola Pengumuman Resmi & Edaran", desc: "Akses mempublikasikan surat edaran, tender/lelang, dan dokumen PDF" },
  { no: 3, id: "manage_tautan_opd", label: "Kelola Tautan OPD & Aplikasi Daerah", desc: "Akses menambah, mengubah, dan menonaktifkan kartu tautan OPD di beranda" },
  { no: 4, id: "manage_gis", label: "Kelola Editor Peta Spasial GIS", desc: "Akses menambahkan layer peta infrastruktur & tata ruang wilayah" },
  { no: 5, id: "manage_dashboard", label: "Kelola Statistik Dashboard", desc: "Akses memperbarui data realisasi APBD dan capaian program daerah" },
  { no: 6, id: "view_audit_logs", label: "Lihat Audit Log Sistem", desc: "Akses audit aktivitas admin, waktu mutasi data, dan alamat IP" },
  { no: 7, id: "manage_berita", label: "Kelola Berita & Artikel Humas", desc: "Akses merilis siaran pers, artikel berita utama, & topik kategori portal" },
  { no: 8, id: "manage_galeri", label: "Kelola Galeri Foto & Video Kegiatan", desc: "Akses mengunggah arsip foto dokumentasi & video YouTube kegiatan" },
  { no: 9, id: "manage_dokumen", label: "Kelola Repository Dokumen Perencanaan", desc: "Akses mengunggah dan mengelola dokumen perencanaan daerah & bidang" },
  { no: 10, id: "manage_users", label: "Kelola Pengguna & Hak Akses", desc: "Akses mengelola akun pengelola dan role permissions Spatie" },
  { no: 11, id: "manage_survey", label: "Kelola Survei Kepuasan", desc: "Akses responden, pertanyaan, dan konfigurasi survei kepuasan IKM" },
  { no: 12, id: "view_download_logs", label: "Lihat Riwayat Pengunduh", desc: "Akses email dan metadata unduhan dokumen publik" },
  { no: 13, id: "manage_document_types", label: "Kelola Jenis Dokumen", desc: "Akses master kategori dan penentuan scope bidang dokumen perencanaan" },
  { no: 14, id: "manage_kritik", label: "Kelola Kritik & Saran", desc: "Akses identitas pengirim aspirasi masyarakat dan pemberian tanggapan" },
];

export const BIDANG_OPTIONS = [
  { value: "infrastruktur", label: "Bidang IPW (Infrastruktur & Pengembangan Wilayah)" },
  { value: "sosbud", label: "Bidang Sosbud (Pembangunan Manusia & Masyarakat)" },
  { value: "perekonomian", label: "Bidang Ekonomi & Sumber Daya Alam" },
  { value: "renval", label: "Bidang Monev / Renval (Perencanaan, Pengendalian & Evaluasi)" },
  { value: "semua", label: "Sekretariat Umum (Semua Bidang)" },
];

export const PERMISSION_LABEL_MAP: Record<string, { no: number; short: string }> = {
  manage_profil: { no: 1, short: "Profil" },
  manage_pengumuman: { no: 2, short: "Pengumuman" },
  manage_tautan_opd: { no: 3, short: "Tautan OPD" },
  manage_gis: { no: 4, short: "Peta GIS" },
  manage_dashboard: { no: 5, short: "Dashboard" },
  view_audit_logs: { no: 6, short: "Audit Log" },
  manage_berita: { no: 7, short: "Berita" },
  manage_galeri: { no: 8, short: "Galeri" },
  manage_dokumen: { no: 9, short: "Dokumen" },
  manage_users: { no: 10, short: "Kelola User" },
  manage_survey: { no: 11, short: "Survei" },
  view_download_logs: { no: 12, short: "Riwayat Unduh" },
  manage_document_types: { no: 13, short: "Jenis Dokumen" },
  manage_kritik: { no: 14, short: "Kritik" },
};

export const getBidangLabel = (bidang?: string) => {
  switch (bidang) {
    case "infrastruktur": return "IPW";
    case "sosbud": return "SOSBUD";
    case "perekonomian": return "EKONOMI";
    case "renval": return "MONEV / RENVAL";
    case "semua": return "SEKRETARIAT";
    default: return bidang ? bidang.toUpperCase() : "BAPPEDA";
  }
};

export interface TemplatePresetOption {
  id: "custom" | "ipw" | "monev" | "ekonomi" | "sosbud" | "sektert" | "superadmin";
  title: string;
  category: string;
  role: "admin_bidang" | "admin_umum" | "superadmin";
  bidang: "infrastruktur" | "sosbud" | "perekonomian" | "renval" | "semua";
  badge: string;
  badgeBg: string;
  badgeText: string;
  iconType: "custom" | "ipw" | "monev" | "ekonomi" | "sosbud" | "sektert" | "superadmin";
  description: string;
  skPerson: string;
  modules: number[];
  permissions: string[];
  docScopeDesc: string;
}

export const TEMPLATE_PRESET_OPTIONS: TemplatePresetOption[] = [
  {
    id: "custom",
    title: "Kustom / Pengaturan Bebas",
    category: "Paling Fleksibel (Default)",
    role: "admin_bidang",
    bidang: "infrastruktur",
    badge: "Manual Custom",
    badgeBg: "bg-slate-100 border-slate-300",
    badgeText: "text-slate-800",
    iconType: "custom",
    description: "Tentukan sendiri peran, bidang, dan kombinasi modul secara leluasa tanpa batasan template bawaan.",
    skPerson: "Fleksibel Sesuai Kebutuhan",
    modules: [],
    permissions: [
      "manage_pengumuman",
      "manage_tautan_opd",
      "manage_galeri",
      "manage_dokumen",
      "manage_users",
    ],
    docScopeDesc: "Disesuaikan manual sesuai bidang dan kebutuhan penugasan",
  },
  {
    id: "ipw",
    title: "Template Bidang IPW",
    category: "Infrastruktur & Pengembangan Wilayah",
    role: "admin_bidang",
    bidang: "infrastruktur",
    badge: "SK Nofrendy ST",
    badgeBg: "bg-amber-50 border-amber-300",
    badgeText: "text-amber-900",
    iconType: "ipw",
    description: "Penugasan tata ruang, dokumen KLHS, RTRW, RDTR, pengumuman tender dinas, serta arsip infrastruktur daerah.",
    skPerson: "Nofrendy Johanis Utubulang, ST",
    modules: [2, 3, 8, 9, 10],
    permissions: [
      "manage_pengumuman",
      "manage_tautan_opd",
      "manage_galeri",
      "manage_dokumen",
      "manage_users",
    ],
    docScopeDesc: "KLHS, RTRW, RDTR + Dokumen Bersama (Renstra, Renja, Data Sektoral)",
  },
  {
    id: "monev",
    title: "Template Bidang Monev / Renval",
    category: "Perencanaan, Pengendalian & Evaluasi",
    role: "admin_bidang",
    bidang: "renval",
    badge: "SK Christian SP",
    badgeBg: "bg-indigo-50 border-indigo-300",
    badgeText: "text-indigo-900",
    iconType: "monev",
    description: "Penugasan pelaporan LKPJ, evaluasi berkala RKPD, pengendalian indikator makro, serta editor layer spasial GIS.",
    skPerson: "Christian Melkianus, SP",
    modules: [2, 3, 4, 8, 9, 10],
    permissions: [
      "manage_pengumuman",
      "manage_tautan_opd",
      "manage_gis",
      "manage_galeri",
      "manage_dokumen",
      "manage_users",
    ],
    docScopeDesc: "LKPJ, Evaluasi RKPD + Dokumen Bersama (Renstra, Renja, Data Sektoral)",
  },
  {
    id: "ekonomi",
    title: "Template Bidang Ekonomi & SDA",
    category: "Perekonomian & Ketahanan Pangan",
    role: "admin_bidang",
    bidang: "perekonomian",
    badge: "SK Gregoryan",
    badgeBg: "bg-emerald-50 border-emerald-300",
    badgeText: "text-emerald-900",
    iconType: "ekonomi",
    description: "Penugasan pengendalian inflasi/TPID, neraca pangan, potensi komoditas daerah, serta data sektoral ekonomi.",
    skPerson: "Gregoryan",
    modules: [2, 3, 8, 9, 10],
    permissions: [
      "manage_pengumuman",
      "manage_tautan_opd",
      "manage_galeri",
      "manage_dokumen",
      "manage_users",
    ],
    docScopeDesc: "TPID, PDRB, Neraca Pangan + Dokumen Bersama (Renstra, Renja, Data Sektoral)",
  },
  {
    id: "sosbud",
    title: "Template Bidang Sosbud",
    category: "Pembangunan Manusia & Masyarakat",
    role: "admin_bidang",
    bidang: "sosbud",
    badge: "SK Vinchadros",
    badgeBg: "bg-rose-50 border-rose-300",
    badgeText: "text-rose-900",
    iconType: "sosbud",
    description: "Penugasan percepatan stunting, kemiskinan ekstrem, siaran pers berita humas, survei kepuasan, & aspirasi warga.",
    skPerson: "Vinchadros",
    modules: [1, 7, 11, 13, 14],
    permissions: [
      "manage_profil",
      "manage_berita",
      "manage_survey",
      "manage_document_types",
      "manage_kritik",
    ],
    docScopeDesc: "Stunting, Kemiskinan Ekstrem + Dokumen Bersama (Renstra, Renja, Data Sektoral)",
  },
  {
    id: "sektert",
    title: "Template Sekretariat Umum",
    category: "Tata Usaha & Kearsipan Dinas",
    role: "admin_umum",
    bidang: "semua",
    badge: "SK Hjon",
    badgeBg: "bg-sky-50 border-sky-300",
    badgeText: "text-sky-900",
    iconType: "sektert",
    description: "Penugasan publikasi surat edaran dinas, arsip dokumen makro daerah (RPJPD/RPJMD), & monitoring unduhan warga.",
    skPerson: "Hjon",
    modules: [2, 3, 8, 9, 10, 12],
    permissions: [
      "manage_pengumuman",
      "manage_tautan_opd",
      "manage_galeri",
      "manage_dokumen",
      "manage_users",
      "view_download_logs",
    ],
    docScopeDesc: "Dokumen Makro Daerah (RPJPD, RPJMD, Renja Sekretariat, Dokumen Lintas Bidang)",
  },
  {
    id: "superadmin",
    title: "Template Super Administrator",
    category: "Pusat Kendali Sistem Penuh",
    role: "superadmin",
    bidang: "semua",
    badge: "Akses Penuh (1–14)",
    badgeBg: "bg-purple-50 border-purple-300",
    badgeText: "text-purple-900",
    iconType: "superadmin",
    description: "Akses absolut tanpa batas ke seluruh 14 modul sistem portal, konfigurasi database, dan seluruh jenis dokumen.",
    skPerson: "Administrator Utama BAPPEDA",
    modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    permissions: [
      "manage_profil",
      "manage_pengumuman",
      "manage_tautan_opd",
      "manage_gis",
      "manage_dashboard",
      "view_audit_logs",
      "manage_berita",
      "manage_galeri",
      "manage_dokumen",
      "manage_users",
      "manage_survey",
      "view_download_logs",
      "manage_document_types",
      "manage_kritik",
    ],
    docScopeDesc: "Seluruh Jenis Dokumen Perencanaan (Tanpa Batasan)",
  },
];

