"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { AuditLog } from "@/types/auth";
import { Lock, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { formatDateWIT } from "@/lib/dateUtils";

export default function AuditLogsPage() {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const isSuperAdmin = hasRole(["superadmin"]);

  useEffect(() => {
    setLoading(true);
    adminService.fetchLogs()
      .then(setLogs)
      .catch((err) => {
        console.error("Gagal memuat audit logs:", err);
        setLogs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress.includes(searchTerm)
  );

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas (Restricted Area)</h2>
        <p className="text-xs text-slate-600 font-medium">
          Modul Audit Log Keamanan SPBE hanya dapat diakses oleh role **Administrator (SuperAdmin)**.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-purple-600 shrink-0" />
            <span>Audit Log Security SPBE</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Jejak rekam aktivitas pengubahan data, unggah berkas, dan autentikasi pengelola.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{logs.length} Aktivitas Terekam</span>
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari berdasarkan nama user, aksi, detail, atau IP Address..."
          className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 focus:border-purple-700 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-sm"
        />
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Waktu / Timestamp</th>
                <th className="px-5 py-3.5">Pengelola SPBE</th>
                <th className="px-5 py-3.5">Jenis Aksi (Action)</th>
                <th className="px-5 py-3.5">Detail Rincian Activity</th>
                <th className="px-5 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                [1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-200 rounded"></div></td>
                    <td className="px-5 py-4 space-y-1.5">
                      <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      <div className="h-3 w-16 bg-slate-100 rounded"></div>
                    </td>
                    <td className="px-5 py-4"><div className="h-5 w-24 bg-slate-200 rounded-full"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-64 bg-slate-200 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    Tidak ada aktivitas audit log ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-mono text-slate-500 whitespace-nowrap font-bold text-xs">
                      {formatDateWIT(log.timestamp)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{log.userName}</p>
                      <span className="text-[10px] text-amber-900 font-bold uppercase font-mono">
                        {log.userRole}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {log.details}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-500 font-bold">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
