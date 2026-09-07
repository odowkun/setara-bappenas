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
import { API_BASE_URL } from "@/lib/apiClient";

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
        const res = await fetch(`${API_BASE_URL}/news/${slug}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setArticle(json.data);
          }
        }
      } catch (err) {
        console.error("Artikel resmi gagal dimuat:", err);
      } finally {
        setLoading(false);
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

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 px-4 text-center">
        <p className="font-bold text-slate-600">Artikel tidak ditemukan atau belum dipublikasikan.</p>
        <Link href="/berita" className="mt-4 inline-block text-blue-700 font-bold">
          Kembali ke daftar berita
        </Link>
      </div>
    );
  }

  const displayData = article;

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
              {displayData.category || "Belum dikategorikan"}
            </span>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateWIT(displayData.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600 font-extrabold">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                {displayData.views?.toLocaleString() || "0"} Hits Pembaca
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {displayData.title}
          </h1>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {displayData.author ? displayData.author.substring(0, 2).toUpperCase() : "--"}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">{displayData.author || "Belum tersedia"}</p>
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
        {displayData.image && <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayData.image}
            alt={displayData.title}
            className="w-full h-full object-cover"
          />
        </div>}

        {/* ARTICLE BODY READER */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xs prose max-w-none text-slate-800">
          <div
            dangerouslySetInnerHTML={{
              __html: displayData.content || "",
            }}
          />
        </div>
      </article>
    </div>
  );
}
