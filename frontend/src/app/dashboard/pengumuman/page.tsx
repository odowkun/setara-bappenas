"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Megaphone,
  Plus,
  Trash2,
  Search,
  Pin,
  Calendar,
  Edit,
  Filter,
  Paperclip,
  Image as ImageIcon,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";

interface AnnouncementItem {
  id: string;
  title: string;
  type: string;
  isImportant: boolean;
  validUntil: string | null;
  pdfUrl?: string;
  fileType?: "pdf" | "image" | "video" | "doc";
  content: string;
  createdAt: string;
  isPublished: boolean;
}

const initialAnnouncements: AnnouncementItem[] = [
  {
    id: "ann-1",
    title: "Pengumuman Seleksi Penerimaan Tenaga Pendamping Perencanaan BAPPEDA Halut 2026",
    type: "Rekrutmen / Seleksi",
    isImportant: true,
    validUntil: "2026-08-31",
    pdfUrl: "/documents/pengumuman-seleksi-tenaga-pendamping-2026.pdf",
    fileType: "pdf",
    content: "Diberitahukan kepada seluruh calon pelamar bahwa pendaftaran seleksi administrasi dibuka mulai tanggal 1 s/d 15 Agustus 2026 secara online.",
    createdAt: "2026-07-24",
    isPublished: true,
  },
  {
    id: "ann-2",
    title: "Surat Edaran Penyusunan Rencana Kerja Anggaran (RKA) Perangkat Daerah TA 2027",
    type: "Surat Edaran",
    isImportant: true,
    validUntil: null,
    pdfUrl: "/documents/surat-edaran-rka-2027.pdf",
    fileType: "pdf",
    content: "Seluruh Kepala SKPD Kabupaten Halmahera Utara diimbau untuk segera menyampaikan rancangan awal RKA TA 2027 melalui aplikasi SIPD RI.",
    createdAt: "2026-07-20",
    isPublished: true,
  },
  {
    id: "ann-3",
    title: "Pengumuman Tender Pekerjaan Studi Evaluasi Dampak Lingkungan Kawasan Industri",
    type: "Informasi Tender / Lelang",
    isImportant: false,
    validUntil: "2026-08-10",
    pdfUrl: "/documents/dokumen-lelang-amdal-2026.pdf",
    fileType: "pdf",
    content: "Pengadaan jasa konsultansi evaluasi dampak lingkungan kawasan industri Tobelo Tengah.",
    createdAt: "2026-07-15",
    isPublished: true,
  },
  {
    id: "ann-4",
    title: "Himbauan Publik Sosialisasi Partisipasi Masyarakat dalam Penyusunan RKPD",
    type: "Himbauan Publik",
    isImportant: false,
    validUntil: "2026-09-01",
    pdfUrl: "/documents/himbauan-publik-rkpd.pdf",
    fileType: "pdf",
    content: "Mendorong peranserta aktif seluruh elemen masyarakat dalam memberikan masukan usulan pembangunan daerah.",
    createdAt: "2026-07-01",
    isPublished: true,
  },
];

const DEFAULT_TYPES = [
  "Semua",
  "Pengumuman Resmi",
  "Surat Edaran",
  "Informasi Tender / Lelang",
  "Rekrutmen / Seleksi",
  "Himbauan Publik",
];

export default function PengumumanManagementPage() {
  const { hasRole } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua");
  const [typeOptions, setTypeOptions] = useState<string[]>(DEFAULT_TYPES);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  useEffect(() => {
    // Load custom types from storage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bappeda_announcement_types");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTypeOptions(["Semua", ...Array.from(new Set([...DEFAULT_TYPES.slice(1), ...parsed]))]);
          }
        } catch (e) {
          console.error("Gagal parse tipe pengumuman:", e);
        }
      }
    }

    // Simulate API Load with Skeleton Loader
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    const res = await showDeleteConfirm(title);
    if (res.isConfirmed) {
      setAnnouncements(announcements.filter((a) => a.id !== id));
      toast.success(`Pengumuman "${title}" berhasil dihapus!`);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "Semua" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 w-full max-w-[1400px] mx-auto font-sans">
      {/* HEADER CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Manajemen Pengumuman Resmi & Surat Edaran</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Kelola edaran resmi, pengumuman seleksi, serta lampiran dokumen/media resmi.
          </p>
        </div>

        <Link
          href="/dashboard/pengumuman/tambah"
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Baru</span>
        </Link>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kata kunci pengumuman..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Tipe:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-black text-blue-700 focus:outline-none cursor-pointer"
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LIST ANNOUNCEMENT CARDS (WITH SKELETON LOADERS) */}
      <div className="space-y-3">
        {loading ? (
          /* SKELETON LOADERS */
          [1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-3xl bg-white border border-slate-200 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex gap-2">
                  <div className="w-20 h-4 bg-slate-200 rounded-full" />
                  <div className="w-32 h-4 bg-slate-200 rounded-full" />
                </div>
                <div className="w-16 h-6 bg-slate-200 rounded-xl" />
              </div>
              <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
            </div>
          ))
        ) : paginatedAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold bg-white rounded-3xl border border-slate-200">
            Tidak ada pengumuman yang sesuai dengan kriteria.
          </div>
        ) : (
          paginatedAnnouncements.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-3xl bg-white border shadow-xs transition space-y-3.5 ${
                item.isImportant ? "border-amber-300 ring-1 ring-amber-200/50" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {item.isImportant && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs whitespace-nowrap shrink-0">
                      <Pin className="w-3 h-3 fill-current" />
                      PENTING / PINNED
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap shrink-0">
                    {item.type}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                    <Calendar className="w-3 h-3" />
                    {item.validUntil ? `Berlaku s/d ${item.validUntil} (WIT)` : "Permanen (Tanpa Batas Waktu)"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/pengumuman/edit/${item.id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center gap-1 transition border border-slate-200"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1 transition border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                  {item.content}
                </p>
              </div>

              {item.pdfUrl && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold text-emerald-800">
                    {item.fileType === "image" ? (
                      <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                    ) : item.fileType === "video" ? (
                      <Video className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span className="truncate max-w-xs">{item.pdfUrl}</span>
                  </div>
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-black text-blue-600 hover:underline"
                  >
                    Lihat Lampiran Media →
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {!loading && filteredAnnouncements.length > 0 && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAnnouncements.length)} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)} dari {filteredAnnouncements.length} pengumuman
            </span>

            {/* Items Per Page Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700">
              <span className="text-slate-400">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-black text-blue-700 focus:outline-none cursor-pointer"
              >
                <option value={5}>5 Baris</option>
                <option value={10}>10 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
                <option value={999999}>Semua Data</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-xl font-black transition text-xs ${
                  currentPage === p
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
