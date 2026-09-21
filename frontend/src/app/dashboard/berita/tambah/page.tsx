"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { OptimizedMediaUploader } from "@/components/ui/OptimizedMediaUploader";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Newspaper,
  Plus,
  Tag,
  Check,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { officialContentService } from "@/services/officialContentService";
import { adminService } from "@/services/adminService";
import { toast } from "@/lib/swal";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function TambahBeritaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Inline Category Creator State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [content, setContent] = useState("");

  const [mediaData, setMediaData] = useState<{
    masterUrl: string;
    webUrl: string;
    thumbUrl: string;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  useEffect(() => {
    officialContentService.getNewsCategories()
      .then((rows) => {
        const names = rows.map((item) => item.name);
        setCategoryList(names);
        setSelectedCategory((current) => current || names[0] || "");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Kategori berita gagal dimuat."));
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("edit");
    if (!id) return;

    setEditingId(id);
    adminService.fetchNewsById(id)
      .then((item) => {
        setTitle(String(item.title ?? ""));
        setSummary(String(item.summary ?? ""));
        setSelectedCategory(String(item.category ?? ""));
        setContent(String(item.content ?? ""));
        setIsPublished(Boolean(item.is_published));
        const image = String(item.image ?? "");
        if (image) {
          setMediaData({ masterUrl: image, webUrl: image, thumbUrl: image });
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Berita gagal dimuat.");
        router.push("/dashboard/berita");
      });
  }, [router]);

  const handleAddNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (!categoryList.includes(trimmed)) {
      try {
        const created = await officialContentService.createNewsCategory(trimmed);
        setCategoryList((current) => [...current, created.name]);
        setSelectedCategory(created.name);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Kategori gagal disimpan.");
        return;
      }
    } else {
      setSelectedCategory(trimmed);
    }

    setNewCategoryName("");
    setShowAddCategory(false);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__ADD_NEW__") {
      setShowAddCategory(true);
    } else {
      setSelectedCategory(val);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (isImageUploading) {
      toast.error("Foto sampul masih dalam proses unggah dan optimasi WebP. Mohon tunggu beberapa detik...");
      return;
    }

    if (!title.trim() || !content.trim() || !selectedCategory) {
      toast.error("Judul, kategori, dan isi berita wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const finalImage = mediaData?.webUrl || mediaData?.masterUrl || "/images/bappeda/default-news-cover.jpg";
      const payload = {
        title: title.trim(),
        summary,
        category: selectedCategory,
        content,
        image: finalImage,
        is_published: publish,
      };
      if (editingId) {
        await adminService.updateNews(editingId, payload);
      } else {
        await adminService.addNews(payload);
      }
      setIsPublished(publish);
      toast.success(publish
        ? "Artikel tersimpan dan diterbitkan."
        : "Artikel tersimpan sebagai draf.");
      router.push("/dashboard/berita");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Artikel berita gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/berita"
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs shrink-0"
            title="Kembali ke Berita"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-blue-600 shrink-0" />
              <span>{editingId ? "Edit Artikel Berita" : "Tulis Artikel Berita Baru"}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Tulis narasi berita resmi, sertakan foto sampul utama, dan pilih/buat kategori topik.
            </p>
          </div>
        </div>

        {editingId && (
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
            isPublished
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isPublished ? "Sedang Tayang" : "Draf"}
          </span>
        )}
      </div>

      {/* FORM UTAMA */}
      <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Artikel Berita Resmi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: BAPPEDA Halmahera Utara Gelar Forum Musrenbang RKPD 2026..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ringkasan Singkat / Excerpt (Tampil pada Card Berita)
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tuliskan 1-2 kalimat ringkasan singkat berita di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* INLINE CATEGORY SELECT WITH CREATE NEW CATEGORY OPTION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Kategori Topik Berita *</span>
                {!showAddCategory && (
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Kategori Baru</span>
                  </button>
                )}
              </label>

              {showAddCategory ? (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-blue-50 border border-blue-200 animate-in fade-in">
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ketik nama kategori baru..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <SearchableSelect
                  options={categoryList.map((cat) => ({ value: cat, label: cat }))}
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(String(val))}
                  placeholder="-- Pilih Kategori Topik Berita --"
                  searchPlaceholder="Cari atau ketik kategori baru..."
                  creatable={true}
                  createLabelPrefix="Tambah kategori baru:"
                  onCreateOption={async (newCat) => {
                    const trimmed = newCat.trim();
                    if (!trimmed) return;
                    if (!categoryList.includes(trimmed)) {
                      try {
                        const created = await officialContentService.createNewsCategory(trimmed);
                        setCategoryList((current) => [...current, created.name]);
                        setSelectedCategory(created.name);
                        toast.success(`Kategori "${created.name}" berhasil dibuat!`);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Kategori gagal disimpan.");
                      }
                    } else {
                      setSelectedCategory(trimmed);
                    }
                  }}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Penulis / Redaksi Humas
              </label>
              <input
                type="text"
                disabled
                value={
                  user
                    ? `${user.name} (${user.role})`
                    : "Memuat identitas pengelola dari server..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Dual-Variant Optimized Image Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Foto Sampul Utama Artikel *
            </label>
            <OptimizedMediaUploader
              onUploadSuccess={(data) => setMediaData(data)}
              onUploadStatusChange={(uploading) => setIsImageUploading(uploading)}
              initialUrl={mediaData?.webUrl || mediaData?.masterUrl || undefined}
              label="Unggah Foto Sampul Berita Utama"
            />
          </div>

          {/* Rich Text Editor for Long Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Isi Narasi Berita Lengkap *
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Tuliskan berita lengkap di sini..."
              minHeight="320px"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/berita"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center justify-center flex items-center"
          >
            Batal
          </Link>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-black text-xs border border-slate-300 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingId ? "Simpan & Terbitkan" : "Terbitkan Artikel"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
