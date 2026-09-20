"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Bell,
  Download,
  FileText,
  FileCheck,
  ExternalLink,
  MapPin,
  Search,
  Maximize2,
  CheckCircle2,
  Building2,
  TrendingUp,
  Plane,
  Sprout,
  Palmtree,
  Waves,
  Landmark,
  Camera,
  Globe,
  Info,
  X,
  ListFilter,
  HardHat,
  HeartPulse,
  GraduationCap,
  Compass,
  Paperclip,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/swal";
import Swal from "sweetalert2";

import { proyekService, ProyekDetail } from "@/services/proyekService";
import {
  officialContentService,
  type AnnouncementItem,
} from "@/services/officialContentService";
import { MediaAlbumModal, MediaItem } from "@/components/ui/MediaAlbumModal";
import { STORAGE_BASE_URL } from "@/lib/apiClient";

const EsriLeafletMap = dynamic(
  () => import("@/components/gis/EsriLeafletMap"),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[460px] bg-slate-100 animate-pulse rounded-[24px] flex items-center justify-center text-xs font-bold text-slate-500">Memuat Peta Esri ArcGIS Engine...</div> }
);

const DEFAULT_BAPPEDA_PROYEK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e3a8a"/><stop offset="50%" stop-color="%23172554"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="800" height="400" rx="32" fill="url(%23bg)"/><g transform="translate(400, 140)" text-anchor="middle"><circle cx="0" cy="0" r="42" fill="none" stroke="%23f59e0b" stroke-width="6"/><ellipse cx="0" cy="0" rx="20" ry="42" fill="none" stroke="%23f59e0b" stroke-width="5"/><line x1="-42" y1="0" x2="42" y2="0" stroke="%23f59e0b" stroke-width="5"/><line x1="-36" y1="-20" x2="36" y2="-20" stroke="%23f59e0b" stroke-width="4"/><line x1="-36" y1="20" x2="36" y2="20" stroke="%23f59e0b" stroke-width="4"/><text x="0" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" fill="%23ffffff" letter-spacing="-0.5">Kabupaten Halmahera Utara</text><text x="0" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="%23fbbf24">Ibu Kota: Tobelo • 4.951,61 km²</text></g></svg>`;

export const GeospatialSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null); // Null on initial load -> Full Halut Overview View
  const [mobileTab, setMobileTab] = useState<"map" | "list" | "overview">("map");
  const [rawProjects, setRawProjects] = useState<ProyekDetail[]>([]);
  const [geoAnalyses, setGeoAnalyses] = useState<any[]>([]);
  const [albumState, setAlbumState] = useState<{
    isOpen: boolean;
    mediaList: MediaItem[];
    initialIndex: number;
  }>({
    isOpen: false,
    mediaList: [],
    initialIndex: 0,
  });

  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<AnnouncementItem | null>(null);

  React.useEffect(() => {
    Promise.all([
      proyekService.getProjects(),
      proyekService.getBufferAnalyses(),
      officialContentService.getAnnouncements().catch(() => []),
    ]).then(([projects, analyses, announcements]) => {
      setRawProjects(projects);
      setGeoAnalyses(analyses);
      const pinned =
        (Array.isArray(announcements) && announcements.find((a) => a.isImportant)) ||
        (Array.isArray(announcements) && announcements[0]) ||
        null;
      setPinnedAnnouncement(pinned);
    });
  }, []);

  const locations = React.useMemo(() => {
    if (rawProjects.length === 0) return [];
    return rawProjects.map((p, idx) => {
      const categoryMap: Record<string, { category: string; icon: any; badgeColor: string }> = {
        infrastruktur: { category: "Infrastruktur", icon: HardHat, badgeColor: "bg-blue-600" },
        pemerintahan: { category: "Pemerintahan", icon: Building2, badgeColor: "bg-indigo-600" },
        kesehatan: { category: "Kesehatan", icon: HeartPulse, badgeColor: "bg-rose-600" },
        transportasi: { category: "Transportasi", icon: Plane, badgeColor: "bg-teal-600" },
        sejarah: { category: "Sejarah", icon: Landmark, badgeColor: "bg-purple-600" },
        perekonomian: { category: "Ekonomi", icon: TrendingUp, badgeColor: "bg-orange-600" },
        ekonomi: { category: "Ekonomi", icon: TrendingUp, badgeColor: "bg-orange-600" },
        sosbud: { category: "Pendidikan & Sosbud", icon: GraduationCap, badgeColor: "bg-purple-600" },
        pendidikan: { category: "Pendidikan", icon: GraduationCap, badgeColor: "bg-purple-600" },
        renval: { category: "Perencanaan", icon: Compass, badgeColor: "bg-emerald-600" },
      };

      const catInfo = categoryMap[p.bidang] || {
        category: "Belum Diklasifikasikan",
        icon: MapPin,
        badgeColor: "bg-slate-600",
      };

      // Extract photo attachment from Lampiran Teknis ESRI if uploaded
      const photoAtt = p.attachments?.find(
        (att) =>
          att.file_type === "foto" ||
          att.file_path.startsWith("data:image/") ||
          att.file_path.startsWith("http") ||
          att.file_path.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
      );

      const photoUrl = photoAtt && photoAtt.file_path ? photoAtt.file_path : DEFAULT_BAPPEDA_PROYEK_SVG;

      const numId = typeof p.id === "number" ? p.id : idx + 1;

      const allAtts = p.attachments || [];
      const imagesList = allAtts.filter(
        (att) =>
          att.file_type === "foto" ||
          att.file_path.startsWith("data:image/") ||
          att.file_path.startsWith("http") ||
          att.file_path.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
      );

      const documentsList = allAtts.filter(
        (att) =>
          att.file_type !== "foto" &&
          !att.file_path.startsWith("data:image/") &&
          !att.file_path.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
      );

      return {
        id: numId,
        realId: p.id,
        documentId: p.document_id,
        rawDoc: (p as any).document,
        attachments: allAtts,
        images: imagesList,
        documents: documentsList,
        name: p.nama_proyek,
        kecamatan: p.kecamatan ? `Kecamatan ${p.kecamatan}` : "Lokasi belum tersedia",
        category: catInfo.category,
        icon: catInfo.icon,
        badgeColor: catInfo.badgeColor,
        desc: p.lokasi_deskripsi || "Deskripsi proyek belum tersedia.",
        peran: p.bidang ? `Bidang ${catInfo.category}` : "Bidang belum tersedia",
        akses: "Informasi akses belum tersedia.",
        koordinat: `${p.latitude.toFixed(4)}° N, ${p.longitude.toFixed(4)}° E`,
        lat: p.latitude,
        lng: p.longitude,
        status: p.status_progres === "selesai" ? "Selesai (100%)" : `Progres ${p.persentase_progres}%`,
        sumber: p.opd_penanggung_jawab || "OPD belum tersedia",
        potensi: "Informasi manfaat proyek belum tersedia.",
        budget: new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(Number(p.pagu_anggaran)),
        progress: p.persentase_progres || 0,
        contractor: p.opd_penanggung_jawab || "OPD belum tersedia",
        image: photoUrl,
      };
    });
  }, [rawProjects]);

  // Compute categories dynamically based ONLY on existing projects
  const categories = React.useMemo(() => {
    const presentCats = Array.from(new Set(locations.map((loc) => loc.category)));
    const catList = [{ name: "Semua", icon: ListFilter, color: "bg-slate-700" }];

    presentCats.forEach((catName) => {
      const match = locations.find((l) => l.category === catName);
      if (match) {
        catList.push({
          name: catName,
          icon: match.icon,
          color: match.badgeColor || "bg-blue-600",
        });
      }
    });

    return catList;
  }, [locations]);

  const selectedLoc = selectedId !== null ? locations.find((l) => l.id === selectedId) || null : null;

  const selectedGeoAnalysis = React.useMemo(() => {
    if (!selectedLoc) return null;
    return geoAnalyses.find(
      (item) =>
        String(item.proyek_detail_id) ===
        String((selectedLoc as any).realId || selectedLoc.id)
    ) || null;
  }, [selectedLoc, geoAnalyses]);

  const filteredLocations = locations.filter((loc) => {
    const matchesCat = activeCategory === "Semua" || loc.category === activeCategory;
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.kecamatan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAlbum = (loc: any, startIndex = 0) => {
    if (!loc) return;
    let items: MediaItem[] = [];

    if (loc.images && loc.images.length > 0) {
      items = loc.images.map((img: any) => ({
        id: img.id,
        url: img.file_path,
        title: img.file_name || loc.name,
        type: img.file_type || "foto",
        size: img.file_size,
      }));
    } else if (loc.image) {
      items = [
        {
          id: loc.id,
          url: loc.image,
          title: loc.name,
          type: "foto",
        },
      ];
    }

    if (items.length > 0) {
      setAlbumState({
        isOpen: true,
        mediaList: items,
        initialIndex: startIndex,
      });
    } else {
      toast.error("Belum ada foto/video dokumentasi untuk lokasi ini.");
    }
  };

  const handleDownloadDocument = (loc: any) => {
    if (!loc) return;

    const foundDoc = loc.rawDoc;
    const documentId =
      foundDoc?.id || loc.documentId || loc.dokumen_id;

    if (documentId) {
      Swal.fire({
        title: `<div class="flex items-center justify-center gap-2 text-blue-900 font-black text-base"><svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Dokumen Terverifikasi Tim Bappeda</div>`,
        html: `
          <div class="text-left space-y-3 font-sans pt-2">
            <div class="p-3 bg-blue-50/80 rounded-2xl border border-blue-100">
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">${foundDoc?.jenis ? foundDoc.jenis.toUpperCase() : "JENIS BELUM TERSEDIA"} • TAHUN ${foundDoc?.tahun || "Belum tersedia"}</span>
              <h4 class="text-sm font-extrabold text-slate-900 mt-1.5">${foundDoc?.title || "Judul dokumen belum tersedia"}</h4>
              <p class="text-xs text-slate-500 font-medium mt-0.5">Dokumen Resmi Perencanaan Bappeda Kab. Halmahera Utara</p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
              <div class="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] text-slate-400 block font-bold">OPD / Pengunggah:</span>
                <span class="font-extrabold text-slate-800">${foundDoc?.uploadedBy || "Tidak dipublikasikan"}</span>
              </div>
              <div class="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] text-slate-400 block font-bold">Target Proyek:</span>
                <span class="font-extrabold text-slate-800">${loc.name}</span>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "📄 Buka / Unduh Dokumen Resmi (PDF)",
        cancelButtonText: "Tutup",
        customClass: {
          popup: "rounded-3xl p-6 font-sans border border-slate-200 shadow-2xl bg-white",
          title: "text-base font-black text-slate-900",
          confirmButton:
            "px-5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-700/20 mr-2 transition cursor-pointer",
          cancelButton:
            "px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer",
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(`/dokumen?unduh=${encodeURIComponent(String(documentId))}`, "_blank");
        }
      });
    } else {
      toast.success(`Membuka Dokumen Induk Perencanaan untuk proyek: ${loc.name}`);
      window.open(`/dashboard/dokumen`, "_blank");
    }
  };

  const handleSelectProject = (id: number) => {
    setSelectedId(selectedId === id ? null : id);
    // On mobile, auto-switch to map view when tapping project from list
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileTab("map");
    }
  };

  return (
    <section className="py-8 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* TOP INDEPENDENT CARD 1: Pengumuman Resmi Perencanaan Daerah */}
        <div className="p-5 sm:p-10 rounded-[28px] bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 border border-amber-400/30 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-white">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-blue-950 text-xs font-black shadow-md border border-amber-300">
              <Bell className="w-3.5 h-3.5 text-blue-950 animate-bounce" />{" "}
              {pinnedAnnouncement ? (pinnedAnnouncement.type || "Pengumuman Resmi") : "Pengumuman Resmi Perencanaan Daerah"}
            </div>
            <h3 className="text-lg sm:text-3xl font-extrabold text-white leading-tight">
              {pinnedAnnouncement ? pinnedAnnouncement.title : "Penyusunan Renstra PD (Perangkat Daerah) Tahun 2025–2029"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium line-clamp-3">
              {pinnedAnnouncement ? (
                pinnedAnnouncement.content
              ) : (
                <>
                  Berdasarkan <strong className="text-amber-300 font-bold">PERMENDAGRI 86 Tahun 2017</strong> tentang tata cara perencanaan, pengendalian dan Evaluasi Daerah serta <strong className="text-amber-300 font-bold">INMENDAGRI Nomor 2 Tahun 2025</strong> tentang Pedoman Penyusunan Rencana Strategis Perangkat Daerah Kabupaten Halmahera Utara.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            {pinnedAnnouncement?.pdfUrl ? (
              <a
                href={`${pinnedAnnouncement.pdfUrl}?download=1`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto h-12 px-6 rounded-full bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 border border-amber-300 transition transform hover:scale-105 whitespace-nowrap cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-blue-950 shrink-0" /> Unduh Berkas Resmi
              </a>
            ) : (
              <Link
                href="/pengumuman"
                className="w-full sm:w-auto h-12 px-6 rounded-full bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 border border-amber-300 transition transform hover:scale-105 whitespace-nowrap cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-blue-950 shrink-0" /> Unduh Berkas Renstra
              </Link>
            )}
            <Link
              href="/pengumuman"
              className="w-full sm:w-auto h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md shadow-sm transition whitespace-nowrap"
            >
              Arsip Pengumuman <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </Link>
          </div>
        </div>

        {/* MOBILE ONLY: Sleek Segmented Controller Switcher (< lg screens) */}
        <div className="flex lg:hidden items-center justify-between p-1 bg-slate-100 border border-slate-200/80 rounded-2xl shadow-inner">
          <button
            onClick={() => setMobileTab("map")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
              mobileTab === "map"
                ? "bg-blue-700 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Peta Spasial
          </button>
          <button
            onClick={() => setMobileTab("list")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
              mobileTab === "list"
                ? "bg-blue-700 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> Daftar ({filteredLocations.length})
          </button>
          <button
            onClick={() => setMobileTab("overview")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
              mobileTab === "overview"
                ? "bg-blue-700 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Info className="w-3.5 h-3.5" /> Ringkasan
          </button>
        </div>

        {/* RESPONSIVE LAYOUT CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* INDEPENDENT CARD 2: Left Dynamic Details Card (Overview vs Selected Location Detail) */}
          <div
            className={`lg:col-span-3 bg-blue-50/80 border border-blue-200/80 rounded-[28px] p-5 flex flex-col justify-between space-y-4 shadow-lg text-slate-900 ${
              mobileTab !== "overview" ? "hidden lg:flex" : "flex"
            }`}
          >
            {selectedLoc ? (
              /* State A: Specific Project Selected */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-wider ${selectedLoc.badgeColor}`}>
                    {selectedLoc.category}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
                    {selectedLoc.budget}
                  </span>
                </div>

                {/* Construction Photo Showcase Image */}
                {selectedLoc.image && (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-md group">
                    <img
                      src={selectedLoc.image}
                      alt={selectedLoc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = DEFAULT_BAPPEDA_PROYEK_SVG;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <Camera className="w-3 h-3 text-amber-400" /> Foto Lapangan Realisasi Fisik
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-widest block">
                    {selectedLoc.kecamatan}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                    {selectedLoc.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                    {selectedLoc.desc}
                  </p>
                </div>

                {/* Progress Bar Visual */}
                <div className="space-y-1 bg-white p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">Progres Fisik Lapangan</span>
                    <span className="text-blue-700 font-black">{selectedLoc.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${selectedLoc.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block pt-0.5">
                    Pelaksana: {selectedLoc.contractor}
                  </span>
                </div>

                <div className="space-y-2 pt-1.5 text-xs border-t border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500 font-medium shrink-0">Peran Strategis:</span>
                    <span className="font-bold text-slate-800 text-[11px] text-right leading-tight">{selectedLoc.peran}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium shrink-0">Koordinat:</span>
                    <span className="font-mono text-[10px] font-bold text-blue-800 tracking-tight">{selectedLoc.koordinat}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium shrink-0">Status:</span>
                    <span className="font-bold text-blue-700 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {selectedLoc.status}
                    </span>
                  </div>
                </div>

                {/* Berkas / Lampiran Teknis (PDF/DED/AMDAL) */}
                {selectedLoc.documents && selectedLoc.documents.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lampiran Teknis & Berkas ({selectedLoc.documents.length})</span>
                    </span>
                    <div className="space-y-1.5">
                      {selectedLoc.documents.map((att: any) => (
                        <div
                          key={att.id}
                          className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs hover:border-blue-300 transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold uppercase font-mono shrink-0">
                              {att.file_type || "PDF"}
                            </span>
                            <span className="font-bold text-slate-900 truncate text-[11px]">
                              {att.file_name}
                            </span>
                          </div>
                          <a
                            href={
                              att.file_path.startsWith("/storage/")
                                ? `${STORAGE_BASE_URL}${att.file_path}`
                                : att.file_path
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-extrabold text-[10px] hover:bg-blue-700 transition flex items-center gap-1 shrink-0"
                          >
                            <Download className="w-3 h-3" />
                            <span>Buka</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGeoAnalysis && (
                  <div className="p-3 rounded-2xl bg-purple-50/90 border border-purple-200 text-xs text-purple-950 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-extrabold text-[11px] text-purple-900">
                        <Compass className="w-4 h-4 text-purple-700 shrink-0" />
                        <span>Analisis Geoprocessing</span>
                      </span>
                      <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-purple-700 text-white font-extrabold text-[10px] whitespace-nowrap">
                        Radius {selectedGeoAnalysis.radius_meters >= 1000 ? `${(selectedGeoAnalysis.radius_meters / 1000).toFixed(1)} km` : `${selectedGeoAnalysis.radius_meters} m`}
                      </span>
                    </div>
                    {selectedGeoAnalysis.notes && (
                      <p className="text-[10px] text-purple-800 italic font-medium leading-relaxed bg-white/70 p-2 rounded-xl border border-purple-100/80">
                        "{selectedGeoAnalysis.notes}"
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleDownloadDocument(selectedLoc)}
                  className="w-full py-2.5 px-3.5 bg-blue-50 hover:bg-blue-100/90 border border-blue-200 text-blue-800 text-xs font-extrabold rounded-xl transition shadow-xs flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                    <span>Dokumen Terverifikasi Tim Bappeda</span>
                  </div>
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                </button>

                <button
                  onClick={() => setSelectedId(null)}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Kembali ke Ringkasan Halut
                </button>
              </div>
            ) : (
              /* State B: No Project Selected -> Display Regional Overview */
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-3 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-wider bg-blue-900">
                    Ringkasan Wilayah
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
                    GIS BAPPEDA
                  </span>
                </div>

                {/* Regional Hero Visual Badge */}
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-blue-900/20 shadow-md bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex flex-col items-center justify-center text-center p-4 text-white">
                  <Globe className="w-9 h-9 text-amber-400 mb-1 animate-pulse" />
                  <span className="text-sm font-black text-white">Kabupaten Halmahera Utara</span>
                  <span className="text-[10px] text-amber-300 font-semibold mt-0.5">Ibu Kota: Tobelo • 4.951,61 km²</span>
                </div>

                <div>
                  <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-widest block">
                    Provinsi Maluku Utara
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                    Peta Geospasial Spasial & Pembangunan Daerah
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                    Pilih titik lokasi pada peta atau daftar proyek untuk melihat foto realisasi fisik & detail anggaran.
                  </p>
                </div>

                {/* Regional Stats Breakdown */}
                <div className="space-y-2 bg-white p-3 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Total Proyek:</span>
                    <span className="font-extrabold text-blue-900">5 Lokasi Terverifikasi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Total Pagu:</span>
                    <span className="font-extrabold text-blue-900">Rp 27,75 Miliar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Wilayah:</span>
                    <span className="font-extrabold text-blue-900">17 Kecamatan</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verified Documentation Tag for Public View */}
            <div className="w-full py-2.5 px-3 bg-white text-blue-900 text-[11px] font-bold rounded-xl border border-blue-100 shadow-sm flex items-center justify-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" /> Dokumen Terverifikasi Tim Bappeda
            </div>
          </div>

          {/* INDEPENDENT CARD 3: Center Interactive Map Card with Esri Leaflet Integration */}
          <div
            className={`lg:col-span-6 bg-white border border-slate-200 rounded-[28px] p-2 relative overflow-hidden flex-col justify-between min-h-[440px] sm:min-h-[480px] shadow-lg ${
              mobileTab !== "map" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Esri Leaflet Live Map Canvas */}
            <div className="w-full flex-1 rounded-[24px] overflow-hidden relative">
              <EsriLeafletMap
                locations={locations}
                selectedId={selectedId}
                onSelectLocation={(id) => setSelectedId(id)}
                onOpenAlbum={(loc) => handleOpenAlbum(loc)}
              />

              {/* MOBILE BOTTOM SHEET DRAWER OVER MAP WHEN A LOCATION IS SELECTED */}
              <AnimatePresence>
                {selectedLoc && (
                  <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    className="lg:hidden absolute bottom-3 left-3 right-3 z-[999] p-3.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl space-y-2 text-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black text-white uppercase ${selectedLoc.badgeColor}`}>
                        {selectedLoc.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {selectedLoc.budget}
                        </span>
                        <button
                          onClick={() => setSelectedId(null)}
                          className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {selectedLoc.image && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                          <img src={selectedLoc.image} alt={selectedLoc.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-extrabold text-blue-700 uppercase tracking-widest block">
                          {selectedLoc.kecamatan}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 line-clamp-1">{selectedLoc.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{selectedLoc.desc}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold text-blue-700">Progres: {selectedLoc.progress}%</span>
                          <button
                            onClick={() => setMobileTab("overview")}
                            aria-label="Overview detail"
                            className="text-[10px] font-bold text-amber-600 underline"
                          >
                            Lihat Detail Lengkap
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DIRECT MAP FOOTER WITH COMPACT FULLSCREEN ACTION BUTTON */}
            <div className="p-3 bg-white border-t border-slate-100 z-20 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-[10px] font-semibold text-slate-500 px-2">
                Esri ArcGIS Tile Service | Halmahera Utara
              </div>

              <Link
                href="/gis-peta"
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 rounded-xl shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Buka Peta Fullscreen
              </Link>
            </div>
          </div>

          {/* INDEPENDENT CARD 4: Right Directory List Card */}
          <div
            className={`lg:col-span-3 bg-blue-50/80 border border-blue-200/80 rounded-[28px] p-6 flex flex-col justify-between space-y-4 shadow-lg text-slate-900 ${
              mobileTab !== "list" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-blue-950">Lokasi Proyek Halut</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Klik lokasi pada daftar atau marker di peta untuk melihat foto & realisasi fisik.
                </p>
              </div>

              {/* Search Bar Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari wilayah atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition font-medium"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(activeCategory === cat.name ? "Semua" : cat.name)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                      activeCategory === cat.name
                        ? "bg-blue-700 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-blue-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Location Item List - Isolated Scroll Container */}
              <div
                className="space-y-2 h-[340px] max-h-[340px] overflow-y-auto pr-1 text-left custom-scrollbar"
                style={{ overscrollBehavior: "contain" }}
              >
                {filteredLocations.map((loc) => {
                  const IconComp = loc.icon;
                  const isSelected = loc.id === selectedId;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectProject(loc.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                        isSelected
                          ? "bg-blue-700 border-blue-700 text-white shadow-md"
                          : "bg-white border-slate-200 hover:border-blue-300 text-slate-800 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : `${loc.badgeColor} text-white`}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className={`text-xs font-bold line-clamp-1 ${isSelected ? "text-white" : "text-slate-900"}`}>{loc.name}</h5>
                        <p className={`text-[10px] line-clamp-1 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>{loc.kecamatan} • {loc.budget}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Media Album Modal (Full 100dvh Portal Overlay) */}
      <MediaAlbumModal
        isOpen={albumState.isOpen}
        onClose={() => setAlbumState((prev) => ({ ...prev, isOpen: false }))}
        mediaList={albumState.mediaList}
        initialIndex={albumState.initialIndex}
      />
    </section>
  );
};
