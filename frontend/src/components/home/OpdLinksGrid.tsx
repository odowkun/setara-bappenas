"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Link2Off } from "lucide-react";
import { tautanOpdService, TautanOpdItem } from "@/services/tautanOpdService";
import { STORAGE_BASE_URL } from "@/lib/apiClient";

export const OpdLinksGrid: React.FC = () => {
  const [items, setItems] = useState<TautanOpdItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      const data = await tautanOpdService.getItems(true);
      setItems(data);
      setLoading(false);
    };

    loadItems();
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-white font-sans border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
              Integrasi Layanan Daerah
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tautan OPD &amp; Aplikasi Terkait
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          {loading
            ? Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-40 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
              ))
            : items.map((item) => {
                const logoSrc = item.logoUrl.startsWith("/storage/")
                  ? `${STORAGE_BASE_URL}${item.logoUrl}`
                  : item.logoUrl;

                const content = (
                  <>
                    <span className="absolute top-3 right-3 text-slate-300 group-hover:text-blue-500 transition">
                      {item.url ? <ExternalLink className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                    </span>
                    <span className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-slate-200 bg-white shadow-xs flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoSrc}
                        alt={item.name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/bappeda/logo-halut.png";
                        }}
                      />
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 text-center leading-tight">
                      {item.name}
                    </span>
                  </>
                );

                if (!item.url) {
                  return (
                    <div
                      key={item.id}
                      className="relative min-h-40 sm:min-h-48 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-5 p-5 group"
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative min-h-40 sm:min-h-48 rounded-lg bg-white border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition flex flex-col items-center justify-center gap-5 p-5 group"
                  >
                    {content}
                  </a>
                );
              })}
        </div>
      </div>
    </section>
  );
};
