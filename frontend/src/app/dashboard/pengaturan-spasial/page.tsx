"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GeoSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/pengaturan-spasial/viewport");
  }, [router]);

  return (
    <div className="w-full p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 font-sans animate-pulse">
      <div className="w-10 h-10 rounded-2xl bg-purple-100 mx-auto" />
      <div className="h-4 w-64 bg-slate-200 rounded mx-auto" />
    </div>
  );
}
