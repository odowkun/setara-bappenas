"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { Role, BidangType } from "@/types/auth";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { toast } from "@/lib/swal";
import {
  ArrowLeft,
  UserPlus,
  Save,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Key,
  CheckSquare,
  Square,
  Users,
  FileText,
} from "lucide-react";

interface PejabatOption {
  position: string;
  name: string;
}

const ALL_DOCUMENT_PERMISSIONS = [
  { id: "rpjpd", label: "RPJPD (Rencana Pembangunan Jangka Panjang Daerah)", roleDefault: "admin_umum" },
  { id: "rpjmd", label: "RPJMD (Rencana Pembangunan Jangka Menengah Daerah)", roleDefault: "admin_umum" },
  { id: "rkpd", label: "RKPD (Rencana Kerja Pemerintah Daerah)", roleDefault: "admin_umum" },
  { id: "lkpj", label: "LKPJ (Laporan Keterangan Pertanggungjawaban)", roleDefault: "admin_umum" },
  { id: "renstra", label: "Renstra (Rencana Strategis Bidang)", roleDefault: "admin_bidang" },
  { id: "renja", label: "Renja (Rencana Kerja Bidang)", roleDefault: "admin_bidang" },
  { id: "dik_sektoral", label: "Dik. Sektoral", roleDefault: "admin_bidang" },
  { id: "data_sektoral", label: "Data Sektoral", roleDefault: "admin_bidang" },
];

const ALL_SPATIE_PERMISSIONS = [
  {
    id: "manage_profil",
    label: "Kelola Profil & Kelembagaan BAPPEDA",
    desc: "Akses mengedit tentang, visi-misi, tugas-fungsi, & dasar hukum instansi",
  },
  {
    id: "manage_berita",
    label: "Kelola Berita & Artikel Humas",
    desc: "Akses merilis siaran pers, artikel berita utama, & topik kategori",
  },
  {
    id: "manage_pengumuman",
    label: "Kelola Pengumuman Resmi & Edaran",
    desc: "Akses mempublikasikan surat edaran, tender/lelang, & dokumen PDF",
  },
  {
    id: "manage_galeri",
    label: "Kelola Galeri Foto & Video Kegiatan",
    desc: "Akses mengunggah arsip foto dokumentasi & video YouTube kegiatan",
  },
  {
    id: "manage_tautan_opd",
    label: "Kelola Tautan OPD & Aplikasi Daerah",
    desc: "Akses menambah, mengubah, dan menonaktifkan kartu tautan OPD di beranda",
  },
  {
    id: "manage_dokumen",
    label: "Kelola Repository Dokumen Perencanaan",
    desc: "Akses mengunggah dokumen RKPD, RPJMD, LKPJ, Renstra, & Renja",
  },
  {
    id: "manage_gis",
    label: "Kelola Editor Peta Spasial GIS",
    desc: "Akses menambahkan layer peta infrastruktur & tata ruang wilayah",
  },
  {
    id: "manage_users",
    label: "Kelola Pengguna & Hak Akses (SuperAdmin)",
    desc: "Akses penuh mengelola akun pengelola dan role permissions Spatie",
  },
  {
    id: "manage_dashboard",
    label: "Kelola Statistik Dashboard",
    desc: "Akses memperbarui realisasi APBD dan program sektoral",
  },
  {
    id: "manage_survey",
    label: "Kelola Survei Kepuasan",
    desc: "Akses responden, pertanyaan, dan konfigurasi layanan survei",
  },
  {
    id: "manage_kritik",
    label: "Kelola Kritik & Saran",
    desc: "Akses identitas pengirim dan pemberian tanggapan",
  },
  {
    id: "view_download_logs",
    label: "Lihat Riwayat Pengunduh",
    desc: "Akses email dan metadata unduhan dokumen",
  },
  {
    id: "view_audit_logs",
    label: "Lihat Audit Log SPBE",
    desc: "Akses aktivitas admin dan alamat IP",
  },
  {
    id: "manage_document_types",
    label: "Kelola Jenis Dokumen",
    desc: "Akses master kategori dan scope dokumen",
  },
];

export default function TambahUserPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin_bidang");
  const [bidang, setBidang] = useState<BidangType>("infrastruktur");
  const [nip, setNip] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Document Upload Checkbox Permissions
  const [allowedDocPermissions, setAllowedDocPermissions] = useState<string[]>([
    "renstra",
    "renja",
    "dik_sektoral",
    "data_sektoral",
  ]);

  // Spatie Permissions State
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "manage_dokumen",
  ]);

  const [pejabatPositions, setPejabatPositions] = useState<string[]>([
    "Kepala BAPPEDA (Administrator)",
    "Sekretaris BAPPEDA",
    "Kasubag Umum & Kepegawaian",
    "Kabid Infrastruktur & Pengembangan Wilayah (IPW)",
    "Kabid Perekonomian & SDA",
    "Kabid Pembangunan Manusia & Masyarakat (Sosbud)",
    "Kabid Perencanaan, Pengendalian & Evaluasi (Renval)",
    "Pejabat Fungsional Perencana Ahli",
    "Staf Admin Pengelola SPBE",
  ]);

  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Update default document upload permissions when role changes
  useEffect(() => {
    if (role === "superadmin") {
      setAllowedDocPermissions(ALL_DOCUMENT_PERMISSIONS.map((d) => d.id));
      setSelectedPermissions(ALL_SPATIE_PERMISSIONS.map((p) => p.id));
    } else if (role === "admin_umum") {
      setAllowedDocPermissions(["rpjpd", "rpjmd", "rkpd", "lkpj"]);
      setSelectedPermissions([
        "manage_dashboard",
        "manage_berita",
        "manage_pengumuman",
        "manage_galeri",
        "manage_tautan_opd",
        "manage_dokumen",
        "view_download_logs",
        "manage_survey",
        "manage_kritik",
        "manage_gis",
      ]);
    } else {
      setAllowedDocPermissions(["renstra", "renja", "dik_sektoral", "data_sektoral"]);
      setSelectedPermissions(["manage_dokumen", "manage_gis"]);
    }
  }, [role]);

  const toggleDocPermission = (docId: string) => {
    setAllowedDocPermissions((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim()) {
      const msg = "Nama lengkap dan email wajib diisi!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (
      password.length < 12 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      const msg = "Password minimal 12 karakter serta memiliki huruf besar, huruf kecil, dan angka!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Konfirmasi password tidak cocok dengan password awal!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      await adminService.addUser({
        name,
        email,
        password,
        passwordConfirmation: confirmPassword,
        role,
        bidang: role === "admin_bidang" ? bidang : undefined,
        nip,
        jabatan: jabatan || pejabatPositions[0],
        permissions: selectedPermissions,
        allowedDocumentPermissions: allowedDocPermissions,
      });

      toast.success(`Pengguna baru ${name} berhasil ditambahkan!`);
      setIsSaved(true);
      setTimeout(() => {
        router.push("/dashboard/users");
      }, 1500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menambahkan pengguna.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Hanya role <strong>Administrator (SuperAdmin)</strong> yang dapat membuat dan mengonfigurasi pengguna baru.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/users"
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs shrink-0"
            title="Kembali ke Daftar Pengguna"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Tambah Pengguna Pengelola SPBE Baru</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Daftarkan akun kedinasan baru, tentukan bidang Bappeda, password, serta checkbox izin upload jenis dokumen.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengguna Berhasil Ditambahkan!</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* FORM UTAMA */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CARD 1: IDENTITAS & JABATAN STRUKTURAL */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                1. Informasi Identitas Kedinasan & Jabatan
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Data resmi pegawai/pejabat pengelola portal BAPPEDA Halmahera Utara
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ir. Hendra Kusuma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Kedinasan Official *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="infrastruktur@halmaherautarakab.go.id"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP Kedinasan (Opsional)
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="198103202006041002"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan Struktural BAPPEDA *
              </label>
              <SearchableSelect
                options={pejabatPositions.map((pos) => ({ value: pos, label: pos }))}
                value={jabatan}
                onChange={(val) => setJabatan(String(val))}
                placeholder="-- Pilih Jabatan dari Struktur BAPPEDA --"
                searchPlaceholder="Cari jabatan..."
              />
            </div>
          </div>
        </div>

        {/* CARD 2: PASSWORD SETUP */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                2. Pengaturan Password Akun
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Tentukan kata sandi awal untuk autentikasi login pengguna
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password Awal Akun *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ulangi Konfirmasi Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Pastikan sama dengan password di atas"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: ROLE & BIDANG */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                3. Peran Pengguna & Scope Bidang Bappeda
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Pembagian akses role (Admin Umum vs Admin Bidang 1 s/d 4)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role Pengguna *
              </label>
              <SearchableSelect
                options={[
                  { value: "admin_bidang", label: "Admin Bidang (Dokumen Renstra/Renja & Sektoral)" },
                  { value: "admin_umum", label: "Admin Umum (RPJPD, RPJMD, RKPD, LKPJ)" },
                  { value: "superadmin", label: "Administrator (SuperAdmin Full System)" },
                ]}
                value={role}
                onChange={(val) => setRole(String(val) as Role)}
                placeholder="-- Pilih Role Pengguna --"
                searchPlaceholder="Cari role..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Scope Pembagian Bidang BAPPEDA *
              </label>
              <SearchableSelect
                options={[
                  { value: "sosbud", label: "Admin Bidang 1: Pembangunan Manusia & Masyarakat (Sosbud)" },
                  { value: "perekonomian", label: "Admin Bidang 2: Ekonomi & Sumber Daya Alam" },
                  { value: "infrastruktur", label: "Admin Bidang 3: Infrastruktur & Pengembangan Wilayah" },
                  { value: "renval", label: "Admin Bidang 4: Pengendalian, Evaluasi & Pelaporan (Renval)" },
                  { value: "semua", label: "Sekretariat Umum (Semua Bidang)" },
                ]}
                value={bidang}
                onChange={(val) => setBidang(String(val) as BidangType)}
                placeholder="-- Pilih Scope Bidang --"
                searchPlaceholder="Cari bidang..."
                disabled={role === "superadmin"}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: CHECKBOX PERMISSION UPLOAD DOKUMEN (PERMINTAAN USER LENGKAP) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                4. Checkbox Permission Upload Jenis Dokumen Perencanaan
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Centang izin jenis dokumen apa saja yang boleh diunggah oleh akun ini
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_DOCUMENT_PERMISSIONS.map((item) => {
              const isChecked = allowedDocPermissions.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleDocPermission(item.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-center gap-3 ${
                    isChecked
                      ? "bg-blue-50/80 border-blue-300 text-blue-950 font-bold"
                      : "bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4.5 h-4.5 text-blue-700 shrink-0" />
                  ) : (
                    <Square className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs leading-tight">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 5: SPATIE RBAC PERMISSIONS */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  5. Granular Spatie RBAC Permissions
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Hak akses modul portal SPBE
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_SPATIE_PERMISSIONS.map((perm) => {
              const isChecked = selectedPermissions.includes(perm.id);
              return (
                <div
                  key={perm.id}
                  onClick={() => togglePermission(perm.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-start gap-2.5 ${
                    isChecked
                      ? "bg-purple-50/70 border-purple-200 text-purple-950"
                      : "bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-black leading-tight">{perm.label}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{perm.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/users"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan & Buat Pengguna Baru</span>
          </button>
        </div>
      </form>
    </div>
  );
}
