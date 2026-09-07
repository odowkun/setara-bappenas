"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch } from "@/lib/apiClient";
import { StrukturOrganisasiChart, OrgNode } from "@/components/ui/StrukturOrganisasiChart";
import {
  Plus,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  Network,
  UserCheck,
  Building2,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";

interface OfficialItem {
  id: number;
  node_id: string;
  parent_id: string | null;
  name: string;
  position: string;
  nip: string;
  avatar?: string;
}

interface HierarchicalTreeItem {
  item: OfficialItem;
  depth: number;
}

export default function StrukturEditorPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  const [treeData, setTreeData] = useState<OrgNode | undefined>(undefined);
  const [officials, setOfficials] = useState<OfficialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active Management Tab: "step1-structure" vs "step2-pejabat"
  const [mgmtTab, setMgmtTab] = useState<"step1-structure" | "step2-pejabat">("step1-structure");

  // Modal State for Quick Add Position
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalPositionName, setModalPositionName] = useState("");
  const [modalParentId, setModalParentId] = useState("");
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [addingPosition, setAddingPosition] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch pejabat structure directly from Laravel API Database
  const fetchPejabatData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/pejabat");
      if (res.ok) {
        const json = await res.json();
        setTreeData(json.data.tree);
        setOfficials(json.data.flat);
      }
    } catch (err) {
      console.error("Gagal memuat data pejabat dari database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPejabatData();
  }, []);

  // Handle Quick Add Position via Modal Popup
  const handleAddPositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPositionName.trim()) return;

    setAddingPosition(true);
    setModalError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await authenticatedFetch("http://localhost:8000/api/v1/pejabat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          position: modalPositionName,
          parent_id: modalParentId || null,
          name: "(Belum Ditentukan)",
          nip: "",
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setShowAddModal(false);
        setModalPositionName("");
        setModalParentId("");
        setParentDropdownOpen(false);
        setSaved(true);
        toast.success(`Posisi "${modalPositionName}" berhasil ditambahkan ke struktur!`);
        await fetchPejabatData();
        setTimeout(() => setSaved(false), 3500);
      } else {
        const errMsg = json.message || "Gagal menyimpan posisi jabatan. Pastikan Anda telah login sebagai SuperAdmin.";
        setModalError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      console.error("Gagal menambahkan posisi jabatan:", err);
      const errMsg = "Terjadi kesalahan jaringan/server. Silakan coba lagi.";
      setModalError(errMsg);
      toast.error(errMsg);
    } finally {
      setAddingPosition(false);
    }
  };

  // Ordered Hierarchical Tree Items for clean List view (Root -> Children -> Subchildren)
  const hierarchicalTreeList = useMemo<HierarchicalTreeItem[]>(() => {
    if (!officials.length) return [];

    const map = new Map<string, OfficialItem & { children: any[] }>();
    officials.forEach((item) => {
      map.set(item.node_id, { ...item, children: [] });
    });

    const roots: (OfficialItem & { children: any[] })[] = [];
    map.forEach((item) => {
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children.push(item);
      } else {
        roots.push(item);
      }
    });

    const list: HierarchicalTreeItem[] = [];
    const traverse = (node: any, depth = 0) => {
      list.push({ item: node, depth });
      if (node.children) {
        node.children.forEach((c: any) => traverse(c, depth + 1));
      }
    };

    roots.forEach((r) => traverse(r, 0));
    return list;
  }, [officials]);

  // Delete Position Node
  const handleDeletePosition = async (id: number, position: string) => {
    const confirmRes = await showDeleteConfirm(position);
    if (!confirmRes.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await authenticatedFetch(`http://localhost:8000/api/v1/pejabat/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.ok) {
        setSaved(true);
        toast.success(`Jabatan "${position}" berhasil dihapus dari struktur!`);
        await fetchPejabatData();
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(`Gagal menghapus jabatan "${position}".`);
      }
    } catch (err) {
      console.error("Gagal menghapus posisi:", err);
      toast.error("Terjadi kesalahan koneksi saat menghapus posisi!");
    }
  };

  // Helper for initials or avatar image
  const getInitials = (name: string) => {
    if (!name || name === "(Belum Ditentukan)") return "?";
    return name
      .replace(/^(Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s+/gi, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Pengeditan Struktur Organisasi hanya dapat dilakukan oleh role **Administrator (SuperAdmin)**.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-[1400px] mx-auto font-sans">
      {/* HEADER CARD (FLUID & COMPACT PADDING) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Kelola Struktur Organisasi BAPPEDA ({officials.length} Posisi)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Proses terpisah: Buat hirarki posisi terlebih dahulu via popup, lalu penugasan pejabat pada daftar di bawah.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Perubahan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {/* 1. MAIN CARD SECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">

        {/* Tab Selector: Step 1 vs Step 2 */}
        <div className="flex rounded-2xl bg-slate-100 p-1.5 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setMgmtTab("step1-structure")}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition ${
              mgmtTab === "step1-structure"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Langkah 1 — Susun Daftar Posisi Jabatan</span>
          </button>

          <button
            type="button"
            onClick={() => setMgmtTab("step2-pejabat")}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition ${
              mgmtTab === "step2-pejabat"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Langkah 2 — Penugasan Pejabat & NIP ({officials.filter((o) => o.name && o.name !== "(Belum Ditentukan)").length}/{officials.length} Terisi)</span>
          </button>
        </div>

        {/* TAB 1: Step 1 — Clean Hierarchical List of Positions */}
        {mgmtTab === "step1-structure" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900 font-medium">
              <div>
                <p className="font-extrabold text-blue-950">🏛️ Daftar Hirarki Posisi Jabatan</p>
                <p className="mt-0.5 text-blue-800">
                  Susunan posisi jabatan ditampilkan secara berurutan sesuai cabang atasan dan bawahannya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setShowAddModal(true);
                }}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition shrink-0 ml-4"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Posisi Jabatan</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold animate-pulse">
                Memuat hirarki posisi dari database...
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                {hierarchicalTreeList.map(({ item, depth }) => {
                  const isAssigned = item.name && item.name !== "(Belum Ditentukan)";
                  const parentItem = officials.find((o) => o.node_id === item.parent_id);

                  return (
                    <div
                      key={item.id}
                      style={{ paddingLeft: `${Math.max(16, depth * 32 + 16)}px` }}
                      className="py-4 pr-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {depth > 0 && (
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        )}

                        {/* Avatar Image or Initials */}
                        {item.avatar ? (
                          <img
                            src={item.avatar.startsWith("http") ? item.avatar : `http://localhost:8000${item.avatar}`}
                            alt={item.position}
                            className="w-10 h-10 rounded-2xl object-cover border border-blue-300 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm border border-blue-200">
                            {getInitials(item.position)}
                          </div>
                        )}

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                              {item.position}
                            </h4>
                            {depth === 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-900 text-[10px] font-extrabold">
                                Root (Pimpinan Utama)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                                Atasan: {parentItem?.position || item.parent_id}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                            {isAssigned ? (
                              <span className="text-blue-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Pejabat: {item.name}</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold">
                                ⚠️ Belum Ada Pejabat (Vacant)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/profil/struktur/edit/${item.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center gap-1 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Posisi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(item.id, item.position)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Step 2 — Clean Hierarchical List of Official Persons & NIP */}
        {mgmtTab === "step2-pejabat" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-950 font-medium">
              <p className="font-extrabold text-blue-950">👤 Daftar Penugasan Pejabat Struktural & NIP</p>
              <p className="mt-0.5 text-blue-800">
                Tampilan daftar bertingkat pejabat struktural berdasarkan hirarki jabatannya. Klik tombol tugaskan untuk mengisi nama, NIP, dan foto resmi.
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold animate-pulse">
                Memuat daftar pejabat dari database...
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                {hierarchicalTreeList.map(({ item, depth }) => {
                  const isAssigned = item.name && item.name !== "(Belum Ditentukan)";

                  return (
                    <div
                      key={item.id}
                      style={{ paddingLeft: `${Math.max(16, depth * 32 + 16)}px` }}
                      className={`py-4 pr-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        isAssigned ? "hover:bg-slate-50/80" : "bg-slate-50/60 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {depth > 0 && (
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        )}

                        {/* Avatar Image or Initials Circle */}
                        {item.avatar ? (
                          <img
                            src={item.avatar.startsWith("http") ? item.avatar : `http://localhost:8000${item.avatar}`}
                            alt={item.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-blue-300 shadow-sm shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 shadow-sm border ${
                              isAssigned
                                ? "bg-blue-100 border-blue-300 text-blue-800"
                                : "bg-slate-100 border-slate-300 text-slate-700"
                            }`}
                          >
                            {getInitials(item.name)}
                          </div>
                        )}

                        {/* Position & Name */}
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                            {isAssigned ? item.name : "(Belum Ditentukan / Vacant)"}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold text-blue-700">
                              {item.position}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right NIP & Action Button */}
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        {item.nip ? (
                          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-extrabold">
                            NIP: {item.nip}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-400 font-mono text-[11px] font-bold">
                            NIP: -
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/profil/struktur/edit/${item.id}`)}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                            isAssigned
                              ? "bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{isAssigned ? "Edit Pejabat" : "Tugaskan"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. BOTTOM SECTION: Struktur Organisasi BAPPEDA Halmahera Utara */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <StrukturOrganisasiChart
          data={treeData}
          title="Struktur Organisasi BAPPEDA Halmahera Utara"
        />
      </div>

      {/* Modal Pop Up: Tambah Posisi Jabatan (Mounted via React Portal on document.body to cover 100% of viewport without header leaks) */}
      {showAddModal &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Tambah Posisi Jabatan Baru</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Atur nama posisi jabatan dan pilih atasannya secara langsung.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddPositionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Posisi Jabatan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SUBID PERENCANAAN DAN EVALUASI"
                    value={modalPositionName}
                    onChange={(e) => setModalPositionName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {/* Custom Styled Visual Tree Picker */}
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-bold text-slate-700">
                    Jabatan Atasan (Parent Position)
                  </label>

                  <button
                    type="button"
                    onClick={() => setParentDropdownOpen(!parentDropdownOpen)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-500 text-left text-xs font-extrabold text-slate-900 flex items-center justify-between transition"
                  >
                    <span className="truncate pr-2">
                      {!modalParentId
                        ? "Root (Kepala Badan Utama / Tanpa Atasan)"
                        : officials.find((o) => o.node_id === modalParentId)?.position || modalParentId}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${parentDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {parentDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-2 space-y-1 font-sans animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setModalParentId("");
                          setParentDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                          !modalParentId ? "bg-blue-50 text-blue-900 font-extrabold" : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Root (Kepala Badan Utama / Tanpa Atasan)</span>
                        </span>
                        {!modalParentId && <Check className="w-4 h-4 text-blue-600" />}
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      {hierarchicalTreeList.map(({ item, depth }) => {
                        const isSelected = modalParentId === item.node_id;

                        return (
                          <button
                            key={item.node_id}
                            type="button"
                            onClick={() => {
                              setModalParentId(item.node_id);
                              setParentDropdownOpen(false);
                            }}
                            style={{ paddingLeft: `${depth * 14 + 10}px` }}
                            className={`w-full text-left py-2 pr-3 rounded-xl text-xs font-extrabold flex items-center justify-between transition ${
                              isSelected
                                ? "bg-blue-50 text-blue-900"
                                : "hover:bg-slate-100 text-slate-800"
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                              <span className="truncate">{item.position}</span>
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addingPosition}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                  >
                    {addingPosition ? "Menyimpan..." : "Simpan Posisi"}
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
