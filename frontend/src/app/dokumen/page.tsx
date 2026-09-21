"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Filter, ChevronRight } from "lucide-react";
import { DocumentDownloadModal } from "@/components/documents/DocumentDownloadModal";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { DocumentQuickMenu } from "@/components/documents/DocumentQuickMenu";
import { PublicDocumentGrid } from "@/components/documents/PublicDocumentGrid";
import { documentAnalyticsService } from "@/services/documentAnalyticsService";
import { adminService } from "@/services/adminService";
import { AdminDocument } from "@/types/auth";
import { DocumentDownloadResult } from "@/types/documentAnalytics";
import { toast } from "@/lib/swal";
import {
  DOCUMENT_QUICK_CATEGORIES,
  DocumentCategoryCode,
  isPrimaryDocumentCategory,
} from "@/data/documentCategories";

function DokumenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jenisParam = searchParams.get("jenis");
  const downloadParam = searchParams.get("unduh");
  const previewParam = searchParams.get("preview");

  const [category, setCategory] = useState("ALL");
  const [docsList, setDocsList] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
  const [downloadDoc, setDownloadDoc] = useState<AdminDocument | null>(null);

  // Fetch Documents 100% directly from Backend Database API
  useEffect(() => {
    setLoading(true);
    adminService.fetchDocuments().then((docs) => {
      setDocsList(docs || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!jenisParam) {
      setCategory("ALL");
      return;
    }
    const formatted = jenisParam.toUpperCase().replace(/-/g, "_");
    if (formatted === "RPJMD") {
      setCategory("RPJMD_KAB");
      return;
    }
    const isQuickCategory = DOCUMENT_QUICK_CATEGORIES.some(
      ({ code }) => code === formatted
    );
    setCategory(isQuickCategory ? formatted : "ALL");
  }, [jenisParam]);

  useEffect(() => {
    if (!downloadParam || docsList.length === 0) return;

    const requestedDocument = docsList.find(
      (document) => document.id === downloadParam
    );
    if (requestedDocument) {
      setDownloadDoc(requestedDocument);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("unduh");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/dokumen?${nextQuery}` : "/dokumen", {
      scroll: false,
    });
  }, [docsList, downloadParam, router, searchParams]);

  useEffect(() => {
    if (!previewParam || docsList.length === 0) return;

    const requestedDocument = docsList.find(
      (document) => document.id === previewParam
    );
    if (requestedDocument) {
      documentAnalyticsService
        .recordPreview(requestedDocument.id)
        .then((result) => {
          setDocsList((currentDocs) =>
            currentDocs.map((document) =>
              document.id === result.documentId
                ? {
                    ...document,
                    views: result.views,
                    uniqueViews: result.uniqueViews,
                  }
                : document
            )
          );
          setPreviewDoc({
            ...requestedDocument,
            fileUrl: result.previewUrl,
            views: result.views,
            uniqueViews: result.uniqueViews,
          });
        })
        .catch((error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "Preview dokumen tidak dapat dibuka."
          )
        );
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("preview");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/dokumen?${nextQuery}` : "/dokumen", {
      scroll: false,
    });
  }, [docsList, previewParam, router, searchParams]);

  // Lock body scroll when preview is open
  useEffect(() => {
    if (previewDoc) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewDoc]);

  const updateDocumentMetrics = (
    documentId: string,
    metrics: { views?: number; uniqueViews?: number; downloads?: number }
  ) => {
    setDocsList((currentDocs) =>
      currentDocs.map((document) =>
        document.id === documentId ? { ...document, ...metrics } : document
      )
    );
    setPreviewDoc((currentDocument) =>
      currentDocument?.id === documentId
        ? { ...currentDocument, ...metrics }
        : currentDocument
    );
  };

  const handlePreview = async (document: AdminDocument) => {
    try {
      const result = await documentAnalyticsService.recordPreview(document.id);
      updateDocumentMetrics(result.documentId, {
        views: result.views,
        uniqueViews: result.uniqueViews,
      });
      setPreviewDoc({
        ...document,
        fileUrl: result.previewUrl,
        views: result.views,
        uniqueViews: result.uniqueViews,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Preview dokumen tidak dapat dibuka."
      );
    }
  };

  const handleDownloaded = (result: DocumentDownloadResult) => {
    updateDocumentMetrics(result.documentId, {
      views: result.views,
      downloads: result.downloads,
    });
  };

  const selectCategory = (code: DocumentCategoryCode) => {
    setCategory(code);
    router.replace(`/dokumen?jenis=${code}`, { scroll: false });
  };

  const resetCategory = () => {
    setCategory("ALL");
    router.replace("/dokumen", { scroll: false });
  };

  const filteredDocs = docsList.filter((doc) => {
    if (category === "ALL") return true;

    const normalizedType = (doc.jenis || "").toUpperCase().replace(/-/g, "_");
    const normalizedTitle = (doc.title || "").toUpperCase();

    if (category === "LAINNYA") {
      return !isPrimaryDocumentCategory(normalizedType);
    }

    if (category === "RPJMD_PROV") {
      return (
        normalizedType === "RPJMD_PROV" ||
        normalizedType.includes("RPJMD_PROV") ||
        normalizedType.includes("PROV") ||
        (normalizedType.includes("RPJMD") && normalizedTitle.includes("PROVINSI"))
      );
    }

    if (category === "RPJMD_KAB") {
      return (
        normalizedType === "RPJMD_KAB" ||
        normalizedType === "RPJMD" ||
        normalizedType.includes("RPJMD_KAB") ||
        (normalizedType.includes("RPJMD") && !normalizedTitle.includes("PROVINSI"))
      );
    }

    if (category === "RPJMN") {
      return (
        normalizedType === "RPJMN" ||
        normalizedType.includes("RPJMN") ||
        normalizedTitle.includes("RPJMN") ||
        normalizedTitle.includes("NASIONAL")
      );
    }

    if (category === "RPJPD") {
      return (
        normalizedType === "RPJPD" ||
        normalizedType.includes("RPJPD") ||
        normalizedTitle.includes("RPJPD")
      );
    }

    if (category === "RKPD") {
      return (
        normalizedType === "RKPD" ||
        normalizedType.includes("RKPD") ||
        normalizedTitle.includes("RKPD")
      );
    }

    return normalizedType === category || normalizedType.includes(category);
  });

  const activeCategoryInfo = DOCUMENT_QUICK_CATEGORIES.find(
    ({ code }) => code === category
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-8 space-y-6 sm:space-y-10 w-full overflow-hidden">
        {/* HERO TITLE BANNER & BREADCRUMB (PEDOMAN SINGLEPAGE PROFIL) */}
        <div className="py-2 space-y-3 sm:space-y-4 text-center flex flex-col items-center justify-center">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-500">
            <Link
              href="/"
              className="hover:text-blue-600 transition flex items-center gap-1"
            >
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">Informasi &amp; Publikasi</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-700 font-extrabold">
              Repository Dokumen
            </span>
          </div>

          <div className="space-y-2 max-w-3xl mx-auto flex flex-col items-center px-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>REPOSITORY DOKUMEN SPASIAL &amp; PERENCANAAN</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight text-center">
              Dokumen Perencanaan Pembangunan Daerah
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed text-center max-w-2xl">
              Akses publik transparan untuk berkas BAPPEDA Kabupaten Halmahera
              Utara.
            </p>
          </div>
        </div>

        <DocumentQuickMenu activeCode={category} onSelect={selectCategory} />

        {/* Active Filter Banner */}
        {category !== "ALL" && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-900 font-extrabold">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                Menampilkan Jenis Dokumen:{" "}
                {activeCategoryInfo?.label || category}
              </span>
            </span>
            <button
              onClick={resetCategory}
              className="text-blue-700 hover:underline font-bold text-xs cursor-pointer self-start sm:self-auto"
            >
              Reset ke Semua Dokumen
            </button>
          </div>
        )}

        <PublicDocumentGrid
          documents={filteredDocs}
          loading={loading}
          onPreview={handlePreview}
          onDownload={setDownloadDoc}
          onResetFilters={resetCategory}
        />
      </div>

      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onRequestDownload={setDownloadDoc}
      />
      <DocumentDownloadModal
        document={downloadDoc}
        onClose={() => setDownloadDoc(null)}
        onDownloaded={handleDownloaded}
      />
    </div>
  );
}

export default function DokumenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 text-center text-xs font-bold text-slate-500">
          Memuat Repository Dokumen...
        </div>
      }
    >
      <DokumenContent />
    </Suspense>
  );
}
