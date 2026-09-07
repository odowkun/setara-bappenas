"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Database,
  ExternalLink,
  FileCheck2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { showConfirm, toast } from "@/lib/swal";
import { ArchiveMetadataForm } from "@/components/documents/archive/ArchiveMetadataForm";
import { ArchiveVersionPanel } from "@/components/documents/archive/ArchiveVersionPanel";
import { ArchiveWorkflowPanel } from "@/components/documents/archive/ArchiveWorkflowPanel";
import {
  DocumentGovernanceData,
  DocumentGovernanceStatus,
  DocumentGovernanceUpdate,
  DocumentReviewDecision,
  documentArchiveService,
} from "@/services/documentArchiveService";
import { resolveDocumentUrl } from "@/services/documentAnalyticsService";

export default function DocumentArchiveDetailPage() {
  const params = useParams<{ id: string }>();
  const documentId = String(params.id);
  const { hasRole } = useAuth();
  const [data, setData] = useState<DocumentGovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadGovernance = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setData(await documentArchiveService.getGovernance(documentId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Tata kelola arsip gagal dimuat."
      );
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadGovernance();
  }, [loadGovernance]);

  const saveMetadata = async (input: DocumentGovernanceUpdate) => {
    setBusyAction("metadata");
    try {
      setData(
        await documentArchiveService.updateGovernance(documentId, input)
      );
      toast.success("Metadata tata kelola berhasil diperbarui.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Metadata gagal disimpan."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const createVersion = async (filePath: string, changeSummary: string) => {
    setBusyAction("version");
    try {
      const result = await documentArchiveService.createVersion(documentId, {
        file_path: filePath,
        change_summary: changeSummary,
      });
      setData(result.document);
      toast.success("Versi baru tersimpan sebagai draf.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Versi gagal disimpan."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const submitReview = async (notes: string) => {
    const confirmation = await showConfirm({
      title: "Ajukan Arsip untuk Review?",
      text: "Versi terbaru akan dikunci selama proses pemeriksaan.",
      confirmButtonText: "Ya, Ajukan",
    });
    if (!confirmation.isConfirmed) return;
    setBusyAction("submit");
    try {
      setData(
        await documentArchiveService.submitWorkflow(documentId, { notes })
      );
      toast.success("Arsip berhasil diajukan untuk review.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Pengajuan gagal diproses."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const reviewArchive = async (
    decision: DocumentReviewDecision,
    notes: string
  ) => {
    const approved = decision === "approved";
    const confirmation = await showConfirm({
      title: approved ? "Setujui Versi Arsip?" : "Tolak Versi Arsip?",
      text: approved
        ? "Versi ini akan ditetapkan sebagai versi aktif."
        : "Versi aktif sebelumnya tetap dipertahankan.",
      confirmButtonText: approved ? "Setujui" : "Tolak",
      icon: approved ? "question" : "warning",
    });
    if (!confirmation.isConfirmed) return;
    setBusyAction("review");
    try {
      setData(
        await documentArchiveService.reviewWorkflow(documentId, {
          decision,
          notes,
        })
      );
      toast.success(approved ? "Arsip disetujui." : "Arsip ditolak.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Review gagal diproses."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const verifyIntegrity = async () => {
    setBusyAction("integrity");
    try {
      await documentArchiveService.verifyIntegrity(documentId);
      await loadGovernance();
      toast.success("Pemeriksaan checksum selesai.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Integritas gagal diperiksa."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const extractVersion = async (versionId: string | number) => {
    setBusyAction(`extract-${versionId}`);
    try {
      await documentArchiveService.extractVersion(documentId, versionId);
      await loadGovernance();
      toast.success("Ekstraksi teks selesai.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ekstraksi teks gagal."
      );
    } finally {
      setBusyAction(null);
    }
  };

  if (loading && !data) {
    return (
      <div role="status" className="p-12 text-center text-xs font-bold text-slate-500">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-blue-700" />
        Memuat tata kelola arsip...
      </div>
    );
  }

  if (!data) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="text-sm font-black text-rose-700">{errorMessage}</p>
        <button onClick={loadGovernance} className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white">
          Coba Lagi
        </button>
      </div>
    );
  }

  const canReview = hasRole(["superadmin", "admin_umum"]);
  const latest = data.latest_version || data.current_version;
  const workflowStatus: DocumentGovernanceStatus =
    data.latest_version &&
    data.latest_version.id !== data.current_version?.id &&
    ["draft", "pending_review", "rejected"].includes(data.latest_version.status)
      ? (data.latest_version.status as DocumentGovernanceStatus)
      : data.governance_status;
  const summaryCards = [
    { label: "Kode Arsip", value: data.archive_code || "Belum dibuat", icon: Archive },
    { label: "Governance", value: data.governance_status.replaceAll("_", " "), icon: ShieldCheck },
    { label: "Penyimpanan", value: data.storage_status.replaceAll("_", " "), icon: Database },
    { label: "Versi Terbaru", value: latest?.version_label || "Belum ada", icon: FileCheck2 },
  ];

  return (
    <main className="w-full space-y-6 font-sans pb-12">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/dashboard/dokumen" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Repository
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
              {data.jenis} · {data.tahun}
            </p>
            <h1 className="mt-1 text-xl font-black text-slate-900">{data.title}</h1>
            <p className="mt-1 text-xs text-slate-500">{data.owner_opd || data.bidang}</p>
          </div>
          {data.preview_url && (
            <a href={resolveDocumentUrl(data.preview_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-amber-300">
              <ExternalLink className="h-4 w-4" /> Preview Privat
            </a>
          )}
        </div>
      </header>

      <section aria-label="Ringkasan arsip" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <card.icon className="h-4 w-4 text-blue-700" />
            <p className="mt-3 text-[10px] font-bold uppercase text-blue-700">{card.label}</p>
            <p className="mt-1 text-sm font-black capitalize text-blue-950">{card.value}</p>
          </article>
        ))}
      </section>

      <div aria-live="polite" className="sr-only">{busyAction ? "Permintaan sedang diproses" : "Siap"}</div>

      {canReview && <ArchiveMetadataForm metadata={data} saving={busyAction === "metadata"} onSave={saveMetadata} />}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ArchiveVersionPanel currentVersion={data.latest_version || data.current_version} versions={data.versions} busyAction={busyAction} onCreateVersion={createVersion} onVerifyIntegrity={verifyIntegrity} onExtractVersion={extractVersion} />
        <ArchiveWorkflowPanel status={workflowStatus} approvalLogs={data.approval_logs} busyAction={busyAction} canReview={canReview} onSubmitReview={submitReview} onReview={reviewArchive} />
      </div>
    </main>
  );
}
