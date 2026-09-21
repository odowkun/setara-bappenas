"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatDateWIT } from "@/lib/dateUtils";
import {
  Newspaper,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Eye,
  Edit,
  Clock,
  Tag,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";
import { adminService } from "@/services/adminService";
import { officialContentService } from "@/services/officialContentService";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

interface NewsItem {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  views: number;
  isPublished: boolean;
  featuredImage: string;
  summary: string;
}

export default function BeritaManagementPage() {
  const { hasRole } = useAuth();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const [categories, setCategories] = useState<string[]>(["Semua"]);

  useEffect(() => {
    const fetchNewsFromApi = async () => {
      setLoading(true);
      try {
        const [mapped, categoryRows] = await Promise.all([
          adminService.fetchNews(),
          officialContentService.getNewsCategories(),
        ]);
        setNewsList(mapped);
        setCategories(["Semua", ...categoryRows.map((item) => item.name)]);
      } catch (err) {
        console.error("Data berita resmi gagal dimuat:", err);
        setNewsList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsFromApi();
  }, []);

  const handleDeleteNews = async (id: string, newsTitle: string) => {
    const res = await showDeleteConfirm(newsTitle);
    if (res.isConfirmed) {
      try {
        await adminService.deleteNews(id);
        setNewsList((current) => current.filter((item) => item.id !== id));
        toast.success(`Berita "${newsTitle}" berhasil dihapus dari database!`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Berita gagal dihapus.");
      }
    }
  };

  const handleTogglePublish = async (id: string) => {
    const target = newsList.find((item) => item.id === id);
    if (!target) return;
    try {
      await adminService.updateNewsPublication(id, !target.isPublished);
      setNewsList((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isPublished: !item.isPublished } : item
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status publikasi gagal diperbarui.");
    }
  };

  const filteredNews = newsList.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || n.category === selectedCategory;
    const matchesStatus =
      statusFilter === "Semua" ||
      (statusFilter === "Published" && n.isPublished) ||
      (statusFilter === "Draft" && !n.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate Pagination Slices
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage) || 1;
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalViews = newsList.reduce((acc, curr) => acc + curr.views, 0);

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Newspaper className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Portal Manajemen Berita &amp; Artikel Publik</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Kelola publikasi berita resmi, artikel perencanaan daerah, serta pantau statistik pembaca.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/berita/tambah"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Artikel Berita Baru</span>
          </Link>
        </div>
      </div>

      {/* STATS METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400">Total Artikel Berita</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{newsList.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Newspaper className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400">Total Pembaca (Hits)</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{totalViews.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400">Status Tayang</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">
              {newsList.filter((n) => n.isPublished).length} / {newsList.length}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari judul berita atau kata kunci..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Category Filter */}
          <div className="w-full sm:w-56">
            <SearchableSelect
              options={categories.map((c) => ({ value: c, label: c === "Semua" ? "Semua Kategori" : c }))}
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(String(val));
                setCurrentPage(1);
              }}
              placeholder="Pilih Kategori"
              searchPlaceholder="Cari kategori..."
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <SearchableSelect
              options={[
                { value: "Semua", label: "Semua Status" },
                { value: "Published", label: "Published" },
                { value: "Draft", label: "Draft" },
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(String(val));
                setCurrentPage(1);
              }}
              placeholder="Pilih Status"
            />
          </div>
        </div>
      </div>

      {/* TABLE / CARDS CMS BERITA (WITH SKELETON LOADER) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        {loading ? (
          /* SKELETON LOADERS */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse flex flex-col sm:flex-row items-center gap-4"
              >
                <div className="w-full sm:w-28 h-20 bg-slate-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 w-full">
                  <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-4 bg-slate-200 rounded-full w-16" />
                    <div className="h-4 bg-slate-200 rounded-full w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedNews.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">
            Tidak ada artikel berita yang sesuai dengan kriteria pencarian.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedNews.map((item) => (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <ProgressiveImage
                    src={item.featuredImage || "/images/bappeda/default-news-cover.jpg"}
                    alt={item.title}
                    fallbackSrc="/images/bappeda/default-news-cover.jpg"
                    className="group-hover:scale-105 transition"
                    containerClassName="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap shrink-0">
                        {item.category}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap shrink-0 ${
                          item.isPublished
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.isPublished ? "Tayang / Published" : "Draft"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateWIT(item.date)}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-1 group-hover:text-blue-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                      {item.summary}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 pt-0.5">
                      <span>Oleh: <strong className="text-slate-700">{item.author}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600 font-extrabold">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        {item.views.toLocaleString()} Pembaca
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                      item.isPublished
                        ? "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    }`}
                  >
                    {item.isPublished ? "Jadikan Draft" : "Publikasikan"}
                  </button>

                  <Link
                    href={`/dashboard/berita/tambah?edit=${item.id}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition border border-slate-200"
                    title="Edit Artikel"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteNews(item.id, item.title)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition border border-rose-200"
                    title="Hapus Artikel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!loading && filteredNews.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-500">
                Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredNews.length)} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredNews.length)} dari {filteredNews.length} artikel berita
              </span>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Tampilkan:</span>
                <div className="w-36">
                  <SearchableSelect
                    options={[
                      { value: 5, label: "5 Baris" },
                      { value: 10, label: "10 Baris" },
                      { value: 50, label: "50 Baris" },
                      { value: 100, label: "100 Baris" },
                      { value: 999999, label: "Semua Data" },
                    ]}
                    value={itemsPerPage}
                    onChange={(val) => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                    placeholder="Jumlah baris"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-xl font-black transition text-xs ${
                    currentPage === p
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
