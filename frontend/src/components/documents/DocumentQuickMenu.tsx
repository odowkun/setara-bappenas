"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp, X } from "lucide-react";
import { useAccessibility } from "@/context/AccessibilityContext";
import {
  DOCUMENT_QUICK_CATEGORIES,
  DocumentCategoryCode,
} from "@/data/documentCategories";
import { officialContentService } from "@/services/officialContentService";

interface DocumentQuickMenuProps {
  activeCode?: string;
  onSelect?: (code: DocumentCategoryCode) => void;
  floatingOnScroll?: boolean;
  className?: string;
  showTicker?: boolean;
}

interface TickerItem {
  id: string;
  title: string;
  href: string;
  tag: string;
}

const DEFAULT_TICKER_ITEMS: TickerItem[] = [
  {
    id: "rpjpd-2045",
    title:
      "Publikasi Dokumen RPJPD Kabupaten Halmahera Utara 2025–2045: Menuju Halut Maju, Mandiri & Berkelanjutan",
    href: "/dokumen?jenis=RPJPD",
    tag: "RPJPD",
  },
  {
    id: "rpjmd-2029",
    title:
      "Akselerasi Program Prioritas RPJMD: Peningkatan Infrastruktur & Kualitas Pelayanan Dasar Daerah",
    href: "/dokumen?jenis=RPJMD",
    tag: "RPJMD",
  },
  {
    id: "rkpd-tahunan",
    title:
      "Rencana Kerja Pemerintah Daerah (RKPD) Terkini untuk Ketahanan Ekonomi & Percepatan Pembangunan",
    href: "/dokumen?jenis=RKPD",
    tag: "RKPD",
  },
  {
    id: "geospasial-gis",
    title:
      "Monitoring Geospasial WebGIS Aktif: Pantau Lokasi & Realisasi Fisik Titik Sebaran Proyek Strategis Daerah",
    href: "/geospasial",
    tag: "WEBGIS",
  },
  {
    id: "portal-bappeda",
    title:
      "Portal Resmi BAPPEDA Kabupaten Halmahera Utara — Pusat Sinkronisasi & Transparansi Perencanaan Terintegrasi",
    href: "/dokumen",
    tag: "BAPPEDA",
  },
];

const CATEGORY_META: Record<
  DocumentCategoryCode,
  {
    icon3d: string;
    shortLabel: string;
    description: string;
  }
> = {
  RPJPD: {
    icon3d: "/images/3dicons/target-dynamic-color.png",
    shortLabel: "RPJPD",
    description: "Rencana Pembangunan 20 Tahun",
  },
  RPJMD: {
    icon3d: "/images/3dicons/chart-dynamic-color.png",
    shortLabel: "RPJMD",
    description: "Rencana Pembangunan 5 Tahun",
  },
  RKPD: {
    icon3d: "/images/3dicons/calender-dynamic-color.png",
    shortLabel: "RKPD",
    description: "Rencana Kerja Pemerintah Daerah",
  },
  LAINNYA: {
    icon3d: "/images/3dicons/folder-dynamic-color.png",
    shortLabel: "Lainnya",
    description: "Dokumen Publik Lainnya",
  },
};

export function DocumentQuickMenu({
  activeCode,
  onSelect,
  floatingOnScroll = false,
  className = "",
  showTicker,
}: DocumentQuickMenuProps) {
  const menuRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isPastMenu, setIsPastMenu] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const router = useRouter();
  const { setIsSearchOpen } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState("");

  const isTickerMode = showTicker ?? !onSelect;
  const [categoriesRevealed, setCategoriesRevealed] = useState(false);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(DEFAULT_TICKER_ITEMS);

  const filteredCategories = searchQuery.trim()
    ? DOCUMENT_QUICK_CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          CATEGORY_META[c.code]?.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : DOCUMENT_QUICK_CATEGORIES;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Entrance transition: Running text is initially full-width, then shrinks to reveal categories
  useEffect(() => {
    if (!isTickerMode) return;
    const timer = setTimeout(() => {
      setCategoriesRevealed(true);
    }, 1300);
    return () => clearTimeout(timer);
  }, [isTickerMode]);

  // Fetch live official announcements for running text
  useEffect(() => {
    if (!isTickerMode) return;
    officialContentService
      .getAnnouncements()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TickerItem[] = data.slice(0, 5).map((a) => ({
            id: a.id,
            title: a.title,
            href: a.pdfUrl ? `/pengumuman?id=${a.id}` : "/pengumuman",
            tag: a.type || "PENGUMUMAN",
          }));
          setTickerItems([...mapped, ...DEFAULT_TICKER_ITEMS]);
        }
      })
      .catch(() => {
        // fallback to default ticker items
      });
  }, [isTickerMode]);

  useEffect(() => {
    const closeWhenAnotherPanelOpens = (event: Event) => {
      const panelEvent = event as CustomEvent<string>;
      if (panelEvent.detail !== "documents") setIsFloatingOpen(false);
    };

    window.addEventListener(
      "bappeda:floating-panel-open",
      closeWhenAnotherPanelOpens
    );
    return () =>
      window.removeEventListener(
        "bappeda:floating-panel-open",
        closeWhenAnotherPanelOpens
      );
  }, []);

  useEffect(() => {
    if (!floatingOnScroll || !menuRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const hasPassedAboveViewport =
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        setIsPastMenu(hasPassedAboveViewport);
        if (!hasPassedAboveViewport) setIsFloatingOpen(false);
      },
      { threshold: 0.05 }
    );

    observer.observe(menuRef.current);
    return () => observer.disconnect();
  }, [floatingOnScroll]);

  const renderCategory = (
    code: DocumentCategoryCode,
    label: string,
    compact = false
  ) => {
    const isActive = activeCode === code;
    const meta = CATEGORY_META[code] || {
      icon3d: "/images/3dicons/file-text-dynamic-color.png",
      shortLabel: label,
      description: label,
    };
    const displayLabel = compact ? label : meta.shortLabel;

    if (compact) {
      const compactContent = (
        <>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-white/20 shadow-xs"
                : "bg-blue-50/80 group-hover:bg-blue-100"
            }`}
          >
            <img
              src={meta.icon3d}
              alt={label}
              width={24}
              height={24}
              style={{ width: 24, height: 24, maxWidth: 24, maxHeight: 24 }}
              className="h-6 w-6 object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-110"
              loading="lazy"
            />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black leading-snug">{label}</span>
            <span
              className={`text-[10px] leading-tight truncate ${
                isActive ? "text-blue-100" : "text-slate-500"
              }`}
            >
              {meta.description}
            </span>
          </div>
        </>
      );

      const compactClass = `group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-all text-left outline-none ${
        isActive
          ? "bg-blue-600 text-white font-black shadow-md shadow-blue-600/25"
          : "text-slate-700 hover:bg-blue-50/80 hover:text-blue-900"
      }`;

      if (onSelect) {
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              onSelect(code);
              setIsFloatingOpen(false);
            }}
            className={compactClass}
            aria-pressed={isActive}
          >
            {compactContent}
          </button>
        );
      }

      return (
        <Link
          key={code}
          href={`/dokumen?jenis=${code}`}
          className={compactClass}
          onClick={() => setIsFloatingOpen(false)}
        >
          {compactContent}
        </Link>
      );
    }

    // Grid Item (Used on Document Catalog page)
    const content = (
      <div className="relative flex items-center justify-center gap-2 sm:gap-2.5 w-full">
        <span
          className={`flex shrink-0 items-center justify-center transition-all duration-200 ${
            isActive
              ? "h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-white/20 shadow-2xs"
              : "h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-blue-50/70 group-hover:bg-blue-100/80"
          }`}
        >
          <img
            src={meta.icon3d}
            alt={label}
            width={24}
            height={24}
            style={{ width: 24, height: 24, maxWidth: 24, maxHeight: 24 }}
            className="h-5 w-5 sm:h-6 sm:w-6 object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-110"
            loading="lazy"
          />
        </span>
        <span
          className={`whitespace-nowrap font-black tracking-tight transition-colors duration-200 ${
            isActive
              ? "text-white text-xs sm:text-sm"
              : "text-slate-700 group-hover:text-blue-950 text-xs sm:text-sm"
          }`}
        >
          {displayLabel}
        </span>
      </div>
    );

    const sharedClass = `group relative flex items-center justify-center h-12 sm:h-14 px-3 sm:px-4 rounded-xl sm:rounded-full cursor-pointer outline-none transition-all duration-200 select-none ${
      isActive
        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]"
        : "hover:bg-slate-100/80 text-slate-700 active:scale-98"
    }`;

    if (onSelect) {
      return (
        <button
          key={code}
          type="button"
          onClick={() => onSelect(code)}
          className={sharedClass}
          aria-pressed={isActive}
          title={meta.description}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={code}
        href={`/dokumen?jenis=${code}`}
        className={sharedClass}
        onClick={() => setIsFloatingOpen(false)}
        title={meta.description}
      >
        {content}
      </Link>
    );
  };

  const floatingMenu =
    mounted &&
    floatingOnScroll &&
    createPortal(
      <AnimatePresence>
        {isPastMenu && (
          <motion.aside
            data-testid="floating-document-menu"
            initial={reduceMotion ? false : { opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 80 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8"
          >
            <AnimatePresence>
              {isFloatingOpen && (
                <motion.nav
                  id="floating-document-categories"
                  aria-label="Filter cepat dokumen"
                  initial={
                    reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12, scale: 0.97 }
                  }
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="w-[calc(100vw-2.5rem)] max-w-sm rounded-[28px] border border-slate-200/90 bg-white/95 p-3.5 text-slate-900 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 px-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-2xs">
                        <img
                          src="/images/3dicons/folder-dynamic-color.png"
                          alt=""
                          width={20}
                          height={20}
                          style={{ width: 20, height: 20 }}
                          className="object-contain drop-shadow-xs"
                        />
                      </span>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                          Filter Cepat Dokumen
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Pilih kategori arsip perencanaan
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFloatingOpen(false)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      aria-label="Tutup filter cepat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Real-time Category Filter Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        setIsFloatingOpen(false);
                        router.push(
                          `/dokumen?q=${encodeURIComponent(searchQuery.trim())}`
                        );
                      }
                    }}
                    className="mb-2"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Saring kategori atau ketik kata kunci..."
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 focus:bg-white text-slate-800 placeholder-slate-400 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsFloatingOpen(false);
                          setIsSearchOpen(true);
                        }}
                        className="absolute right-1 px-1.5 py-0.5 text-[9px] font-bold bg-slate-200/70 hover:bg-slate-300 text-slate-600 rounded-md transition cursor-pointer"
                        title="Buka Dialog Pencarian Lengkap (⌘K)"
                      >
                        ⌘K
                      </button>
                    </div>
                  </form>

                  {/* Filtered Category List */}
                  <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-0.5">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map(({ code, label }) =>
                        renderCategory(code, label, true)
                      )
                    ) : (
                      <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <p className="text-xs text-slate-500 font-medium">
                          Tidak ada kategori cocok &quot;{searchQuery}&quot;
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFloatingOpen(false);
                            router.push(
                              `/dokumen?q=${encodeURIComponent(
                                searchQuery.trim()
                              )}`
                            );
                          }}
                          className="text-xs font-bold text-blue-700 hover:underline inline-block cursor-pointer"
                        >
                          Cari di semua dokumen &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </motion.nav>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => {
                const willOpen = !isFloatingOpen;
                setIsFloatingOpen(willOpen);
                if (willOpen) {
                  window.dispatchEvent(
                    new CustomEvent("bappeda:floating-panel-open", {
                      detail: "documents",
                    })
                  );
                }
              }}
              aria-expanded={isFloatingOpen}
              aria-controls="floating-document-categories"
              aria-label="Buka filter cepat dokumen"
              className="group flex h-12 cursor-pointer items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/95 px-3.5 sm:px-4.5 text-slate-800 shadow-xl shadow-blue-950/10 backdrop-blur-2xl transition-all duration-200 hover:bg-white hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-900/15 active:scale-95"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 border border-amber-200/70 transition-all duration-200 group-hover:scale-110 shadow-2xs">
                <img
                  src="/images/3dicons/file-text-dynamic-color.png"
                  alt="Kategori Dokumen"
                  width={20}
                  height={20}
                  style={{ width: 20, height: 20, maxWidth: 20, maxHeight: 20 }}
                  className="h-5 w-5 object-contain drop-shadow-xs"
                />
              </span>
              <span className="hidden text-xs font-black tracking-tight text-slate-700 transition-colors group-hover:text-amber-950 sm:inline">
                Kategori Dokumen
              </span>
              <ChevronUp
                aria-hidden="true"
                className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 sm:block group-hover:text-amber-600 ${
                  isFloatingOpen ? "rotate-180 text-amber-600" : ""
                }`}
              />
            </button>
          </motion.aside>
        )}
      </AnimatePresence>,
      document.body
    );

  const doubledTicker = [...tickerItems, ...tickerItems];

  return (
    <>
      {isTickerMode ? (
        <nav
          ref={menuRef}
          data-testid="document-quick-menu"
          aria-label="Informasi resmi dan kategori dokumen publik"
          className={`w-full max-w-7xl mx-auto rounded-2xl sm:rounded-full border border-slate-200/90 bg-white/95 p-1.5 sm:p-2 shadow-xl shadow-blue-950/10 backdrop-blur-xl flex items-center justify-between overflow-hidden relative min-h-[56px] sm:min-h-[64px] ${className}`}
        >
          {/* Left: Running Text (Marquee Ticker) */}
          <div
            className={`flex items-center gap-2 sm:gap-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] min-w-0 ${
              categoriesRevealed ? "flex-1 mr-1 sm:mr-3" : "w-full"
            }`}
          >
            {/* Badge: INFO HALUT */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-900/20 select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase whitespace-nowrap">
                INFO HALUT
              </span>
            </div>

            {/* Continuous Marquee Ticker Track */}
            <div className="relative flex-1 overflow-hidden mask-fade-edges py-1">
              <div className="animate-bappeda-marquee flex items-center gap-8 whitespace-nowrap will-change-transform">
                {doubledTicker.map((item, idx) => (
                  <Link
                    key={`${item.id}-${idx}`}
                    href={item.href}
                    className="group inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors"
                  >
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 group-hover:bg-blue-600 group-hover:text-white transition">
                      {item.tag}
                    </span>
                    <span className="hover:underline line-clamp-1">
                      {item.title}
                    </span>
                    <span className="text-amber-500 font-black ml-4 select-none">
                      ✦
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Kategori Dokumen (With smooth shrinking-left entrance transition) */}
          <div
            className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden shrink-0 flex items-center ${
              categoriesRevealed
                ? "max-w-[760px] opacity-100 translate-x-0 scale-100 pointer-events-auto"
                : "max-w-0 opacity-0 translate-x-10 scale-95 pointer-events-none"
            }`}
          >
            {/* Subtle Vertical Divider */}
            <div className="hidden md:block h-7 w-px bg-slate-200/80 mr-1.5 shrink-0" />

            {/* Category Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-0.5">
              {DOCUMENT_QUICK_CATEGORIES.map(({ code, label }) => {
                const meta = CATEGORY_META[code] || {
                  icon3d: "/images/3dicons/file-text-dynamic-color.png",
                  shortLabel: label,
                  description: label,
                };
                return (
                  <Link
                    key={code}
                    href={`/dokumen?jenis=${code}`}
                    className="group relative flex items-center gap-2 sm:gap-2.5 h-10 sm:h-12 px-2.5 sm:px-3.5 rounded-xl sm:rounded-full cursor-pointer outline-none transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-900 text-slate-700 active:scale-95 select-none shrink-0"
                    title={meta.description}
                  >
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50/70 group-hover:bg-blue-100/80 transition-all duration-200 shadow-2xs">
                      <img
                        src={meta.icon3d}
                        alt={label}
                        width={24}
                        height={24}
                        style={{
                          width: 24,
                          height: 24,
                          maxWidth: 24,
                          maxHeight: 24,
                        }}
                        className="h-5 w-5 sm:h-6 sm:w-6 object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-110"
                        loading="lazy"
                      />
                    </span>
                    <span className="whitespace-nowrap font-black tracking-tight text-xs sm:text-sm text-slate-700 group-hover:text-blue-950 transition-colors">
                      {meta.shortLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      ) : (
        <nav
          ref={menuRef}
          data-testid="document-quick-menu"
          aria-label="Kategori dokumen publik"
          className={`w-full max-w-4xl mx-auto rounded-2xl sm:rounded-full border border-slate-200/90 bg-white/95 p-1.5 sm:p-2 shadow-xl shadow-blue-950/10 backdrop-blur-xl ${className}`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
            {DOCUMENT_QUICK_CATEGORIES.map(({ code, label }) =>
              renderCategory(code, label)
            )}
          </div>
        </nav>
      )}
      {floatingMenu}
    </>
  );
}
