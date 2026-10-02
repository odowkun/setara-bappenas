"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";
import { AuditLog } from "@/types/auth";
import { getIkmGrade, fetchPublicKritikList } from "@/services/surveyService";
import {
  Users,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Layers,
  BarChart3,
  CheckCircle2,
  HeartHandshake,
  DownloadCloud,
  MessageSquare,
  ExternalLink,
  Newspaper,
  Calendar,
  Image as ImageIcon,
  Megaphone,
  Briefcase,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface ProjectsSummary {
  total_projects: number;
  status_counts: {
    selesai: number;
    dalam_proses: number;
    belum_mulai: number;
    terkendala: number;
  };
  total_pagu: number;
  total_realisasi: number;
  serapan_persen: number;
  avg_progress: number;
  by_bidang: {
    bidang: string;
    total_proyek: number;
    avg_progres: number;
    total_pagu: number;
    total_realisasi: number;
  }[];
}

interface DocumentTypeStat {
  jenis: string;
  count: number;
  total_downloads: number;
}

interface PortalStats {
  berita: number;
  agenda: number;
  galeri: number;
  pengumuman: number;
}

interface PublicEngagement {
  total_downloads: number;
  top_documents: {
    id: number;
    title: string;
    jenis: string;
    tahun: string;
    downloads: number;
    views: number;
  }[];
  survey_count: number;
  avg_ikm: number;
  kritik_total?: number;
  kritik_pending?: number;
  kritik_responded?: number;
}

const formatRupiah = (val: number) => {
  if (val >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
  }
  if (val >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${val.toLocaleString("id-ID")}`;
};

const getBidangName = (slug: string) => {
  const map: Record<string, string> = {
    infrastruktur: "Bidang Infrastruktur & Kewilayahan",
    perekonomian: "Bidang Perekonomian & SDA",
    sosbud: "Bidang Pemerintahan & Pembangunan Manusia",
    sosial_budaya: "Bidang Pemerintahan & Pembangunan Manusia",
    renval: "Bidang Perencanaan, Pengendalian & Evaluasi",
    perencanaan: "Bidang Perencanaan, Pengendalian & Evaluasi",
    sekretariat: "Sekretariat BAPPEDA",
  };
  return map[slug?.toLowerCase()] || (slug ? `Bidang ${slug.replace(/_/g, " ").toUpperCase()}` : "Bidang Umum");
};

const getDocumentTypeLabel = (jenis: string) => {
  const map: Record<string, string> = {
    rpjpd: "RPJPD (Rencana Jangka Panjang)",
    rpjmd_kab: "RPJMD Kabupaten",
    rkpd: "RKPD Tahunan",
    renstra: "Rencana Strategis (Renstra)",
    renja: "Rencana Kerja (Renja)",
    data_sektoral: "Data Sektoral Pembangunan",
    dik_sektoral: "Dokumen Informasi Kinerja (DIK)",
    lakip: "LAKIP / SAKIP Daerah",
  };
  return map[jenis?.toLowerCase()] || (jenis ? jenis.replace(/_/g, " ").toUpperCase() : "Dokumen Lainnya");
};

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);
  const [usersCount, setUsersCount] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Real Sub-Menu Chart Data
  const [chartsLoading, setChartsLoading] = useState(true);
  const [projectsSummary, setProjectsSummary] = useState<ProjectsSummary | null>(null);
  const [documentsByType, setDocumentsByType] = useState<DocumentTypeStat[]>([]);
  const [portalStats, setPortalStats] = useState<PortalStats | null>(null);
  const [publicEngagement, setPublicEngagement] = useState<PublicEngagement | null>(null);
  const [kritikStats, setKritikStats] = useState<{ total: number; pending: number }>({
    total: 0,
    pending: 0,
  });

  const fetchCharts = async () => {
    setChartsLoading(true);
    try {
      const data = await adminService.fetchDashboardCharts();
      if (data) {
        if (data.projects_summary) {
          setProjectsSummary(data.projects_summary);
        }
        if (Array.isArray(data.documents_by_type)) {
          setDocumentsByType(data.documents_by_type);
        }
        if (data.portal_stats) {
          setPortalStats(data.portal_stats);
        }
        if (data.public_engagement) {
          setPublicEngagement(data.public_engagement);
        }
      }
    } catch (err) {
      console.error("Data chart riil sub-menu gagal dimuat:", err);
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      adminService.fetchUsers(),
      adminService.fetchDocuments(user?.bidang, user?.role),
      adminService.fetchLogs(),
    ]).then(([users, docs, auditLogs]) => {
      setUsersCount(users.length);
      setDocsCount(docs.length);
      setLogs(auditLogs.slice(0, 5));
    });

    fetchCharts();

    fetchPublicKritikList().then((list) => {
      if (Array.isArray(list)) {
        const pending = list.filter((k) => k.status !== "Sudah Ditanggapi" && k.status !== "Ditutup").length;
        setKritikStats({ total: list.length, pending });
      }
    });
  }, [user]);

  const getRoleDisplayName = () => {
    if (!user) return "";
    switch (user.role) {
      case "superadmin":
        return "Administrator (Super Admin)";
      case "admin_umum":
        return "Admin Umum & Redaksi Humas";
      case "admin_bidang":
        return `Admin Bidang (${user.bidang?.toUpperCase() || ""})`;
      default:
        return user.role;
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* 1. TOP WELCOME BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{getRoleDisplayName()}</span>
            </span>
            <button
              onClick={fetchCharts}
              disabled={chartsLoading}
              title="Klik untuk menyinkronkan data metrik sub-menu"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 text-emerald-800 text-[11px] font-bold transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${chartsLoading ? "animate-spin" : ""}`} />
              <span>{chartsLoading ? "Menyinkronkan..." : "Sinkronisasi Otomatis Sub-Menu"}</span>
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Selamat Datang, <span className="text-blue-700">{user?.name}</span> 👋
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
            Ikhtisar Pusat Kendali Sistem Informasi &amp; Geotagging Pembangunan Daerah BAPPEDA Kabupaten Halmahera Utara. Seluruh grafik dan metrik dikalkulasi secara otomatis langsung dari sub-menu operasional.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/geotagging-proyek"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold shadow-sm shadow-blue-700/20 transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <MapPin className="w-4 h-4" />
            <span>Peta Geotagging Proyek</span>
          </Link>
        </div>
      </div>

      {/* 2. OVERVIEW METRIC CARDS GRID (5 CARDS) */}
      {(() => {
        const displayKritikTotal = publicEngagement?.kritik_total ?? kritikStats.total;
        const displayKritikPending = publicEngagement?.kritik_pending ?? kritikStats.pending;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Card 1: Users */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-blue-300 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengguna Sistem</span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{usersCount} Terdaftar</div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">3 Peran (Superadmin, Umum, Bidang)</p>
                </div>
              </div>
              {isSuperAdmin && (
                <Link
                  href="/dashboard/users"
                  className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <span>Kelola Pengguna</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* Card 2: Dokumen & Unduhan */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dokumen Perencanaan</span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{docsCount} Dokumen</div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {publicEngagement ? `${publicEngagement.total_downloads.toLocaleString("id-ID")}x Total Diunduh` : "RPJPD, RPJMD, RKPD"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/dokumen"
                className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Repository Publik</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Proyek Geotagging Riil */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-300 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proyek Geotagging</span>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {projectsSummary ? (
                      `${projectsSummary.total_projects} Titik Proyek`
                    ) : chartsLoading ? (
                      <span className="inline-block w-28 h-7 bg-slate-200 animate-pulse rounded-lg" />
                    ) : (
                      "0 Titik Proyek"
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {projectsSummary ? `Serapan: ${projectsSummary.serapan_persen}% (${formatRupiah(projectsSummary.total_realisasi)})` : "Peta & Pemantauan Fisik"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/update-progres"
                className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Update Progres</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4: Kepuasan Warga (IKM) */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kepuasan Warga (IKM)</span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-100">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-600 flex items-center gap-2">
                    <span>{publicEngagement ? `${publicEngagement.avg_ikm}` : "96.0"}</span>
                    {(() => {
                      const score = publicEngagement ? Number(publicEngagement.avg_ikm) : 96.0;
                      const grade = getIkmGrade(score);
                      return (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${grade.badgeClass}`}>
                          {grade.kategori.toUpperCase()} ({grade.mutu})
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {publicEngagement ? `${publicEngagement.survey_count} Responden Masuk` : "Survei Kepuasan Online"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/survey-kepuasan"
                className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Laporan IKM</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 5: Kritik & Saran Warga */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-rose-300 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kritik &amp; Saran</span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-100">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 flex items-center flex-wrap gap-1.5">
                    <span>{displayKritikTotal} Masukan</span>
                    {displayKritikPending > 0 ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        {displayKritikPending} Belum Dijawab
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Semua Terjawab
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {displayKritikPending > 0
                      ? `${displayKritikPending} pesan perlu tindak lanjut`
                      : "Seluruh kritik & saran telah direspons"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/kritik-saran"
                className="text-xs font-bold text-rose-700 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Kelola Masukan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })()}

      {/* 3. CHARTS ROW 1: KINERJA SEKTORAL PROYEK RIIL & MONITORING OPERASIONAL GEOTAGGING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 Cols): Serapan Anggaran & Progres Fisik Riil per Bidang */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> Kinerja Sektoral Proyek Riil
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Realisasi Anggaran &amp; Progres Fisik per Bidang
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold shrink-0">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-3 rounded-full bg-blue-600" /> Serapan Keuangan
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Progres Fisik
              </span>
            </div>
          </div>

          {/* Dynamic List / Bar Chart per Bidang */}
          <div className="space-y-4 pt-1 flex-1">
            {projectsSummary?.by_bidang && projectsSummary.by_bidang.length > 0 ? (
              projectsSummary.by_bidang.map((b, idx) => {
                const serapan = b.total_pagu > 0 ? Math.round((b.total_realisasi / b.total_pagu) * 100) : 0;
                const fisik = Number(b.avg_progres) || 0;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-extrabold text-slate-900">{getBidangName(b.bidang)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {b.total_proyek} Proyek
                        </span>
                        <span className="text-[11px] font-black text-slate-900">
                          {formatRupiah(b.total_realisasi)} / {formatRupiah(b.total_pagu)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Double Bars */}
                    <div className="space-y-1.5 pt-0.5">
                      {/* Bar 1: Serapan Keuangan */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Serapan Keuangan:</span>
                          <span className="text-blue-700 font-extrabold">{serapan}%</span>
                        </div>
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-700 to-blue-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(serapan, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Bar 2: Progres Fisik Lapangan */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Rata-rata Fisik Lapangan:</span>
                          <span className="text-emerald-700 font-extrabold">{fisik}%</span>
                        </div>
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(fisik, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : projectsSummary ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                Belum ada data proyek sektoral per bidang.
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-bold animate-pulse">
                Memuat data kinerja sektoral per bidang...
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dihitung otomatis dari akumulasi titik proyek riil</span>
            </span>
            <Link href="/dashboard/update-progres" className="text-blue-700 hover:underline">
              Kelola Proyek Sektoral &rarr;
            </Link>
          </div>
        </div>

        {/* Right (5 Cols): Real Geotagging Projects Operational Progress */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Monitoring Proyek Lapangan (Geotagging)
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Serapan &amp; Status Proyek Fisik Riil
              </h3>
            </div>
            <Link
              href="/dashboard/geotagging-proyek"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Buka Peta Geotagging"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {/* Real Budget Absorption Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Total Pagu Keseluruhan:</span>
                <span className="font-black text-slate-900">
                  {projectsSummary ? formatRupiah(projectsSummary.total_pagu) : "Memuat..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Realisasi Keuangan Terserap:</span>
                <span className="font-black text-emerald-700">
                  {projectsSummary ? formatRupiah(projectsSummary.total_realisasi) : "Memuat..."}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projectsSummary ? Math.min(projectsSummary.serapan_persen, 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-0.5">
                <span>Rasio Serapan: {projectsSummary ? `${projectsSummary.serapan_persen}%` : "0%"}</span>
                <span>Rata-rata Fisik: {projectsSummary ? `${projectsSummary.avg_progress}%` : "0%"}</span>
              </div>
            </div>

            {/* Status Breakdown Pills */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800">Selesai</span>
                <span className="text-xs font-black text-emerald-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs min-w-[24px] text-center">
                  {projectsSummary ? (
                    projectsSummary.status_counts.selesai
                  ) : chartsLoading ? (
                    <span className="inline-block w-3 h-3 bg-emerald-200 animate-pulse rounded" />
                  ) : (
                    0
                  )}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800">Dalam Proses</span>
                <span className="text-xs font-black text-blue-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs min-w-[24px] text-center">
                  {projectsSummary ? (
                    projectsSummary.status_counts.dalam_proses
                  ) : chartsLoading ? (
                    <span className="inline-block w-3 h-3 bg-blue-200 animate-pulse rounded" />
                  ) : (
                    0
                  )}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Belum Mulai</span>
                <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs min-w-[24px] text-center">
                  {projectsSummary ? (
                    projectsSummary.status_counts.belum_mulai
                  ) : chartsLoading ? (
                    <span className="inline-block w-3 h-3 bg-slate-300 animate-pulse rounded" />
                  ) : (
                    0
                  )}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800">Terkendala</span>
                <span className="text-xs font-black text-rose-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs min-w-[24px] text-center">
                  {projectsSummary ? (
                    projectsSummary.status_counts.terkendala
                  ) : chartsLoading ? (
                    <span className="inline-block w-3 h-3 bg-rose-200 animate-pulse rounded" />
                  ) : (
                    0
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1 text-indigo-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terintegrasi ESRI REST
            </span>
            <Link href="/dashboard/geotagging-proyek" className="text-blue-700 hover:underline">
              Buka Peta Lokasi &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 4. CHARTS ROW 2: DISTRIBUSI REPOSITORI DOKUMEN & TOP DOKUMEN DIUNDUH WARGA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (6 Cols): Distribusi Dokumen Perencanaan per Kategori */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Repositori Perencanaan Daerah
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Distribusi Dokumen per Kategori
              </h3>
            </div>
            <Link
              href="/dashboard/dokumen"
              className="text-xs font-bold text-indigo-700 hover:underline shrink-0"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {documentsByType.length > 0 ? (
              documentsByType.map((item, idx) => {
                const maxCount = documentsByType[0]?.count || 1;
                const ratio = Math.max(12, Math.round((item.count / maxCount) * 100));

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{getDocumentTypeLabel(item.jenis)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.count} Dokumen
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {item.total_downloads.toLocaleString("id-ID")}x unduh
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : chartsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold animate-pulse">
                Memuat data kategori dokumen...
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                Belum ada data kategori dokumen.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Dokumen: {docsCount} Berkas Terdaftar</span>
            </span>
            <Link href="/dashboard/dokumen/jenis-dokumen" className="text-blue-700 hover:underline">
              Master Jenis Dokumen &rarr;
            </Link>
          </div>
        </div>

        {/* Right (6 Cols): Top Dokumen Perencanaan Publik Terpopuler */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <DownloadCloud className="w-4 h-4" /> Minat Akses Publik &amp; Transparansi
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                5 Dokumen Perencanaan Paling Banyak Diunduh
              </h3>
            </div>
            <Link
              href="/dashboard/dokumen"
              className="text-xs font-bold text-emerald-700 hover:underline shrink-0"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {publicEngagement?.top_documents && publicEngagement.top_documents.length > 0 ? (
              publicEngagement.top_documents.map((doc, idx) => {
                const maxDownloads = publicEngagement.top_documents[0]?.downloads || 1;
                const ratio = Math.max(10, Math.round((doc.downloads / maxDownloads) * 100));

                return (
                  <div
                    key={doc.id || idx}
                    className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate" title={doc.title}>
                          {doc.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                        {doc.downloads.toLocaleString("id-ID")}x unduh
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : chartsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold animate-pulse">
                Memuat riwayat unduhan dokumen...
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                Belum ada data unduhan dokumen.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Unduhan: {publicEngagement?.total_downloads.toLocaleString("id-ID") || 0} berkas</span>
            </span>
            <Link href="/dashboard/dokumen/riwayat-unduhan" className="text-blue-700 hover:underline">
              Log Unduhan Lengkap &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 5. PORTAL CONTENT MODULES QUICK CARDS (Sub-menu Berita, Agenda, Galeri, Pengumuman) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Berita */}
        <Link
          href="/dashboard/berita"
          className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 transition flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100 shrink-0 group-hover:scale-105 transition">
            <Newspaper className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Berita Daerah</span>
            <span className="text-base font-black text-slate-900 block">
              {portalStats ? (
                `${portalStats.berita} Artikel`
              ) : chartsLoading ? (
                <span className="inline-block w-14 h-5 bg-slate-200 animate-pulse rounded-md" />
              ) : (
                "0 Artikel"
              )}
            </span>
          </div>
        </Link>

        {/* Agenda */}
        <Link
          href="/dashboard/agenda"
          className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 transition flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-100 shrink-0 group-hover:scale-105 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Agenda Kegiatan</span>
            <span className="text-base font-black text-slate-900 block">
              {portalStats ? (
                `${portalStats.agenda} Terjadwal`
              ) : chartsLoading ? (
                <span className="inline-block w-14 h-5 bg-slate-200 animate-pulse rounded-md" />
              ) : (
                "0 Terjadwal"
              )}
            </span>
          </div>
        </Link>

        {/* Galeri */}
        <Link
          href="/dashboard/galeri"
          className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 transition flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100 shrink-0 group-hover:scale-105 transition">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Galeri Foto/Video</span>
            <span className="text-base font-black text-slate-900 block">
              {portalStats ? (
                `${portalStats.galeri} Media`
              ) : chartsLoading ? (
                <span className="inline-block w-14 h-5 bg-slate-200 animate-pulse rounded-md" />
              ) : (
                "0 Media"
              )}
            </span>
          </div>
        </Link>

        {/* Pengumuman */}
        <Link
          href="/dashboard/pengumuman"
          className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-amber-400 transition flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-100 shrink-0 group-hover:scale-105 transition">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 block truncate">Pengumuman &amp; Surat</span>
            <span className="text-base font-black text-slate-900 block">
              {portalStats ? (
                `${portalStats.pengumuman} Publikasi`
              ) : chartsLoading ? (
                <span className="inline-block w-14 h-5 bg-slate-200 animate-pulse rounded-md" />
              ) : (
                "0 Publikasi"
              )}
            </span>
          </div>
        </Link>
      </div>

      {/* 6. RECENT ACTIVITY (AUDIT LOGS) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Audit Log Aktivitas Pengelola</h3>
            <p className="text-[11px] text-slate-500 font-medium">Rekap riwayat aktivitas admin terenkripsi</p>
          </div>
          {isSuperAdmin && (
            <Link href="/dashboard/audit-logs" className="text-xs font-bold text-blue-700 hover:underline">
              Buka Audit Log &rarr;
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs hover:border-amber-300 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold border border-amber-200">
                ⚡
              </div>
              <div className="space-y-0.5 overflow-hidden flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.userName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                  </span>
                </div>
                <p className="text-slate-700 font-medium line-clamp-1">{log.details}</p>
                <p className="text-[10px] text-slate-400 font-mono">IP: {log.ipAddress}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
