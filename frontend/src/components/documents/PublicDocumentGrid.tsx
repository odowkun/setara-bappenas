"use client";

import { Archive, Building2, Download, Eye, FileText } from "lucide-react";
import { AdminDocument } from "@/types/auth";

interface PublicDocumentGridProps {
  documents: AdminDocument[];
  loading: boolean;
  onPreview: (document: AdminDocument) => void;
  onDownload: (document: AdminDocument) => void;
  onResetFilters: () => void;
}

export function PublicDocumentGrid({
  documents,
  loading,
  onPreview,
  onDownload,
  onResetFilters,
}: PublicDocumentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="animate-pulse space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-200" />
            </div>
            <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
            <div className="h-4 w-1/2 rounded-lg bg-slate-200" />
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="h-4 w-24 rounded-lg bg-slate-200" />
              <div className="h-8 w-32 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="text-base font-extrabold text-slate-800">
          Dokumen Tidak Ditemukan
        </h2>
        <p className="mx-auto max-w-md text-xs text-slate-500">
          Tidak ada dokumen untuk kriteria pencarian atau jenis dokumen ini.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-block rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
        >
          Tampilkan Semua Dokumen
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
      {documents.map((document) => (
        <article
          key={document.id}
          className="flex flex-col justify-between space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition hover:shadow-md overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 sm:px-3 py-1 text-[10px] font-extrabold uppercase text-amber-900">
                  {(document.jenis || "DOKUMEN").replace(/_/g, " ")}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                  {document.tahun || "-"}
                </span>
              </div>
            </div>

            <h2 className="text-sm sm:text-base font-extrabold leading-snug text-slate-900 break-words">
              {document.title || "Dokumen Publik BAPPEDA"}
            </h2>
            {(document.archiveCode || document.currentVersion?.versionLabel) && (
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold text-blue-700 break-all">
                <Archive className="h-3.5 w-3.5 shrink-0" />
                {document.archiveCode && <span>{document.archiveCode}</span>}
                {document.currentVersion?.versionLabel && (
                  <span>Versi {document.currentVersion.versionLabel}</span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Bidang: <strong className="uppercase text-slate-800">{document.bidang || "UMUM"}</strong></span>
              </span>
              <span>Ukuran: {document.ukuran || "-"}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3.5 sm:pt-4">
            <div className="flex items-center gap-3.5 font-mono text-[11px] text-slate-500 shrink-0">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Eye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span><strong className="font-bold text-slate-700">{document.views ?? 0}</strong> dilihat</span>
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Download className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span><strong className="font-bold text-slate-700">{document.downloads ?? 0}</strong> diunduh</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onPreview(document)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => onDownload(document)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-3.5 py-2 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
