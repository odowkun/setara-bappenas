"use client";

import React, { useState, useRef, useEffect } from "react";
import { authenticatedFetch } from "@/lib/apiClient";
import {
  Image as ImageIcon,
  Zap,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Video,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface OptimizedMediaUploaderProps {
  onUploadSuccess: (mediaData: {
    masterUrl: string;
    webUrl: string;
    thumbUrl: string;
  }) => void;
  onUploadStatusChange?: (isUploading: boolean) => void;
  initialUrl?: string;
  label?: string;
  acceptType?: "image" | "video" | "all";
}

export const OptimizedMediaUploader: React.FC<OptimizedMediaUploaderProps> = ({
  onUploadSuccess,
  onUploadStatusChange,
  initialUrl,
  label = "Unggah Foto Sampul Berita Utama",
  acceptType = "image",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [optimizedData, setOptimizedData] = useState<{
    masterUrl: string;
    webUrl: string;
    thumbUrl: string;
    originalSize: string;
    webSize: string;
    savings: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialUrl if given
  useEffect(() => {
    if (initialUrl && !file && !optimizedData) {
      setPreviewUrl(initialUrl);
    }
  }, [initialUrl, file, optimizedData]);

  const acceptAttribute =
    acceptType === "image"
      ? "image/jpeg,image/png,image/webp,image/jpg,image/avif"
      : acceptType === "video"
      ? "video/mp4,video/webm"
      : "image/*,video/*";

  const performUpload = async (targetFile: File) => {
    setUploading(true);
    setUploadError("");
    onUploadStatusChange?.(true);

    const formData = new FormData();
    formData.append("media", targetFile);

    try {
      const res = await authenticatedFetch("/media/upload-optimized", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        const result = {
          masterUrl: data.master_url,
          webUrl: data.web_url,
          thumbUrl: data.thumb_url,
          originalSize: data.original_size,
          webSize: data.web_optimized_size,
          savings: data.savings_percentage,
        };
        setOptimizedData(result);

        onUploadSuccess({
          masterUrl: data.master_url,
          webUrl: data.web_url,
          thumbUrl: data.thumb_url,
        });
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || "Gagal mengunggah media ke server.");
      }
    } catch (err: unknown) {
      console.error("Unggah media resmi gagal:", err);
      const msg = err instanceof Error ? err.message : "Media belum tersimpan. Periksa koneksi lalu coba lagi.";
      setUploadError(msg);
    } finally {
      setUploading(false);
      onUploadStatusChange?.(false);
    }
  };

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setOptimizedData(null);
      setUploadError("");
      // Otomatis unggah langsung begitu berkas dipilih
      await performUpload(selected);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setOptimizedData(null);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3.5 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-extrabold text-slate-900">{label}</span>
        </div>
        {uploading && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Mengunggah &amp; Memproses WebP...</span>
          </span>
        )}
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{uploadError}</span>
          </div>
          {file && (
            <button
              type="button"
              onClick={() => performUpload(file)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] flex items-center gap-1 shrink-0 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Coba Lagi</span>
            </button>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleSelectFile}
        accept={acceptAttribute}
        className="hidden"
      />

      {!file && !previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white cursor-pointer text-center space-y-2 transition group hover:shadow-xs"
        >
          <ImageIcon className="w-8 h-8 text-blue-600 mx-auto group-hover:scale-110 transition" />
          <div>
            <p className="font-black text-slate-900">
              {acceptType === "image"
                ? "Klik / Drop Foto Sampul Utama (JPG, PNG, WebP)"
                : "Klik / Drop File Media"}
            </p>
            <p className="text-slate-500 font-medium text-[11px] mt-0.5">
              Otomatis diunggah &amp; dikonversi ke WebP Dual-Variant (HD Asli + 95% Lebih Ringan untuk Publik)
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-4">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview Sampul"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/bappeda/default-news-cover.jpg";
                }}
              />
            )}
            {!previewUrl && file?.type.startsWith("video/") && (
              <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Video className="w-6 h-6 text-amber-400" />
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-slate-900 truncate">
                {file ? file.name : "Foto Sampul Terpasang"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {file
                  ? `Ukuran Berkas: ${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : "Siap tayang pada portal berita resmi"}
              </p>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition disabled:opacity-50 cursor-pointer"
            >
              Ganti Foto
            </button>
          </div>

          {/* Uploading Progress Indicator */}
          {uploading && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 font-bold text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-black">Mengunggah &amp; Mengoptimasi WebP Dual-Variant...</p>
                <p className="text-[11px] text-amber-700 font-normal">
                  Sistem otomatis mengompresi gambar untuk kecepatan loading warga. Mohon tunggu beberapa detik.
                </p>
              </div>
            </div>
          )}

          {/* Optimized Dual Variant Cards Display */}
          {optimizedData && !uploading && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Foto Berhasil Diunggah &amp; Teroptimasi Otomatis!</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Variant 1: Master Original 4K */}
                <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      1. Master HD Asli
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {optimizedData.originalSize}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Tersimpan utuh untuk arsip &amp; download resolusi penuh.</p>
                </div>

                {/* Variant 2: Web-Optimized WebP */}
                <div className="p-3 rounded-xl bg-white border border-amber-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      2. Varian Web (WebP)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {optimizedData.webSize}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold">
                    ⚡ {optimizedData.savings}! Halaman warga terbuka dalam 0.3 detik.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
