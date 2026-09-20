"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ArrowRight,
  Maximize2,
  X,
  Download,
  Calendar,
  Eye,
  Sparkles,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  infografisService,
  InfografisItem,
} from "@/services/infografisService";

export const PinnedInfographicsSection: React.FC = () => {
  const [items, setItems] = useState<InfografisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInfografis, setSelectedInfografis] = useState<InfografisItem | null>(null);

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

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4 pb-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-700">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Infografis Pembangunan Daerah</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Fakta &amp; Visualisasi Data Pembangunan Halut
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
            Paparan visual capaian makro daerah, arah kebijakan RPJPD/RPJMD, pemantauan spasial, dan transparansi anggaran daerah.
          </p>
        </div>

        <Link
          href="/infografis"
          className="inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 transition group self-start sm:self-auto shrink-0 bg-blue-50 dark:bg-slate-800 px-4 py-2 rounded-xl hover:bg-blue-100/80"
        >
          <span>Buka Galeri Infografis</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 5 Pinned Infographics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          : items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedInfografis(item)}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-[3/4] shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none"
              >
                {/* Background Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-95 group-hover:opacity-90 transition-opacity" />

                {/* Top Badge: Category & Pin Indicator */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-600/90 backdrop-blur-md text-white shadow-sm">
                    {item.category}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-blue-950 flex items-center justify-center text-[10px] font-black shadow-sm" title="Tersemat di Beranda">
                    ★
                  </span>
                </div>

                {/* Center Hover Magnify Icon */}
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <span className="w-11 h-11 rounded-full bg-amber-400 text-blue-950 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                    <Maximize2 className="w-5 h-5" />
                  </span>
                </div>

                {/* Bottom Content Metadata */}
                <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 space-y-1.5">
                  <h3 className="text-xs font-black text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors drop-shadow-sm">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium pt-1 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      {item.viewCount} kali
                    </span>
                    <span className="text-amber-400 font-bold text-[10px] flex items-center gap-0.5">
                      Perbesar &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Lightbox Modal */}
      {selectedInfografis && (
        <div
          onClick={() => setSelectedInfografis(null)}
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
              </div>
              <h3 className="text-sm sm:text-base font-black truncate text-slate-100">
                {selectedInfografis.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={selectedInfografis.imageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh HD</span>
              </a>
              <button
                onClick={() => setSelectedInfografis(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Image Display */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedInfografis.imageUrl}
              alt={selectedInfografis.title}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl drop-shadow-2xl"
            />
          </div>

          {/* Modal Footer Description */}
          {selectedInfografis.description && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="border-t border-white/10 pt-3 text-center max-w-3xl mx-auto"
            >
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {selectedInfografis.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
