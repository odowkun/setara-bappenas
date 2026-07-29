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

const DEFAULT_CATEGORIES = [
  "Pembangunan",
  "Infrastruktur",
  "Ekonomi & Keuangan",
  "Sosial Budaya",
  "SPBE & Digital",
  "Inovasi Daerah",
];

const CATEGORIES_KEY = "bappeda_news_categories";

export default function TambahBeritaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("Pembangunan");

  // Inline Category Creator State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [content, setContent] = useState(
    "<p><strong>TOBELO, BAPPEDA HALUT</strong> — Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara menyelenggarakan agenda kerja tahunan...</p><h3>Poin Utama Pembahasan:</h3><ol><li>Penetapan skala prioritas pembangunan daerah</li><li>Integrasi data statistik sektoral</li><li>Penguatan tata kelola SPBE berbasis teknologi</li></ol>"
  );

  const [mediaData, setMediaData] = useState<{
    masterUrl: string;
    webUrl: string;
    thumbUrl: string;
  } | null>(null);

  const [isSaved, setIsSaved] = useState(false);

  // Load saved categories from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CATEGORIES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategoryList(Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed])));
          }
        } catch (e) {
          console.error("Gagal parse kategori dari storage:", e);
        }
      }
    }
  }, []);

  // Handle adding new category
  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (!categoryList.includes(trimmed)) {
      const updated = [...categoryList, trimmed];
      setCategoryList(updated);
      setSelectedCategory(trimmed);
      if (typeof window !== "undefined") {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSaved(true);
    setTimeout(() => {
      router.push("/dashboard/berita");
    }, 1500);
  };

  return (
    <div className="space-y-4 w-full max-w-[1400px] mx-auto font-sans">
      {/* HEADER CARD (FLUID & COMPACT PADDING) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <span>Tulis & Publikasikan Artikel Berita Baru</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Tulis narasi berita resmi, sertakan foto sampul utama, dan pilih/buat kategori topik.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Artikel Berita Berhasil Diterbitkan!</span>
          </div>
        )}
      </div>

      {/* FORM UTAMA */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
                <select
                  value={selectedCategory}
                  onChange={handleSelectChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition cursor-pointer shadow-2xs"
                >
                  {categoryList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-blue-600 bg-blue-50">
                    + Buat Kategori Baru...
                  </option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Penulis / Redaksi Humas
              </label>
              <input
                type="text"
                disabled
                value={`${user?.name || "Redaksi Humas BAPPEDA"} (${user?.role || "Humas"})`}
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
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/berita"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Publikasikan Artikel Berita</span>
          </button>
        </div>
      </form>
    </div>
  );
}
