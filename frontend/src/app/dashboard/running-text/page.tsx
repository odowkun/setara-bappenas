"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollText,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  RotateCcw,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Sparkles,
  Link2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { showDeleteConfirm, toast } from "@/lib/swal";
import {
  runningTextService,
  RunningTextItem,
  RunningTextPayload,
} from "@/services/runningTextService";
import SearchableSelect from "@/components/ui/SearchableSelect";

const DEFAULT_TAGS = ["INFORMASI", "RPJPD", "RPJMD", "RKPD", "WEBGIS", "PENGUMUMAN", "AGENDA"];

const emptyForm = {
  content: "",
  tag: "INFORMASI",
  url: "",
  order_index: 0,
  is_active: true,
};

export default function RunningTextDashboardPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<RunningTextItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RunningTextItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const canManage = hasPermission("manage_pengumuman");

  const tagOptions = useMemo(() => {
    const existing = new Set<string>(DEFAULT_TAGS);
    items.forEach((item) => {
      if (item.tag) existing.add(item.tag.toUpperCase());
    });
    if (form.tag) existing.add(form.tag.toUpperCase());
    return Array.from(existing).map((t) => ({
      value: t,
      label: t,
    }));
  }, [items, form.tag]);

  const fetchItems = async () => {
    setLoading(true);
    const data = await runningTextService.getAdminItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.url && item.url.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterActive === "active") return item.isActive;
      if (filterActive === "inactive") return !item.isActive;
      return true;
    });
  }, [items, searchTerm, filterActive]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      content: "",
      tag: "INFORMASI",
      url: "",
      order_index: items.length > 0 ? Math.max(...items.map((i) => i.orderIndex)) + 1 : 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: RunningTextItem) => {
    setEditingItem(item);
    setForm({
      content: item.content,
      tag: item.tag || "INFORMASI",
      url: item.url || "",
      order_index: item.orderIndex,
      is_active: item.isActive,
    });
    setModalOpen(true);
  };

  const handleToggle = async (item: RunningTextItem) => {
    const res = await runningTextService.toggleItem(item.id);
    if (res.success) {
      toast.success(res.message || "Status berhasil diperbarui");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
      );
    } else {
      toast.error(res.message || "Gagal mengubah status");
    }
  };

  const handleDelete = async (item: RunningTextItem) => {
    const confirm = await showDeleteConfirm(
      item.content.length > 40 ? item.content.slice(0, 40) + "..." : item.content,
      "Teks berjalan ini akan dihapus dari sistem dan tidak akan tayang lagi pada floating bar."
    );

    if (confirm.isConfirmed) {
      const res = await runningTextService.deleteItem(item.id);
      if (res.success) {
        toast.success(res.message || "Teks berjalan berhasil dihapus");
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        toast.error(res.message || "Gagal menghapus teks berjalan");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) {
      toast.error("Isi teks berjalan tidak boleh kosong.");
      return;
    }

    setSaving(true);
    const payload: RunningTextPayload = {
      content: form.content.trim(),
      tag: form.tag.trim().toUpperCase(),
      url: form.url.trim() ? form.url.trim() : null,
      order_index: Number(form.order_index),
      is_active: form.is_active,
    };

    let res;
    if (editingItem) {
      res = await runningTextService.updateItem(editingItem.id, payload);
    } else {
      res = await runningTextService.createItem(payload);
    }

    setSaving(false);

    if (res.success) {
      toast.success(res.message || "Teks berjalan berhasil disimpan");
      setModalOpen(false);
      fetchItems();
    } else {
      toast.error(res.message || "Gagal menyimpan teks berjalan");
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold tracking-wide text-blue-200">
              <ScrollText className="w-3.5 h-3.5 text-blue-300" />
              Floating Bar Marquee Controller
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Manajemen Teks Berjalan (Running Text)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola pesan penting, sorotan dokumen strategis, dan pengumuman berjalan yang tayang pada bilah mengambang di bawah halaman publik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              disabled={!canManage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Tambah Teks Berjalan
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari konten, label, atau URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline-flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
            </span>
            <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 w-full sm:w-auto">
              <button
                onClick={() => setFilterActive("all")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterActive === "all"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Semua ({items.length})
              </button>
              <button
                onClick={() => setFilterActive("active")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterActive === "active"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Aktif ({items.filter((i) => i.isActive).length})
              </button>
              <button
                onClick={() => setFilterActive("inactive")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterActive === "inactive"
                    ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Nonaktif ({items.filter((i) => !i.isActive).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Memuat data teks berjalan...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 mx-auto flex items-center justify-center">
              <ScrollText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Tidak ada teks berjalan ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm
                ? "Tidak ada item yang cocok dengan pencarian Anda."
                : "Belum ada item teks berjalan. Klik tombol 'Tambah Teks Berjalan' untuk menambahkan."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-4 sm:px-6 w-16 text-center">Urutan</th>
                  <th className="py-4 px-4 w-32">Kategori/Label</th>
                  <th className="py-4 px-4">Konten Teks Berjalan</th>
                  <th className="py-4 px-4 w-44">Tautan (URL)</th>
                  <th className="py-4 px-4 w-28 text-center">Status</th>
                  <th className="py-4 px-4 sm:px-6 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.orderIndex}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50">
                        {item.tag}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                        {item.content}
                      </p>
                      {item.createdBy && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Oleh: {item.createdBy}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {item.url ? (
                        <a
                          href={item.url}
                          target={item.url.startsWith("http") ? "_blank" : "_self"}
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline max-w-[160px] truncate"
                        >
                          <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{item.url}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={!canManage}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          item.isActive
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                        title="Klik untuk ubah status"
                      >
                        {item.isActive ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Tayang
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Nonaktif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          disabled={!canManage}
                          className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Teks Berjalan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={!canManage}
                          className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Hapus Teks Berjalan"
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
        )}
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingItem ? "Edit Teks Berjalan" : "Tambah Teks Berjalan"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Isian ini akan tayang bergantian secara dinamis di floating bar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tag / Category Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Kategori / Label Badge <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={tagOptions}
                  value={form.tag}
                  onChange={(val) => setForm({ ...form, tag: String(val).toUpperCase() })}
                  creatable={true}
                  createLabelPrefix="Tambah label badge:"
                  placeholder="-- Pilih atau Ketik Kategori/Badge --"
                  searchPlaceholder="Cari kategori atau ketik label baru..."
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Pilih label yang tersedia, atau ketik nama baru lalu tekan Enter / klik &quot;Tambah label badge&quot; jika belum ada.
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Isi Teks Berjalan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Publikasi Dokumen RPJPD Kabupaten Halmahera Utara Tahun 2025–2045: Menuju Halut Maju, Mandiri & Berkelanjutan"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Tautan / Link Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: /dokumen?jenis=RPJPD atau https://bappeda.halutkab.go.id/..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Order Index & Is Active */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Status Tayang
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      form.is_active
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {form.is_active ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tayang Aktif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" /> Nonaktif
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
