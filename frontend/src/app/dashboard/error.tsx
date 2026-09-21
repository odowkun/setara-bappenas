"use client";

import React, { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error Boundary caught error:", error);

    const isChunkError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("failed to fetch dynamically imported module") ||
      error?.message?.includes("Load failed");

    if (isChunkError && typeof window !== "undefined") {
      const storageKey = `chunk_reload_${window.location.pathname}`;
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] min-h-[calc(100dvh-10rem)] flex-1 w-full flex flex-col items-center justify-center p-6 text-center font-sans my-auto">
      <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">Terjadi Kendala Memuat Modul Dashboard</h2>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        Sistem mendeteksi pembaruan modul atau kendala rendering data di peramban Anda (Koneksi server utama aktif). Silakan tekan tombol di bawah untuk menyegarkan kembali.
      </p>
      <button
        onClick={handleReload}
        className="px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <RefreshCw className="w-4 h-4" /> Segarkan Halaman
      </button>
    </div>
  );
}
