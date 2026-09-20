"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl max-w-md space-y-4">
          <h1 className="text-2xl font-black text-blue-950">Aplikasi BAPPEDA Halut</h1>
          <p className="text-sm text-slate-600">
            Terjadi pembaruan sistem sementara. Silakan segarkan halaman browser Anda.
          </p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full py-3 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition cursor-pointer active:scale-95"
          >
            Segarkan Kembali
          </button>
        </div>
      </body>
    </html>
  );
}
