"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/apiClient";
import {
  Building2,
  ChevronRight,
  BookOpen,
  Target,
  Award,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface TentangData {
  title: string;
  subtitle: string;
  content: string;
  meta_json?: {
    tahun_berdiri?: string;
    alamat?: string;
    telepon?: string;
    email?: string;
    jam_kerja?: string;
  };
}

interface VisiMisiData {
  title: string;
  subtitle: string;
  content: string;
  meta_json?: {
    misi?: string[];
  };
}

export default function PublicTentangPage() {
  const [tentangData, setTentangData] = useState<TentangData | null>(null);
  const [visiMisiData, setVisiMisiData] = useState<VisiMisiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resTentang = await fetch(`${API_BASE_URL}/profil/tentang`);
        if (resTentang.ok) {
          const jsonTentang = await resTentang.json();
          if (jsonTentang.success && jsonTentang.data) {
            setTentangData(jsonTentang.data);
          }
        }

        const resVisi = await fetch(`${API_BASE_URL}/profil/visi_misi`);
        if (resVisi.ok) {
          const jsonVisi = await resVisi.json();
          if (jsonVisi.success && jsonVisi.data) {
            setVisiMisiData(jsonVisi.data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data profil tentang dari database:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            <span className="text-blue-700 font-extrabold">Tentang Bappeda</span>
          </div>

          {/* Centered Title & Subtitle */}
          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>GAMBARAN UMUM & KELEMBAGAAN</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tentang BAPPEDA Halmahera Utara
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Profil resmi, narasi sejarah pembentukan, visi & misi pemerintah daerah.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-xs text-slate-400 font-bold animate-pulse space-y-3 bg-white rounded-3xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat data profil BAPPEDA dari database Laravel...</p>
          </div>
        ) : (
          /* 2. FULL WIDTH CONTENT CONTAINER (NO SIDEBAR) */
          <div className="space-y-8">
            {/* SECTION 1: PROFIL & SEJARAH SINGKAT */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/80 space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-100/60 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Sejarah & Pembentukan Instansi</h2>
                  <p className="text-xs text-slate-500 font-medium">Gambaran umum dan landasan pembentukan BAPPEDA</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-blue-100/60 shadow-sm">
                <div
                  className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 font-medium leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: tentangData?.content || "<p>Data profil belum tersedia.</p>",
                  }}
                />
              </div>
            </div>

            {/* SECTION 2: VISI & MISI BAPPEDA */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/80 space-y-6">
              <div className="flex items-center gap-3 border-b border-blue-100/60 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Visi & Misi Pemerintah Daerah</h2>
                  <p className="text-xs text-slate-500 font-medium">Arah kebijakan utama dan prioritas pembangunan Kabupaten Halmahera Utara</p>
                </div>
              </div>

              {/* VISI CARD */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-blue-100/80 shadow-sm border-l-4 border-l-blue-600 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-900">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Visi Utama</span>
                </div>
                <p className="text-base sm:text-xl font-black text-slate-900 leading-snug italic">
                  "{visiMisiData?.content || "Data visi belum tersedia."}"
                </p>
              </div>

              {/* MISI LIST */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Poin-poin Misi Strategis ({visiMisiData?.meta_json?.misi?.length || 0} Misi)</span>
                </h3>

                <div className="space-y-3">
                  {(visiMisiData?.meta_json?.misi ?? []).map((misiText, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-blue-100/60 shadow-sm hover:shadow-md transition flex items-center gap-3.5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 leading-relaxed">
                          {misiText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 3: INFORMASI INSTANSI, JAM KERJA & KONTAK */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/80 space-y-6">
                <div className="flex items-center gap-3 border-b border-blue-100/60 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Informasi Kelembagaan, Jam Kerja &amp; Kontak
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Data legalitas tahun pendirian, jadwal operasional kantor, dan saluran komunikasi resmi instansi
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Tahun Berdiri */}
                  <div className="p-5 rounded-2xl bg-white border border-blue-100/60 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tahun Berdiri</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">
                        {tentangData?.meta_json?.tahun_berdiri ? `Tahun ${tentangData.meta_json.tahun_berdiri}` : "Tahun 2003"}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Lembaga Perencana Daerah
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Jam Kerja */}
                  <div className="p-5 rounded-2xl bg-white border border-blue-100/60 shadow-sm flex flex-col justify-between space-y-3 sm:col-span-1 lg:col-span-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Jam Layanan</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 leading-snug">
                        {tentangData?.meta_json?.jam_kerja || "Senin - Jumat: 08:00 - 16:30 WIT"}
                      </div>
                      <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                        Waktu Indonesia Timur (WIT)
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Telepon */}
                  <div className="p-5 rounded-2xl bg-white border border-blue-100/60 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Telepon Kantor</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      {tentangData?.meta_json?.telepon ? (
                        <a
                          href={`tel:${tentangData.meta_json.telepon.replace(/\s+/g, "")}`}
                          className="text-xs font-black text-blue-700 hover:underline block truncate"
                        >
                          {tentangData.meta_json.telepon}
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-slate-900">(0924) 2621111</span>
                      )}
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Saluran Komunikasi Resmi
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Email */}
                  <div className="p-5 rounded-2xl bg-white border border-blue-100/60 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Instansi</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      {tentangData?.meta_json?.email ? (
                        <a
                          href={`mailto:${tentangData.meta_json.email}`}
                          className="text-xs font-black text-blue-700 hover:underline block truncate"
                          title={tentangData.meta_json.email}
                        >
                          {tentangData.meta_json.email}
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-slate-900">info@bappeda.halut.go.id</span>
                      )}
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Korespondensi &amp; Administrasi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Width Card: Alamat Lengkap */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-blue-100/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Alamat Kantor Sekretariat
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                      {tentangData?.meta_json?.alamat || "Jl. Ir. Hein Namotemo M.SP 2 Tobelo, Halmahera Utara, Maluku Utara"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                    Kabupaten Halmahera Utara
                  </span>
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
