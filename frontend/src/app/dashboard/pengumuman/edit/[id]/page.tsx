"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Megaphone,
  Save,
  CheckCircle2,
  Plus,
  Check,
  X,
  FileText,
  UploadCloud,
  FileCheck,
  Calendar,
  Image as ImageIcon,
  Video,
  Pin,
  Paperclip,
} from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";

const DEFAULT_ANNOUNCEMENT_TYPES = [
  "Pengumuman Resmi",
  "Surat Edaran",
  "Informasi Tender / Lelang",
  "Rekrutmen / Seleksi",
  "Himbauan Publik",
];

const TYPES_KEY = "bappeda_announcement_types";

export default function EditPengumumanPage() {
  const router = useRouter();
  const params = useParams();
  const annId = params?.id as string;
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [typeList, setTypeList] = useState<string[]>(DEFAULT_ANNOUNCEMENT_TYPES);
  const [selectedType, setSelectedType] = useState("Pengumuman Resmi");

  // Inline Type Creator State
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  // Validity Date Toggle
  const [hasExpiryDate, setHasExpiryDate] = useState(true);
  const [validUntil, setValidUntil] = useState("2026-12-31");

  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "image" | "video" | "doc" | "none">("none");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load stored announcement types and target announcement item
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TYPES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTypeList(Array.from(new Set([...DEFAULT_ANNOUNCEMENT_TYPES, ...parsed])));
          }
        } catch (e) {
          console.error("Gagal parse tipe pengumuman:", e);
        }
      }
    }

    // Default mock load for demo
    if (annId) {
      setTitle("Pengumuman Seleksi Penerimaan Tenaga Pendamping Perencanaan BAPPEDA Halut 2026");
      setSelectedType("Rekrutmen / Seleksi");
      setHasExpiryDate(true);
      setValidUntil("2026-08-31");
      setContent("Diberitahukan kepada seluruh calon pelamar bahwa pendaftaran seleksi administrasi dibuka mulai tanggal 1 s/d 15 Agustus 2026 secara online.");
      setIsImportant(true);
      setFileUrl("/documents/pengumuman-seleksi-tenaga-pendamping-2026.pdf");
      setFileType("pdf");
    }
    setLoading(false);
  }, [annId]);

  const handleAddNewType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    if (!typeList.includes(trimmed)) {
      const updated = [...typeList, trimmed];
      setTypeList(updated);
      setSelectedType(trimmed);
      if (typeof window !== "undefined") {
        localStorage.setItem(TYPES_KEY, JSON.stringify(updated));
      }
    } else {
      setSelectedType(trimmed);
    }

    setNewTypeName("");
    setShowAddType(false);
  };

  const handleSelectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__ADD_NEW__") {
      setShowAddType(true);
    } else {
      setSelectedType(val);
    }
  };

  const handleFileUpload = (file: File) => {
    const fakeUrl = `/documents/${file.name}`;
    setFileUrl(fakeUrl);

    if (file.type.includes("pdf")) {
      setFileType("pdf");
    } else if (file.type.includes("image")) {
      setFileType("image");
    } else if (file.type.includes("video")) {
      setFileType("video");
    } else {
      setFileType("doc");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaved(true);
    setTimeout(() => {
      router.push("/dashboard/pengumuman");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 font-bold animate-pulse bg-white rounded-3xl border border-slate-200 max-w-[1400px] mx-auto">
        Memuat data pengumuman...
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-[1400px] mx-auto font-sans">
      {/* HEADER CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pengumuman"
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs shrink-0"
            title="Kembali ke Pengumuman"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Edit Pengumuman / Edaran Resmi</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Perbarui judul, tipe, tanggal masa berlaku, narasi edaran, serta dokumen lampiran.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengumuman Berhasil Diperbarui!</span>
          </div>
        )}
      </div>

      {/* FORM UTAMA */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Pengumuman *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengumuman Seleksi Penerimaan Tenaga Pendamping Perencanaan 2026..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* TIPE PENGUMUMAN SELECT + INLINE CREATOR */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Tipe Pengumuman *</span>
                {!showAddType && (
                  <button
                    type="button"
                    onClick={() => setShowAddType(true)}
                    className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Tipe Baru</span>
                  </button>
                )}
              </label>

              {showAddType ? (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-blue-50 border border-blue-200 animate-in fade-in">
                  <input
                    type="text"
                    autoFocus
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Ketik tipe pengumuman baru..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewType}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddType(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <SearchableSelect
                  options={[
                    ...typeList.map((t) => ({ value: t, label: t })),
                    { value: "__ADD_NEW__", label: "+ Buat Tipe Pengumuman Baru..." },
                  ]}
                  value={selectedType}
                  onChange={(val) => {
                    if (val === "__ADD_NEW__") {
                      setShowAddType(true);
                    } else {
                      setSelectedType(String(val));
                    }
                  }}
                  placeholder="-- Pilih Tipe Pengumuman --"
                  searchPlaceholder="Cari tipe pengumuman..."
                />
              )}
            </div>

            {/* MASA BERLAKU WITH TOGGLE ON/OFF */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Berlaku Sampai Tanggal
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExpiryDate}
                    onChange={(e) => setHasExpiryDate(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-[11px] font-bold text-slate-600">
                    {hasExpiryDate ? "Ada Masa Berlaku" : "Permanen (Tanpa Batas)"}
                  </span>
                </label>
              </div>

              {hasExpiryDate ? (
                <CustomDatePicker
                  value={validUntil}
                  onChange={(val) => setValidUntil(val)}
                  minYear={2020}
                  maxYear={2035}
                />
              ) : (
                <input
                  type="text"
                  disabled
                  value="Tidak Ada Batas Waktu (Permanen)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-400 cursor-not-allowed"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Isi / Ringkasan Narasi Pengumuman *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan rinci narasi atau petunjuk pengumuman di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
            />
          </div>

          {/* MULTI-FORMAT DOCUMENT / MEDIA ATTACHMENT (PDF, IMAGE, VIDEO) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lampiran Dokumen / Media Resmi (PDF, Foto, atau Video)
            </label>
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 overflow-hidden">
                {fileType === "pdf" && <FileText className="w-4 h-4 text-blue-600 shrink-0" />}
                {fileType === "image" && <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />}
                {fileType === "video" && <Video className="w-4 h-4 text-rose-600 shrink-0" />}
                {fileType === "none" && <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />}

                {fileUrl ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold text-emerald-800 truncate">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-xs">{fileUrl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl("");
                        setFileType("none");
                      }}
                      className="p-0.5 rounded-full hover:bg-emerald-200 text-emerald-700 transition"
                      title="Hapus File"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    Belum ada dokumen PDF, foto, atau video terlampir
                  </span>
                )}
              </div>

              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 font-bold text-xs transition shrink-0 shadow-2xs">
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>{fileUrl ? "Ganti File" : "Unggah Lampiran"}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4,.webm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* PINNED CHECKBOX */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isImportant"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="isImportant" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              <span>Tandai sebagai Pengumuman Penting (Pinned to Top)</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/pengumuman"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengumuman</span>
          </button>
        </div>
      </form>
    </div>
  );
}
