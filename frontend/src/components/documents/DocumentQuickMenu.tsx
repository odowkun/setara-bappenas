"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpenText, ChevronUp, X } from "lucide-react";
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
    const content = (
      <>
        <span
          className={`flex shrink-0 items-center justify-center bg-blue-700 text-white ${
            compact ? "h-9 w-9 rounded-xl" : "h-12 w-12 rounded-2xl"
          }`}
        >
          <BookOpenText
            aria-hidden="true"
            className={compact ? "h-5 w-5" : "h-6 w-6"}
          />
        </span>
        <span
          className={`text-left font-black leading-tight ${
            compact ? "text-xs" : "text-sm sm:text-base"
          }`}
        >
          {label}
        </span>
      </>
    );
    const sharedClass = `group flex cursor-pointer items-center gap-3 rounded-2xl text-slate-800 outline-none transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-amber-300 ${
      compact
        ? "w-full px-3 py-2.5 hover:bg-blue-50"
        : "min-h-20 min-w-[150px] px-4 py-3 hover:bg-blue-50 lg:min-w-0 lg:justify-center"
    } ${isActive ? "bg-blue-50 text-blue-800 ring-2 ring-blue-600" : ""}`;

    if (onSelect) {
      return (
        <button
          key={code}
          type="button"
          onClick={() => onSelect(code)}
          className={sharedClass}
          aria-pressed={isActive}
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
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                        Akses Cepat
                      </p>
                      <p className="text-sm font-black">Pilih Dokumen Publik</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFloatingOpen(false)}
                      aria-label="Tutup filter dokumen"
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-amber-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-1">
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
              className="group flex h-14 cursor-pointer items-center gap-2 rounded-full border border-blue-500 bg-blue-700 px-4 text-white shadow-xl shadow-blue-950/30 outline-none transition-colors hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-amber-300 sm:h-16 sm:px-5"
            >
              <BookOpenText className="h-6 w-6" aria-hidden="true" />
              <span className="hidden text-sm font-black sm:inline">
                Dokumen
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
        className={`rounded-[30px] border border-white/80 bg-white/95 p-2 shadow-2xl shadow-blue-950/20 backdrop-blur-xl ${className}`}
      >
        <div className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
          {DOCUMENT_QUICK_CATEGORIES.map(({ code, label }) =>
            renderCategory(code, label)
          )}
        </div>
      </nav>
      {floatingMenu}
    </>
  );
}
