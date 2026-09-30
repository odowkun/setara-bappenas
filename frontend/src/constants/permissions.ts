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
