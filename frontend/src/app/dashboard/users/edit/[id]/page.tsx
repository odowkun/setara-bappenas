"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { Role, BidangType, JenisDokumenItem } from "@/types/auth";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { toast } from "@/lib/swal";
import { API_BASE_URL } from "@/lib/apiClient";
import {
  ArrowLeft,
  ArrowRight,
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
  HardHat,
  BarChart3,
  Sprout,
  Building2,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import {
  SPATIE_PERMISSIONS_ORDERED,
  BIDANG_OPTIONS,
  TEMPLATE_PRESET_OPTIONS,
  TemplatePresetOption,
} from "@/constants/permissions";

interface PejabatOption {
  position: string;
  name: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  // Wizard Step State (1: Pilih Template, 2: Isi Formulir)
  // Default ke Langkah 2 karena mengedit akun yang sudah ada
  const [activeStep, setActiveStep] = useState<1 | 2>(2);
  const [selectedPresetId, setSelectedPresetId] = useState<TemplatePresetOption["id"]>("custom");

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
    "Staf Pengelola TI / Portal",
  ]);

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

  // Fetch Pejabat positions and target user details
  useEffect(() => {
    const fetchPejabatData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/pejabat`);
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
      try {
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
          if (targetUser.allowedDocumentPermissions && targetUser.allowedDocumentPermissions.length > 0) {
            setAllowedDocPermissions(targetUser.allowedDocumentPermissions);
            setIsDocCustomized(true);
          }
        } else {
          setErrorMessage("Pengguna dengan ID ini tidak ditemukan!");
        }
      } catch (err) {
        setErrorMessage("Gagal memuat data pengguna.");
      } finally {
        setLoading(false);
      }
    };

    loadTargetUser();
  }, [userId]);

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

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Presets Cepat Sesuai Template Pilihan
  const applyPresetById = (presetId: TemplatePresetOption["id"]) => {
    const preset = TEMPLATE_PRESET_OPTIONS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.id === "custom") {
      setRole("admin_bidang");
      setBidang("infrastruktur");
      setSelectedPermissions([
        "manage_pengumuman",
        "manage_tautan_opd",
        "manage_galeri",
        "manage_dokumen",
        "manage_users",
      ]);
      setIsDocCustomized(false);
      return;
    }

    setRole(preset.role);
    setBidang(preset.bidang);
    setSelectedPermissions(preset.permissions);
    setIsDocCustomized(false);
  };

  // Handler saat klik tombol Lanjut ke Langkah 2
  const handleProceedToStep2 = (targetPresetId?: TemplatePresetOption["id"]) => {
    const presetToApply = targetPresetId || selectedPresetId;
    setSelectedPresetId(presetToApply);
    applyPresetById(presetToApply);
    setActiveStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const preset = TEMPLATE_PRESET_OPTIONS.find((p) => p.id === presetToApply);
    if (preset && preset.id !== "custom") {
      toast.success(`Diterapkan: ${preset.title}`);
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

    if (password) {
      if (
        password.length < 12 ||
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        const msg = "Password baru minimal 12 karakter serta memiliki huruf besar, huruf kecil, dan angka!";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      if (password !== confirmPassword) {
        const msg = "Konfirmasi password tidak cocok dengan password baru!";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
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
        allowedDocumentPermissions: allowedDocPermissions,
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

  const renderPresetIcon = (iconType: string) => {
    switch (iconType) {
      case "ipw":
        return <HardHat className="w-5 h-5 text-amber-600" />;
      case "monev":
        return <BarChart3 className="w-5 h-5 text-indigo-600" />;
      case "ekonomi":
        return <Sprout className="w-5 h-5 text-emerald-600" />;
      case "sosbud":
        return <Users className="w-5 h-5 text-rose-600" />;
      case "sektert":
        return <Building2 className="w-5 h-5 text-sky-600" />;
      case "superadmin":
        return <ShieldAlert className="w-5 h-5 text-purple-600" />;
      default:
        return <Sliders className="w-5 h-5 text-slate-600" />;
    }
  };

  const currentSelectedPreset =
    TEMPLATE_PRESET_OPTIONS.find((p) => p.id === selectedPresetId) || TEMPLATE_PRESET_OPTIONS[0];

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Hanya role <strong>Administrator (SuperAdmin)</strong> yang memiliki wewenang mengedit data &amp; hak akses pengguna.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full space-y-6 font-sans pb-12">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700">Memuat rincian data pengguna...</span>
        </div>
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
              <span>Edit Pengguna &amp; Atribusi Hak Akses</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Sesuaikan data pegawai, bidang Bappeda, matriks hak akses modul portal (1–14), serta izin dokumen perencanaan.
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* 2-STEP WIZARD PROGRESS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Step 1 Button */}
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer ${
            activeStep === 1
              ? "bg-white border-blue-600 shadow-sm ring-2 ring-blue-500/10"
              : "bg-white/70 border-slate-200 hover:bg-white text-slate-600"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
              activeStep === 1
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 font-bold"
            }`}
          >
            {activeStep === 2 ? <Sparkles className="w-4 h-4 text-amber-500" /> : "1"}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pilihan Template</p>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Pilih Profil / Template Penugasan
            </h2>
          </div>
        </button>

        {/* Step 2 Button */}
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer ${
            activeStep === 2
              ? "bg-white border-blue-600 shadow-sm ring-2 ring-blue-500/10"
              : "bg-white/70 border-slate-200 hover:bg-white text-slate-600"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
              activeStep === 2
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-500 font-bold"
            }`}
          >
            2
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Formulir Akun</p>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Kelola Biodata &amp; Rincian Hak Akses
            </h2>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: PEMILIHAN TEMPLATE PENUGASAN (FOKUS UTAMA)                         */}
      {/* ========================================================================= */}
      {activeStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    Pilih Profil Template Penugasan BAPPEDA Halut
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Terapkan template di bawah untuk otomatis mereset peran, bidang, dan 14 modul pengguna ini.
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                7 Opsi Tersedia
              </span>
            </div>

            {/* Grid Kartu Template */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {TEMPLATE_PRESET_OPTIONS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-4 sm:p-5 rounded-2xl border text-left cursor-pointer transition relative flex flex-col justify-between space-y-3 group ${
                      isSelected
                        ? "bg-blue-50/60 border-blue-600 ring-2 ring-blue-500/20 shadow-sm"
                        : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Header Card */}
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          {renderPresetIcon(preset.iconType)}
                        </div>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${preset.badgeBg} ${preset.badgeText}`}
                        >
                          {preset.badge}
                        </span>
                      </div>

                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {preset.category}
                        </p>
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition">
                          {preset.title}
                        </h3>
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    {/* Footer Info of Card */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500 truncate max-w-[170px]">
                        {preset.skPerson}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-700">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            Terpilih
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-slate-600">
                            Pilih Card
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL IKHTISAR PREVIEW TEMPLATE TERPILIH */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Ikhtisar Otomatisasi: {currentSelectedPreset.title}
                  </h3>
                  <p className="text-[11px] text-blue-200/80 font-medium">
                    {currentSelectedPreset.category} • {currentSelectedPreset.skPerson}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-black border border-blue-400/30">
                {currentSelectedPreset.id === "superadmin"
                  ? "Akses Penuh (14 Modul)"
                  : currentSelectedPreset.modules.length > 0
                  ? `${currentSelectedPreset.modules.length} Modul Terpilih`
                  : "Fleksibel (Atur Bebas)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider">Peran &amp; Bidang</span>
                <p className="text-xs font-bold text-white capitalize">
                  {currentSelectedPreset.role.replace("_", " ")} ({currentSelectedPreset.bidang.toUpperCase()})
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 sm:col-span-1 lg:col-span-2">
                <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider">Cakupan Dokumen Unggahan</span>
                <p className="text-xs font-bold text-white truncate">
                  {currentSelectedPreset.docScopeDesc}
                </p>
              </div>
            </div>

            {currentSelectedPreset.modules.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider">
                  Nomor Modul Sesuai SK:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentSelectedPreset.modules.map((num) => {
                    const mod = SPATIE_PERMISSIONS_ORDERED.find((p) => p.no === num);
                    return (
                      <span
                        key={num}
                        className="px-2.5 py-1 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-100 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-blue-300" />
                        <span>Modul {num}: {mod?.label.split(" ")[1] || "Modul"}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTON TERAPKAN TEMPLATE KE FORMULIR */}
          <div className="flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="text-xs font-bold text-slate-700">
                Template terpilih: <span className="text-blue-700 font-black">{currentSelectedPreset.title}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Kembali ke Formulir
              </button>

              <button
                type="button"
                onClick={() => handleProceedToStep2()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <span>Terapkan Template Ini ke Formulir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: FORMULIR DATA PENGGUNA & HAK AKSES                                */}
      {/* ========================================================================= */}
      {activeStep === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
          {/* BANNER TEMPLATE AKTIF */}
          <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/80 border border-blue-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-blue-950">
                    Formulir Hak Akses Pengguna
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-200/60 text-blue-900 border border-blue-300">
                    Langkah 2
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 font-medium">
                  Sesuaikan data pengguna atau terapkan template penugasan untuk mengatur ulang seluruh wewenang secara otomatis.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveStep(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-black transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ganti / Terapkan Template</span>
            </button>
          </div>

          {/* CARD 1: IDENTITAS & JABATAN STRUKTURAL */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                <Users className="w-4 h-4" />
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

          {/* CARD 2: PASSWORD SETUP (OPSIONAL SAAT EDIT) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  2. Pengaturan Password Akun (Opsional)
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Biarkan kosong jika tidak ingin mengganti kata sandi pengguna
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
                    placeholder="Kosongkan jika tidak diubah"
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
                  placeholder="Ulangi jika mengganti password"
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
              <span>Simpan Perubahan Pengguna</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
