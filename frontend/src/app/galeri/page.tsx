"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Image as ImageIcon,
  Video,
  Eye,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Sparkles,
  Layers,
} from "lucide-react";
import { galeriService, AlbumItem } from "@/services/galeriService";
import { MediaAlbumModal } from "@/components/ui/MediaAlbumModal";

export default function PublicGaleriPage() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  // Lightbox Modal State
  const [activeAlbum, setActiveAlbum] = useState<AlbumItem | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    const fetchGaleriFromDatabase = async () => {
      setLoading(true);
      try {
        const data = await galeriService.getAlbums();
        setAlbums(data);

        const cats = Array.from(new Set(data.map((m) => m.category)));
        setCategories(["Semua", ...cats]);
      } catch (error) {
        console.error("Galeri resmi gagal dimuat:", error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGaleriFromDatabase();
  }, []);

  const filteredAlbums = albums.filter((alb) => {
    const matchesSearch =
      alb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alb.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "Semua" || alb.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate Pagination Slices
  const totalPages = Math.ceil(filteredAlbums.length / itemsPerPage) || 1;
  const paginatedAlbums = filteredAlbums.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            <span className="text-blue-700 font-extrabold">Galeri Foto &amp; Video</span>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>DOKUMENTASI VISUAL KEGIATAN DAERAH</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Galeri Foto &amp; Video Album BAPPEDA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed text-center">
              Kumpulan album foto dan video dokumentasi kegiatan perencanaan, rapat kerja, musrenbang, serta monitoring pembangunan lapangan di Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari album kegiatan..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition shadow-2xs"
              />
            </div>

            <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">
              Menampilkan <span className="text-blue-700 font-black">{filteredAlbums.length}</span> album galeri
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedCategory(c);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-2xl font-black text-xs transition whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === c
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ALBUM CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-3xl bg-slate-50 border border-slate-200 p-4 space-y-3 animate-pulse">
                <div className="aspect-[16/10] rounded-2xl bg-slate-200 w-full" />
                <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
              </div>
            ))
          ) : paginatedAlbums.length === 0 ? (
            <div className="col-span-full p-16 text-center text-sm font-bold text-slate-400 bg-slate-50 rounded-3xl border border-slate-200">
              Belum ada album galeri yang sesuai dengan pencarian atau kategori terpilih.
            </div>
          ) : (
            paginatedAlbums.map((alb) => {
              const photos = alb.media ? alb.media.filter((m) => m.type !== "video").length : alb.photoCount;
              const videos = alb.media ? alb.media.filter((m) => m.type === "video").length : alb.videoCount;

              return (
                <div
                  key={alb.id}
                  className="rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* COVER IMAGE WITH MEDIA BADGES */}
                    <div
                      onClick={() => {
                        setActiveAlbum(alb);
                        setActiveMediaIndex(0);
                      }}
                      className="relative aspect-[16/10] overflow-hidden bg-slate-900 cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={alb.coverImage}
                        alt={alb.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                      {/* Dynamic Media Count Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        {photos > 0 && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-amber-400" />
                            <span>{photos} Foto</span>
                          </span>
                        )}
                        {videos > 0 && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1">
                            <Video className="w-3 h-3 text-rose-400" />
                            <span>{videos} Video</span>
                          </span>
                        )}
                      </div>

                      <span className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl text-[10px] font-black bg-blue-600 text-white shadow-md flex items-center gap-1 group-hover:bg-blue-700 transition">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka Album</span>
                      </span>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                          {alb.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {alb.eventDate}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-700 transition line-clamp-2">
                        {alb.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {alb.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveAlbum(alb);
                        setActiveMediaIndex(0);
                      }}
                      className="text-[11px] font-black text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Dokumentasi Album</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-2xl font-black text-xs transition cursor-pointer ${
                  currentPage === page
                    ? "bg-blue-700 text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* FULLSCREEN MEDIA ALBUM MODAL (PORTALED ABOVE NAVBAR & FLOATING CONTROLS) */}
      {activeAlbum && activeAlbum.media && activeAlbum.media.length > 0 && (
        <MediaAlbumModal
          isOpen={Boolean(activeAlbum)}
          onClose={() => setActiveAlbum(null)}
          mediaList={activeAlbum.media.map((m) => ({
            id: m.id,
            url: m.url,
            title: m.title || activeAlbum.title,
            type: m.type,
          }))}
          initialIndex={activeMediaIndex}
        />
      )}
    </div>
  );
}
