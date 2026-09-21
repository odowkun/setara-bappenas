"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { User, Role, BidangType } from "@/types/auth";
import {
  UserPlus,
  Trash2,
  Lock,
  Search,
  Users,
  Edit,
  Key,
  ShieldCheck,
  CheckCircle2,
  X,
  Save,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";

const ALL_SPATIE_PERMISSIONS = [
  { id: "manage_profil", label: "Kelola Profil & Kelembagaan BAPPEDA" },
  { id: "manage_berita", label: "Kelola Berita & Artikel Humas" },
  { id: "manage_pengumuman", label: "Kelola Pengumuman Resmi & Edaran" },
  { id: "manage_galeri", label: "Kelola Galeri Foto & Video Kegiatan" },
  { id: "manage_tautan_opd", label: "Kelola Tautan OPD & Aplikasi Daerah" },
  { id: "manage_dokumen", label: "Kelola Repository Dokumen Perencanaan" },
  { id: "manage_gis", label: "Kelola Editor Peta Spasial GIS" },
  { id: "manage_users", label: "Kelola Pengguna & Hak Akses (SuperAdmin)" },
  { id: "manage_dashboard", label: "Kelola Statistik Dashboard" },
  { id: "manage_survey", label: "Kelola Survei Kepuasan" },
  { id: "manage_kritik", label: "Kelola Kritik & Saran" },
  { id: "view_download_logs", label: "Lihat Riwayat Pengunduh" },
  { id: "view_audit_logs", label: "Lihat Audit Log SPBE" },
  { id: "manage_document_types", label: "Kelola Jenis Dokumen" },
];

export default function UserManagementPage() {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const isSuperAdmin = hasRole(["superadmin"]);
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});

  const [successMsg, setSuccessMsg] = useState("");

  const refreshUsers = () => {
    adminService.fetchUsers().then((res) => {
      setUsers(res || []);
    });
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const toggleExpandUser = (userId: string) => {
    setExpandedUserIds((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const renderPermissionsSummary = (u: User, isMobile = false) => {
    const isSuper = u.role === "superadmin";
    const isExpanded = Boolean(expandedUserIds[u.id]);

    if (isSuper) {
      return (
        <div className={`flex flex-col gap-1 ${isMobile ? "items-end" : "items-start"}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              Akses Penuh Seluruh Modul
            </span>
            {u.permissions && u.permissions.length > 0 && (
              <button
                type="button"
                onClick={() => toggleExpandUser(u.id)}
                className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition"
              >
                {isExpanded ? "Tutup Detail" : `Detail (${u.permissions.length})`}
              </button>
            )}
          </div>
          {isExpanded && u.permissions && (
            <div
              className={`flex flex-wrap gap-1 mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200/80 animate-in fade-in max-w-sm ${
                isMobile ? "justify-end" : "justify-start"
              }`}
            >
              {u.permissions.map((pId) => (
                <span
                  key={pId}
                  className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-white text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap"
                >
                  {pId.replace("manage_", "")}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!u.permissions || u.permissions.length === 0) {
      return (
        <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
          Standard Role Access
        </span>
      );
    }

    const limit = 3;
    const displayed = isExpanded ? u.permissions : u.permissions.slice(0, limit);
    const remaining = u.permissions.length - limit;

    return (
      <div
        className={`flex flex-wrap items-center gap-1 max-w-md ${
          isMobile ? "justify-end" : "justify-start"
        }`}
      >
        {displayed.map((pId) => (
          <span
            key={pId}
            className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200/80 whitespace-nowrap shadow-2xs"
          >
            {pId.replace("manage_", "")}
          </span>
        ))}
        {u.permissions.length > limit && (
          <button
            type="button"
            onClick={() => toggleExpandUser(u.id)}
            className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition cursor-pointer whitespace-nowrap"
          >
            {isExpanded ? "Tutup" : `+${remaining} lainnya`}
          </button>
        )}
      </div>
    );
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (id === currentUser?.id) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!");
      return;
    }
    const res = await showDeleteConfirm(userName);
    if (res.isConfirmed) {
      const deleted = await adminService.deleteUser(id);
      if (deleted) {
        refreshUsers();
        toast.success(`Akun pengelola ${userName} berhasil dihapus!`);
      } else {
        toast.error("Akun gagal dihapus. Akun aktif atau Super Admin terakhir dilindungi.");
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.jabatan && u.jabatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Modul Manajemen Pengguna & Hak Akses SPBE hanya dapat dibuka oleh role <strong>Administrator (SuperAdmin)</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Manajemen Pengguna SPBE &amp; Spatie Hak Akses</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Daftar pengelola portal resmi BAPPEDA Halmahera Utara beserta atribusi role &amp; matriks permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/users/tambah"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEARCH BAR CARD */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, email, NIP, atau jabatan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
          />
        </div>
      </div>

      {/* USER LIST TABLE (DESKTOP & TABLET) + MOBILE CARDS */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto min-w-full">
          <table className="w-full text-left text-xs align-middle">
            <thead className="bg-slate-50/80 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Pengguna &amp; Jabatan Struktural</th>
                <th className="px-6 py-4 whitespace-nowrap">Email Official</th>
                <th className="px-6 py-4 whitespace-nowrap">Role Spatie</th>
                <th className="px-6 py-4 whitespace-nowrap">Hak Akses Modul</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white font-black flex items-center justify-center shrink-0 shadow-xs text-sm">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.id === currentUser?.id && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                              (Anda)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-semibold mt-0.5">{u.jabatan || "Staff Bappeda"}</p>
                        {u.nip && <p className="text-[10px] text-slate-400 font-mono">NIP. {u.nip}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-mono font-bold text-xs">{u.email}</td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.role === "superadmin" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs whitespace-nowrap">
                        👑 Administrator (SuperAdmin)
                      </span>
                    )}
                    {u.role === "admin_umum" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs whitespace-nowrap">
                        📰 Admin Umum &amp; Humas
                      </span>
                    )}
                    {u.role === "admin_bidang" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs whitespace-nowrap">
                        🏗️ Admin Bidang ({u.bidang?.toUpperCase() || "IPW"})
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 max-w-md">
                    {renderPermissionsSummary(u)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/users/edit/${u.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-extrabold text-xs transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={u.id === currentUser?.id}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          u.id === currentUser?.id
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                            : "bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200"
                        }`}
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredUsers.map((u) => (
            <div key={u.id} className="p-4 space-y-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white font-black flex items-center justify-center text-sm shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.id === currentUser?.id && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                          (Anda)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold">{u.jabatan || "Staff Bappeda"}</p>
                    {u.nip && <p className="text-[10px] text-slate-400 font-mono">NIP. {u.nip}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/dashboard/users/edit/${u.id}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    disabled={u.id === currentUser?.id}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-600 font-bold text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-bold">Email:</span>
                  <span className="font-mono font-bold text-slate-800">{u.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Role:</span>
                  {u.role === "superadmin" && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                      👑 SuperAdmin
                    </span>
                  )}
                  {u.role === "admin_umum" && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                      📰 Admin Umum
                    </span>
                  )}
                  {u.role === "admin_bidang" && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      🏗️ {u.bidang?.toUpperCase() || "IPW"}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-400 font-bold shrink-0">Hak Akses:</span>
                  <div className="flex-1">
                    {renderPermissionsSummary(u, true)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
