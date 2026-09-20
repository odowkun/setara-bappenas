"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Search, X, FileText, Newspaper, MapPin, Bell, Camera, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/apiClient";

interface SearchResultItem {
  type: string;
  category_label?: string;
  title: string;
  desc: string;
  link: string;
}

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen } = useAccessibility();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when search modal is open
  useEffect(() => {
    if (isSearchOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsSearchOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isSearchOpen, setIsSearchOpen]);

  // Live Dynamic Search Effect with Debounce
  useEffect(() => {
    if (!isSearchOpen) return;

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const json = await res.json();
          setResults(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        console.error("[GlobalSearchModal] Pencarian database gagal:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isSearchOpen]);

  if (!mounted || !isSearchOpen) return null;

  const getIconComp = (type: string) => {
    switch (type) {
      case "dokumen":
        return FileText;
      case "berita":
        return Newspaper;
      case "galeri":
        return Camera;
      case "gis":
        return MapPin;
      case "pengumuman":
        return Bell;
      default:
        return FileText;
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-200 overscroll-contain"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 font-sans overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Dokumen, Berita, Peta GIS, atau Pengumuman..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none font-bold"
            autoFocus
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-full transition shrink-0 ml-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-4 flex flex-col gap-2.5">
          {!query && (
            <div className="px-2 pt-1 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Rekomendasi Pencarian Cepat
            </div>
          )}

          {results.length > 0 ? (
            results.map((item, idx) => {
              const IconComp = getIconComp(item.type);
              return (
                <Link
                  key={idx}
                  href={item.link}
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-100 hover:border-blue-200 transition duration-200 group cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white text-blue-600 group-hover:bg-blue-700 group-hover:text-white transition shadow-xs border border-slate-200/60 shrink-0 mt-0.5 sm:mt-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">
                          {item.category_label || item.type}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-blue-950 truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition transform group-hover:translate-x-1 shrink-0 ml-2" />
                </Link>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs sm:text-sm font-semibold">
              Tidak ada hasil yang cocok dengan &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Pintasan Pencarian Dinamis Bappeda Halut</span>
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-700">ESC</kbd> untuk menutup</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
