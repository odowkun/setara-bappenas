"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Eye, X } from "lucide-react";
import { resolveDocumentUrl } from "@/services/documentAnalyticsService";
import { AdminDocument } from "@/types/auth";

interface DocumentPreviewModalProps {
  document: AdminDocument | null;
  onClose: () => void;
  onRequestDownload: (document: AdminDocument) => void;
}

export function DocumentPreviewModal({
  document,
  onClose,
  onRequestDownload,
}: DocumentPreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!document) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [document, onClose]);

  if (!mounted || !document) return null;

  const resolvedUrl = resolveDocumentUrl(document.fileUrl);
  const previewUrl = `${resolvedUrl}${resolvedUrl.includes("#") ? "&" : "#"}toolbar=0&navpanes=0`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${document.title}`}
      className="fixed inset-0 z-[999999] flex h-[100dvh] w-screen flex-col bg-slate-950/90 font-sans text-white backdrop-blur-xl"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-4 md:px-8">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">
            {document.jenis.replace("_", " ")}
          </span>
          <h2 className="mt-1 truncate text-sm font-extrabold text-slate-100">
            {document.title}
          </h2>
          <div className="mt-1 flex items-center gap-4 text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {document.views} tayangan
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {document.downloads} unduhan
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onRequestDownload(document)}
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
        <iframe
          src={previewUrl}
          title={document.title}
          className="h-full w-full rounded-2xl border border-slate-800 bg-white"
        />
      </div>
    </div>,
    window.document.body
  );
}
