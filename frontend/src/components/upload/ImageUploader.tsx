"use client";

import React, { useState } from "react";
import { compressImageFile, CompressionResult } from "@/utils/imageCompressor";
import { SkeletonImage } from "@/components/ui/SkeletonImage";
import { Upload, CheckCircle2, FileCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/lib/swal";

export const ImageUploader: React.FC = () => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const res = await compressImageFile(file);
      setResult(res);
    } catch (err) {
      toast.error("Gagal mengkompresi gambar.");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-slate-50 border border-slate-200/80 shadow-lg space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Modul Upload & Kompresi Otomatis
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            Upload Gambar Berita / Dokumentasi Bappeda
          </h3>
        </div>
      </div>

      {/* Upload Drag/Drop Box */}
      <div className="relative border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-3xl p-8 text-center bg-white transition cursor-pointer group">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
            {isCompressing ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-7 h-7 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {isCompressing ? "Mengompresi Gambar Tanpa Rusak Pixel..." : "Klik atau Geser File Gambar ke Sini"}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Format JPG, PNG, WEBP. Kompresi otomatis menjaga resolusi piksel tajam.
            </p>
          </div>
        </div>
      </div>

      {/* Result Metrics View */}
      {result && (
        <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Kompresi Berhasil! Hemat {result.savedPercentage}% Kuota
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold text-blue-950">
              {result.originalSizeMB} MB ➔ {result.compressedSizeMB} MB
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Preview Image using Skeleton Loader Component */}
            <div className="rounded-2xl overflow-hidden aspect-video border border-slate-200">
              <SkeletonImage
                src={result.previewUrl}
                alt="Compressed Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <p className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" /> <strong>Nama File:</strong> {result.compressedFile.name}
              </p>
              <p><strong>Ukuran Asli:</strong> {result.originalSizeMB} MB</p>
              <p><strong>Ukuran Hasil Kompresi:</strong> {result.compressedSizeMB} MB</p>
              <p className="text-blue-700 font-bold mt-2">
                ✓ Resolusi piksel gambar dipertahankan secara utuh tanpa blur.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
