"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/apiClient";
import {
  Scale,
  FileText,
  ChevronRight,
  Download,
} from "lucide-react";

interface RegulasiItem {
  nama: string;
  tentang: string;
  kategori: string;
  file_url?: string;
}

interface DasarHukumData {
  title: string;
  subtitle: string;
  content: string;
  meta_json?: {
    regulasi?: RegulasiItem[];
  };
}

export default function PublicDasarHukumPage() {
  const [data, setData] = useState<DasarHukumData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/profil/dasar_hukum`)
      .then((r) => r.json())
      .then((jsonDH) => {
        if (jsonDH.success && jsonDH.data) {
          setData(jsonDH.data);
        }
      })
      .catch((err) => console.error("Gagal memuat dasar hukum dari database:", err))
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
            <span className="text-blue-700 font-extrabold">Dasar Hukum</span>
          </div>

          {/* Centered Title & Subtitle */}
          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>REGULASI & LANDASAN KERJA</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Dasar Hukum BAPPEDA Halmahera Utara
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Peraturan perundang-undangan dan regulasi daerah yang melandasi kelembagaan serta kinerja operasional.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-xs text-slate-400 font-bold animate-pulse space-y-3 bg-white rounded-3xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat Dasar Hukum resmi dari database Laravel...</p>
          </div>
        ) : (
          /* 2. FULL WIDTH CONTENT CONTAINER (NO SIDEBAR) */
          <div className="space-y-8">
            {/* SECTION: DAFTAR REGULASI */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/80 space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-100/60 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Daftar Peraturan & Regulasi Landasan Kerja</h2>
                </div>
              </div>

              <div className="space-y-3">
                {(data?.meta_json?.regulasi ?? []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-blue-100/60 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-900 text-[10px] font-black">
                          {item.kategori}
                        </span>
                        <h3 className="text-xs font-black text-slate-900 uppercase">
                          {item.nama}
                        </h3>
                        <p className="text-xs font-bold text-slate-600">
                          {item.tentang}
                        </p>
                      </div>
                    </div>

                    {item.file_url ? <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-extrabold text-xs flex items-center gap-2 transition shrink-0 self-end sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dokumen</span>
                    </a> : (
                      <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs">
                        Lampiran belum tersedia
                      </span>
                    )}
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
