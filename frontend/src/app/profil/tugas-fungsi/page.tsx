"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/apiClient";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Shield,
} from "lucide-react";

interface TugasFungsiData {
  title: string;
  subtitle: string;
  content: string;
  meta_json?: {
    fungsi?: string[];
  };
}

export default function PublicTugasFungsiPage() {
  const [data, setData] = useState<TugasFungsiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/profil/tugas_fungsi`)
      .then((r) => r.json())
      .then((jsonTF) => {
        if (jsonTF.success && jsonTF.data) {
          setData(jsonTF.data);
        }
      })
      .catch((err) => console.error("Gagal memuat Tugas & Fungsi dari database:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10">
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
            <span className="text-blue-700 font-extrabold">Tugas & Fungsi</span>
          </div>

          {/* Centered Title & Subtitle */}
          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>PERAN STRATEGIS ORGANISASI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tugas & Fungsi BAPPEDA Halmahera Utara
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Tugas pokok perumusan kebijakan teknis serta fungsi strategis perencana pembangunan daerah.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-xs text-slate-400 font-bold animate-pulse space-y-3 bg-white rounded-3xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat data Tugas & Fungsi resmi dari database Laravel...</p>
          </div>
        ) : (
          /* 2. FULL WIDTH CONTENT CONTAINER (NO SIDEBAR) */
          <div className="space-y-8">
            {/* SECTION 1: TUGAS POKOK BAPPEDA */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/80 space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-100/60 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Tugas Pokok Organisasi</h2>
                  <p className="text-xs text-slate-500 font-medium">Tanggung jawab utama perumusan dan pengendalian perencanaan</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-blue-100/60 shadow-sm">
                <div
                  className="prose prose-slate max-w-none text-xs sm:text-sm font-medium text-slate-800 leading-relaxed [&_p]:leading-relaxed [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={{
                    __html: data?.content || "<p>Data tugas pokok belum tersedia.</p>",
                  }}
                />
              </div>
            </div>

            {/* SECTION 2: FUNGSI STRATEGIS ORGANISASI */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/80 space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-100/60 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Fungsi Strategis Organisasi</h2>
                  <p className="text-xs text-slate-500 font-medium">Fungsi penunjang pelaksanaan perumusan kebijakan daerah</p>
                </div>
              </div>

              <div className="space-y-3">
                {(data?.meta_json?.fungsi ?? []).map((fungsiText, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-blue-100/60 shadow-sm hover:shadow-md transition flex items-center gap-3.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-blue-700 text-xs font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Fungsi Ke-{idx + 1}</span>
                      </div>
                      <div
                        className="text-xs font-bold text-slate-900 leading-relaxed [&_p]:my-0"
                        dangerouslySetInnerHTML={{
                          __html: fungsiText,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
