"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDateWIT } from "@/lib/dateUtils";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Share2,
  Bookmark,
  Newspaper,
  CheckCircle2,
} from "lucide-react";

export default function PublicNewsDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/news/${slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setArticle(json.data);
          }
        }
      } catch (err) {
        console.warn("Using local article fallback:", err);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mockArticle = {
    title: "BAPPEDA Halmahera Utara Gelar Forum Musrenbang RKPD Tahun 2026",
    category: "Pembangunan",
    author: "Redaksi Humas BAPPEDA",
    date: "2026-07-24",
    views: 1241,
    featuredImage: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p className="lead text-base font-semibold text-slate-700 leading-relaxed mb-4">
        <strong>TOBELO, BAPPEDA HALUT</strong> — Badan Perencanaan Pembangunan Daerah (BAPPEDA) Kabupaten Halmahera Utara menyelenggarakan Musyawarah Perencanaan Pembangunan (Musrenbang) Rencana Kerja Pemerintah Daerah (RKPD) Tahun 2026 bertempat di Aula Utama Kantor Bupati Halmahera Utara.
      </p>
      <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
        Kegiatan strategis tahunan ini dihadiri oleh Bupati Halmahera Utara, jajaran pimpinan DPRD, Kepala SKPD se-Kabupaten, para Camat, tokoh masyarakat, akademisi, serta organisasi kemasyarakatan. Forum Musrenbang bertujuan untuk menyelaraskan prioritas pembangunan daerah dengan sasaran pembangunan nasional dan provinsi.
      </p>
      <h3 className="text-lg font-black text-slate-900 mt-6 mb-3">Arah Kebijakan Prioritas Pembangunan TA 2026:</h3>
      <ol className="list-decimal pl-5 space-y-2 text-sm font-medium text-slate-700 mb-6">
        <li><strong>Penguatan Infrastruktur Wilayah & Konektivitas Antar Pulau</strong>: Peningkatan aksesibilitas jalan dan pelabuhan antar kecamatan.</li>
        <li><strong>Transformasi Digital & Tata Kelola SPBE</strong>: Integrasi seluruh layanan publik berbasis sistem elektronik terpadu.</li>
        <li><strong>Penurunan Kemiskinan Ekstrem & Stunting</strong>: Program integratif perlindungan sosial dan perbaikan gizi masyarakat secara komprehensif.</li>
        <li><strong>Peningkatan Kualitas Sumber Daya Manusia & Ekonomi Kreatif</strong>: Pelatihan vokasi UMKM lokal berbasis potensi sumber daya alam daerah.</li>
      </ol>
      <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
        Kepala BAPPEDA menegaskan pentingnya kolaborasi aktif dari seluruh elemen untuk memastikan program perencanaan daerah dapat terlaksana dengan tepat sasaran, efisien, dan transparan bagi kesejahteraan warga Halmahera Utara.
      </p>
    `,
  };

  const displayData = article || mockArticle;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pt-32 pb-20 flex justify-center">
        <div className="w-full max-w-3xl px-4 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded-full w-24" />
          <div className="h-10 bg-slate-200 rounded-2xl w-full" />
          <div className="h-80 bg-slate-200 rounded-3xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-28 pb-20">
      <article className="w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* BACK BUTTON */}
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Berita</span>
        </Link>

        {/* ARTICLE HEADER CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
              {displayData.category || displayData.category}
            </span>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateWIT(displayData.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600 font-extrabold">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                {displayData.views?.toLocaleString() || "1,241"} Hits Pembaca
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {displayData.title}
          </h1>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {displayData.author ? displayData.author.substring(0, 2).toUpperCase() : "HUMAS"}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">{displayData.author || "Redaksi Humas BAPPEDA"}</p>
                <p className="text-[10px] text-slate-500 font-medium">BAPPEDA Kab. Halmahera Utara</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-200"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Tersalin!" : "Bagikan"}</span>
            </button>
          </div>
        </div>

        {/* FEATURED COVER IMAGE */}
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayData.image || displayData.featuredImage}
            alt={displayData.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* ARTICLE BODY READER */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xs prose max-w-none text-slate-800">
          <div
            dangerouslySetInnerHTML={{
              __html: displayData.content || mockArticle.content,
            }}
          />
        </div>
      </article>
    </div>
  );
}
