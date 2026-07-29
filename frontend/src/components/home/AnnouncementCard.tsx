"use client";

import React from "react";
import { Bell, FileCheck, ExternalLink } from "lucide-react";

export const AnnouncementCard: React.FC = () => {
  return (
    <section id="pengumuman" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-[32px] bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 border border-blue-800 shadow-xl shadow-slate-900/10 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 text-white">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-blue-950 text-xs font-black shadow-sm">
              <Bell className="w-3.5 h-3.5 text-blue-950 animate-bounce" /> Pengumuman Resmi Perencanaan Daerah
            </div>
            <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
              Penyusunan Renstra PD (Perangkat Daerah) Tahun 2025–2029
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Berdasarkan <strong className="text-amber-300 font-bold">PERMENDAGRI 86 Tahun 2017</strong> tentang tata cara perencanaan, pengendalian dan Evaluasi Daerah serta <strong className="text-amber-300 font-bold">INMENDAGRI Nomor 2 Tahun 2025</strong> tentang Pedoman Penyusunan Rencana Strategis Perangkat Daerah Kabupaten Halmahera Utara.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
            <a
              href="/dokumen"
              className="px-6 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <FileCheck className="w-4 h-4 text-blue-950" /> Unduh Berkas Renstra
            </a>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 shadow-sm transition"
            >
              Portal Popeda <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
