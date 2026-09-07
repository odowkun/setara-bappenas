"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GeoSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/pengaturan-spasial/viewport");
  }, [router]);

  return (
    <div className="w-full p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 font-sans">
      <div className="w-6 h-6 border-2 border-purple-700 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-slate-500">Mengarahkan ke Halaman Viewport & Peta Awal...</p>
    </div>
  );
}
