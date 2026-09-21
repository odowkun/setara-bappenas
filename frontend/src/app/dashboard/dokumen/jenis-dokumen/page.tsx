"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";
import { JenisDokumenItem } from "@/types/auth";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  FolderPlus,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  FileText,
  Search,
  Tag,
  UserCheck,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";

export default function ManajemenJenisDokumenPage() {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [jenisList, setJenisList] = useState<JenisDokumenItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("semua");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [scopeRole, setScopeRole] = useState<'admin_umum' | 'admin_bidang' | 'semua'>("semua");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch real list from Laravel Backend API
  useEffect(() => {
    const fetchJenisList = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jenis-dokumen`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setJenisList(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        console.error("Jenis dokumen resmi gagal dimuat:", err);
        setJenisList([]);
      }
    };

    fetchJenisList();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedCode = code.trim()
      ? code.toLowerCase().replace(/[^a-z0-9]/g, "_")
      : name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    try {
      const response = await authenticatedFetch("/jenis-dokumen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: generatedCode,
          scope_role: scopeRole,
        }),
      });
      if (!response.ok) throw new Error(`Server menolak jenis dokumen (${response.status}).`);
      const json = await response.json();
      setJenisList((prev) => [...prev, json.data]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Jenis dokumen gagal disimpan.");
      return;
    }

    setName("");
    setCode("");
    setIsModalOpen(false);
    setSuccessMessage(`Jenis dokumen "${name}" berhasil ditambahkan ke database!`);

    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleDelete = async (id: number | string, itemName: string) => {
    const res = await showDeleteConfirm(itemName);
    if (!res.isConfirmed) return;

    try {
      const response = await authenticatedFetch(`/jenis-dokumen/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Server menolak penghapusan (${response.status}).`);
      setJenisList((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Jenis dokumen "${itemName}" berhasil dihapus dari database!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Jenis dokumen gagal dihapus.");
    }
  };

  const filteredItems = jenisList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "semua" || item.scope_role === filterRole || item.scope_role === "semua";
    return matchesSearch && matchesRole;
  });

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas - Administrator Only</h2>
        <p className="text-xs text-slate-600 font-medium">
          Hanya role <strong>Administrator / SuperAdmin</strong> yang memiliki wewenang untuk mengelola jenis dan kategori dokumen perencanaan Bappeda.
        </p>
        <Link
          href="/dashboard/dokumen"
          className="inline-block px-5 py-2.5 rounded-2xl bg-blue-700 text-white font-extrabold text-xs shadow-md"
        >
          Kembali ke Dokumen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* HEADER SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
              <FolderPlus className="w-3.5 h-3.5" />
              Administrator Management
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderPlus className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Manajemen Jenis Dokumen Perencanaan</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Kelola kategori resmi dokumen kebijakan Bappeda di database. Seluruh jenis dokumen yang terdaftar di sini disiapkan oleh SuperAdmin untuk dipilih oleh Admin Umum dan Admin Bidang.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jenis Dokumen Baru</span>
        </button>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jenis dokumen atau kode..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-700"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Scope Role:</span>
          <div className="w-full sm:w-64">
            <SearchableSelect
              options={[
                { value: "semua", label: "Semua Role" },
                { value: "admin_umum", label: "Admin Umum" },
                { value: "admin_bidang", label: "Admin Bidang" },
              ]}
              value={filterRole}
              onChange={(val) => setFilterRole(String(val))}
              placeholder="-- Pilih Role --"
              searchPlaceholder="Cari role..."
            />
          </div>
        </div>
      </div>

      {/* TABLE LIST JENIS DOKUMEN */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-black text-slate-900">
              Daftar Kategori dan Jenis Dokumen Database
            </h2>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 font-mono w-fit">
            Total: {filteredItems.length} Jenis Dokumen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Jenis Dokumen</th>
                <th className="py-3 px-4">Kode Unik System</th>
                <th className="py-3 px-4">Scope Izin Role Pengunggah</th>
                <th className="py-3 px-4">Pembuat Dokumen</th>
                <th className="py-3 px-4 text-right">Aksi SuperAdmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ditemukan jenis dokumen sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                        <span className="font-extrabold text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <code className="px-2 py-1 rounded-md bg-slate-100 text-blue-900 font-mono text-[11px] border border-slate-200">
                        {item.code}
                      </code>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.scope_role === "admin_umum" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Admin Umum
                        </span>
                      ) : item.scope_role === "admin_bidang" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Admin Bidang
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          Semua Role
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-extrabold border border-slate-200 text-[11px]">
                        <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                        <span>{item.created_by || "SuperAdmin"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] transition inline-flex items-center gap-1.5"
                        title="Hapus Jenis Dokumen"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH JENIS DOKUMEN BARU (RENDERED WITH REACT PORTAL TO BODY DIRECTLY) */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto w-screen h-screen">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100 my-auto relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900">
                  SUPERADMIN ONLY
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">Tambah Jenis Dokumen Master Baru</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Jenis Dokumen Resmi *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dokumen Kajian Lingkungan Hidup Strategis - KLHS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kode Unik Sistem (Opsional)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="klhs_dokumen (Otomatis jika kosong)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Scope Izin Peran Pengunggah Dokumen *</label>
                <SearchableSelect
                  options={[
                    { value: "semua", label: "Semua Role" },
                    { value: "admin_umum", label: "Admin Umum" },
                    { value: "admin_bidang", label: "Admin Bidang" },
                  ]}
                  value={scopeRole}
                  onChange={(val) => setScopeRole(val as any)}
                  placeholder="-- Pilih Scope Role --"
                  searchPlaceholder="Cari scope role..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-black hover:bg-blue-800 shadow-md shadow-blue-700/20 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
