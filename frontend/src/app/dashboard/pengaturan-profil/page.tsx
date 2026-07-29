"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User as UserIcon,
  ShieldCheck,
  Key,
  Mail,
  Building2,
  Save,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Briefcase,
  Layers3,
  Calendar,
} from "lucide-react";
import { toast } from "@/lib/swal";

export default function PengaturanProfilPage() {
  const { user, updateProfile } = useAuth();

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [jabatan, setJabatan] = useState(user?.jabatan || "");
  const [nip, setNip] = useState(user?.nip || "");
  const [bidang, setBidang] = useState(user?.bidang || "infrastruktur");

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide Password Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setJabatan(user.jabatan || "");
      setNip(user.nip || "");
      setBidang(user.bidang || "infrastruktur");
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    setTimeout(() => {
      updateProfile({
        name,
        email,
        jabatan,
        nip,
        bidang: user?.role === "admin_bidang" ? bidang : user?.bidang,
      });

      toast.success("Informasi profil Anda berhasil diperbarui!");
      setSavingProfile(false);
    }, 400);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Masukkan kata sandi lama Anda!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal harus 6 karakter!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      toast.success("Kata sandi akun SPBE Anda berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSavingPassword(false);
    }, 400);
  };

  const getRoleDisplayName = () => {
    if (!user) return "";
    switch (user.role) {
      case "superadmin":
        return "Administrator (Super Admin)";
      case "admin_umum":
        return "Admin Umum & Humas";
      case "admin_bidang":
        return `Admin Bidang (${(user.bidang || "").toUpperCase()})`;
      default:
        return user.role;
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Page Title Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
              {getRoleDisplayName()}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Pengaturan Profil &amp; Keamanan Akun</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola data biodata pengguna, kredensial akses SPBE, serta matriks peranan jabatan BAPPEDA Halmahera Utara.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 Cols): Biodata Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center border border-blue-100">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Informasi Biodata &amp; Jabatan</h3>
                <p className="text-[11px] text-slate-500 font-medium">Perbarui informasi identitas diri Anda</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap Beserta Gelar"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Official Kedinasan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@halmaherautarakab.go.id"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Induk Pegawai (NIP)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Contoh: 197204121998031004"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan Struktural / Fungsional
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Kepala BAPPEDA / Kasubag Umum"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              {user?.role === "admin_bidang" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bidang Perencanaan BAPPEDA
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={bidang}
                      onChange={(e) => setBidang(e.target.value as any)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs uppercase cursor-pointer"
                    >
                      <option value="infrastruktur">Bidang Infrastruktur &amp; Pengembangan Wilayah (IPW)</option>
                      <option value="ekonomi">Bidang Perekonomian &amp; SDA</option>
                      <option value="sosial_budaya">Bidang Pemerintahan &amp; Pembangunan Manusia</option>
                      <option value="sekretariat">Sekretariat BAPPEDA</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 font-extrabold text-xs text-white shadow-md shadow-blue-700/25 flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password Security Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 font-bold flex items-center justify-center border border-amber-200">
                <Key className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Ubah Kata Sandi Akses</h3>
                <p className="text-[11px] text-slate-500 font-medium">Perbarui kata sandi login sesi SPBE Anda</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Lama
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 font-extrabold text-xs text-slate-950 shadow-md shadow-amber-500/25 flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>{savingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right (5 Cols): Role & Permissions Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Executive Card Info */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl space-y-4 border border-slate-800 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black flex items-center justify-center text-xl shadow-lg ring-2 ring-blue-400/40 shrink-0">
                {user?.name.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden space-y-0.5">
                <h3 className="text-base font-black text-white truncate leading-snug">{user?.name}</h3>
                <p className="text-xs text-blue-200/80 font-medium truncate">{user?.email}</p>
                <p className="text-[11px] text-slate-400 font-mono">NIP. {user?.nip || "-"}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Hak Akses &amp; Peranan Sistem
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>{getRoleDisplayName()}</span>
              </span>
            </div>
          </div>

          {/* Module Permissions Matrix */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Matriks Hak Akses Modul SPBE
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((pId) => (
                  <div
                    key={pId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 font-bold text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="capitalize">{pId.replace("manage_", "").replace("_", " ")}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-xs leading-relaxed">
                  Akun Anda dikonfigurasi menggunakan standar akses sesuai peran <strong>{getRoleDisplayName()}</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
