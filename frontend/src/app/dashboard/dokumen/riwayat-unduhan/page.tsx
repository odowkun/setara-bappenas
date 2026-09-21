"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, History, Mail, Search, Users } from "lucide-react";
import { DownloadLogTable } from "@/components/documents/DownloadLogTable";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { adminService } from "@/services/adminService";
import { documentAnalyticsService } from "@/services/documentAnalyticsService";
import { AdminDocument } from "@/types/auth";
import {
  DocumentDownloadLog,
  DocumentDownloadSummary,
} from "@/types/documentAnalytics";
import { useAuth } from "@/context/AuthContext";

const EMPTY_SUMMARY: DocumentDownloadSummary = {
  totalDownloads: 0,
  uniqueEmails: 0,
  downloadsToday: 0,
};

function DownloadHistoryContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialDocumentId = searchParams.get("documentId") || "semua";
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [logs, setLogs] = useState<DocumentDownloadLog[]>([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [selectedDocumentId, setSelectedDocumentId] = useState(initialDocumentId);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLogs = async (documentId: string) => {
    setLoading(true);
    try {
      const response = await documentAnalyticsService.fetchDownloadLogs(
        documentId === "semua" ? undefined : documentId
      );
      setLogs(response.logs);
      setSummary(response.summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminService.fetchDocuments(user?.bidang, user?.role).then(setDocuments);
    loadLogs(initialDocumentId);
  }, [initialDocumentId, user]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchEmail.trim().toLowerCase();
    if (!normalizedSearch) return logs;
    return logs.filter((log) => log.email.toLowerCase().includes(normalizedSearch));
  }, [logs, searchEmail]);

  const documentOptions = [
    { value: "semua", label: "Semua Dokumen" },
    ...documents.map((document) => ({
      value: document.id,
      label: document.title,
    })),
  ];

  const handleDocumentChange = (value: string | number) => {
    const documentId = String(value);
    setSelectedDocumentId(documentId);
    loadLogs(documentId);
  };

  const summaryCards = [
    {
      label: "Total Unduhan Tercatat",
      value: summary.totalDownloads,
      icon: Download,
    },
    {
      label: "Email Masyarakat Unik",
      value: summary.uniqueEmails,
      icon: Users,
    },
    {
      label: "Unduhan Hari Ini",
      value: summary.downloadsToday,
      icon: Mail,
    },
  ];

  return (
    <main className="w-full space-y-6 pb-12 font-sans">
      <header className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Riwayat Pengunduh Dokumen</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Daftar email masyarakat yang telah mengunduh dokumen resmi BAPPEDA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/dokumen"
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Dokumen</span>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <card.icon className="h-5 w-5 text-blue-700" />
            <p className="mt-3 text-2xl font-black text-blue-950">{card.value}</p>
            <p className="text-[11px] font-bold text-blue-700">{card.label}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <SearchableSelect
          options={documentOptions}
          value={selectedDocumentId}
          onChange={handleDocumentChange}
          placeholder="Filter dokumen"
          searchPlaceholder="Cari judul dokumen..."
        />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={searchEmail}
            onChange={(event) => setSearchEmail(event.target.value)}
            placeholder="Cari alamat email..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-600"
          />
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs font-bold text-slate-500">
          Memuat riwayat pengunduh...
        </div>
      ) : (
        <DownloadLogTable logs={filteredLogs} />
      )}
    </main>
  );
}

export default function DownloadHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold">Memuat riwayat...</div>}>
      <DownloadHistoryContent />
    </Suspense>
  );
}
