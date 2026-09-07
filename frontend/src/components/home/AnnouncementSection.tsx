"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, Pin, ArrowRight, FileText, Download } from "lucide-react";
import { motion } from "framer-motion";
import { officialContentService } from "@/services/officialContentService";

interface AnnouncementHomeItem {
  id: string;
  nomorSurat?: string;
  title: string;
  type: string;
  isImportant: boolean;
  fileSize: string;
  createdAt: string;
  content: string;
  pdfUrl: string;
}

export const AnnouncementSection: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementHomeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const rows = await officialContentService.getAnnouncements();
        setAnnouncements(rows.slice(0, 3).map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          isImportant: item.isImportant,
          fileSize: "",
          createdAt: item.createdAt,
          content: item.content,
          pdfUrl: item.pdfUrl,
        })));
      } catch (e) {
        console.error("[AnnouncementSection] Data resmi gagal dimuat:", e);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <section id="pengumuman" className="py-8 sm:py-16 bg-slate-50 border-t border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Pill */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-900 text-xs sm:text-sm font-black uppercase tracking-wider">
              <Megaphone className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Pengumuman Resmi Perencanaan Daerah</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Informasi Edaran &amp; Rekrutmen Resmi BAPPEDA
            </h2>
          </div>

          <Link
            href="/pengumuman"
            className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-600 text-blue-700 hover:text-blue-800 font-bold text-xs flex items-center gap-2 transition shadow-xs shrink-0"
          >
            <span>Lihat Semua Pengumuman</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Announcement List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-6 rounded-3xl bg-white border border-slate-200 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-xs">
            Belum ada pengumuman resmi terbaru saat ini.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`p-6 rounded-3xl bg-white border transition duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group ${
                  item.isImportant
                    ? "border-amber-300 ring-1 ring-amber-400/30 shadow-md shadow-amber-500/5"
                    : "border-slate-200 hover:border-blue-300 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-rose-600" />
                    <span className="text-[9px] font-black uppercase">PDF</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {item.isImportant && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-current" /> PENTING
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {item.type}
                      </span>
                      {item.nomorSurat && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.nomorSurat}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <a
                  href={item.pdfUrl}
                  download
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 transition shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF ({item.fileSize})</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
