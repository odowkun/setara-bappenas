"use client";

import React, { useState, useRef } from "react";
import { authenticatedFetch } from "@/lib/apiClient";
import { toast } from "@/lib/swal";
import {
  UploadCloud,
  CheckCircle2,
  FileText,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

interface ResumableChunkUploaderProps {
  onUploadSuccess: (fileUrl: string, fileSizeStr: string) => void;
  acceptedTypes?: string;
  chunkSizeMB?: number; // default 5MB
}

import { API_BASE_URL, STORAGE_BASE_URL } from "@/lib/apiClient";

const STORAGE_KEY_PREFIX = "bappeda_chunk_upload_";
const BACKEND_BASE_URL = STORAGE_BASE_URL;

export const ResumableChunkUploader: React.FC<ResumableChunkUploaderProps> = ({
  onUploadSuccess,
  acceptedTypes = ".pdf",
  chunkSizeMB = 5,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [statusText, setStatusText] = useState<string>("Ready");
  const [networkError, setNetworkError] = useState(false);
  const [completedUrl, setCompletedUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAbortedRef = useRef<boolean>(false);

  const CHUNK_SIZE = chunkSizeMB * 1024 * 1024;

  const startResumableUploadForFile = async (fileToUpload: File, initialChunkIndex: number = 0) => {
    setUploading(true);
    setNetworkError(false);
    isAbortedRef.current = false;

    const file = fileToUpload;
    const chunksCount = Math.ceil(file.size / CHUNK_SIZE);
    const fileKey = `${STORAGE_KEY_PREFIX}${file.name}_${file.size}`;

    for (let i = initialChunkIndex; i < chunksCount; i++) {
      if (isAbortedRef.current) break;

      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunkBlob, file.name);
      formData.append("chunk", i.toString());
      formData.append("chunks", chunksCount.toString());

      let chunkUploaded = false;
      let retries = 0;

      while (!chunkUploaded && retries < 5 && !isAbortedRef.current) {
        try {
          setStatusText(`Mengunggah berkas (${(end / 1024 / 1024).toFixed(1)}MB / ${(file.size / 1024 / 1024).toFixed(1)}MB)...`);

          const res = await authenticatedFetch(`${API_BASE_URL}/documents/upload-chunk`, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            chunkUploaded = true;
            setNetworkError(false);
            setCurrentChunk(i + 1);
            const pct = Math.round(((i + 1) / chunksCount) * 100);
            setProgress(pct);

            localStorage.setItem(fileKey, (i + 1).toString());

            if (data.status === "success" && data.watermark_applied === true) {
              const rawPath = data.file_path || `/documents/${file.name}`;
              const finalUrl = rawPath.startsWith("/storage/")
                ? `${BACKEND_BASE_URL}${rawPath}`
                : rawPath;

              const sizeStr = data.file_size || `${(file.size / 1024 / 1024).toFixed(1)} MB`;
              setCompletedUrl(finalUrl);
              setStatusText("✅ Watermark BAPPEDA HALUT berhasil diterapkan!");
              localStorage.removeItem(fileKey);
              onUploadSuccess(finalUrl, sizeStr);
              setUploading(false);
              return;
            }

            if (i + 1 === chunksCount) {
              chunkUploaded = false;
              throw new Error("Server belum mengonfirmasi watermark dokumen");
            }
          } else {
            let errorMsg = `Gagal mengunggah berkas (${res.status})`;
            try {
              const errData = await res.json();
              if (errData?.message) {
                errorMsg = errData.message;
              }
            } catch {
              // ignore json parse error
            }

            // Jika status 4xx (client error / validasi / format belum didukung server), jangan retry berulang-ulang
            if (res.status >= 400 && res.status < 500) {
              setUploading(false);
              setNetworkError(false);
              setStatusText(`❌ ${errorMsg}`);
              toast.error(errorMsg);
              return;
            }

            throw new Error(errorMsg);
          }
        } catch (err: unknown) {
          retries++;
          setNetworkError(true);
          const errorMsg = err instanceof Error ? err.message : "Gangguan koneksi";
          setStatusText(`⚠️ Gangguan jaringan (${errorMsg}), mencoba ulang (${retries}/5)...`);
          await new Promise((r) => setTimeout(r, 2000 * retries));
        }
      }

      if (!chunkUploaded) {
        setStatusText("❌ Gagal mengunggah berkas setelah 5 kali percobaan jaringan. Silakan coba lagi.");
        toast.error("Gagal mengunggah berkas setelah 5 kali percobaan jaringan.");
        setUploading(false);
        return;
      }
    }
  };

  const handleFileSelect = (file: File) => {
    // Validasi ekstensi berkas jika dibatasi (misal: hanya .pdf)
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const allowed = acceptedTypes
      .split(",")
      .map((t) => t.trim().toLowerCase());

    const isAllowed = allowed.some((ext) => {
      if (ext.startsWith(".")) {
        return ext === fileExt;
      }
      return file.type === ext;
    });

    if (!isAllowed) {
      toast.error(
        acceptedTypes === ".pdf"
          ? "Hanya berkas format PDF (.pdf) resmi yang diperbolehkan untuk dokumen perencanaan."
          : `Format berkas tidak diizinkan. Berkas yang diterima: ${acceptedTypes}`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    setProgress(0);
    setCurrentChunk(0);
    setCompletedUrl(null);
    setNetworkError(false);
    setStatusText(`Berkas dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    const fileKey = `${STORAGE_KEY_PREFIX}${file.name}_${file.size}`;
    const savedProgress = localStorage.getItem(fileKey);
    let startChunkIndex = 0;
    if (savedProgress) {
      const parsed = parseInt(savedProgress, 10);
      if (parsed > 0 && parsed < chunks) {
        startChunkIndex = parsed;
        setCurrentChunk(parsed);
        setStatusText(`Ditemukan status unggah sebelumnya: Melanjutkan (${parsed}/${chunks})...`);
      }
    }

    // Auto trigger chunk upload
    setTimeout(() => {
      startResumableUploadForFile(file, startChunkIndex);
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const startResumableUpload = async () => {
    if (!selectedFile) return;
    await startResumableUploadForFile(selectedFile, currentChunk);
  };

  const handlePause = () => {
    isAbortedRef.current = true;
    setUploading(false);
    setStatusText("Unggah dijeda. Klik Lanjutkan untuk meneruskan.");
  };

  const isPdfOnly = acceptedTypes.trim() === ".pdf";

  return (
    <div className="font-sans text-xs">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={isPdfOnly ? ".pdf,application/pdf" : acceptedTypes}
        className="hidden"
      />

      {/* Premium Dropzone UI */}
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center relative overflow-hidden group shadow-sm ${
            isDragOver
              ? "border-blue-600 bg-blue-50/80 scale-[1.01] shadow-lg shadow-blue-500/10"
              : "border-slate-200 hover:border-blue-500 bg-white hover:bg-slate-50/50"
          }`}
        >
          {/* Subtle Background Glow Accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Animated Icon Container */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-700/20 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-8 h-8 text-white" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base tracking-tight group-hover:text-blue-700 transition">
                {isPdfOnly
                  ? "Pilih atau Tarik Berkas Dokumen PDF Di Sini"
                  : "Pilih atau Tarik Berkas Dokumen Di Sini"}
              </h3>
              <p className="text-slate-500 font-medium text-xs">
                {isPdfOnly
                  ? "Format resmi kearsipan BAPPEDA HALUT (Wajib berkas *.pdf)"
                  : "Unggah berkas resmi perencanaan daerah Halmahera Utara"}
              </p>
            </div>

            {/* Allowed Document Format Extension Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
              {isPdfOnly ? (
                <span className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 font-extrabold text-xs border border-red-200/80 shadow-2xs flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Hanya Menerima Dokumen PDF (*.pdf)</span>
                </span>
              ) : (
                <>
                  <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 font-black text-[10px] border border-red-200/80 shadow-2xs flex items-center gap-1">
                    <FileText className="w-3 h-3 text-red-600" />
                    <span>PDF</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-200/80 shadow-2xs flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span>DOCX</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-200/80 shadow-2xs flex items-center gap-1">
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>XLSX</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-black text-[10px] border border-amber-200/80 shadow-2xs flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-600" />
                    <span>PPTX</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-black text-[10px] border border-purple-200/80 shadow-2xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-purple-600" />
                    <span>JPG / PNG</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card View */
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-blue-700/20">
                <FileText className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="font-extrabold text-slate-900 text-sm truncate">{selectedFile.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                    {selectedFile.name.split(".").pop() || "FILE"}
                  </span>
                </div>
              </div>
            </div>

            {!completedUrl && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setUploading(false);
                  setProgress(0);
                  setCurrentChunk(0);
                  setStatusText("Ready");
                  setNetworkError(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-xs font-extrabold text-slate-400 hover:text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition"
              >
                Ganti Berkas
              </button>
            )}
          </div>

          {/* Shimmer Progress Bar */}
          {(uploading || progress > 0) && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700">{statusText}</span>
                <span className="font-mono font-black text-blue-700">{progress}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    networkError
                      ? "bg-amber-500 animate-pulse"
                      : completedUrl
                      ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 shadow-md shadow-blue-600/30"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            {!completedUrl ? (
              !uploading ? (
                <button
                  type="button"
                  onClick={startResumableUpload}
                  className="px-5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold shadow-md shadow-blue-700/20 flex items-center gap-2 transition text-xs active:scale-95"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{progress > 0 ? "Lanjutkan Unggah" : "Mulai Unggah Berkas"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold flex items-center gap-2 transition text-xs active:scale-95"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-800" />
                  <span>Jeda</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-200 font-extrabold text-xs shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Berkas Berhasil Diunggah Utuh!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
