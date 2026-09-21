"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Newspaper, Calendar, Eye, User, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/apiClient";
import { normalizeMediaUrl } from "@/services/adminService";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

interface NewsCardItem {
  id: string;
  slug: string;
  date: string;
  title: string;
  category: string;
  author: string;
  views: number;
  desc: string;
  image: string;
  link: string;
}

export const LatestNewsCarousel: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsCardItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/news`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const mapped = json.data.map((item: any) => ({
              id: String(item.id),
              slug: item.slug || `news-${item.id}`,
              date: item.date || item.created_at?.split("T")[0] || "",
              title: item.title,
              category: item.category || "Belum dikategorikan",
              author: item.author || "Belum tersedia",
              views: Number(item.views) || 0,
              image: normalizeMediaUrl(item.image || item.featured_image || item.image_url),
              desc: item.summary
                ? item.summary.replace(/<[^>]*>/g, "")
                : item.content
                ? item.content.replace(/<[^>]*>/g, "").substring(0, 140) + "..."
                : item.title,
              link: `/berita/${item.slug || item.id}`,
            }));
            setNewsItems(mapped);
          }
        }
      } catch (err) {
        console.error("[LatestNewsCarousel] Data resmi gagal dimuat:", err);
        setNewsItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <section id="berita" className="py-10 sm:py-16 lg:py-20 bg-white font-sans border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        {/* HEADER SECTION WITH CTA BUTTON */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Newspaper className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Publikasi &amp; Kabar Pembangunan</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Info Terkini &amp; Berita Resmi BAPPEDA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Kabar terbaru kebijakan pembangunan daerah, agenda musrenbang, rilis resmi, dan artikel informatif dari Pemerintah Kabupaten Halmahera Utara.
            </p>
          </div>

          <Link
            href="/berita"
            className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-lg shadow-blue-700/20 flex items-center justify-center gap-2.5 transition active:scale-95 shrink-0 self-start md:self-auto group cursor-pointer"
          >
            <span>Selengkapnya di Berita BAPPEDA</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* CLEAN UNIFORM 4-COLUMN CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl sm:rounded-3xl bg-slate-100 p-4 space-y-3 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {newsItems.slice(0, 4).map((item) => (
              <motion.div key={item.id} variants={itemVariants} className="h-full">
                <Link
                  href={item.link}
                  className="group flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div>
                    {/* CARD IMAGE WITH OVERLAY BADGE */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <ProgressiveImage
                        src={item.image || "/images/bappeda/default-news-cover.jpg"}
                        alt={item.title}
                        fallbackSrc="/images/bappeda/default-news-cover.jpg"
                        className="group-hover:scale-108 transition-transform duration-500 ease-out"
                        containerClassName="relative w-full h-full overflow-hidden bg-slate-100"
                      />
                      <div className="absolute top-3 left-3 z-20">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-md border border-white/20">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* CARD CONTENT */}
                    <div className="p-4 sm:p-5 space-y-2 sm:space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{item.date}</span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-700 transition">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.views?.toLocaleString() || "0"} views</span>
                    </span>

                    <span className="flex items-center gap-0.5 text-blue-700 font-black">
                      <span>Baca</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};
