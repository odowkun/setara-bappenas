"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Megaphone,
  Search,
  Pin,
  Calendar,
  Filter,
  Paperclip,
  Image as ImageIcon,
  Video,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  Eye,
  X,
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Printer,
  Share2,
} from "lucide-react";
import {
  officialContentService,
  type AnnouncementItem as OfficialAnnouncement,
} from "@/services/officialContentService";

interface AnnouncementItem extends OfficialAnnouncement {
  fileSize?: string;
  nomorSurat?: string;
}

function formatIndonesianDate(isoString?: string): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return (
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jayapura", // WIT for Halmahera Utara
      }).format(d) + " WIT"
    );
  } catch {
    return isoString;
  }
}

function formatIndonesianDateOnly(dateString?: string): string {
  if (!dateString) return "Permanen (Tanpa Batas Waktu)";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

const isImageFile = (fileType?: string, url?: string) => {
  const str = `${fileType || ""} ${url || ""}`.toLowerCase();
  return str.includes("image") || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(str);
};

const isPdfFile = (fileType?: string, url?: string) => {
  const str = `${fileType || ""} ${url || ""}`.toLowerCase();
  return str.includes("pdf") || /\.pdf(\?.*)?$/i.test(str);
};

const isVideoFile = (fileType?: string, url?: string) => {
  const str = `${fileType || ""} ${url || ""}`.toLowerCase();
  return str.includes("video") || /\.(mp4|webm|mkv|mov)(\?.*)?$/i.test(str);
};

export default function PublicPengumumanPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua Dokumen");
  const [typeOptions, setTypeOptions] = useState<string[]>(["Semua Dokumen"]);
  const [loading, setLoading] = useState(true);

  // Items Per Page State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Document Modal Preview State
  const [activeDoc, setActiveDoc] = useState<AnnouncementItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key when document preview modal is active
  useEffect(() => {
    if (activeDoc) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Prevent content shift by measuring scrollbar width
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setActiveDoc(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      // Auto-focus scrollable body reader so mouse wheel / keys scroll modal immediately
      const timer = setTimeout(() => {
        if (modalBodyRef.current) {
          modalBodyRef.current.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [activeDoc]);

  useEffect(() => {
    const fetchAnnouncementsFromApi = async () => {
      setLoading(true);
      try {
        const [rows, types] = await Promise.all([
          officialContentService.getAnnouncements(false, true),
          officialContentService.getAnnouncementTypes(),
        ]);
        setAnnouncements(rows);
        setTypeOptions(["Semua Dokumen", ...types.map((item) => item.name)]);
      } catch (e) {
        console.error("[PengumumanPage] Data resmi tidak dapat dimuat:", e);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncementsFromApi();
  }, []);

  const pinnedAnnouncement = announcements.find((a) => a.isImportant);

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.nomorSurat && a.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "Semua Dokumen" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-8">
        {/* BREADCRUMB & HERO HEADER (PEDOMAN SINGLEPAGE PROFIL) */}
        <div className="py-2 space-y-4 text-center flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">Informasi &amp; Publikasi</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-700 font-extrabold">Pengumuman &amp; Edaran Dokumen</span>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5 text-blue-600" />
              <span>REPOSITORY DOKUMEN PENGUMUMAN RESMI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Pengumuman &amp; Surat Edaran Resmi
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Arsip dokumen resmi surat edaran, pengumuman seleksi, serta publikasi regulasi Pemerintah Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

        {/* TOP PINNED OFFICIAL ANNOUNCEMENT HERO CARD */}
        {pinnedAnnouncement && !searchTerm && typeFilter === "Semua Dokumen" && (
          <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 border border-amber-400/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-white">
            <div className="max-w-3xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400 text-blue-950 text-xs font-black shadow-md border border-amber-300">
                <Pin className="w-3.5 h-3.5 fill-current text-blue-950" />
                <span>PENGUMUMAN RESMI UTAMA (PIN BERANDA)</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                {pinnedAnnouncement.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium line-clamp-3">
                {pinnedAnnouncement.content ? pinnedAnnouncement.content.replace(/<[^>]*>/g, "") : ""}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 font-bold border border-white/20">
                  {pinnedAnnouncement.type}
                </span>
                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {pinnedAnnouncement.validUntil
                    ? `Berlaku s/d ${formatIndonesianDateOnly(pinnedAnnouncement.validUntil)}`
                    : "Permanen (Tanpa Batas Waktu)"}
                </span>
                <span className="text-slate-400 text-[11px]">
                  Diterbitkan: {formatIndonesianDate(pinnedAnnouncement.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setActiveDoc(pinnedAnnouncement)}
                className="h-12 px-6 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" /> Pratinjau Dokumen
              </button>
              {pinnedAnnouncement.pdfUrl && (
                <a
                  href={`${pinnedAnnouncement.pdfUrl}?download=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 px-6 rounded-full bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 border border-amber-300 transition transform hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-950" /> Unduh Lampiran
                </a>
              )}
            </div>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS BAR */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari judul dokumen, nomor surat, atau kata kunci..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="text-xs font-bold text-slate-600">
              Menampilkan <strong className="text-blue-700">{filteredAnnouncements.length}</strong> arsip dokumen pengumuman
            </div>
          </div>

          {/* TYPE CATEGORY PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {typeOptions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTypeFilter(t);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-2xl font-black text-xs transition whitespace-nowrap shrink-0 cursor-pointer ${
                  typeFilter === t
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* OFFICIAL DOCUMENT LIST REPOSITORY */}
        <div className="space-y-4">
          {loading ? (
            /* SKELETON LOADERS */
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-5 rounded-3xl bg-white border border-slate-200 animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-14 bg-slate-200 rounded-2xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="w-32 h-10 bg-slate-200 rounded-2xl shrink-0" />
              </div>
            ))
          ) : paginatedAnnouncements.length === 0 ? (
            <div className="p-16 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-3xl border border-slate-200">
              Tidak ada dokumen pengumuman yang sesuai dengan kriteria pencarian.
            </div>
          ) : (
            paginatedAnnouncements.map((item) => {
              const isImg = isImageFile(item.fileType, item.pdfUrl);
              const isPdf = isPdfFile(item.fileType, item.pdfUrl);
              const isVid = isVideoFile(item.fileType, item.pdfUrl);

              return (
                <div
                  key={item.id}
                  className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative group ${
                    item.isImportant
                      ? "border-amber-300 shadow-md shadow-amber-500/5 ring-1 ring-amber-400/30"
                      : "border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md"
                  }`}
                >
                  {/* Left Urgent Accent Strip */}
                  {item.isImportant && (
                    <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-amber-500 rounded-r-full" />
                  )}

                  {/* MAIN DOCUMENT INFO AREA */}
                  <div className="flex items-center gap-4 flex-1 pl-2">
                    {/* DYNAMIC MEDIA ICON BADGE */}
                    <div
                      className={`w-12 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition ${
                        isImg
                          ? "bg-purple-50 border-purple-200 text-purple-600"
                          : isVid
                          ? "bg-amber-50 border-amber-200 text-amber-600"
                          : isPdf
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-blue-50 border-blue-200 text-blue-600"
                      }`}
                    >
                      {isImg ? (
                        <ImageIcon className="w-6 h-6" />
                      ) : isVid ? (
                        <Video className="w-6 h-6" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                      <span className="text-[9px] font-black tracking-widest uppercase mt-0.5">
                        {isImg ? "IMG" : isVid ? "VID" : isPdf ? "PDF" : "DOC"}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {/* TOP BADGES & META */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {item.isImportant && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center gap-1 shadow-2xs">
                            <Pin className="w-3 h-3 fill-current" />
                            PENGUMUMAN RESMI (PIN)
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.type}
                        </span>

                        {item.nomorSurat && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.nomorSurat}
                          </span>
                        )}

                        {(() => {
                          const isExpired = Boolean(
                            item.validUntil &&
                            new Date(item.validUntil).setHours(23, 59, 59, 999) < Date.now()
                          );
                          return (
                            <span className={`text-[11px] font-bold flex items-center gap-1 ml-auto sm:ml-0 ${
                              isExpired ? "text-amber-600" : "text-slate-500"
                            }`}>
                              <Clock className={`w-3.5 h-3.5 ${isExpired ? "text-amber-500" : "text-slate-400"}`} />
                              {item.validUntil
                                ? isExpired
                                  ? `Berlaku s/d ${formatIndonesianDateOnly(item.validUntil)} (Selesai)`
                                  : `Berlaku s/d ${formatIndonesianDateOnly(item.validUntil)}`
                                : "Permanen"}
                            </span>
                          );
                        })()}
                      </div>

                      {/* TITLE & DESCRIPTION */}
                      <div>
                        <h3
                          onClick={() => setActiveDoc(item)}
                          className="text-base font-black text-slate-900 group-hover:text-blue-700 cursor-pointer transition leading-snug"
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed mt-1">
                          {item.content ? item.content.replace(/<[^>]*>/g, "") : ""}
                        </p>
                      </div>

                      <div className="text-[11px] font-bold text-slate-400 pt-0.5 flex items-center gap-2">
                        <span>Diterbitkan: {formatIndonesianDate(item.createdAt)}</span>
                        {item.fileType && (
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px] font-mono text-slate-500">
                            {item.fileType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ACTION BUTTONS */}
                  <div className="flex flex-col gap-2 shrink-0 w-full lg:w-44 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveDoc(item)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                      title="Pratinjau Dokumen / Berkas Asli"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Pratinjau Dokumen</span>
                    </button>

                    {item.pdfUrl && (
                      <a
                        href={`${item.pdfUrl}?download=1`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-blue-600/25 cursor-pointer"
                        title="Unduh Lampiran Resmi"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Lampiran</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredAnnouncements.length > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-600">
                Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAnnouncements.length)} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)} dari {filteredAnnouncements.length} dokumen
              </span>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700">
                <span className="text-slate-400">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-black text-blue-700 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 Dokumen</option>
                  <option value={10}>10 Dokumen</option>
                  <option value={50}>50 Dokumen</option>
                  <option value={100}>100 Dokumen</option>
                  <option value={999999}>Semua Data</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-2xl font-black transition text-xs cursor-pointer ${
                    currentPage === p
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OFFICIAL DOCUMENT READER MODAL WITH REAL MEDIA PREVIEW */}
      {mounted && activeDoc && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveDoc(null);
            }
          }}
          className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overscroll-contain"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] overscroll-contain"
          >
            {/* OFFICIAL HEADER KOP SURAT */}
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 space-y-3 relative shrink-0">
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-white hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200 shadow-2xs cursor-pointer"
                title="Tutup Pratinjau Dokumen"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/bappeda/logo-halut.png"
                  alt="BAPPEDA Halut"
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <h4 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                    PEMERINTAH KABUPATEN HALMAHERA UTARA
                  </h4>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">
                    BADAN PERENCANAAN PEMBANGUNAN DAERAH (BAPPEDA)
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                    {activeDoc.type}
                  </span>
                  {activeDoc.isImportant && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                      <Pin className="w-3 h-3 fill-current" />
                      PIN RESMI
                    </span>
                  )}
                  {activeDoc.nomorSurat && (
                    <span className="font-mono font-bold text-slate-700 text-[11px]">
                      NOMOR: {activeDoc.nomorSurat}
                    </span>
                  )}
                </div>

                <span className="text-slate-500 font-semibold text-[11px]">
                  Diterbitkan: {formatIndonesianDate(activeDoc.createdAt)}
                </span>
              </div>
            </div>

            {/* DOCUMENT BODY READER */}
            <div
              ref={modalBodyRef}
              tabIndex={0}
              className="p-5 sm:p-7 flex-1 overflow-y-auto overscroll-contain space-y-5 text-slate-800 focus:outline-hidden"
            >
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {activeDoc.title}
              </h2>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs font-bold text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Masa Berlaku Dokumen:</span>
                </span>
                <span className="font-extrabold text-blue-800">
                  {activeDoc.validUntil ? `s/d ${formatIndonesianDateOnly(activeDoc.validUntil)}` : "Permanen (Tanpa Batas Waktu)"}
                </span>
              </div>

              {activeDoc.content && (
                <div
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-700 leading-relaxed prose prose-slate max-w-none [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={{ __html: activeDoc.content }}
                />
              )}

              {/* REAL ATTACHMENT FILE PREVIEW CONTAINER */}
              {activeDoc.pdfUrl ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span>Berkas Dokumen Lampiran Asli</span>
                      {activeDoc.fileType && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-600">
                          {activeDoc.fileType}
                        </span>
                      )}
                    </h3>

                    <a
                      href={activeDoc.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      Buka Tab Baru <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* REAL MEDIA RENDER */}
                  {isImageFile(activeDoc.fileType, activeDoc.pdfUrl) ? (
                    <div className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeDoc.pdfUrl}
                        alt={activeDoc.title}
                        className="max-h-[62vh] max-w-full rounded-xl object-contain shadow-sm border border-slate-200 bg-white"
                      />
                      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Pratinjau Berkas Gambar Resmi BAPPEDA Halmahera Utara</span>
                      </p>
                    </div>
                  ) : isPdfFile(activeDoc.fileType, activeDoc.pdfUrl) ? (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-inner bg-slate-100 flex flex-col">
                      <iframe
                        src={`${activeDoc.pdfUrl}#toolbar=1`}
                        title={activeDoc.title}
                        className="w-full h-[65vh] border-0 bg-white"
                      />
                    </div>
                  ) : isVideoFile(activeDoc.fileType, activeDoc.pdfUrl) ? (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-black p-2 flex justify-center">
                      <video
                        src={activeDoc.pdfUrl}
                        controls
                        className="w-full max-h-[60vh] rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Dokumen Lampiran Resmi</p>
                          <p className="text-[11px] text-slate-500 font-medium">Format: {activeDoc.fileType || "Dokumen"}</p>
                        </div>
                      </div>
                      <a
                        href={`${activeDoc.pdfUrl}?download=1`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition"
                      >
                        <Download className="w-4 h-4" /> Unduh Dokumen
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs font-bold text-slate-400">
                  Pengumuman ini tidak memiliki berkas lampiran media.
                </div>
              )}
            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                {activeDoc.pdfUrl && (
                  <a
                    href={activeDoc.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Buka Penuh</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {activeDoc.pdfUrl && (
                  <a
                    href={`${activeDoc.pdfUrl}?download=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas Lampiran</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
