"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  FolderPlus,
  Trash2,
  Search,
  Image as ImageIcon,
  Video,
  Eye,
  Edit,
  Filter,
  Calendar,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  BadgeCheck,
  CircleDashed,
  Youtube,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";
import { galeriService, AlbumItem, MediaItem } from "@/services/galeriService";
import HeroVideoSettingsPanel from "@/components/admin/HeroVideoSettingsPanel";
import YouTubeSocialMediaSettingsPanel from "@/components/admin/YouTubeSocialMediaSettingsPanel";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function GaleriManagementPage() {
  const { hasRole } = useAuth();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["Semua"]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"albums" | "hero-video" | "youtube-media">("albums");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "video" || tabParam === "hero-video") {
        setActiveTab("hero-video");
      } else if (tabParam === "youtube" || tabParam === "youtube-media") {
        setActiveTab("youtube-media");
      }
    }
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  // Lightbox Modal state for inspecting album items
  const [activeAlbum, setActiveAlbum] = useState<AlbumItem | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const fetchDatabaseAlbums = async () => {
    setLoading(true);
    try {
      const loadedAlbums = await galeriService.getAlbums(undefined, undefined, true);
      setAlbums(loadedAlbums);

      const cats = Array.from(new Set(loadedAlbums.map((a) => a.category)));
      setCategoryOptions(["Semua", ...cats]);
    } catch (error) {
      setAlbums([]);
      toast.error(error instanceof Error ? error.message : "Galeri gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseAlbums();
  }, []);

  const handleDeleteAlbum = async (id: string, title: string) => {
    const res = await showDeleteConfirm(title);
    if (!res.isConfirmed) return;

    try {
      await galeriService.deleteAlbum(id);
      toast.success(`Album "${title}" berhasil dihapus dari database.`);
      setAlbums((current) => current.filter((album) => album.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Album gagal dihapus.");
    }
  };

  const handleTogglePublication = async (album: AlbumItem) => {
    try {
      const updated = await galeriService.updatePublication(album.id, !album.isPublished);
      setAlbums((current) => current.map((row) => row.id === album.id ? updated : row));
      toast.success(updated.isPublished ? "Album berhasil diterbitkan." : "Album ditarik menjadi draf.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status publikasi gagal diperbarui.");
    }
  };

  const filteredAlbums = albums.filter((alb) => {
    const matchesSearch =
      alb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alb.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === "Semua" || alb.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate Pagination Slices
  const totalPages = Math.ceil(filteredAlbums.length / itemsPerPage) || 1;
  const paginatedAlbums = filteredAlbums.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* PAGE HEADER & TOP CONTROLS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Manajemen Album Galeri Foto &amp; Video</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelompokkan dokumentasi kegiatan daerah ke dalam album multi foto dan video langsung tersimpan di database backend SPBE.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "hero-video" ? "albums" : "hero-video")}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
              activeTab === "hero-video"
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
            }`}
          >
            <Video className="w-4 h-4 text-amber-600" />
            <span>{activeTab === "hero-video" ? "Lihat Daftar Album" : "Pengaturan Video Beranda"}</span>
          </button>

          {hasRole(["superadmin", "admin_umum", "admin_bidang"]) && (
            <Link
              href="/dashboard/galeri/tambah"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Buat Album Galeri Baru</span>
            </Link>
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("albums")}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "albums"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Daftar Album Galeri ({albums.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hero-video")}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "hero-video"
              ? "bg-amber-500 text-blue-950 font-black shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Video className="w-4 h-4 text-amber-600" />
          <span>Video Sambutan Utama (Hero)</span>
          <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-amber-100 text-amber-900 font-black uppercase">
            Live
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("youtube-media")}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "youtube-media"
              ? "bg-red-600 text-white font-black shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Youtube className="w-4 h-4 text-red-500" />
          <span>Video YouTube Media Sosial</span>
          <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-red-100 text-red-800 font-black uppercase">
            Beranda
          </span>
        </button>
      </div>

      {activeTab === "hero-video" ? (
        <HeroVideoSettingsPanel />
      ) : activeTab === "youtube-media" ? (
        <YouTubeSocialMediaSettingsPanel />
      ) : (
        <>
          {/* SEARCH BAR & CATEGORY SELECTOR */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kata kunci album..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="w-full sm:w-64">
          <SearchableSelect
            options={categoryOptions.map((c) => ({ value: c, label: c === "Semua" ? "Semua Kategori" : c }))}
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(String(val));
              setCurrentPage(1);
            }}
            placeholder="Pilih Kategori Album"
            searchPlaceholder="Cari kategori album..."
          />
        </div>
      </div>

      {/* ALBUMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 animate-pulse">
              <div className="aspect-video rounded-2xl bg-slate-200 w-full" />
              <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
            </div>
          ))
        ) : paginatedAlbums.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 font-bold bg-white rounded-3xl border border-slate-200">
            Belum ada album galeri yang sesuai dengan pencarian.
          </div>
        ) : (
          paginatedAlbums.map((alb) => {
            const photos = alb.media ? alb.media.filter((m) => m.type !== "video").length : alb.photoCount;
            const videos = alb.media ? alb.media.filter((m) => m.type === "video").length : alb.videoCount;

            return (
              <div
                key={alb.id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* COVER THUMBNAIL WITH MEDIA BADGES */}
                  <div
                    onClick={() => {
                      setActiveAlbum(alb);
                      setActiveMediaIndex(0);
                    }}
                    className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 cursor-pointer group-hover:brightness-105 transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={alb.coverImage}
                      alt={alb.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                    {/* DYNAMIC MEDIA COUNT BADGES */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
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

                    <span className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-xl text-[10px] font-black bg-blue-600 text-white shadow-md flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Lihat Isi Album</span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                        {alb.category}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {alb.eventDate}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        alb.isPublished
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {alb.isPublished ? "Tayang" : "Draf"}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                      {alb.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">
                      {alb.description}
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAlbum(alb);
                      setActiveMediaIndex(0);
                    }}
                    className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Buka Galeri Album</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePublication(alb)}
                      className={`p-2 rounded-xl transition border cursor-pointer ${
                        alb.isPublished
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                      }`}
                      title={alb.isPublished ? "Tarik menjadi draf" : "Terbitkan album"}
                    >
                      {alb.isPublished
                        ? <CircleDashed className="w-3.5 h-3.5" />
                        : <BadgeCheck className="w-3.5 h-3.5" />}
                    </button>
                    <Link
                      href={`/dashboard/galeri/edit/${alb.id}`}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition border border-slate-200"
                      title="Edit Album"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlbum(alb.id, alb.title)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition border border-rose-200 cursor-pointer"
                      title="Hapus Album"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-xs font-bold"
              >
                &larr; Prev
              </button>
              <span className="text-xs font-bold text-slate-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-xs font-bold"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}

      {/* LIGHTBOX MODAL */}
      {activeAlbum && activeAlbum.media && activeAlbum.media.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in">
          {/* Modal Header */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-black truncate max-w-xl">{activeAlbum.title}</h2>
              <p className="text-xs text-slate-400 font-medium">
                Media {activeMediaIndex + 1} dari {activeAlbum.media.length} • {activeAlbum.category}
              </p>
            </div>
            <button
              onClick={() => setActiveAlbum(null)}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Media Display */}
          <div className="relative flex-1 flex items-center justify-center my-4">
            {activeAlbum.media[activeMediaIndex].type === "video" ? (
              <video
                src={activeAlbum.media[activeMediaIndex].url}
                controls
                autoPlay
                className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activeAlbum.media[activeMediaIndex].url}
                alt={activeAlbum.media[activeMediaIndex].title}
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            )}

            {activeAlbum.media.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : activeAlbum.media.length - 1))
                  }
                  className="absolute left-2 p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white transition cursor-pointer backdrop-blur-md"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setActiveMediaIndex((prev) => (prev < activeAlbum.media.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-2 p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white transition cursor-pointer backdrop-blur-md"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Modal Thumbnails Strip */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pt-2 border-t border-white/10">
            {activeAlbum.media.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveMediaIndex(idx)}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                  activeMediaIndex === idx ? "border-blue-500 ring-2 ring-blue-400/50" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
