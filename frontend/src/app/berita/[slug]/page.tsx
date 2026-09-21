"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDateWIT } from "@/lib/dateUtils";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Share2,
  Bookmark,
  Newspaper,
  CheckCircle2,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/apiClient";
import { normalizeMediaUrl } from "@/services/adminService";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

export default function PublicNewsDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      }
    };
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/news/${slug}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setArticle({
              ...json.data,
              image: json.data.image ? normalizeMediaUrl(json.data.image) : "",
            });
          }
        }
      } catch (err) {
        console.error("Artikel resmi gagal dimuat:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pt-32 pb-20 flex justify-center">
        <div className="w-full max-w-3xl px-4 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded-full w-24" />
          <div className="h-10 bg-slate-200 rounded-2xl w-full" />
          <div className="h-80 bg-slate-200 rounded-3xl w-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 px-4 text-center">
        <p className="font-bold text-slate-600">Artikel tidak ditemukan atau belum dipublikasikan.</p>
        <Link href="/berita" className="mt-4 inline-block text-blue-700 font-bold">
          Kembali ke daftar berita
        </Link>
      </div>
    );
  }

  const displayData = article;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-28 pb-20">
      <article className="w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* BACK BUTTON */}
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Berita</span>
        </Link>

        {/* ARTICLE HEADER CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
              {displayData.category || "Belum dikategorikan"}
            </span>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateWIT(displayData.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600 font-extrabold">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                {displayData.views?.toLocaleString() || "0"} Hits Pembaca
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {displayData.title}
          </h1>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {displayData.author ? displayData.author.substring(0, 2).toUpperCase() : "--"}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">{displayData.author || "Belum tersedia"}</p>
                <p className="text-[10px] text-slate-500 font-medium">BAPPEDA Kab. Halmahera Utara</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-200"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Tersalin!" : "Bagikan"}</span>
            </button>
          </div>
        </div>

        {/* FEATURED COVER IMAGE WITH CLICK-TO-ZOOM */}
        {displayData.image && (
          <div
            onClick={() => {
              setIsLightboxOpen(true);
              setZoomLevel(1);
            }}
            className="group relative aspect-[16/9] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-lg cursor-zoom-in"
          >
            <ProgressiveImage
              src={displayData.image}
              alt={displayData.title}
              priority={true}
              fallbackSrc="/images/bappeda/default-news-cover.jpg"
              className="group-hover:scale-103 transition-transform duration-700 ease-out"
              containerClassName="relative w-full h-full overflow-hidden bg-slate-900"
            />

            {/* Click to Expand Badge Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 sm:p-6 pointer-events-none">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/85 text-white backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Klik untuk Melihat Resolusi Penuh (Full HD)</span>
              </span>
            </div>
          </div>
        )}

        {/* ARTICLE BODY READER */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xs prose max-w-none text-slate-800">
          <div
            dangerouslySetInnerHTML={{
              __html: displayData.content || "",
            }}
          />
        </div>
      </article>

      {/* FULL-RESOLUTION LIGHTBOX MODAL */}
      {isMounted && isLightboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="min-w-0 pr-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                {displayData.category}
              </p>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {displayData.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z === 1 ? 1.75 : 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                title={zoomLevel > 1 ? "Perkecil (1x)" : "Perbesar (Zoom 1.75x)"}
              >
                {zoomLevel > 1 ? (
                  <>
                    <ZoomOut className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">1x</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4 text-blue-400" />
                    <span className="hidden sm:inline">Zoom</span>
                  </>
                )}
              </button>

              <a
                href={displayData.image}
                target="_blank"
                rel="noreferrer"
                download
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                title="Buka Berkas Asli / Unduh"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Unduh HD</span>
              </a>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-200 hover:text-red-400 flex items-center justify-center transition border border-slate-700 cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Image Viewport with Zoom */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsLightboxOpen(false);
            }}
            className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 cursor-pointer"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel((z) => (z === 1 ? 1.75 : 1));
              }}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
              }}
              className={`transition-transform duration-300 select-none ${
                zoomLevel > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayData.image}
                alt={displayData.title}
                className="max-h-[80vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl border border-slate-800"
              />
            </div>
          </div>

          {/* Bottom Bar Caption */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-3 text-center text-xs text-slate-400 border-t border-slate-800/80 bg-slate-950/80"
          >
            <span>Foto Dokumentasi Resmi BAPPEDA Halmahera Utara &bull; Klik gambar untuk zoom atau tekan Esc untuk keluar</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
