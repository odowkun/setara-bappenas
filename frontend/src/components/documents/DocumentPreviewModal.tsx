"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, Eye, FileText, X } from "lucide-react";
import { resolveDocumentUrl } from "@/services/documentAnalyticsService";
import { AdminDocument } from "@/types/auth";

interface DocumentPreviewModalProps {
  document: AdminDocument | null;
  onClose: () => void;
  onRequestDownload: (document: AdminDocument) => void;
}

export function DocumentPreviewModal({
  document: doc,
  onClose,
  onRequestDownload,
}: DocumentPreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!doc || typeof window === "undefined") return;

    const domDoc = window.document;
    const originalOverflow = domDoc.body.style.overflow;
    const originalPaddingRight = domDoc.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - domDoc.documentElement.clientWidth;
    domDoc.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      domDoc.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      domDoc.body.style.overflow = originalOverflow;
      domDoc.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [doc, onClose]);

  if (!mounted || !doc) return null;

  const resolvedUrl = doc.fileUrl ? resolveDocumentUrl(doc.fileUrl) : "";
  const previewUrl = resolvedUrl
    ? `${resolvedUrl}${resolvedUrl.includes("#") ? "&" : "#"}toolbar=0&navpanes=0`
    : "";
  const displayTitle = doc.title || "Dokumen Publik BAPPEDA";
  const displayJenis = (doc.jenis || "Dokumen").replace(/_/g, " ");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${displayTitle}`}
      className="fixed inset-0 z-[999999] flex h-[100dvh] w-screen flex-col bg-slate-950/90 font-sans text-white backdrop-blur-xl overscroll-contain"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-4 md:px-8">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">
            {displayJenis}
          </span>
          <h2 className="mt-1 truncate text-sm font-extrabold text-slate-100">
            {displayTitle}
          </h2>
          <div className="mt-1 flex items-center gap-4 text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {doc.views ?? 0} tayangan
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {doc.downloads ?? 0} unduhan
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {resolvedUrl && (
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-extrabold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Tab Baru
            </a>
          )}
          <button
            type="button"
            onClick={() => onRequestDownload(doc)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-blue-500"
          >
            <Download className="h-4 w-4" />
            Unduh
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup preview"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 p-2 md:p-4">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title={displayTitle}
            className="h-full w-full rounded-2xl border border-slate-800 bg-white shadow-2xl"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-100">
              Pratinjau Berkas Tidak Tersedia
            </h3>
            <p className="mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">
              Berkas digital untuk dokumen ini belum terhubung ke tautan pratinjau publik atau sedang diproses. Silakan gunakan opsi unduh untuk mengakses arsip.
            </p>
            <button
              type="button"
              onClick={() => onRequestDownload(doc)}
              className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Minta / Unduh Dokumen
            </button>
          </div>
        )}
      </div>
    </div>,
    window.document.body
  );
}
