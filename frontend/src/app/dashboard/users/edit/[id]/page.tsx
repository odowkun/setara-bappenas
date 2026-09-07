"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { User, Role, BidangType } from "@/types/auth";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { toast } from "@/lib/swal";
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Key,
  CheckSquare,
  Square,
  Users,
} from "lucide-react";

interface PejabatOption {
  position: string;
  name: string;
}

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
  { id: "manage_dashboard", label: "Kelola Statistik Dashboard", desc: "Akses memperbarui data statistik eksekutif" },
  { id: "manage_survey", label: "Kelola Survei Kepuasan", desc: "Akses data responden dan konfigurasi survei" },
  { id: "manage_kritik", label: "Kelola Kritik & Saran", desc: "Akses identitas pengirim dan tanggapan" },
  { id: "view_download_logs", label: "Lihat Riwayat Pengunduh", desc: "Akses email dan metadata unduhan dokumen" },
  { id: "view_audit_logs", label: "Lihat Audit Log SPBE", desc: "Akses aktivitas admin dan alamat IP" },
  { id: "manage_document_types", label: "Kelola Jenis Dokumen", desc: "Akses master kategori dokumen" },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

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

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Dynamic Pejabat Structure Options
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

  // Fetch Pejabat positions and target user details
  useEffect(() => {
    const fetchPejabatData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/pejabat");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const fetchedPositions = json.data
              .map((p: PejabatOption) => p.position)
              .filter(Boolean);
            if (fetchedPositions.length > 0) {
              const combined = Array.from(new Set([...fetchedPositions, ...pejabatPositions]));
              setPejabatPositions(combined);
            }
          }
        }
      } catch (err) {
        console.warn("Menggunakan opsi Jabatan default:", err);
      }
    };

    fetchPejabatData();

    // Load User Data from the protected server endpoint.
    const loadTargetUser = async () => {
      if (!userId) return;
      const allUsers = await adminService.fetchUsers();
      const targetUser = allUsers.find((u) => u.id === userId);

      if (targetUser) {
        setName(targetUser.name);
        setEmail(targetUser.email);
        setRole(targetUser.role);
        setBidang(targetUser.bidang || "infrastruktur");
        setNip(targetUser.nip || "");
        setJabatan(targetUser.jabatan || "");
        setSelectedPermissions(targetUser.permissions || ["manage_dokumen"]);
      } else {
        setErrorMessage("Pengguna dengan ID ini tidak ditemukan!");
      }
      setLoading(false);
    };

    loadTargetUser();
  }, [userId]);

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim()) {
      const msg = "Nama lengkap dan email kedinasan wajib diisi!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (
      password &&
      (
        password.length < 12 ||
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      )
    ) {
      const msg = "Password baru minimal 12 karakter serta memiliki huruf besar, huruf kecil, dan angka!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password && password !== confirmPassword) {
      const msg = "Konfirmasi password baru tidak cocok!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      await adminService.updateUser(userId, {
        name,
        email,
        role,
        bidang: role === "admin_bidang" ? bidang : undefined,
        nip,
        jabatan,
        permissions: selectedPermissions,
        ...(password
          ? { password, passwordConfirmation: confirmPassword }
          : {}),
      });

      toast.success(`Data pengguna ${name} berhasil diperbarui!`);
      setIsSaved(true);
      setTimeout(() => {
        router.push("/dashboard/users");
      }, 1500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memperbarui pengguna.";
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
          Hanya role <strong>Administrator (SuperAdmin)</strong> yang dapat mengedit data pengguna dan hak akses.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 font-bold animate-pulse bg-white rounded-3xl border border-slate-200 max-w-[1400px] mx-auto">
        Memuat data pengguna...
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-[1400px] mx-auto font-sans">
      {/* HEADER CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <UserCheck className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Edit Pengguna & Hak Akses: {name || "Loading..."}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Perbarui identitas kedinasan, reset password, serta matriks hak akses Spatie RBAC.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Perubahan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* FORM EDIT SINGLE PAGE */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CARD 1: IDENTITAS & JABATAN STRUKTURAL */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                1. Informasi Identitas Kedinasan & Jabatan
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Data pegawai/pejabat pengelola portal BAPPEDA Halmahera Utara
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
                placeholder="Contoh: Dra. Maria N. Tobing, M.Si"
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
                placeholder="nama@halmaherautarakab.go.id"
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
                placeholder="198509152009022003"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* DYNAMIC JABATAN STRUKTURAL FROM STRUCTURE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Jabatan Struktural BAPPEDA *</span>
                <span className="text-[10px] text-blue-600 font-bold">(Dari Struktur Organisasi)</span>
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

        {/* CARD 2: RESET / CHANGE PASSWORD */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                2. Reset / Ubah Password Akun Pengguna (Opsional)
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Biarkan kolom ini kosong jika tidak ingin mengubah password saat ini
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password Baru (Opsional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ketik password baru jika ingin mereset..."
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
                Ulangi Konfirmasi Password Baru
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Pastikan sama dengan password baru"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: ROLE & SPATIE PERMISSIONS */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                3. Konfigurasi Role & Matriks Permissions Spatie (RBAC)
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Atur role utama serta centang hak akses terperinci untuk tiap fitur portal
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Role Pengguna (Spatie Main Role)
                </label>
                <SearchableSelect
                options={[
                  { value: "admin_bidang", label: "Admin Bidang (Dokumen Renstra & Bidang Spesifik)" },
                  { value: "admin_umum", label: "Admin Umum & Humas (Berita, Pengumuman, Galeri & Public)" },
                  { value: "superadmin", label: "Administrator (SuperAdmin Full System Access)" },
                ]}
                value={role}
                onChange={(val) => setRole(String(val) as Role)}
                placeholder="-- Pilih Role Pengguna --"
                searchPlaceholder="Cari role..."
              />
              </div>

              {/* DYNAMIC SUB-BIDANG SELECT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Scope Sub-Bidang BAPPEDA</span>
                  <span className="text-[10px] text-blue-600 font-bold">(Dari Struktur Unit)</span>
                </label>
                <SearchableSelect
                  options={[
                    { value: "infrastruktur", label: "Bidang Infrastruktur & Pengembangan Wilayah (IPW)" },
                    { value: "perekonomian", label: "Bidang Perekonomian & SDA" },
                    { value: "sosbud", label: "Bidang Pembangunan Manusia & Masyarakat (Sosbud)" },
                    { value: "renval", label: "Bidang Perencanaan, Pengendalian & Evaluasi (Renval)" },
                    { value: "semua", label: "Sekretariat BAPPEDA (Semua Bidang)" },
                  ]}
                  value={bidang}
                  onChange={(val) => setBidang(String(val) as BidangType)}
                  placeholder="-- Pilih Scope Bidang --"
                  searchPlaceholder="Cari bidang..."
                  disabled={role === "superadmin"}
                />
              </div>
            </div>

            {/* SPATIE GRANULAR PERMISSIONS MATRIX */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>Rincian Hak Akses Modul (Spatie Granular Permissions):</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_SPATIE_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-start gap-2.5 ${
                        isChecked
                          ? "bg-blue-50/70 border-blue-200 text-blue-950"
                          : "bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
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
            <span>Simpan Perubahan User</span>
          </button>
        </div>
      </form>
    </div>
  );
}
