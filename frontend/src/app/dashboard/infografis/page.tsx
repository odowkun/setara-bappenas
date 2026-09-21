"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Star,
  StarOff,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { showDeleteConfirm, toast } from "@/lib/swal";
import {
  infografisService,
  InfografisItem,
  InfografisPayload,
} from "@/services/infografisService";
import SearchableSelect from "@/components/ui/SearchableSelect";

const CATEGORY_OPTIONS = [
  "Perencanaan",
  "Ekonomi",
  "Spasial",
  "Kesehatan",
  "Anggaran",
  "Infrastruktur",
  "Pendidikan",
  "Sosial & Budaya",
  "Umum",
];

const emptyForm = {
  title: "",
  category: "Perencanaan",
  image_url: "",
  description: "",
  is_pinned: false,
  is_published: true,
  order_index: 0,
};

export default function InfografisDashboardPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<InfografisItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState<"all" | "pinned" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfografisItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManage = hasPermission("manage_berita") || hasPermission("manage_pengumuman");

  const fetchItems = async () => {
    setLoading(true);
    const data = await infografisService.getAdminItems();
    setItems(data);
    setLoading(false);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterCategory !== "Semua" && item.category !== filterCategory) {
        return false;
      }

      if (filterStatus === "pinned") return item.isPinned;
      if (filterStatus === "published") return item.isPublished;
      if (filterStatus === "draft") return !item.isPublished;

      return true;
    });
  }, [items, searchTerm, filterCategory, filterStatus]);

  const pinnedCount = useMemo(() => items.filter((i) => i.isPinned).length, [items]);

  const allCategories = useMemo(() => {
    const set = new Set<string>(CATEGORY_OPTIONS);
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    if (form.category) set.add(form.category);
    return Array.from(set);
  }, [items, form.category]);

  const categorySelectOptions = useMemo(() => {
    return allCategories.map((c) => ({
      value: c,
      label: c,
    }));
  }, [allCategories]);

  const filterCategoryOptions = useMemo(() => {
    return [
      { value: "Semua", label: "Semua Kategori" },
      ...allCategories.map((c) => ({
        value: c,
        label: c,
      })),
    ];
  }, [allCategories]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      title: "",
      category: "Perencanaan",
      image_url: "",
      description: "",
      is_pinned: pinnedCount < 5,
      is_published: true,
      order_index: items.length > 0 ? Math.max(...items.map((i) => i.orderIndex)) + 1 : 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: InfografisItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      category: item.category,
      image_url: item.imageUrl,
      description: item.description || "",
      is_pinned: item.isPinned,
      is_published: item.isPublished,
      order_index: item.orderIndex,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran berkas melebihi batas maksimal 15MB.");
      return;
    }

    setUploadingImage(true);
    const res = await infografisService.uploadImage(file);
    setUploadingImage(false);

    if (res.success && res.url) {
      setForm((prev) => ({ ...prev, image_url: res.url! }));
      toast.success("Gambar infografis berhasil diunggah!");
    } else {
      toast.error(res.message || "Gagal mengunggah gambar.");
    }
  };

  const handleTogglePin = async (item: InfografisItem) => {
    if (!item.isPinned && pinnedCount >= 5) {
      toast.error("Maksimal 5 infografis yang dapat disematkan di beranda. Cabut sematan infografis lain terlebih dahulu.");
      return;
    }

    const res = await infografisService.togglePin(item.id);
    if (res.success) {
      toast.success(res.message || "Status sematan berhasil diubah");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isPinned: !i.isPinned } : i))
      );
    } else {
      toast.error(res.message || "Gagal mengubah sematan");
    }
  };

  const handleTogglePublish = async (item: InfografisItem) => {
    const res = await infografisService.togglePublish(item.id);
    if (res.success) {
      toast.success(res.message || "Status publikasi berhasil diubah");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isPublished: !i.isPublished } : i))
      );
    } else {
      toast.error(res.message || "Gagal mengubah status publikasi");
    }
  };

  const handleDelete = async (item: InfografisItem) => {
    const confirm = await showDeleteConfirm(
      item.title,
      "Infografis ini akan dihapus secara permanen dari basis data dan tidak akan tayang lagi di beranda publik."
    );

    if (confirm.isConfirmed) {
      const res = await infografisService.deleteItem(item.id);
      if (res.success) {
        toast.success(res.message || "Infografis berhasil dihapus");
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        toast.error(res.message || "Gagal menghapus infografis");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Judul infografis wajib diisi.");
      return;
    }
    if (!form.image_url.trim()) {
      toast.error("Berkas gambar infografis wajib diunggah.");
      return;
    }

    setSaving(true);
    const payload: InfografisPayload = {
      title: form.title.trim(),
      category: form.category.trim(),
      image_url: form.image_url.trim(),
      description: form.description.trim() || null,
      is_pinned: form.is_pinned,
      is_published: form.is_published,
      order_index: Number(form.order_index),
    };

    let res;
    if (editingItem) {
      res = await infografisService.updateItem(editingItem.id, payload);
    } else {
      res = await infografisService.createItem(payload);
    }

    setSaving(false);

    if (res.success) {
      toast.success(res.message || "Infografis berhasil disimpan");
      setModalOpen(false);
      fetchItems();
    } else {
      toast.error(res.message || "Gagal menyimpan infografis");
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Manajemen Infografis Pembangunan</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Kelola lembar visual data, indikator kinerja, dan publikasi grafis. Tandai hingga 5 infografis sebagai &quot;Tersemat&quot; untuk tayang di beranda utama tepat di bawah video sambutan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
            Tersemat: <span className="text-blue-600 font-extrabold">{pinnedCount}</span> / 5 Beranda
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleOpenAdd}
            disabled={!canManage}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Infografis Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul infografis, topik, atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            {/* Category Select */}
            <div className="w-full sm:w-52">
              <SearchableSelect
                options={filterCategoryOptions}
                value={filterCategory}
                onChange={(val) => setFilterCategory(String(val))}
                placeholder="Semua Kategori"
                searchPlaceholder="Cari kategori..."
              />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap sm:inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 w-full sm:w-auto">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === "all"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Semua ({items.length})
              </button>
              <button
                onClick={() => setFilterStatus("pinned")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === "pinned"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                ⭐ Tersemat ({pinnedCount})
              </button>
              <button
                onClick={() => setFilterStatus("published")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === "published"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Tayang ({items.filter((i) => i.isPublished).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-4 sm:px-6 w-20 text-center">Gambar</th>
                <th className="py-4 px-4">Judul &amp; Deskripsi Infografis</th>
                <th className="py-4 px-4 w-32">Kategori</th>
                <th className="py-4 px-4 w-28 text-center">Tersemat Beranda</th>
                <th className="py-4 px-4 w-28 text-center">Status</th>
                <th className="py-4 px-4 w-20 text-center">Urutan</th>
                <th className="py-4 px-4 sm:px-6 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="w-14 h-18 rounded-xl bg-slate-200 dark:bg-slate-800 mx-auto" />
                    </td>
                    <td className="py-4 px-4 space-y-2">
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 px-6 text-center">
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 mx-auto flex items-center justify-center">
                        <BarChart3 className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        Tidak ada infografis yang cocok
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {searchTerm
                          ? "Tidak ada item yang cocok dengan pencarian Anda."
                          : "Belum ada infografis. Klik tombol 'Tambah Infografis Baru' untuk menambahkan."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Thumbnail Image */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="w-14 h-18 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 mx-auto relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                          title="Buka gambar penuh"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Title & Description */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                          <span>Dilihat: {item.viewCount}x</span>
                          <span>•</span>
                          <span>Oleh: {item.createdBy || "Admin"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50">
                        {item.category}
                      </span>
                    </td>

                    {/* Pinned Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleTogglePin(item)}
                        disabled={!canManage}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          item.isPinned
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 border border-slate-200 dark:border-slate-700"
                        }`}
                        title={item.isPinned ? "Cabut sematan dari beranda" : "Sematkan di beranda (maks 5)"}
                      >
                        {item.isPinned ? (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>Tersemat</span>
                          </>
                        ) : (
                          <>
                            <StarOff className="w-3.5 h-3.5" />
                            <span>Reguler</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Status Publish */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        disabled={!canManage}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          item.isPublished
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                        title="Klik untuk ubah status publikasi"
                      >
                        {item.isPublished ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Tayang
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Draf
                          </>
                        )}
                      </button>
                    </td>

                    {/* Order Index */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.orderIndex}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          disabled={!canManage}
                          className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Infografis"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={!canManage}
                          className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus Infografis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>

      {/* Modal Add / Edit */}
      {mounted && modalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingItem ? "Edit Infografis" : "Tambah Infografis Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi data visualisasi dan tentukan apakah disematkan di beranda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Judul Infografis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Capaian Indikator Kinerja Makro Pembangunan Halut 2025"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Kategori Topik <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={categorySelectOptions}
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: String(val) })}
                  creatable={true}
                  createLabelPrefix="Tambah kategori baru:"
                  placeholder="-- Pilih atau Ketik Kategori --"
                  searchPlaceholder="Cari kategori atau ketik baru..."
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Pilih kategori yang tersedia, atau ketik nama baru lalu tekan Enter / klik &quot;Tambah kategori baru&quot; jika belum ada.
                </p>
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Gambar Infografis <span className="text-rose-500">*</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: /images/bappeda/fgd-keuangan.png atau upload berkas..."
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition border border-blue-200 shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Image */}
                {form.image_url && (
                  <div className="mt-2 w-32 h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Deskripsi / Keterangan Penjelas (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan poin-poin penting atau sumber data resmi..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Pinned & Published & Order Index */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Is Pinned */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Sematkan di Beranda
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.is_pinned && pinnedCount >= 5 && !editingItem?.isPinned) {
                        toast.error("Maksimal 5 infografis tersemat di beranda.");
                        return;
                      }
                      setForm({ ...form, is_pinned: !form.is_pinned });
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      form.is_pinned
                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200"
                    }`}
                  >
                    {form.is_pinned ? (
                      <>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>⭐ Tersemat (Top 5)</span>
                      </>
                    ) : (
                      <>
                        <StarOff className="w-3.5 h-3.5" />
                        <span>Reguler</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Is Published */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Status Publikasi
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_published: !form.is_published })}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      form.is_published
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200"
                    }`}
                  >
                    {form.is_published ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tayang Publik</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Simpan Draf</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Order Index */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Nomor Urut Tampil
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan Infografis
                    </>
                  )}
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
