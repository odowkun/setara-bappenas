"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
  Trash2,
  ExternalLink,
} from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import {
  officialContentService,
  type TaxonomyItem,
} from "@/services/officialContentService";
import { toast } from "@/lib/swal";

export default function EditPengumumanPage() {
  const router = useRouter();
  const params = useParams();
  const annId = params?.id as string;

  const [title, setTitle] = useState("");
  const [typeItems, setTypeItems] = useState<TaxonomyItem[]>([]);
  const [typeList, setTypeList] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("");

  // Inline Type Creator State
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  // Validity Date Toggle
  const [hasExpiryDate, setHasExpiryDate] = useState(true);
  const [validUntil, setValidUntil] = useState(new Date().toISOString().slice(0, 10));

  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image" | "video" | "doc" | "none">("none");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load stored announcement types and target announcement item
  useEffect(() => {
    Promise.all([
      officialContentService.getAnnouncementTypes(),
      officialContentService.getAnnouncement(annId),
    ])
      .then(([types, announcement]) => {
        setTypeItems(types);
        setTypeList(types.map((item) => item.name));
        setTitle(announcement.title);
        setSelectedType(announcement.type);
        setHasExpiryDate(Boolean(announcement.validUntil));
        if (announcement.validUntil) setValidUntil(announcement.validUntil);
        setContent(announcement.content);
        setIsImportant(announcement.isImportant);
        setIsPublished(announcement.isPublished);
        setFileUrl(announcement.pdfUrl);
        const mime = announcement.fileType;
        if (mime.includes("pdf")) setFileType("pdf");
        else if (mime.includes("image")) setFileType("image");
        else if (mime.includes("video")) setFileType("video");
        else if (mime) setFileType("doc");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Pengumuman gagal dimuat."))
      .finally(() => setLoading(false));
  }, [annId]);

  const handleAddNewType = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    if (!typeList.includes(trimmed)) {
      try {
        const created = await officialContentService.createAnnouncementType(trimmed);
        setTypeItems((current) => [...current, created]);
        setTypeList((current) => [...current, created.name]);
        setSelectedType(created.name);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Tipe gagal disimpan.");
        return;
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
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Ukuran berkas melebihi batas maksimal yang diizinkan (500 MB).");
      return;
    }
    setAttachment(file);
    setFileUrl(file.name);

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

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan isi pengumuman wajib diisi.");
      return;
    }

    const type = typeItems.find((item) => item.name === selectedType);
    if (!type) {
      toast.error("Pilih tipe pengumuman resmi.");
      return;
    }

    const formData = new FormData();
    formData.append("announcement_type_id", String(type.id));
    formData.append("title", title.trim());
    formData.append("content", content.trim());
    formData.append("is_important", isImportant ? "1" : "0");
    formData.append("is_published", publish ? "1" : "0");
    formData.append("valid_until", hasExpiryDate && validUntil ? validUntil : "");
    if (attachment) formData.append("attachment", attachment);

    try {
      await officialContentService.saveAnnouncement(formData, annId);
      setIsSaved(true);
      setIsPublished(publish);
      toast.success(publish
        ? "Perubahan tersimpan dan pengumuman diterbitkan."
        : "Perubahan tersimpan sebagai draf.");
      router.push("/dashboard/pengumuman");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pengumuman gagal diperbarui.");
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 font-sans pb-12 animate-pulse">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-5 w-48 bg-slate-200 rounded-lg" />
              <div className="h-3.5 w-64 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-11 w-full bg-slate-100 rounded-2xl" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-36 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
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

          {/* DOKUMEN PERENCANAAN STYLE ATTACHMENT DROPZONE */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Lampiran Dokumen / Media Resmi (PDF, Foto, atau Video)
            </label>

            {!fileUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => {
                  const input = document.getElementById("pengumuman-edit-file-input") as HTMLInputElement;
                  input?.click();
                }}
                className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center relative overflow-hidden group shadow-xs ${
                  isDragOver
                    ? "border-blue-600 bg-blue-50/80 scale-[1.01] shadow-lg shadow-blue-500/10"
                    : "border-slate-200 hover:border-blue-500 bg-white hover:bg-slate-50/50"
                }`}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-700/20 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-7 h-7 text-white" />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-black text-slate-900 text-xs sm:text-sm tracking-tight group-hover:text-blue-700 transition">
                      Pilih atau Tarik Berkas Lampiran Pengumuman Di Sini
                    </h3>
                    <p className="text-slate-500 font-medium text-[11px]">
                      Mendukung berkas dokumen PDF, format gambar (JPG/PNG), atau video resmi
                    </p>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-black text-[10px] border border-blue-200 shadow-2xs flex items-center gap-1">
                      <span>Maks. 500 MB</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 font-black text-[10px] border border-red-200/80 shadow-2xs flex items-center gap-1">
                      <FileText className="w-3 h-3 text-red-600" />
                      <span>PDF</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-200/80 shadow-2xs flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span>DOCX</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-black text-[10px] border border-purple-200/80 shadow-2xs flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-purple-600" />
                      <span>JPG / PNG</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-black text-[10px] border border-amber-200/80 shadow-2xs flex items-center gap-1">
                      <Video className="w-3 h-3 text-amber-600" />
                      <span>MP4 / WEBM</span>
                    </span>
                  </div>
                </div>

                <input
                  id="pengumuman-edit-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4,.webm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            ) : (
              /* Selected File Card View */
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-blue-700/20">
                    {fileType === "pdf" && <FileText className="w-6 h-6" />}
                    {fileType === "image" && <ImageIcon className="w-6 h-6" />}
                    {fileType === "video" && <Video className="w-6 h-6" />}
                    {fileType !== "pdf" && fileType !== "image" && fileType !== "video" && (
                      <Paperclip className="w-6 h-6" />
                    )}
                  </div>
                  <div className="overflow-hidden space-y-1">
                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                      {decodeURIComponent(fileUrl.split("/").pop() || fileUrl)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                        {fileType.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Berkas Terlampir</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {fileUrl.startsWith("http") || fileUrl.startsWith("/storage") ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition shadow-2xs"
                      title="Lihat Berkas"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                      <span>Buka File</span>
                    </a>
                  ) : null}

                  <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 hover:border-blue-300 transition shadow-2xs">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ganti Berkas</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4,.webm"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      setFileUrl("");
                      setFileType("none");
                    }}
                    className="px-3 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 border border-transparent hover:border-rose-200 transition cursor-pointer"
                    title="Hapus Lampiran"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            )}
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
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/pengumuman"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center justify-center flex items-center"
          >
            Batal
          </Link>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-black text-xs border border-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan sebagai Draf</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isPublished ? "Simpan Tetap Tayang" : "Simpan & Terbitkan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
