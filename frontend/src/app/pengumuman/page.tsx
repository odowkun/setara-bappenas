"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchAnnouncementsFromApi = async () => {
      setLoading(true);
      try {
        const [rows, types] = await Promise.all([
          officialContentService.getAnnouncements(),
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
              Arsip dokumen resmi surat edaran, pengumuman rekrutmen tenaga pendamping, dan informasi lelang Pemerintah Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

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
                className={`px-4 py-2 rounded-2xl font-black text-xs transition whitespace-nowrap shrink-0 ${
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

        {/* OFFICIAL DOCUMENT LIST REPOSITORY (RELAYOUT - NO BLOATED BOX CARDS) */}
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
            paginatedAnnouncements.map((item) => (
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
                  {/* DOCUMENT FILE ICON BADGE (VERTICALLY CENTERED) */}
                  <div className="w-12 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                    <FileText className="w-6 h-6 text-rose-600" />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-0.5">
                      {item.fileType?.toUpperCase() || "PDF"}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {/* TOP BADGES & META */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {item.isImportant && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                          <Pin className="w-3 h-3 fill-current" />
                          PENTING / URGENT
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

                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.validUntil ? `Berlaku s/d ${item.validUntil}` : "Permanen (Tanpa Batas Waktu)"}
                      </span>
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
                        {item.content}
                      </p>
                    </div>

                    <div className="text-[11px] font-bold text-slate-400 pt-0.5">
                      Diterbitkan: {item.createdAt}
                    </div>
                  </div>
                </div>

                {/* RIGHT ACTION BUTTONS (STACKED TOP & BOTTOM) */}
                <div className="flex flex-col gap-2 shrink-0 w-full lg:w-44 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-center">
                  <button
                    type="button"
                    onClick={() => setActiveDoc(item)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                    title="Baca / Pratinjau Dokumen Pengumuman"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Pratinjau Dokumen</span>
                  </button>

                  {item.pdfUrl && (
                    <a
                      href={item.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-blue-600/25"
                      title="Unduh Lampiran PDF Resmi"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Lampiran</span>
                    </a>
                  )}
                </div>
              </div>
            ))
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
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-2xl font-black transition text-xs ${
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
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OFFICIAL DOCUMENT READER MODAL */}
      {activeDoc && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* OFFICIAL HEADER KOP SURAT */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-3 relative">
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-white hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200 shadow-2xs"
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                  {activeDoc.type}
                </span>
                {activeDoc.nomorSurat && (
                  <span className="font-mono font-bold text-slate-700 text-[11px]">
                    NOMOR: {activeDoc.nomorSurat}
                  </span>
                )}
                <span className="text-slate-500 font-semibold text-[11px]">
                  Diterbitkan: {activeDoc.createdAt}
                </span>
              </div>
            </div>

            {/* DOCUMENT BODY READER */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-5 text-slate-800">
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {activeDoc.title}
              </h2>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs font-bold text-blue-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Masa Berlaku Dokumen:</span>
                </span>
                <span className="font-extrabold text-blue-800">
                  {activeDoc.validUntil ? `s/d ${activeDoc.validUntil}` : "Permanen (Tanpa Batas Waktu)"}
                </span>
              </div>

              <div className="prose text-xs sm:text-sm font-medium text-slate-700 leading-relaxed space-y-3 pt-2">
                <p>{activeDoc.content}</p>
                <p>
                  Demikian pengumuman ini disampaikan untuk diketahui dan dilaksanakan sebagaimana mestinya oleh seluruh pihak terkait di Kabupaten Halmahera Utara.
                </p>
              </div>

              {/* SIGNATURE STAMP MOCK */}
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-bold text-slate-500">Tobelo, {activeDoc.createdAt}</p>
                  <p className="text-xs font-black text-slate-900">Kepala BAPPEDA Halmahera Utara</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                      ✓ TTD DIGITAL RESMI
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 underline">Dr. ARYANI SYAH, M.Si</p>
                  <p className="text-[10px] font-mono text-slate-400">NIP. 19780512 200312 2 004</p>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen</span>
              </button>

              {activeDoc.pdfUrl && (
                <a
                  href={activeDoc.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Lampiran {activeDoc.fileType?.toUpperCase() || "PDF"}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
