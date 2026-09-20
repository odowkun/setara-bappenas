"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  Filter,
  Maximize2,
  X,
  Download,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/lib/swal";
import {
  infografisService,
  InfografisItem,
  InfografisPagination,
} from "@/services/infografisService";

const CATEGORIES = [
  "Semua",
  "Perencanaan",
  "Ekonomi",
  "Spasial",
  "Kesehatan",
  "Anggaran",
  "Infrastruktur",
];

export default function PublicInfografisPage() {
  const [items, setItems] = useState<InfografisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<InfografisPagination | undefined>(undefined);
  const [selectedInfografis, setSelectedInfografis] = useState<InfografisItem | null>(null);

  const fetchData = async (page = 1, cat = selectedCategory, search = searchTerm) => {
    setLoading(true);
    const res = await infografisService.getPublicItems(page, cat, search);
    setItems(res.data);
    setPagination(res.pagination);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(currentPage, selectedCategory, searchTerm);
  }, [currentPage, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData(1, selectedCategory, searchTerm);
  };

  const handleShare = async (item: InfografisItem) => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/infografis#${item.slug}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: item.title,
            text: item.description || item.title,
            url: shareUrl,
          });
          return;
        } catch {
          // fallback to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Tautan infografis berhasil disalin ke clipboard!");
      } catch {
        toast.error("Gagal menyalin tautan.");
      }
    }
  };

  const handleOpenInfografis = (item: InfografisItem) => {
    setSelectedInfografis(item);
    infografisService.recordView(item.id).then((newCount) => {
      if (newCount !== null) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, viewCount: newCount } : it))
        );
        setSelectedInfografis((prev) =>
          prev && prev.id === item.id ? { ...prev, viewCount: newCount } : prev
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans pb-24 pt-28 sm:pt-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-bold">Infografis Pembangunan</span>
        </div>

        {/* Hero Header Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-8 sm:p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold tracking-wide text-blue-200">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Galeri Data &amp; Fakta Visual Daerah
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Infografis Pembangunan Kabupaten Halmahera Utara
            </h1>
            <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed">
              Koleksi grafis informasi resmi yang menyajikan data makro pembangunan, indikator kemiskinan dan pertumbuhan, dokumen perencanaan (RPJPD/RPJMD), pemetaan spasial, dan akuntabilitas kinerja daerah.
            </p>
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari infografis, kata kunci indikator, atau topik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition shrink-0"
            >
              Cari Infografis
            </button>
          </form>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-xs font-bold text-slate-400 shrink-0 hidden sm:inline-flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Kategori:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Infographics Grid */}
        {loading ? (
          <div className="py-28 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Memuat galeri infografis...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 px-6 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 mx-auto flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Tidak ada infografis ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Coba gunakan kata kunci pencarian lain atau pilih kategori &quot;Semua&quot; untuk menampilkan seluruh infografis daerah.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                id={item.slug}
                onClick={() => handleOpenInfografis(item)}
                className="group relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col cursor-pointer select-none"
              >
                {/* Poster Container */}
                <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-85 group-hover:opacity-80 transition-opacity" />

                  {/* Category & Pin Badge */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600/95 backdrop-blur-md text-white shadow-sm">
                      {item.category}
                    </span>

                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-400 text-blue-950 shadow-sm">
                        ★ Tersemat
                      </span>
                    )}
                  </div>

                  {/* Center Hover Magnify */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="w-12 h-12 rounded-full bg-amber-400 text-blue-950 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                      <Maximize2 className="w-6 h-6" />
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-normal line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {item.viewCount} dilihat
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition"
                      title="Bagikan infografis"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 px-3">
              Halaman {currentPage} dari {pagination.last_page}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.last_page))}
              disabled={currentPage === pagination.last_page}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer text-xs font-bold"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedInfografis && (
        <div
          onClick={() => setSelectedInfografis(null)}
          className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-2xl p-4 sm:p-6 flex flex-col justify-between animate-in fade-in duration-200"
        >
          {/* Top Control Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white border-b border-white/10 pb-4"
          >
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-600 text-white">
                  {selectedInfografis.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedInfografis.publishedAt
                    ? new Date(selectedInfografis.publishedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Resmi BAPPEDA"}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-300 font-medium bg-white/10 px-2 py-0.5 rounded-md">
                  <Eye className="w-3 h-3 text-slate-300" />
                  {selectedInfografis.viewCount} dilihat
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black truncate text-slate-100">
                {selectedInfografis.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShare(selectedInfografis)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>
              <a
                href={selectedInfografis.imageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black transition cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar HD</span>
              </a>
              <button
                onClick={() => setSelectedInfografis(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer ml-1"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Image Canvas */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedInfografis.imageUrl}
              alt={selectedInfografis.title}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl"
            />
          </div>

          {/* Bottom Caption Box */}
          {selectedInfografis.description && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="border-t border-white/10 pt-3 text-center max-w-3xl mx-auto"
            >
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                {selectedInfografis.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
