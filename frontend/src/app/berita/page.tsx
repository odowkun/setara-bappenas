"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  Search,
  Eye,
  Clock,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  Tag,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/apiClient";
import { officialContentService } from "@/services/officialContentService";
import { normalizeMediaUrl } from "@/services/adminService";

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  views: number;
  featuredImage: string;
  summary: string;
  readTime: string;
}

export default function PublicNewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  useEffect(() => {
    const fetchNewsFromApi = async () => {
      setLoading(true);
      try {
        const [res, categoryRows] = await Promise.all([
          fetch(`${API_BASE_URL}/news`, { cache: "no-store" }),
          officialContentService.getNewsCategories(),
        ]);
        setCategories(["Semua", ...categoryRows.map((item) => item.name)]);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const mapped: NewsItem[] = json.data.map((item: any) => ({
              id: String(item.id),
              slug: item.slug || `news-${item.id}`,
              title: item.title,
              category: item.category || "Belum dikategorikan",
              author: item.author || "Belum tersedia",
              date: item.date || item.created_at?.split("T")[0] || "",
              views: Number(item.views) || 0,
              featuredImage: normalizeMediaUrl(item.image),
              summary: item.summary || "",
              readTime: "3 mnt baca",
            }));
            setNewsList(mapped);
          }
        }
      } catch (err) {
        console.error("Data berita resmi tidak dapat dimuat:", err);
        setNewsList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsFromApi();
  }, []);

  const filteredNews = newsList.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Pagination Slices
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage) || 1;
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const headlineNews = newsList[0];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-10">
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
            <span className="text-blue-700 font-extrabold">Berita &amp; Artikel</span>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>KABAR &amp; PUBLIKASI DAERAH</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Berita &amp; Artikel Publik BAPPEDA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Informasi terkini perihal kebijakan perencanaan, kegiatan pembangunan fisik, digitalisasi SPBE, dan inovasi daerah Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

        {/* HEADLINE NEWS BANNER CARD */}
        {headlineNews && !loading && (
          <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl shadow-slate-200/50 group">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto lg:h-[420px] overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={headlineNews.featuredImage || "/images/bappeda/logo-halut.png"}
                  alt={headlineNews.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("logo-halut.png")) {
                      target.src = "/images/bappeda/logo-halut.png";
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
              </div>

              <div className="lg:col-span-5 p-6 sm:p-10 space-y-4 bg-white text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                    HEADLINE UTAMA
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                    {headlineNews.category}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black leading-snug text-slate-900 group-hover:text-blue-600 transition">
                  {headlineNews.title}
                </h2>

                <p className="text-slate-600 font-medium text-xs sm:text-sm line-clamp-3 leading-relaxed">
                  {headlineNews.summary}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {headlineNews.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-extrabold text-slate-700">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      {headlineNews.views.toLocaleString()} Pembaca
                    </span>
                  </div>

                  <Link
                    href={`/berita/${headlineNews.slug}`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-blue-600/25"
                  >
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

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
                }}
                placeholder="Cari judul berita atau topik..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="text-xs font-bold text-slate-500">
              Menampilkan <strong className="text-slate-900">{filteredNews.length}</strong> artikel berita
            </div>
          </div>

          {/* CATEGORY PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-2xl font-black text-xs transition whitespace-nowrap shrink-0 ${
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

        {/* ARTICLES GRID (WITH SKELETON LOADERS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            /* SKELETON LOADERS */
            [1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden space-y-3 p-4 animate-pulse"
              >
                <div className="aspect-[16/10] rounded-2xl bg-slate-200 w-full" />
                <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                <div className="h-3 bg-slate-200 rounded-lg w-full" />
              </div>
            ))
          ) : paginatedNews.length === 0 ? (
            <div className="col-span-full p-16 text-center text-sm font-bold text-slate-400 bg-white rounded-3xl border border-slate-200">
              Belum ada artikel berita yang cocok dengan kata kunci atau kategori terpilih.
            </div>
          ) : (
            paginatedNews.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* COVER THUMBNAIL */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.featuredImage || "/images/bappeda/logo-halut.png"}
                      alt={item.title}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes("logo-halut.png")) {
                          target.src = "/images/bappeda/logo-halut.png";
                        }
                      }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-xl text-[10px] font-black bg-blue-900/90 text-white backdrop-blur-md border border-white/20">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.date}
                      </span>
                      <span className="flex items-center gap-1 font-extrabold text-slate-600">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        {item.views.toLocaleString()} Hits
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-blue-600 transition">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <span className="text-[11px] font-bold text-slate-400 truncate">
                    {item.author}
                  </span>

                  <Link
                    href={`/berita/${item.slug}`}
                    className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-1 transition"
                  >
                    <span>Baca Artikel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredNews.length > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-500">
                Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredNews.length)} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredNews.length)} dari {filteredNews.length} artikel berita
              </span>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700">
                <span className="text-slate-400">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-black text-blue-700 focus:outline-none cursor-pointer"
                >
                  <option value={6}>6 Kartu</option>
                  <option value={10}>10 Kartu</option>
                  <option value={50}>50 Kartu</option>
                  <option value={100}>100 Kartu</option>
                  <option value={999999}>Semua Data</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-2xl font-black transition text-xs ${
                    currentPage === p
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
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
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
