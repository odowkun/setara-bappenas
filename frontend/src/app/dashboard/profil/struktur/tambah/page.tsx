"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch, API_BASE_URL, STORAGE_BASE_URL } from "@/lib/apiClient";
import { toast } from "@/lib/swal";
import { OptimizedMediaUploader } from "@/components/ui/OptimizedMediaUploader";
import {
  Building2,
  Save,
  ArrowLeft,
  ChevronDown,
  CornerDownRight,
  Check,
  Lock,
  UserCheck,
} from "lucide-react";

interface OfficialItem {
  id: number;
  node_id: string;
  parent_id: string | null;
  name: string;
  position: string;
  nip: string;
  avatar?: string;
}

interface HierarchicalOptionItem {
  node_id: string;
  position: string;
  depth: number;
}

export default function TambahStrukturPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  const [officials, setOfficials] = useState<OfficialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [position, setPosition] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [name, setName] = useState("");
  const [nip, setNip] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);

  // Fetch all existing pejabat items for parent selector
  useEffect(() => {
    const fetchPejabat = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/pejabat`);
        if (res.ok) {
          const json = await res.json();
          setOfficials(json.data.flat);
        }
      } catch (err) {
        console.error("Gagal memuat data pejabat:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPejabat();
  }, []);

  // Ordered Hierarchical Tree Items for Parent Selector
  const hierarchicalTreeList = useMemo<HierarchicalOptionItem[]>(() => {
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

    const list: HierarchicalOptionItem[] = [];
    const traverse = (node: any, depth = 0) => {
      list.push({ node_id: node.node_id, position: node.position, depth });
      if (node.children) {
        node.children.forEach((c: any) => traverse(c, depth + 1));
      }
    };

    roots.forEach((r) => traverse(r, 0));
    return list;
  }, [officials]);

  const selectedParentLabel = useMemo(() => {
    if (!parentId) return "Root (Kepala Badan Utama / Tanpa Atasan)";
    const found = officials.find((o) => o.node_id === parentId);
    return found ? found.position : parentId;
  }, [parentId, officials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authenticatedFetch("/pejabat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position,
          parent_id: parentId || null,
          name: name || "(Belum Ditentukan)",
          nip: nip || "",
          avatar: avatar || null,
        }),
      });

      if (res.ok) {
        toast.success(`Pejabat/Struktur "${position}" berhasil ditambahkan!`);
        router.push("/dashboard/profil/struktur");
      } else {
        toast.error("Gagal menambahkan posisi pejabat baru ke database!");
      }
    } catch (err) {
      console.error("Gagal menyimpan posisi pejabat baru:", err);
      toast.error("Terjadi kesalahan koneksi saat menyimpan posisi pejabat!");
    } finally {
      setSaving(false);
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
          Pengeditan Struktur Organisasi hanya dapat dilakukan oleh role **Administrator (SuperAdmin)**.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans pb-16">
      {/* Header Back Button & Title */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/dashboard/profil/struktur")}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Struktur Organisasi</span>
        </button>

        <span className="text-xs font-mono text-slate-400 font-bold">
          Tambah Posisi Jabatan & Hirarki Atasan
        </span>
      </div>

      {/* Main Single Page Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Informasi Jabatan & Hirarki */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>1. Informasi Posisi Jabatan & Hirarki Atasan</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tentukan posisi jabatan baru dan kedudukan atasannya dalam struktur organisasi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Position Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase">
                Nama Posisi / Jabatan Baru <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: KASUBAG PERENCANAAN, EVALUASI & PELAPORAN"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Custom Modern Visual Tree Picker for Parent Position Selector */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-black text-slate-800 uppercase">
                Jabatan Atasan (Parent Node Hirarki):
              </label>

              <button
                type="button"
                onClick={() => setParentDropdownOpen(!parentDropdownOpen)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-500 text-left text-xs font-black text-slate-900 flex items-center justify-between transition"
              >
                <span className="truncate pr-2">{selectedParentLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${parentDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {parentDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 font-sans animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setParentId("");
                      setParentDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                      !parentId ? "bg-blue-50 text-blue-900" : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Root (Kepala Badan Utama / Tanpa Atasan)</span>
                    </span>
                    {!parentId && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  {hierarchicalTreeList.map(({ node_id, position: pos, depth }) => {
                    const isSelected = parentId === node_id;

                    return (
                      <button
                        key={node_id}
                        type="button"
                        onClick={() => {
                          setParentId(node_id);
                          setParentDropdownOpen(false);
                        }}
                        style={{ paddingLeft: `${depth * 16 + 12}px` }}
                        className={`w-full text-left py-2 pr-3 rounded-xl text-xs font-extrabold flex items-center justify-between transition ${
                          isSelected
                            ? "bg-blue-50 text-blue-900"
                            : "hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span className="truncate">{pos}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Data Pejabat & Foto Profile */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>2. Data Lengkap Pejabat & Foto Resmi (Opsional Jika Vacant)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Isi nama lengkap, NIP, serta unggah foto profil resmi pejabat jika sudah ditentukan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Official Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase">
                Nama Lengkap Pejabat:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dr. Jan W. N. Papilaya, M.Si (Kosongkan jika Vacant)"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Official NIP Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase">
                NIP Pejabat:
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 197204121998031004"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Official Avatar Photo Uploader */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-black text-slate-800 uppercase">
                Foto / Avatar Resmi Pejabat (Otomatis Konversi WebP & HD):
              </label>

              <OptimizedMediaUploader
                onUploadSuccess={(media) => setAvatar(media.webUrl || media.masterUrl)}
                label="Unggah Foto Profil Resmi Pejabat (Pasfoto Resmi BAPPEDA)"
              />

              {avatar && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-200 mt-2">
                  <img
                    src={avatar.startsWith("http") ? avatar : `${STORAGE_BASE_URL}${avatar}`}
                    alt="Foto Pejabat"
                    className="w-12 h-12 rounded-xl object-cover border border-blue-300 shadow-sm"
                  />
                  <div className="text-xs">
                    <p className="font-extrabold text-blue-950">Foto Berhasil Diunggah!</p>
                    <p className="text-blue-700 font-mono text-[10px] truncate max-w-md">{avatar}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/profil/struktur")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition text-center justify-center flex items-center cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Menyimpan Data..." : "Simpan Data Posisi & Pejabat"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
