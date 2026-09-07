"use client";

import { FormEvent, useState } from "react";
import {
  FileCheck2,
  FilePlus2,
  Fingerprint,
  Loader2,
} from "lucide-react";
import { ResumableChunkUploader } from "@/components/ui/ResumableChunkUploader";
import { ArchiveVersionTimeline } from "./ArchiveVersionTimeline";
import { DocumentArchiveVersion } from "@/services/documentArchiveService";

interface ArchiveVersionPanelProps {
  currentVersion: DocumentArchiveVersion | null;
  versions: DocumentArchiveVersion[];
  busyAction: string | null;
  onCreateVersion: (
    filePath: string,
    changeSummary: string
  ) => Promise<void>;
  onVerifyIntegrity: () => Promise<void>;
  onExtractVersion: (versionId: string | number) => Promise<void>;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
};

function StatusBadge({ value, label }: { value: string; label: string }) {
  const style =
    value === "valid" || value === "completed"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : value === "failed" || value === "mismatch" || value === "missing"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${style}`}
    >
      {label}: {value.replaceAll("_", " ")}
    </span>
  );
}

export function ArchiveVersionPanel({
  currentVersion,
  versions,
  busyAction,
  onCreateVersion,
  onVerifyIntegrity,
  onExtractVersion,
}: ArchiveVersionPanelProps) {
  const [uploadedPath, setUploadedPath] = useState("");
  const [uploadedSize, setUploadedSize] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  const handleCreateVersion = async (event: FormEvent) => {
    event.preventDefault();
    if (!uploadedPath) return;
    await onCreateVersion(uploadedPath, changeSummary);
    setUploadedPath("");
    setUploadedSize("");
    setChangeSummary("");
  };

  return (
    <section
      aria-labelledby="archive-version-heading"
      className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <FileCheck2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="archive-version-heading"
            className="text-sm font-black text-slate-900"
          >
            Versi, Integritas, dan Ekstraksi Teks
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Revisi baru tidak menimpa versi aktif sebelumnya.
          </p>
        </div>
      </div>

      {currentVersion ? (
        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                {currentVersion.status === "approved"
                  ? "Versi aktif"
                  : "Versi terbaru"}{" "}
                {currentVersion.version_label ||
                  currentVersion.version_number}
              </span>
              <h3 className="mt-1 text-sm font-black text-blue-950">
                {currentVersion.file_name}
              </h3>
              <p className="mt-1 text-[11px] text-slate-600">
                {formatBytes(currentVersion.file_size_bytes)} ·{" "}
                {currentVersion.searchable_characters.toLocaleString("id-ID")}{" "}
                karakter dapat dicari
              </p>
            </div>
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={onVerifyIntegrity}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-700 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-amber-300 disabled:bg-slate-300"
            >
              {busyAction === "integrity" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Fingerprint className="h-4 w-4" aria-hidden="true" />
              )}
              Verifikasi SHA-256
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge
              value={currentVersion.integrity_status}
              label="Integritas"
            />
            <StatusBadge
              value={currentVersion.extraction_status}
              label="Ekstraksi"
            />
          </div>
          <div className="mt-3 rounded-xl border border-blue-100 bg-white/80 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Checksum SHA-256
            </p>
            <code className="mt-1 block break-all text-[10px] font-bold text-slate-700">
              {currentVersion.checksum_sha256 || "Belum dihitung"}
            </code>
          </div>
        </article>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs font-bold text-slate-500">
          Belum ada versi berkas yang tersimpan.
        </p>
      )}

      <form
        onSubmit={handleCreateVersion}
        className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
      >
        <h3 className="flex items-center gap-2 text-xs font-black text-slate-800">
          <FilePlus2 className="h-4 w-4 text-blue-700" aria-hidden="true" />
          Tambahkan Versi Ber-watermark
        </h3>
        {!uploadedPath ? (
          <ResumableChunkUploader
            acceptedTypes=".pdf"
            chunkSizeMB={5}
            onUploadSuccess={(filePath, fileSize) => {
              setUploadedPath(filePath);
              setUploadedSize(fileSize);
            }}
          />
        ) : (
          <p
            role="status"
            className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-900"
          >
            PDF privat ber-watermark siap dipakai sebagai versi baru
            {uploadedSize ? ` (${uploadedSize})` : ""}.
          </p>
        )}
        <div>
          <label
            htmlFor="archive-version-summary"
            className="mb-1.5 block text-xs font-extrabold text-slate-700"
          >
            Ringkasan Perubahan
          </label>
          <textarea
            id="archive-version-summary"
            rows={2}
            required
            value={changeSummary}
            onChange={(event) => setChangeSummary(event.target.value)}
            placeholder="Jelaskan perubahan pada versi ini..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
        </div>
        <button
          type="submit"
          disabled={!uploadedPath || busyAction !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-amber-300 disabled:bg-slate-300"
        >
          {busyAction === "version" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          )}
          Simpan Versi Baru
        </button>
      </form>

      <ArchiveVersionTimeline
        versions={versions}
        busyAction={busyAction}
        onExtractVersion={onExtractVersion}
      />
    </section>
  );
}
