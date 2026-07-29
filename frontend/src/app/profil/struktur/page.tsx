"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StrukturOrganisasiChart, OrgNode } from "@/components/ui/StrukturOrganisasiChart";
import {
  ChevronRight,
  Network,
} from "lucide-react";

export default function PublicStrukturPage() {
  const [treeData, setTreeData] = useState<OrgNode | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/pejabat")
      .then((r) => r.json())
      .then((jsonPejabat) => {
        if (jsonPejabat.success && jsonPejabat.data) {
          setTreeData(jsonPejabat.data.tree);
        }
      })
      .catch((err) => console.error("Gagal memuat bagan pejabat dari database:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-10">
        {/* 1. CLEAN UNBOXED CENTERED STATIC HEADER */}
        <div className="py-2 space-y-4 text-center flex flex-col items-center justify-center">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">Profil</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-700 font-extrabold">Struktur Organisasi</span>
          </div>

          {/* Centered Title & Subtitle */}
          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black">
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>BAGAN HIRARKI KELEMBAGAAN</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Struktur Organisasi BAPPEDA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Bagan hirarki kepemimpinan dan kelembagaan resmi Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-xs text-slate-400 font-bold animate-pulse space-y-3 bg-white rounded-3xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat Bagan Struktur Organisasi dari database Laravel...</p>
          </div>
        ) : (
          /* 2. FULL WIDTH CONTENT CONTAINER (NO SIDEBAR) */
          <div className="space-y-8">
            {/* SECTION: BAGAN STRUKTUR ORGANISASI CHART */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/80 space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-100/60 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Bagan Hirarki Kelembagaan Resmi</h2>
                  <p className="text-xs text-slate-500 font-medium">Visualisasi hirarki pejabat dan unit kerja BAPPEDA Halmahera Utara</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-white border border-blue-100/60 shadow-sm overflow-hidden">
                <StrukturOrganisasiChart
                  data={treeData}
                  title="Bagan Hirarki Kelembagaan BAPPEDA Halmahera Utara"
                  showSaveButton={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
