"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Download, Film } from "lucide-react";

export interface MediaItem {
  id: string | number;
  url: string;
  title: string;
  type: string; // 'foto', 'video', etc.
  size?: string;
}

interface MediaAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  initialIndex?: number;
}

export const MediaAlbumModal: React.FC<MediaAlbumModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  initialIndex = 0,
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Keyboard Arrow & Esc Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, mediaList]);

  if (!isOpen || !mounted || mediaList.length === 0) return null;

  const currentMedia = mediaList[currentIndex] || mediaList[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  const formattedUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("/storage/") ? `http://localhost:8000${url}` : url;
  };

  const isVideo =
    currentMedia.type === "video" ||
    currentMedia.url.match(/\.(mp4|webm|ogg|mov)$/i);

  const modalContent = (
    <div className="fixed inset-0 z-[999999] h-[100dvh] w-[100vw] bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between p-4 md:p-6 text-white font-sans animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 px-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider font-mono shrink-0">
            {isVideo ? "🎥 VIDEO LAPANGAN" : "📸 FOTO LAPANGAN"}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-100 truncate">
              {currentMedia.title}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Berkas {currentIndex + 1} dari {mediaList.length}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-slate-700/60"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Media Viewer Area with Nav Arrows */}
      <div className="relative flex-1 flex items-center justify-center my-3 min-h-0">
        {/* Previous Button */}
        {mediaList.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 md:left-6 z-10 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center transition cursor-pointer border border-slate-700/80 shadow-2xl hover:scale-110"
            title="Sebelumnya (←)"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {/* Media Container */}
        <div className="relative max-w-5xl max-h-[72dvh] w-full flex items-center justify-center p-2 overflow-hidden">
          {isVideo ? (
            <video
              src={formattedUrl(currentMedia.url)}
              controls
              autoPlay
              className="max-w-full max-h-[68dvh] object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          ) : (
            <img
              src={formattedUrl(currentMedia.url)}
              alt={currentMedia.title}
              className="max-w-full max-h-[68dvh] object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          )}
        </div>

        {/* Next Button */}
        {mediaList.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 md:right-6 z-10 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center transition cursor-pointer border border-slate-700/80 shadow-2xl hover:scale-110"
            title="Berikutnya (→)"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnails & Action Bar */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        {/* Filmstrip indicator list if multiple items */}
        {mediaList.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-xl mx-auto custom-scrollbar">
            {mediaList.map((item, idx) => (
              <button
                key={item.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                  currentIndex === idx
                    ? "border-blue-500 scale-105 shadow-md shadow-blue-500/30"
                    : "border-slate-800 opacity-60 hover:opacity-100"
                }`}
              >
                {item.type === "video" || item.url.match(/\.(mp4|webm)$/i) ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-amber-400">
                    <Film className="w-5 h-5" />
                  </div>
                ) : (
                  <img
                    src={formattedUrl(item.url)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2">
          <span>Ukuran Berkas: {currentMedia.size || "Original"}</span>
          <a
            href={formattedUrl(currentMedia.url)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <Download className="w-4 h-4" /> Buka Resolusi Penuh
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
