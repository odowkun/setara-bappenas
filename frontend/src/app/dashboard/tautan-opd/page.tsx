"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Link2,
  Link2Off,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { showDeleteConfirm, toast } from "@/lib/swal";
import {
  tautanOpdService,
  TautanOpdItem,
  TautanOpdPayload,
} from "@/services/tautanOpdService";

const emptyForm = {
  name: "",
  logoUrl: "",
  url: "",
  orderIndex: 0,
  isActive: true,
};

export default function TautanOpdDashboardPage() {
  const { hasPermission } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TautanOpdItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingItem, setEditingItem] = useState<TautanOpdItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const canManage = hasPermission("manage_tautan_opd");

  const fetchItems = async () => {
    setLoading(true);
    const data = await tautanOpdService.getItems(false);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [items, searchTerm]);

  const resetForm = () => {
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleCreateNew = () => {
    resetForm();
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const startEdit = (item: TautanOpdItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      logoUrl: item.logoUrl,
      url: item.url || "",
      orderIndex: item.orderIndex,
      isActive: item.isActive,
    });
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const uploadLogoFile = async (file?: File) => {
    if (!file) return;

    setUploading(true);
    const logoUrl = await tautanOpdService.uploadLogo(file);
    setUploading(false);

    if (!logoUrl) {
      toast.error("Logo OPD gagal diunggah.");
      return;
    }

    setForm((prev) => ({ ...prev, logoUrl }));
    toast.success("Logo OPD berhasil diunggah.");
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await uploadLogoFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleLogoDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    await uploadLogoFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManage) {
      toast.error("Anda tidak memiliki akses mengelola tautan OPD.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Nama OPD wajib diisi.");
      return;
    }

    if (!form.logoUrl.trim()) {
      toast.error("Logo OPD wajib diisi atau diunggah.");
      return;
    }

    const payload: TautanOpdPayload = {
      name: form.name.trim(),
      logo_url: form.logoUrl.trim(),
      url: form.url.trim() || null,
      order_index: Number(form.orderIndex) || 0,
      is_active: form.isActive,
    };

    setSaving(true);
    const success = await tautanOpdService.saveItem(payload, editingItem?.id);
    setSaving(false);

    if (!success) {
      toast.error("Tautan OPD gagal disimpan. Periksa URL jika diisi.");
      return;
    }

    toast.success(editingItem ? "Tautan OPD berhasil diperbarui." : "Tautan OPD berhasil ditambahkan.");
    resetForm();
    fetchItems();
  };

  const handleDelete = async (item: TautanOpdItem) => {
    const result = await showDeleteConfirm(item.name);
    if (!result.isConfirmed) return;

    const success = await tautanOpdService.deleteItem(item.id);
    if (!success) {
      toast.error("Tautan OPD gagal dihapus.");
      return;
    }

    toast.success("Tautan OPD berhasil dihapus.");
    if (editingItem?.id === item.id) resetForm();
    fetchItems();
  };

  if (!canManage) {
    return (
      <div className="w-full space-y-6 font-sans pb-12">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Akses Tautan OPD Dibatasi</h1>
          <p className="text-xs font-medium text-slate-500">
            Modul ini hanya tersedia untuk SuperAdmin atau admin yang diberi permission manage_tautan_opd.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
            <Link2 className="w-3.5 h-3.5" />
            Integrasi OPD
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Tautan OPD &amp; Aplikasi Daerah
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-3xl">
            Kelola nama OPD, logo, URL opsional, status tampil, dan urutan kartu yang muncul di halaman beranda.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Input Tautan Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] 2xl:grid-cols-[420px_1fr] gap-6 items-start">
        {/* Sticky Form Column on Desktop with dvh-aware container, natural flow on mobile */}
        <div ref={formRef} className="relative xl:sticky xl:top-4 self-start w-full">
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col xl:max-h-[calc(100dvh-6.5rem)] max-h-none"
          >
            {/* Form Header - Fixed at top of card */}
            <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {editingItem ? "Edit Tautan OPD" : "Tambah Tautan OPD"}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                  URL boleh dikosongkan agar kartu hanya tampil tanpa aksi redirect.
                </p>
              </div>
              {editingItem && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0"
                  aria-label="Batal edit"
                  title="Batal edit"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Scrollable Form Body - Smooth scrolling if desktop height is small */}
            <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5 pr-1 focus:outline-none">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">Nama OPD / Aplikasi *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Contoh: SIPD"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700">Logo OPD *</label>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm((prev) => ({ ...prev, logoUrl: "" }));
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
                <label
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={handleLogoDrop}
                  className={`p-3 rounded-2xl border-2 border-dashed text-xs font-bold transition active:scale-[0.99] flex items-center gap-3 cursor-pointer ${
                    dragActive
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-slate-50 hover:bg-blue-50 border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-700"
                  }`}
                >
                  <span className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    {form.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logoUrl} alt="Preview logo OPD" className="w-full h-full object-contain p-1.5" />
                    ) : uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-slate-300" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-800 truncate">
                      {uploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{uploading ? "Mengunggah..." : form.logoUrl ? "Ganti Berkas Logo" : "Pilih / Tarik Logo"}</span>
                    </span>
                    <p className="text-[10px] font-medium text-slate-400 truncate">JPG, PNG, WEBP, SVG maks 10MB</p>
                  </div>
                  <input type="file" accept="image/*,.svg" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">URL OPD</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(event) => setForm({ ...form, url: event.target.value })}
                  placeholder="https://contoh-opd.go.id"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Urutan</label>
                  <input
                    type="number"
                    min={0}
                    value={form.orderIndex}
                    onChange={(event) => setForm({ ...form, orderIndex: Number(event.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Status</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-full px-3 py-2.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      form.isActive
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{form.isActive ? "Aktif" : "Nonaktif"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Pinned Form Footer - Always visible on desktop and mobile */}
            <div className="pt-3.5 border-t border-slate-100 shrink-0 bg-white mt-auto space-y-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Menyimpan..." : editingItem ? "Perbarui Tautan OPD" : "Simpan Tautan OPD"}</span>
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama OPD atau aplikasi..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
            <span className="text-xs font-black text-slate-500">
              {filteredItems.length} item
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-52 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse" />
              ))
            ) : filteredItems.length === 0 ? (
              <div className="md:col-span-2 2xl:col-span-3 p-12 rounded-3xl bg-white border border-slate-200 text-center text-xs font-bold text-slate-400">
                Belum ada tautan OPD yang sesuai pencarian.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.logoUrl} alt={item.name} className="w-full h-full object-contain p-2" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 truncate">{item.name}</h3>
                        <p className="text-[11px] font-bold text-slate-400">Urutan {item.orderIndex}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="min-h-10 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                    {item.url ? <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" /> : <Link2Off className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="truncate">{item.url || "Tanpa redirect"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="px-3 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="px-3 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
