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

interface DocumentQuickMenuProps {
  activeCode?: string;
  onSelect?: (code: DocumentCategoryCode) => void;
  floatingOnScroll?: boolean;
  className?: string;
}

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
}: DocumentQuickMenuProps) {
  const menuRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isPastMenu, setIsPastMenu] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const router = useRouter();
  const { setIsSearchOpen } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState("");

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

    // Main Desktop / Header Pill Item
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
                          style={{ width: 20, height: 20, maxWidth: 20, maxHeight: 20 }}
                          className="object-contain drop-shadow-xs"
                        />
                      </span>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                          Kategori Dokumen
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Pilih arsip &amp; perencanaan
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFloatingOpen(false)}
                      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                      aria-label="Tutup panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Interactive Document Search Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        setIsFloatingOpen(false);
                        router.push(`/dokumen?q=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    className="mb-2.5"
                  >
                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs border border-slate-200/60 ml-0.5">
                        <img
                          src="/images/3dicons/zoom-dynamic-color.png"
                          alt=""
                          width={16}
                          height={16}
                          style={{ width: 16, height: 16 }}
                          className="object-contain"
                        />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari arsip & dokumen..."
                        className="flex-1 bg-transparent text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsFloatingOpen(false);
                          setIsSearchOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold text-slate-500 shadow-2xs transition shrink-0 cursor-pointer"
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
                            router.push(`/dokumen?q=${encodeURIComponent(searchQuery.trim())}`);
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

  return (
    <>
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
      {floatingMenu}
    </>
  );
}
