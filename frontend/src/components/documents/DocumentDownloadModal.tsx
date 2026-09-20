"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import {
  documentAnalyticsService,
  resolveDocumentUrl,
} from "@/services/documentAnalyticsService";
import { AdminDocument } from "@/types/auth";
import { DocumentDownloadResult } from "@/types/documentAnalytics";

interface DocumentDownloadModalProps {
  document: AdminDocument | null;
  onClose: () => void;
  onDownloaded: (result: DocumentDownloadResult) => void;
}

export function DocumentDownloadModal({
  document,
  onClose,
  onDownloaded,
}: DocumentDownloadModalProps) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setEmail("");
    setErrorMessage("");
  }, [document]);

  useEffect(() => {
    if (!document) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [document, onClose, submitting]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!document) return;

    setSubmitting(true);
    setErrorMessage("");
    const downloadTab = window.open("", "_blank");

    try {
      const result = await documentAnalyticsService.registerDownload(
        document.id,
        email.trim()
      );
      onDownloaded(result);

      const downloadUrl = resolveDocumentUrl(result.downloadUrl);
      if (downloadTab) {
        downloadTab.location.href = downloadUrl;
      } else {
        window.location.assign(downloadUrl);
      }

      onClose();
    } catch (error) {
      downloadTab?.close();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Email gagal dicatat. Silakan coba kembali."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !document) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-slate-950/80 p-4 font-sans backdrop-blur-md overscroll-contain"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl overscroll-contain"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="download-dialog-title" className="text-base font-black">
                Verifikasi Email Pengunduh
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Masukkan alamat email sebelum mengunduh dokumen resmi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup formulir unduhan"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-5 rounded-2xl border border-blue-100 bg-blue-50 p-3">
          <p className="line-clamp-2 text-xs font-extrabold text-blue-950">
            {document.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="download-email" className="mb-1.5 block text-xs font-extrabold text-slate-700">
              Alamat Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="download-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contoh@email.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
              {errorMessage}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-slate-500">
            Email dicatat sebagai log layanan publik BAPPEDA dan tidak ditampilkan kepada masyarakat.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 py-3 text-xs font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {submitting ? "Mencatat & Menyiapkan..." : "Catat Email & Unduh Dokumen"}
          </button>
        </form>
      </section>
    </div>,
    window.document.body
  );
}
