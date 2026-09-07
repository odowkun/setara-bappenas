"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarRange,
  Map,
  Award,
  Briefcase,
  CheckCircle2,
  FolderArchive,
  BookOpenText,
  ChevronUp,
  X,
  FileText,
} from "lucide-react";
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
    icon: React.ComponentType<{ className?: string }>;
    shortLabel: string;
    description: string;
  }
> = {
  RKPD: {
    icon: CalendarRange,
    shortLabel: "RKPD",
    description: "Rencana Kerja Pemerintah Daerah",
  },
  RTRW: {
    icon: Map,
    shortLabel: "RTRW",
    description: "Rencana Tata Ruang Wilayah",
  },
  RPJPD: {
    icon: Award,
    shortLabel: "RPJPD",
    description: "Rencana Pembangunan 20 Tahun",
  },
  RPJMD: {
    icon: Briefcase,
    shortLabel: "RPJMD",
    description: "Rencana Pembangunan 5 Tahun",
  },
  LKPJ: {
    icon: CheckCircle2,
    shortLabel: "LKPJ",
    description: "Laporan Pertanggungjawaban",
  },
  LAINNYA: {
    icon: FolderArchive,
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
      icon: BookOpenText,
      shortLabel: label,
      description: label,
    };
    const IconComponent = meta.icon;
    const displayLabel = compact ? label : meta.shortLabel;

    if (compact) {
      const compactContent = (
        <>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive
                ? "bg-white/20 text-white"
                : "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
            }`}
          >
            <IconComponent className="h-4.5 w-4.5" />
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
              ? "h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-white/20 text-white shadow-2xs"
              : "h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-100 group-hover:text-blue-800"
          }`}
        >
          <IconComponent className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
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
            className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
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
                  className="w-[calc(100vw-2rem)] max-w-sm rounded-[28px] border border-blue-100 bg-white/95 p-3 text-slate-900 shadow-2xl shadow-blue-950/20 backdrop-blur-xl"
                >
                  <div className="mb-2 flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Kategori Dokumen
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFloatingOpen(false)}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Tutup panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {DOCUMENT_QUICK_CATEGORIES.map(({ code, label }) =>
                      renderCategory(code, label, true)
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
              className="group flex h-13 cursor-pointer items-center gap-2 rounded-full border border-blue-500 bg-blue-700 px-4 text-white shadow-xl shadow-blue-950/30 outline-none transition-colors hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-amber-300 sm:h-14 sm:px-5"
            >
              <FileText className="h-5 w-5" aria-hidden="true" />
              <span className="hidden text-xs font-black sm:inline">
                Kategori Dokumen
              </span>
              <ChevronUp
                aria-hidden="true"
                className={`hidden h-4 w-4 transition-transform sm:block ${
                  isFloatingOpen ? "rotate-180" : ""
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
        className={`w-full max-w-5xl mx-auto rounded-2xl sm:rounded-full border border-slate-200/90 bg-white/95 p-1.5 sm:p-2 shadow-xl shadow-blue-950/10 backdrop-blur-xl ${className}`}
      >
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-1.5">
          {DOCUMENT_QUICK_CATEGORIES.map(({ code, label }) =>
            renderCategory(code, label)
          )}
        </div>
      </nav>
      {floatingMenu}
    </>
  );
}
