"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Maximize2,
  X,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  infografisService,
  InfografisItem,
} from "@/services/infografisService";

export const PinnedInfographicsSection: React.FC = () => {
  const [items, setItems] = useState<InfografisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInfografis, setSelectedInfografis] = useState<InfografisItem | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    infografisService
      .getPinnedItems(5)
      .then((data) => {
        setItems(data);
      })
      .catch((err) => {
        console.warn("[PinnedInfographicsSection] Gagal memuat infografis:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedInfografis) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [selectedInfografis]);

  const handleOpenInfografis = (item: InfografisItem) => {
    setSelectedInfografis(item);
    setZoomScale(1);
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

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth === 0) return;
    const cardWidth = clientWidth * 0.72 + 12; // 72vw + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveSlide(Math.min(Math.max(0, index), items.length - 1));
  };

  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const card = container.children[index] as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      setActiveSlide(index);
    }
  };

  const handlePrev = () => {
    scrollToSlide(Math.max(0, activeSlide - 1));
  };

  const handleNext = () => {
    scrollToSlide(Math.min(items.length - 1, activeSlide + 1));
  };

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <div className="w-full pb-2">
      {/* MOBILE CAROUSEL VIEW (< sm) */}
      <div className="block sm:hidden space-y-3">
        {/* Mobile Header: Label & Slide Counter Controls */}
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Infografis Pilihan</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {items.length > 0 ? `${activeSlide + 1} / ${items.length}` : "..."}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeSlide === 0}
                aria-label="Sebelumnya"
                className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeSlide >= items.length - 1}
                aria-label="Selanjutnya"
                className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Snap Container with Card Peek */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 py-1"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[72vw] max-w-[270px] aspect-[4/5] shrink-0 snap-center rounded-2xl bg-slate-100 animate-pulse p-4 flex flex-col justify-end"
                >
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))
            : items.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenInfografis(item)}
                  className={`w-[72vw] max-w-[270px] aspect-[4/5] shrink-0 snap-center relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-950 shadow-md active:scale-98 transition-all duration-200 cursor-pointer select-none ${
                    activeSlide === idx ? "ring-2 ring-blue-500/40 shadow-xl" : "opacity-90"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-600/95 backdrop-blur-md text-white shadow-sm">
                      {item.category}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-blue-950 flex items-center justify-center text-[10px] font-black shadow-sm" title="Tersemat di Beranda">
                      ★
                    </span>
                  </div>

                  {/* Bottom Tap to Enlarge Pill */}
                  <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-black text-white line-clamp-1 drop-shadow-sm flex-1 mr-2">
                      {item.title}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-blue-950 font-extrabold text-[10px] shadow-md flex items-center gap-1 shrink-0">
                      <Maximize2 className="w-3 h-3" />
                      <span>Perbesar</span>
                    </span>
                  </div>
                </div>
              ))}
        </div>

        {/* Mobile Pagination Dots */}
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {items.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => scrollToSlide(dotIdx)}
                aria-label={`Slide ${dotIdx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === dotIdx ? "w-6 bg-blue-600" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP GRID VIEW (sm+) */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse aspect-[3/4] p-4 flex flex-col justify-end"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))
          : items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenInfografis(item)}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-[3/4] shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none"
              >
                {/* Background Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* Subtle Hover Overlay */}
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/45 transition-colors pointer-events-none" />

                {/* Top Badge: Category & Pin Indicator */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-600/90 backdrop-blur-md text-white shadow-sm">
                    {item.category}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-blue-950 flex items-center justify-center text-[10px] font-black shadow-sm" title="Tersemat di Beranda">
                    ★
                  </span>
                </div>

                {/* Center Hover Magnify Icon */}
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                  <span className="px-3.5 py-2 rounded-xl bg-amber-400 text-blue-950 font-black text-xs shadow-xl flex items-center gap-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                    <Maximize2 className="w-4 h-4" />
                    <span>Perbesar</span>
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* Lightbox Modal (Portaled directly to document.body) */}
      {mounted && selectedInfografis && createPortal(
        <div
          onClick={() => {
            setSelectedInfografis(null);
            setZoomScale(1);
          }}
          className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-xl p-4 sm:p-6 flex flex-col justify-between animate-in fade-in duration-200"
        >
          {/* Modal Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white border-b border-white/10 pb-3"
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
                    : "Dipublikasikan resmi"}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-300 font-medium bg-white/10 px-2 py-0.5 rounded-md">
                  <Eye className="w-3 h-3 text-slate-300" />
                  {selectedInfografis.viewCount} dilihat
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black truncate text-slate-100">
                {selectedInfografis.title}
              </h3>
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

              <a
                href={selectedInfografis.imageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black transition cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh HD</span>
              </a>
              <button
                onClick={() => {
                  setSelectedInfografis(null);
                  setZoomScale(1);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Image Display with Zoom */}
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
              className={`max-h-full max-w-full object-contain rounded-xl shadow-2xl drop-shadow-2xl transition-transform duration-200 select-none ${
                zoomScale > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              title={zoomScale > 1 ? "Klik untuk mengembalikan ukuran normal" : "Klik untuk memperbesar (Zoom)"}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
