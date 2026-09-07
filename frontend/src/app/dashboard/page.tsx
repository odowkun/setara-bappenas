"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { API_BASE_URL } from "@/lib/apiClient";
import { AuditLog } from "@/types/auth";
import {
  Users,
  FileText,
  ArrowUpRight,
  FileUp,
  ShieldCheck,
  MapPin,
  Compass,
  Layers,
  Activity,
  Paperclip,
  TrendingUp,
  BarChart3,
  PieChart,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers3,
} from "lucide-react";

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [usersCount, setUsersCount] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Chart Data State (Fetched dynamically from Database)
  const [programPerformance, setProgramPerformance] = useState<
    { id?: number; sector: string; realisasi: number; target: number; color: string; textColor: string }[]
  >([]);

  const [monthlyTrends, setMonthlyTrends] = useState<
    { id?: number; month: string; keuangan: number; fisik: number }[]
  >([]);

  const [chartMeta, setChartMeta] = useState({
    source_text: "",
    status_text: "",
    total_target_met: 0,
  });

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

    // Fetch dynamic charts data from backend MySQL DB
    fetch(`${API_BASE_URL}/dashboard/charts`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success" && json.data) {
          if (Array.isArray(json.data.monthly_trends) && json.data.monthly_trends.length > 0) {
            setMonthlyTrends(
              json.data.monthly_trends.map((item: any) => ({
                id: item.id,
                month: item.month,
                keuangan: Number(item.keuangan),
                fisik: Number(item.fisik),
              }))
            );
          }
          if (Array.isArray(json.data.program_performance) && json.data.program_performance.length > 0) {
            setProgramPerformance(
              json.data.program_performance.map((item: any) => ({
                id: item.id,
                sector: item.sector,
                realisasi: Number(item.realisasi),
                target: Number(item.target),
                color: item.color || "bg-blue-600",
                textColor: item.textColor || "text-blue-700",
              }))
            );
          }
          if (json.data.meta) {
            setChartMeta(json.data.meta);
          }
        }
      })
      .catch((err) => console.error("Data chart database gagal dimuat:", err));
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
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase bg-blue-50 text-blue-800 border border-blue-200/80 tracking-wider">
              HAK AKSES: {getRoleDisplayName()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Selamat Datang, <span className="text-blue-700">{user?.name}</span> 👋
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
            Ikhtisar Pusat Kendali Sistem Pengelolaan SPBE &amp; Geotagging Pembangunan Daerah BAPPEDA Kabupaten Halmahera Utara.
          </p>
        </div>
      </div>

      {/* 2. OVERVIEW METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Users */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengguna Sistem</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{usersCount} Terdaftar</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">3 Peran Access (Superadmin, Umum, Bidang)</p>
          </div>
          {hasRole(["superadmin"]) && (
            <Link
              href="/dashboard/users"
              className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Kelola Pengguna</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Card 2: Dokumen */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dokumen Daerah</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{docsCount} Dokumen</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {user?.role === "admin_bidang"
                ? `Filter Scope: ${user.bidang?.toUpperCase()}`
                : "RPJPD, RPJMD, RKPD, Renstra, LKPJ"}
            </p>
          </div>
          <Link
            href="/dashboard/dokumen"
            className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Repository Publik</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: SPBE Status */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden group hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Integritas SPBE</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 flex items-center gap-2">
              <span>99.9%</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                OPTIMAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sanctum Token &amp; Audit Log Active</p>
          </div>
          {hasRole(["superadmin"]) && (
            <Link
              href="/dashboard/audit-logs"
              className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Audit Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* 3. CHARTS SECTION: TREND REALISASI & PERFORMA PROGRAM SEKTOAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 Cols): Bar Chart Realisasi Anggaran APBD Monthly Trend */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> Grafik Tren Realisasi Keuangan vs Fisik APBD 2026
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Progres Kumulatif Bulanan BAPPEDA Halmahera Utara
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold shrink-0">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-3 rounded-full bg-blue-600" /> Realisasi Keuangan
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Realisasi Fisik
              </span>
            </div>
          </div>

          {/* SVG Visual Bar Chart */}
          <div className="space-y-4 pt-2">
            <div className="h-48 w-full flex items-end justify-between gap-3 px-2 pt-6 border-b border-slate-200 relative">
              {monthlyTrends.map((t, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-extrabold py-1 px-2.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-md">
                    Keuangan: {t.keuangan}% | Fisik: {t.fisik}%
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

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
              <span>Sumber Data: {chartMeta.source_text}</span>
              <span className="font-bold text-slate-700">{chartMeta.status_text}</span>
            </div>
          </div>
        </div>

        {/* Right (5 Cols): Program Sektoral Realisasi Indicators */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Performa Program Strategis Sektoral
            </span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Capaian Target Fisik Per-Bidang BAPPEDA
            </h3>
          </div>

          <div className="space-y-4">
            {programPerformance.map((p, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 line-clamp-1">{p.sector}</span>
                  <span className={p.textColor}>{p.realisasi}% / {p.target}%</span>
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

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> {chartMeta.total_target_met} Program Utama Memenuhi Target
            </span>
            <Link href="/dashboard/update-progres" className="text-blue-700 hover:underline">
              Detail Progres Sektoral &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Audit Log Aktivitas Pengelola SPBE</h3>
              <p className="text-[11px] text-slate-500 font-medium">Rekap riwayat aktivitas admin terenkripsi</p>
            </div>
            {hasRole(["superadmin"]) && (
              <Link href="/dashboard/audit-logs" className="text-xs font-bold text-blue-700 hover:underline">
                Buka Log SPBE
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
