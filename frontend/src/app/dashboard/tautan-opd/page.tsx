"use client";

import React, { useEffect, useMemo, useState } from "react";
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

  const startEdit = (item: TautanOpdItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      logoUrl: item.logoUrl,
      url: item.url || "",
      orderIndex: item.orderIndex,
      isActive: item.isActive,
    });
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
          onClick={resetForm}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Input Tautan Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {editingItem ? "Edit Tautan OPD" : "Tambah Tautan OPD"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                URL boleh dikosongkan agar kartu hanya tampil tanpa aksi redirect.
              </p>
            </div>
            {editingItem && (
              <button
                type="button"
                onClick={resetForm}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                aria-label="Reset form"
                title="Reset form"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">Nama OPD / Aplikasi *</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Contoh: SIPD"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">Logo OPD *</label>
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
              className={`min-h-44 px-5 py-6 rounded-3xl border-2 border-dashed text-xs font-extrabold transition active:scale-[0.99] flex flex-col items-center justify-center gap-4 cursor-pointer ${
                dragActive
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-slate-50 hover:bg-blue-50 border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-700"
              }`}
            >
              <span className="h-24 w-24 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-center overflow-hidden">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="Preview logo OPD" className="w-full h-full object-contain p-2" />
                ) : uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                ) : (
                  <ImagePlus className="w-8 h-8 text-slate-300" />
                )}
              </span>
              <span className="inline-flex items-center justify-center gap-2 text-center">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{uploading ? "Mengunggah logo..." : "Pilih atau tarik berkas logo ke sini"}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 text-center">JPG, PNG, WEBP, atau SVG maksimal 10MB</span>
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
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
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
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Status</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`w-full px-4 py-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition ${
                  form.isActive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{form.isActive ? "Aktif" : "Nonaktif"}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Menyimpan..." : "Simpan Tautan OPD"}</span>
          </button>
        </form>

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
