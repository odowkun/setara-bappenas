"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { AuditLog } from "@/types/auth";
import { Lock, Search } from "lucide-react";
import { formatDateWIT } from "@/lib/dateUtils";

export default function AuditLogsPage() {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const isSuperAdmin = hasRole(["superadmin"]);

  useEffect(() => {
    setLogs(adminService.getLogs());
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
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            MODUL SUPERADMIN SPBE
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Audit Log Security SPBE</h1>
        <p className="text-xs text-slate-600 font-medium">
          Jejak rekam aktivitas pengubahan data, unggah berkas, dan autentikasi pengelola.
        </p>
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
          <table className="w-full text-left text-xs">
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
              {filteredLogs.map((log) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
