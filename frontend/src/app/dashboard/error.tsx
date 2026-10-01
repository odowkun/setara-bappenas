"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { RotateCw, AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Otomatis refresh jika error disebabkan pembaruan chunk deploy baru
    const errorMsg = error?.message || "";
    const isChunkError =
      errorMsg.includes("Loading chunk") ||
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      error?.name === "ChunkLoadError";

    if (isChunkError && typeof window !== "undefined") {
      const storageKey = `dashboard_chunk_reload_${window.location.pathname}`;
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  }, [error]);

  const handleHardReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Emblem & Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>

        {/* Agency Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-black tracking-wide uppercase">
          <span>SISTEM INFORMASI BAPPEDA</span>
        </div>

        {/* Headings */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Sinkronisasi Halaman Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            Halaman memerlukan penyegaran aset atau koneksi terbaru dari server. Data Anda tetap aman.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>

          <button
            type="button"
            onClick={handleHardReload}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan Halaman Penuh</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
          Kabupaten Halmahera Utara &bull; Ruang Kerja Dashboard
        </div>
      </div>
    </div>
  );
}
