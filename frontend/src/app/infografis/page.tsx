"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  Maximize2,
  X,
  Download,
  Eye,
  Sparkles,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  "Sosial & SDM",
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
  const [zoomScale, setZoomScale] = useState(1);

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
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-8 space-y-6 sm:space-y-10 w-full overflow-hidden">
        {/* HERO TITLE BANNER & BREADCRUMB (PEDOMAN SINGLEPAGE PROFIL) */}
        <div className="py-2 space-y-4 text-center flex flex-col items-center justify-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">Informasi &amp; Publikasi</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-700 font-extrabold">Infografis Pembangunan</span>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>GALERI DATA &amp; FAKTA VISUAL DAERAH</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Infografis Pembangunan Daerah
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Koleksi grafis informasi resmi yang menyajikan data makro pembangunan, indikator kemiskinan dan pertumbuhan, dokumen perencanaan (RPJPD/RPJMD), pemetaan spasial, dan akuntabilitas kinerja daerah.
            </p>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* SEARCH INPUT */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  fetchData(1, selectedCategory, e.target.value);
                }}
                placeholder="Cari judul infografis atau topik..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="text-xs font-bold text-slate-500">
              Menampilkan <strong className="text-slate-900">{items.length}</strong> infografis daerah
            </div>
          </div>

          {/* CATEGORY PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                  fetchData(1, cat, searchTerm);
                }}
                className={`px-4 py-2 rounded-2xl font-black text-xs transition whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                id={item.slug}
                onClick={() => handleOpenInfografis(item)}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-950 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 aspect-[3/4] cursor-pointer select-none"
              >
                {/* Full Poster Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* Subtle Hover Gradient */}
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/50 transition-colors pointer-events-none" />

                {/* Top Badge: Category & Pin */}
                <div className="absolute top-2.5 inset-x-2.5 sm:top-4 sm:inset-x-4 flex items-center justify-between z-10 pointer-events-none">
                  <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-blue-600/95 backdrop-blur-md text-white shadow-sm">
                    {item.category}
                  </span>

                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400 text-blue-950 shadow-sm">
                      ★ <span className="hidden sm:inline">Tersemat</span>
                    </span>
                  )}
                </div>

                {/* Center Hover Magnify */}
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-amber-400 text-blue-950 font-black text-[11px] sm:text-xs shadow-2xl flex items-center gap-1.5 sm:gap-2 transform scale-90 group-hover:scale-100 transition-transform">
                    <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Perbesar</span>
                  </span>
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
          onClick={() => {
            setSelectedInfografis(null);
            setZoomScale(1);
          }}
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
              {/* Interactive Zoom Controls */}
              <div className="flex items-center bg-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                  disabled={zoomScale <= 1}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white disabled:opacity-40 transition cursor-pointer"
                  title="Perkecil (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold px-1.5 text-slate-200 min-w-[42px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  disabled={zoomScale >= 3}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white disabled:opacity-40 transition cursor-pointer"
                  title="Perbesar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {zoomScale !== 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
                    title="Reset Ukuran (100%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleShare(selectedInfografis)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan</span>
              </button>
              <a
                href={selectedInfografis.imageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black transition cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh HD</span>
              </a>
              <button
                onClick={() => {
                  setSelectedInfografis(null);
                  setZoomScale(1);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer ml-1"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Image Canvas with Zoom Pan */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedInfografis.imageUrl}
              alt={selectedInfografis.title}
              onClick={() => setZoomScale((z) => (z > 1 ? 1 : 1.75))}
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: "center center",
              }}
              className={`max-h-full max-w-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl transition-transform duration-200 select-none ${
                zoomScale > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              title={zoomScale > 1 ? "Klik untuk mengembalikan ukuran normal" : "Klik untuk memperbesar (Zoom)"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
