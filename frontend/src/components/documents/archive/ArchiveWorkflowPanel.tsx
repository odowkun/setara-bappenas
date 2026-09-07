"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  DocumentApprovalLog,
  DocumentGovernanceStatus,
  DocumentReviewDecision,
} from "@/services/documentArchiveService";

interface ArchiveWorkflowPanelProps {
  status: DocumentGovernanceStatus;
  approvalLogs: DocumentApprovalLog[];
  busyAction: string | null;
  canReview: boolean;
  onSubmitReview: (notes: string) => Promise<void>;
  onReview: (
    decision: DocumentReviewDecision,
    notes: string
  ) => Promise<void>;
}

const REVIEW_OPTIONS = [
  { value: "approved", label: "Setujui Arsip" },
  { value: "rejected", label: "Tolak dan Kembalikan" },
];

const statusLabel: Record<DocumentGovernanceStatus, string> = {
  draft: "Draf",
  pending_review: "Menunggu Review",
  approved: "Disetujui",
  rejected: "Ditolak",
  archived: "Diarsipkan",
  pending_migration: "Menunggu Migrasi",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function ArchiveWorkflowPanel({
  status,
  approvalLogs,
  busyAction,
  canReview,
  onSubmitReview,
  onReview,
}: ArchiveWorkflowPanelProps) {
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [reviewDecision, setReviewDecision] =
    useState<DocumentReviewDecision>("approved");
  const [reviewNotes, setReviewNotes] = useState("");

  const canSubmit = status === "draft" || status === "rejected";
  const awaitingReview = status === "pending_review";
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmitReview(submissionNotes);
    setSubmissionNotes("");
  };
  const handleReview = async (event: FormEvent) => {
    event.preventDefault();
    await onReview(reviewDecision, reviewNotes);
    setReviewNotes("");
  };
  return (
    <section
      aria-labelledby="archive-workflow-heading"
      className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <History className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="archive-workflow-heading"
              className="text-sm font-black text-slate-900"
            >
              Workflow Persetujuan
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Pengajuan dan keputusan reviewer tercatat sebagai jejak audit.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-800">
          {statusLabel[status]}
        </span>
      </div>
      {canSubmit && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4"
        >
          <label
            htmlFor="archive-submission-notes"
            className="text-xs font-extrabold text-blue-950"
          >
            Catatan Pengajuan
          </label>
          <textarea
            id="archive-submission-notes"
            value={submissionNotes}
            onChange={(event) => setSubmissionNotes(event.target.value)}
            rows={3}
            required
            placeholder="Jelaskan kesiapan metadata dan berkas untuk direview..."
            className="w-full resize-none rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
          <button
            type="submit"
            disabled={busyAction !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:bg-slate-300"
          >
            {busyAction === "submit" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Ajukan untuk Review
          </button>
        </form>
      )}

      {awaitingReview && canReview && (
        <form
          onSubmit={handleReview}
          className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <div>
            <span className="mb-1.5 block text-xs font-extrabold text-blue-950">
              Keputusan Reviewer
            </span>
            <SearchableSelect
              options={REVIEW_OPTIONS}
              value={reviewDecision}
              onChange={(value) =>
                setReviewDecision(String(value) as DocumentReviewDecision)
              }
              placeholder="Pilih keputusan"
              searchPlaceholder="Cari keputusan..."
            />
          </div>
          <div>
            <label
              htmlFor="archive-review-notes"
              className="mb-1.5 block text-xs font-extrabold text-blue-950"
            >
              Catatan Review
            </label>
            <textarea
              id="archive-review-notes"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              rows={3}
              required={reviewDecision === "rejected"}
              placeholder="Tuliskan hasil pemeriksaan atau alasan penolakan..."
              className="w-full resize-none rounded-2xl border border-amber-200 bg-white px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>
          <button
            type="submit"
            disabled={busyAction !== null}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:bg-slate-300 ${
              reviewDecision === "approved"
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-rose-700 hover:bg-rose-800"
            }`}
          >
            {busyAction === "review" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : reviewDecision === "approved" ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden="true" />
            )}
            {reviewDecision === "approved"
              ? "Setujui Arsip"
              : "Tolak Arsip"}
          </button>
        </form>
      )}

      {!canSubmit && !(awaitingReview && canReview) && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-600"
        >
          <Clock3 className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
          Tidak ada tindakan workflow yang tersedia untuk akun dan status ini.
        </div>
      )}

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-600">
          Log Persetujuan
        </h3>
        {approvalLogs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs font-bold text-slate-500">
            Belum ada aktivitas persetujuan.
          </p>
        ) : (
          <ol className="space-y-3">
            {approvalLogs.map((log) => (
              <li
                key={log.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black capitalize text-slate-900">
                      {log.action.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                      {log.actor
                        ? `${log.actor.name} (${log.actor.role})`
                        : "Sistem"}{" "}
                      ·{" "}
                      {log.from_status || "awal"} ke {log.to_status || "-"}
                    </p>
                  </div>
                  <time className="text-[10px] font-bold text-slate-400">
                    {formatDate(log.created_at)}
                  </time>
                </div>
                {log.note && (
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                    {log.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
