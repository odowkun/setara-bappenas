"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Maximize2, ArrowRight, Calendar, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { galeriService } from "@/services/galeriService";
import { MediaAlbumModal, MediaItem } from "@/components/ui/MediaAlbumModal";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

interface GalleryPhotoItem {
  id: string;
  title: string;
  category: string;
  image: string;
  eventDate: string;
  photoCount: number;
  media: MediaItem[];
}

export const GalleryGrid: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeMediaList, setActiveMediaList] = useState<MediaItem[] | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryPhotoItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([
    { id: "ALL", label: "Semua Dokumentasi" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatabaseGaleri = async () => {
      setLoading(true);
      const albums = await galeriService.getAlbums();

      const items: GalleryPhotoItem[] = albums.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category.toUpperCase(),
        image: item.coverImage,
        eventDate: item.eventDate,
        photoCount: item.photoCount || (item.media && item.media.length > 0 ? item.media.length : 1),
        media:
          item.media && item.media.length > 0
            ? item.media.map((m) => ({
                id: m.id,
                url: m.url,
                title: m.title || item.title,
                type: m.type === "video" ? "video" : "foto",
              }))
            : [
                {
                  id: item.id,
                  url: item.coverImage,
                  title: item.title,
                  type: "foto",
                },
              ],
      }));

      setGalleryItems(items);

      // Count items per category to only show active categories
      const catCounts: Record<string, number> = {};
      items.forEach((it) => {
        catCounts[it.category] = (catCounts[it.category] || 0) + 1;
      });

      const validCats = Object.keys(catCounts).filter((c) => catCounts[c] > 0);
      const catOpts = [
        { id: "ALL", label: `Semua Dokumentasi (${items.length})` },
        ...validCats.map((c) => ({ id: c, label: `${c} (${catCounts[c]})` })),
      ];
      setCategories(catOpts);
      setLoading(false);
    };

    fetchDatabaseGaleri();
  }, []);

  const filteredItems =
    activeCategory === "ALL"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  // Limit Homepage display to max 6 featured items
  const featuredItems = filteredItems.slice(0, 6);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-slate-50/50 font-sans border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        {/* SECTION HEADER & CTA HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Dokumentasi Pembangunan Daerah</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Galeri Foto &amp; Video Kegiatan BAPPEDA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Dokumentasi visual rangkaian rapat koordinasi, musrenbang, kunjungan kerja, dan evaluasi program pembangunan di Kabupaten Halmahera Utara.
            </p>
          </div>

          <Link
            href="/galeri"
            className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-lg shadow-blue-700/20 flex items-center justify-center gap-2.5 transition active:scale-95 shrink-0 self-start md:self-auto group cursor-pointer"
          >
            <span>Buka Seluruh Galeri Foto &amp; Video</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === cat.id
                  ? "bg-blue-700 text-white shadow-md shadow-blue-700/20"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FEATURED GALLERY GRID (MAX 6 ITEMS ON HOMEPAGE) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 space-y-3 animate-pulse aspect-[16/11]" />
            ))}
          </div>
        ) : featuredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-xs sm:text-sm text-slate-500 font-bold bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
            Belum ada dokumentasi foto untuk kategori ini. Silakan pilih kategori lain atau buka galeri utama.
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {featuredItems.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-2xl transition-all duration-500 bg-slate-900 aspect-[16/11] cursor-pointer border border-slate-200/80 hover:-translate-y-1.5"
                onClick={() => {
                  setActiveMediaList(item.media);
                  setActiveMediaIndex(0);
                }}
              >
                <ProgressiveImage
                  src={item.image}
                  alt={item.title}
                  fallbackSrc="/images/bappeda/default-news-cover.jpg"
                  className="group-hover:scale-108 transition-transform duration-700 ease-out"
                  containerClassName="absolute inset-0 w-full h-full overflow-hidden bg-slate-900"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/10 opacity-90 group-hover:opacity-95 transition-opacity pointer-events-none" />

                {/* MEDIA COUNT & CATEGORY BADGES */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-md border border-white/20 shadow-xs">
                    {item.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span>{item.photoCount} Foto</span>
                  </span>
                </div>

                {/* BOTTOM CONTENT OVERLAY */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <span>{item.eventDate}</span>
                  </div>
                  <h3 className="text-sm font-black text-white line-clamp-2 leading-snug drop-shadow-md group-hover:text-blue-300 transition">
                    {item.title}
                  </h3>
                </div>

                <button
                  type="button"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-full bg-blue-600/90 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md scale-75 group-hover:scale-100 shadow-xl cursor-pointer"
                  aria-label="Perbesar Foto"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* FULLSCREEN MEDIA ALBUM MODAL (PORTALED DIRECTLY TO BODY WITH HIGH Z-INDEX) */}
      <MediaAlbumModal
        isOpen={Boolean(activeMediaList && activeMediaList.length > 0)}
        onClose={() => setActiveMediaList(null)}
        mediaList={activeMediaList || []}
        initialIndex={activeMediaIndex}
      />
    </section>
  );
};
