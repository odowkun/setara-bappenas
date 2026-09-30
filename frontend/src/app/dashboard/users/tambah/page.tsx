"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { Role, BidangType, JenisDokumenItem } from "@/types/auth";
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
  Key,
  CheckSquare,
  Square,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Check,
} from "lucide-react";

import { SPATIE_PERMISSIONS_ORDERED, BIDANG_OPTIONS } from "@/constants/permissions";

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

  // Master Dokumen dari Database
  const [allDocTypes, setAllDocTypes] = useState<JenisDokumenItem[]>([]);
  const [allowedDocPermissions, setAllowedDocPermissions] = useState<string[]>([]);
  const [isDocCustomized, setIsDocCustomized] = useState(false);
  const [isDocSectionOpen, setIsDocSectionOpen] = useState(true);

  // Spatie Permissions State
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "manage_pengumuman",
    "manage_tautan_opd",
    "manage_galeri",
    "manage_dokumen",
    "manage_users",
  ]);

  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pejabatPositions = [
    "Kepala BAPPEDA (Administrator)",
    "Sekretaris BAPPEDA",
    "Kasubag Umum & Kepegawaian",
    "Kabid Infrastruktur & Pengembangan Wilayah (IPW)",
    "Kabid Perekonomian & SDA",
    "Kabid Pembangunan Manusia & Masyarakat (Sosbud)",
    "Kabid Perencanaan, Pengendalian & Evaluasi (Renval)",
    "Pejabat Fungsional Perencana Ahli",
    "Staf Pengelola TI / Portal",
  ];

  // Muat master jenis dokumen dari database
  useEffect(() => {
    adminService
      .fetchJenisDokumenItems()
      .then((docs) => {
        setAllDocTypes(docs || []);
      })
      .catch((err) => {
        console.warn("Gagal memuat jenis dokumen master:", err);
      });
  }, []);

  // Hitung izin dokumen default otomatis berdasarkan role dan bidang
  const computeDefaultDocPermissions = (currentRole: Role, currentBidang: BidangType, docs: JenisDokumenItem[]): string[] => {
    if (currentRole === "superadmin") {
      return docs.map((d) => d.code);
    }
    if (currentRole === "admin_umum" || currentBidang === "semua") {
      return docs
        .filter((d) => ["semua", "admin_umum", "sektert", "renval"].includes(d.scope_role))
        .map((d) => d.code);
    }
    // admin_bidang: dokumen bersama ('semua', 'admin_bidang') + dokumen spesifik bidangnya
    return docs
      .filter((d) => ["semua", "admin_bidang", currentBidang].includes(d.scope_role))
      .map((d) => d.code);
  };

  // Sinkronisasi dokumen otomatis saat role atau bidang berubah (jika belum di-override manual)
  useEffect(() => {
    if (!isDocCustomized && allDocTypes.length > 0) {
      const defaults = computeDefaultDocPermissions(role, bidang, allDocTypes);
      setAllowedDocPermissions(defaults);
    }
  }, [role, bidang, allDocTypes, isDocCustomized]);

  // Handler toggle izin jenis dokumen
  const toggleDocPermission = (docCode: string) => {
    setIsDocCustomized(true);
    setAllowedDocPermissions((prev) =>
      prev.includes(docCode) ? prev.filter((c) => c !== docCode) : [...prev, docCode]
    );
  };

  // Reset ke default dokumen bidang
  const handleResetDocDefaults = () => {
    const defaults = computeDefaultDocPermissions(role, bidang, allDocTypes);
    setAllowedDocPermissions(defaults);
    setIsDocCustomized(false);
    toast.success("Izin jenis dokumen dikembalikan ke standar bawaan bidang!");
  };

  // Toggle permission Spatie
  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Presets Cepat Sesuai Tabel SK Penugasan BAPPEDA Halut
  const applyPreset = (presetType: "ipw" | "sektert" | "monev" | "ekonomi" | "sosbud" | "superadmin" | "clear") => {
    switch (presetType) {
      case "ipw": // Nofrendy: 2, 3, 8, 9, 10
        setRole("admin_bidang");
        setBidang("infrastruktur");
        setSelectedPermissions(["manage_pengumuman", "manage_tautan_opd", "manage_galeri", "manage_dokumen", "manage_users"]);
        setIsDocCustomized(false);
        toast.success("Diterapkan: Template Hak Akses Bidang IPW (2, 3, 8, 9, 10)");
        break;
      case "sektert": // Hjon: 2, 3, 8, 9, 10, 12
        setRole("admin_umum");
        setBidang("semua");
        setSelectedPermissions(["manage_pengumuman", "manage_tautan_opd", "manage_galeri", "manage_dokumen", "manage_users", "view_download_logs"]);
        setIsDocCustomized(false);
        toast.success("Diterapkan: Template Hak Akses Sekretariat (2, 3, 8, 9, 10, 12)");
        break;
      case "monev": // Christian: 2, 3, 4, 8, 9, 10
        setRole("admin_bidang");
        setBidang("renval");
        setSelectedPermissions(["manage_pengumuman", "manage_tautan_opd", "manage_gis", "manage_galeri", "manage_dokumen", "manage_users"]);
        setIsDocCustomized(false);
        toast.success("Diterapkan: Template Hak Akses Bidang Monev / Renval (2, 3, 4, 8, 9, 10)");
        break;
      case "ekonomi": // Gregoryan: 2, 3, 8, 9, 10
        setRole("admin_bidang");
        setBidang("perekonomian");
        setSelectedPermissions(["manage_pengumuman", "manage_tautan_opd", "manage_galeri", "manage_dokumen", "manage_users"]);
        setIsDocCustomized(false);
        toast.success("Diterapkan: Template Hak Akses Bidang Ekonomi (2, 3, 8, 9, 10)");
        break;
      case "sosbud": // Vinchadros: 1, 7, 11, 13, 14
        setRole("admin_bidang");
        setBidang("sosbud");
        setSelectedPermissions(["manage_profil", "manage_berita", "manage_survey", "manage_document_types", "manage_kritik"]);
        setIsDocCustomized(false);
        toast.success("Diterapkan: Template Hak Akses Bidang Sosbud (1, 7, 11, 13, 14)");
        break;
      case "superadmin":
        setRole("superadmin");
        setBidang("semua");
        setSelectedPermissions(SPATIE_PERMISSIONS_ORDERED.map((p) => p.id));
        setIsDocCustomized(false);
        toast.success("Diterapkan: Template Administrator / SuperAdmin (Semua Hak Akses 1–14)");
        break;
      case "clear":
        setSelectedPermissions([]);
        toast.success("Seluruh pilihan hak akses modul dikosongkan");
        break;
    }
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
              <span>Tambah Pengguna Pengelola Baru</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Daftarkan akun kedinasan, atur bidang Bappeda, matriks hak akses modul portal (1–14), serta izin dokumen perencanaan.
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

      {/* QUICK TEMPLATE PRESET BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-black text-slate-900">
              Template Cepat Sesuai SK Penugasan BAPPEDA Halut
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Klik salah satu tombol untuk mengisi profil role, bidang &amp; hak akses modul secara otomatis
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => applyPreset("ipw")}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🏗️ Template IPW</span>
            <span className="text-[10px] opacity-75 font-mono">(2, 3, 8, 9, 10)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("sektert")}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🏛️ Template Sektert</span>
            <span className="text-[10px] opacity-75 font-mono">(2, 3, 8, 9, 10, 12)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("monev")}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>📊 Template Monev / Renval</span>
            <span className="text-[10px] opacity-75 font-mono">(2, 3, 4, 8, 9, 10)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("ekonomi")}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🌾 Template Ekonomi</span>
            <span className="text-[10px] opacity-75 font-mono">(2, 3, 8, 9, 10)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("sosbud")}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🤝 Template Sosbud</span>
            <span className="text-[10px] opacity-75 font-mono">(1, 7, 11, 13, 14)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("superadmin")}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-600 hover:text-white border border-amber-200 text-amber-900 text-xs font-black transition shadow-2xs cursor-pointer flex items-center gap-1.5 ml-auto"
          >
            <span>👑 SuperAdmin (1–14)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("clear")}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
            title="Kosongkan Pilihan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
                1. Informasi Identitas Kedinasan &amp; Jabatan
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Data resmi pegawai/pejabat pengelola portal BAPPEDA Halmahera Utara
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Nofrendy Johanis Utubulang, ST"
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
                placeholder="nofrendy@halmaherautarakab.go.id"
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
                Tentukan kata sandi awal untuk autentikasi login (minimal 12 karakter, huruf besar, kecil, angka)
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
                  placeholder="Minimal 12 karakter"
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
                placeholder="Pastikan sama dengan password di samping"
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
                3. Peran Pengguna &amp; Penugasan Bidang BAPPEDA
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Pilih role kedinasan dan bidang kerja yang menjadi tanggung jawab utama pegawai
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
                  { value: "admin_bidang", label: "Admin Bidang (IPW, Sosbud, Ekonomi, Monev)" },
                  { value: "admin_umum", label: "Admin Umum (Sekretariat & Publikasi Portal)" },
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
                options={BIDANG_OPTIONS}
                value={bidang}
                onChange={(val) => setBidang(String(val) as BidangType)}
                placeholder="-- Pilih Scope Bidang --"
                searchPlaceholder="Cari bidang..."
                disabled={role === "superadmin"}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: HAK AKSES UPLOAD DOKUMEN PERENCANAAN */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  4. Hak Akses Upload Dokumen Perencanaan
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {role === "superadmin"
                    ? "Akun SuperAdmin berhak mengunggah seluruh jenis dokumen perencanaan lintas bidang."
                    : `Sistem otomatis memberikan hak dokumen bersama (Renstra, Renja, Data Sektoral) + dokumen spesifik ${bidang.toUpperCase()}.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDocSectionOpen(!isDocSectionOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isDocSectionOpen ? "Tutup Penyesuaian" : "Sesuaikan Jenis Dokumen"}</span>
              {isDocSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Ringkasan Status Dokumen */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-blue-950">
                {allowedDocPermissions.length} Jenis Dokumen Aktif
              </span>
              <span className="text-[11px] text-blue-700">
                {isDocCustomized ? "(Telah dikustomisasi khusus)" : "(Standar otomatis sesuai bidang)"}
              </span>
            </div>

            {isDocCustomized && (
              <button
                type="button"
                onClick={handleResetDocDefaults}
                className="text-[11px] font-black text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Standar Bidang</span>
              </button>
            )}
          </div>

          {/* Checklist Dokumen (Bisa dibuka/ditutup) */}
          {isDocSectionOpen && (
            <div className="space-y-3 pt-1 animate-in fade-in">
              <p className="text-[11px] text-slate-500 font-medium">
                Centang atau lepas jenis dokumen jika akun ini memerlukan wewenang upload khusus di luar standar bidang:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {allDocTypes.map((item) => {
                  const isChecked = allowedDocPermissions.includes(item.code);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleDocPermission(item.code)}
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
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-tight font-black">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] font-mono text-slate-500 uppercase">{item.code}</code>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            Scope: {item.scope_role}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CARD 5: MATRIKS HAK AKSES MODUL (1–14 SESUAI TABEL RESMI) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  5. Granular Spatie RBAC Permissions (Nomor 1 s/d 14)
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Centang modul yang ditugaskan ke pegawai ini (sesuai nomor tabel resmi BAPPEDA)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                {selectedPermissions.length} dari 14 Modul Aktif
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SPATIE_PERMISSIONS_ORDERED.map((perm) => {
              const isChecked = selectedPermissions.includes(perm.id);
              return (
                <div
                  key={perm.id}
                  onClick={() => togglePermission(perm.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-start gap-3 ${
                    isChecked
                      ? "bg-purple-50/70 border-purple-300 text-purple-950 shadow-2xs"
                      : "bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-mono text-[10px] font-black flex items-center justify-center">
                      {perm.no}
                    </span>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-purple-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
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
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/users"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center justify-center flex items-center"
          >
            Batal
          </Link>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan &amp; Buat Pengguna Baru</span>
          </button>
        </div>
      </form>
    </div>
  );
}
