"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";
import { AuditLog } from "@/types/auth";
import { toast } from "@/lib/swal";
import { getIkmGrade, fetchPublicKritikList } from "@/services/surveyService";
import {
  Users,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Compass,
  Layers,
  Activity,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers3,
  HeartHandshake,
  DownloadCloud,
  SlidersHorizontal,
  Save,
  X,
  Loader2,
  Building2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

interface MonthlyTrendItem {
  id: number;
  month: string;
  keuangan: number;
  fisik: number;
}

interface ProgramPerformanceItem {
  id: number;
  sector: string;
  realisasi: number;
  target: number;
  color: string;
  textColor: string;
}

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

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);
  const [mounted, setMounted] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Chart Data State
  const [programPerformance, setProgramPerformance] = useState<ProgramPerformanceItem[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendItem[]>([]);
  const [projectsSummary, setProjectsSummary] = useState<ProjectsSummary | null>(null);
  const [publicEngagement, setPublicEngagement] = useState<PublicEngagement | null>(null);
  const [kritikStats, setKritikStats] = useState<{ total: number; pending: number }>({
    total: 0,
    pending: 0,
  });
  const [chartMeta, setChartMeta] = useState({
    source_text: "Sistem Informasi Keuangan Daerah & Geotagging BAPPEDA Halut",
    status_text: "Q3 2026 Status: 89.4% (On-Track)",
    total_target_met: 5,
  });

  // Edit Modal State (For SuperAdmin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"monthly" | "programs">("monthly");
  const [editMonthly, setEditMonthly] = useState<MonthlyTrendItem[]>([]);
  const [editPrograms, setEditPrograms] = useState<ProgramPerformanceItem[]>([]);
  const [savingCharts, setSavingCharts] = useState(false);

  const fetchCharts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/charts`);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        if (Array.isArray(json.data.monthly_trends)) {
          const mData = json.data.monthly_trends.map((item: any) => ({
            id: item.id,
            month: item.month,
            keuangan: Number(item.keuangan),
            fisik: Number(item.fisik),
          }));
          setMonthlyTrends(mData);
          setEditMonthly(mData);
        }
        if (Array.isArray(json.data.program_performance)) {
          const pData = json.data.program_performance.map((item: any) => ({
            id: item.id,
            sector: item.sector,
            realisasi: Number(item.realisasi),
            target: Number(item.target),
            color: item.color || "bg-blue-600",
            textColor: item.textColor || "text-blue-700",
          }));
          setProgramPerformance(pData);
          setEditPrograms(pData);
        }
        if (json.data.projects_summary) {
          setProjectsSummary(json.data.projects_summary);
        }
        if (json.data.public_engagement) {
          setPublicEngagement(json.data.public_engagement);
        }
        if (json.data.meta) {
          setChartMeta(json.data.meta);
        }
      }
    } catch (err) {
      console.error("Data chart database gagal dimuat:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
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

  const handleSaveCharts = async () => {
    setSavingCharts(true);
    try {
      const res = await authenticatedFetch("/dashboard/charts/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly: editMonthly,
          programs: editPrograms,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        toast.success("Data grafik dashboard berhasil diperbarui!");
        setIsEditModalOpen(false);
        fetchCharts();
      } else {
        toast.error(json.message || "Gagal menyimpan data grafik.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat menyimpan data grafik.");
    } finally {
      setSavingCharts(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Selamat Datang, <span className="text-blue-700">{user?.name}</span> 👋
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
            Ikhtisar Pusat Kendali Sistem Pengelolaan SPBE &amp; Geotagging Pembangunan Daerah BAPPEDA Kabupaten Halmahera Utara.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-extrabold shadow-xs transition active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Kelola Data APBD &amp; Target</span>
          </button>
        )}
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
                    {projectsSummary ? `${projectsSummary.total_projects} Titik Proyek` : "6 Titik Proyek"}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {projectsSummary ? `Serapan: ${projectsSummary.serapan_persen}% (${formatRupiah(projectsSummary.total_realisasi)})` : "Sinkron ESRI ArcGIS"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/update-progres"
                className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Progres Sektoral</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4: IKM Kepuasan Warga */}
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

      {/* 3. CHARTS ROW 1: TREN APBD BULANAN & SEBARAN PROYEK GEOTAGGING RIIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 Cols): Bar Chart Realisasi Anggaran APBD Monthly Trend */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> Realisasi Anggaran Makro APBD 2026
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Progres Kumulatif Bulanan BAPPEDA Halmahera Utara
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold shrink-0">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-3 rounded-full bg-blue-600" /> Keuangan
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Fisik
              </span>
            </div>
          </div>

          {/* SVG Visual Bar Chart */}
          <div className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
            <div className="h-48 w-full flex items-end justify-between gap-2.5 px-2 pt-6 border-b border-slate-200 relative">
              {monthlyTrends.map((t, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-extrabold py-1 px-2.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-md">
                    {t.month}: Keuangan {t.keuangan}% | Fisik {t.fisik}%
                  </div>

                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Keuangan Bar */}
                    <div
                      style={{ height: `${t.keuangan}%` }}
                      className="w-1/2 bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    />
                    {/* Fisik Bar */}
                    <div
                      style={{ height: `${t.fisik}%` }}
                      className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    />
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 mt-2">{t.month}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-medium px-2 pt-2">
              <span className="truncate">Sumber Data: {chartMeta.source_text}</span>
              <span className="font-bold text-slate-700 shrink-0">{chartMeta.status_text}</span>
            </div>
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
                <span className="font-bold text-slate-600">Total Pagu:</span>
                <span className="font-black text-slate-900">
                  {projectsSummary ? formatRupiah(projectsSummary.total_pagu) : "Rp 4,90 M"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Realisasi Keuangan Proyek:</span>
                <span className="font-black text-emerald-700">
                  {projectsSummary ? formatRupiah(projectsSummary.total_realisasi) : "Rp 2,35 M"}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projectsSummary ? projectsSummary.serapan_persen : 48.1}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-0.5">
                <span>Rasio Serapan: {projectsSummary ? projectsSummary.serapan_persen : 48.1}%</span>
                <span>Rata-rata Fisik: {projectsSummary ? projectsSummary.avg_progress : 59.2}%</span>
              </div>
            </div>

            {/* Status Breakdown Pills */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800">Selesai</span>
                <span className="text-xs font-black text-emerald-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {projectsSummary?.status_counts.selesai ?? 2}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800">Dalam Proses</span>
                <span className="text-xs font-black text-blue-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {projectsSummary?.status_counts.dalam_proses ?? 3}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Belum Mulai</span>
                <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {projectsSummary?.status_counts.belum_mulai ?? 1}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800">Terkendala</span>
                <span className="text-xs font-black text-rose-900 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {projectsSummary?.status_counts.terkendala ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1 text-indigo-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terintegrasi ESRI REST
            </span>
            <Link href="/dashboard/update-progres" className="text-blue-700 hover:underline">
              Kelola Proyek Sektoral &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 4. CHARTS ROW 2: TARGET PROGRAM SEKTOAL MAKRO & TOP DOKUMEN PERENCANAAN TERPOPULER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (6 Cols): Target Program Sektoral Makro */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Target Program Strategis Sektoral
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Capaian Target Fisik Per-Bidang BAPPEDA
              </h3>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {programPerformance.map((p, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 line-clamp-1">{p.sector}</span>
                  <span className={p.textColor}>
                    {p.realisasi}% / {p.target}%
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden relative">
                  <div
                    style={{ width: `${p.realisasi}%` }}
                    className={`h-full ${p.color} rounded-full transition-all duration-700`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> {chartMeta.total_target_met} Program Utama Memenuhi Target
            </span>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("programs");
                  setIsEditModalOpen(true);
                }}
                className="text-blue-700 hover:underline cursor-pointer"
              >
                Ubah Target &rarr;
              </button>
            )}
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
                  <div key={doc.id || idx} className="space-y-1 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 text-[10px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate" title={doc.title}>
                          {doc.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                        {doc.downloads.toLocaleString("id-ID")}x unduh
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                Memuat riwayat unduhan dokumen...
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

      {/* 5. RECENT ACTIVITY (AUDIT LOGS) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Audit Log Aktivitas Pengelola SPBE</h3>
            <p className="text-[11px] text-slate-500 font-medium">Rekap riwayat aktivitas admin terenkripsi</p>
          </div>
          {isSuperAdmin && (
            <Link href="/dashboard/audit-logs" className="text-xs font-bold text-blue-700 hover:underline">
              Buka Log SPBE &rarr;
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

      {/* 6. MODAL KELOLA DATA APBD & PROGRAM SEKTOAL (PORTAL) */}
      {mounted && isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => !savingCharts && setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 font-sans max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900">Kelola Nilai Grafik Dashboard</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Perbarui persentase realisasi APBD bulanan dan capaian program sektoral langsung ke database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("monthly")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "monthly"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tren APBD Bulanan ({editMonthly.length} Bulan)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("programs")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "programs"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Target Sektoral ({editPrograms.length} Bidang)
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activeTab === "monthly" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 text-[11px] font-black uppercase text-slate-400 px-3">
                    <span className="col-span-4">Bulan</span>
                    <span className="col-span-4 text-center">Keuangan (%)</span>
                    <span className="col-span-4 text-center">Fisik (%)</span>
                  </div>
                  {editMonthly.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="grid grid-cols-12 items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80"
                    >
                      <span className="col-span-4 text-xs font-bold text-slate-900">{m.month}</span>
                      <div className="col-span-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={m.keuangan}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setEditMonthly((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, keuangan: val } : item))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center text-blue-700 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={m.fisik}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setEditMonthly((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, fisik: val } : item))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center text-emerald-700 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 text-[11px] font-black uppercase text-slate-400 px-3">
                    <span className="col-span-6">Sektor Program</span>
                    <span className="col-span-3 text-center">Realisasi (%)</span>
                    <span className="col-span-3 text-center">Target (%)</span>
                  </div>
                  {editPrograms.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="grid grid-cols-12 items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80"
                    >
                      <span className="col-span-6 text-xs font-bold text-slate-900 line-clamp-1" title={p.sector}>
                        {p.sector}
                      </span>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={p.realisasi}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setEditPrograms((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, realisasi: val } : item))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center text-blue-700 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={p.target}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setEditPrograms((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, target: val } : item))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center text-slate-700 focus:outline-none focus:border-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={savingCharts}
                onClick={() => setIsEditModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition text-center justify-center flex items-center cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingCharts}
                onClick={handleSaveCharts}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingCharts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{savingCharts ? "Menyimpan..." : "Simpan Perubahan Data"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

