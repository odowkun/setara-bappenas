"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, Save, Tags } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import {
  DocumentClassification,
  DocumentGovernanceData,
  DocumentGovernanceUpdate,
} from "@/services/documentArchiveService";
import { ArchiveTextField } from "./ArchiveTextField";

interface ArchiveMetadataFormProps {
  metadata: DocumentGovernanceData;
  saving: boolean;
  onSave: (input: DocumentGovernanceUpdate) => Promise<void>;
}

const CLASSIFICATION_OPTIONS = [
  { value: "public", label: "Publik" },
  { value: "internal", label: "Internal BAPPEDA" },
  { value: "confidential", label: "Rahasia" },
  { value: "restricted", label: "Akses Terbatas" },
];

const RETENTION_OPTIONS = [
  { value: "permanent", label: "Permanen" },
  { value: "active_5_years", label: "Aktif 5 Tahun" },
  { value: "active_10_years", label: "Aktif 10 Tahun" },
  { value: "custom", label: "Tanggal Khusus" },
];

export function ArchiveMetadataForm({
  metadata,
  saving,
  onSave,
}: ArchiveMetadataFormProps) {
  const [documentNumber, setDocumentNumber] = useState("");
  const [ownerOpd, setOwnerOpd] = useState("");
  const [classification, setClassification] =
    useState<DocumentClassification>("internal");
  const [keywords, setKeywords] = useState("");
  const [effectiveAt, setEffectiveAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [retentionPolicy, setRetentionPolicy] =
    useState<DocumentGovernanceUpdate["retention_policy"]>("permanent");
  const [retentionUntil, setRetentionUntil] = useState("");
  const [legalHold, setLegalHold] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    setDocumentNumber(metadata.document_number || "");
    setOwnerOpd(metadata.owner_opd || "");
    setClassification(metadata.classification);
    setKeywords(metadata.keywords.join(", "));
    setEffectiveAt(metadata.effective_at || "");
    setExpiresAt(metadata.expires_at || "");
    setRetentionPolicy(metadata.retention_policy);
    setRetentionUntil(metadata.retention_until || "");
    setLegalHold(metadata.legal_hold);
    setReviewNote(metadata.review_note || "");
  }, [metadata]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      document_number: documentNumber.trim() || null,
      owner_opd: ownerOpd.trim() || null,
      classification,
      keywords: keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      effective_at: effectiveAt || null,
      expires_at: expiresAt || null,
      retention_policy: retentionPolicy,
      retention_until:
        retentionPolicy === "custom" ? retentionUntil || null : null,
      legal_hold: legalHold,
      review_note: reviewNote.trim() || null,
    });
  };

  return (
    <section
      aria-labelledby="archive-metadata-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Tags className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="archive-metadata-heading"
            className="text-sm font-black text-slate-900"
          >
            Metadata Tata Kelola Arsip
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Metadata klasifikasi, periode berlaku, dan retensi dokumen resmi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ArchiveTextField
            id="document-number"
            label="Nomor Dokumen"
            value={documentNumber}
            onChange={setDocumentNumber}
            placeholder="Contoh: 000.7/123/BAPPEDA/2026"
          />
          <ArchiveTextField
            id="owner-opd"
            label="OPD Pemilik Arsip"
            value={ownerOpd}
            onChange={setOwnerOpd}
            placeholder="BAPPEDA Kabupaten Halmahera Utara"
          />
          <div>
            <span className="mb-1.5 block text-xs font-extrabold text-slate-700">
              Klasifikasi Keamanan
            </span>
            <SearchableSelect
              options={CLASSIFICATION_OPTIONS}
              value={classification}
              onChange={(value) =>
                setClassification(String(value) as DocumentClassification)
              }
              placeholder="Pilih klasifikasi"
              searchPlaceholder="Cari klasifikasi..."
            />
          </div>
          <ArchiveTextField
            id="document-keywords"
            label="Kata Kunci"
            value={keywords}
            onChange={setKeywords}
            placeholder="RKPD, pembangunan, 2026"
          />
          <CustomDatePicker
            label="Tanggal Berlaku"
            value={effectiveAt}
            onChange={setEffectiveAt}
            minYear={2000}
            maxYear={2100}
          />
          <CustomDatePicker
            label="Tanggal Berakhir"
            value={expiresAt}
            onChange={setExpiresAt}
            minYear={2000}
            maxYear={2100}
          />
          <div>
            <span className="mb-1.5 block text-xs font-extrabold text-slate-700">
              Kebijakan Retensi
            </span>
            <SearchableSelect
              options={RETENTION_OPTIONS}
              value={retentionPolicy}
              onChange={(value) =>
                setRetentionPolicy(
                  String(
                    value
                  ) as DocumentGovernanceUpdate["retention_policy"]
                )
              }
              placeholder="Pilih kebijakan retensi"
              searchPlaceholder="Cari kebijakan..."
            />
          </div>
          {retentionPolicy === "custom" && (
            <CustomDatePicker
              label="Retensi Sampai"
              value={retentionUntil}
              onChange={setRetentionUntil}
              minYear={2026}
              maxYear={2100}
            />
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <input
            type="checkbox"
            checked={legalHold}
            onChange={(event) => setLegalHold(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-400 text-blue-700 focus:ring-blue-600"
          />
          <span>
            <span className="flex items-center gap-2 text-xs font-black text-blue-950">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Legal Hold
            </span>
            <span className="mt-1 block text-[11px] text-slate-600">
              Cegah pemusnahan arsip selama proses audit atau hukum.
            </span>
          </span>
        </label>

        <div>
          <label
            htmlFor="archive-review-note"
            className="mb-1.5 block text-xs font-extrabold text-slate-700"
          >
            Catatan Petugas Arsip
          </label>
          <textarea
            id="archive-review-note"
            rows={3}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Menyimpan..." : "Simpan Metadata"}
          </button>
        </div>
      </form>
    </section>
  );
}
