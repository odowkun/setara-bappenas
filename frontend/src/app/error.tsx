"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">Terjadi Kendala Memuat Halaman</h2>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        Sistem mendeteksi pembaruan data atau koneksi sementara. Silakan tekan tombol di bawah untuk menyegarkan kembali.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Segarkan Halaman
      </button>
    </div>
  );
}
