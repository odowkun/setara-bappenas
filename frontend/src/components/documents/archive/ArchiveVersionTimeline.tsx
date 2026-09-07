"use client";

import { CheckCircle2, Loader2, ScanText } from "lucide-react";
import { DocumentArchiveVersion } from "@/services/documentArchiveService";

interface ArchiveVersionTimelineProps {
  versions: DocumentArchiveVersion[];
  busyAction: string | null;
  onExtractVersion: (versionId: string | number) => Promise<void>;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function ArchiveVersionTimeline({
  versions,
  busyAction,
  onExtractVersion,
}: ArchiveVersionTimelineProps) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-600">
        Riwayat Versi
      </h3>
      {versions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs font-bold text-slate-500">
          Riwayat versi masih kosong.
        </p>
      ) : (
        <ol className="space-y-3">
          {versions.map((version) => (
            <li
              key={version.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-900">
                    {version.version_label ||
                      `Versi ${version.version_number}`}{" "}
                    · {version.file_name}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {formatDate(version.created_at)} · Status{" "}
                    {version.status.replaceAll("_", " ")}
                  </p>
                  {version.change_summary && (
                    <p className="mt-2 text-[11px] text-slate-600">
                      {version.change_summary}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => onExtractVersion(version.id)}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-extrabold text-blue-800 hover:bg-blue-100 focus-visible:ring-4 focus-visible:ring-amber-300 disabled:opacity-50"
                >
                  {busyAction === `extract-${version.id}` ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : version.extraction_status === "completed" ? (
                    <CheckCircle2
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <ScanText className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Ekstrak Teks
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
