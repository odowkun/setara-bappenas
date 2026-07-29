"use client";

import { Download, Mail, MonitorSmartphone } from "lucide-react";
import { formatDateWIT } from "@/lib/dateUtils";
import { DocumentDownloadLog } from "@/types/documentAnalytics";

interface DownloadLogTableProps {
  logs: DocumentDownloadLog[];
}

export function DownloadLogTable({ logs }: DownloadLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <Download className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 text-sm font-black text-slate-800">
          Belum Ada Riwayat Unduhan
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Email masyarakat akan muncul setelah mereka mengunduh dokumen.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="bg-blue-950 text-white">
            <tr>
              <th className="px-5 py-3.5 font-extrabold">Waktu Unduh</th>
              <th className="px-5 py-3.5 font-extrabold">Email Masyarakat</th>
              <th className="px-5 py-3.5 font-extrabold">Dokumen</th>
              <th className="px-5 py-3.5 font-extrabold">Jejak Akses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="align-top transition hover:bg-blue-50/50">
                <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-700">
                  {formatDateWIT(log.downloadedAt)}
                </td>
                <td className="px-5 py-4">
                  <span className="flex items-center gap-2 font-extrabold text-blue-800">
                    <Mail className="h-4 w-4 shrink-0" />
                    {log.email}
                  </span>
                </td>
                <td className="max-w-sm px-5 py-4">
                  <p className="font-extrabold text-slate-900">{log.documentTitle}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                    {log.documentJenis} · {log.documentBidang}
                  </p>
                </td>
                <td className="px-5 py-4 text-slate-500">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <MonitorSmartphone className="h-3.5 w-3.5" />
                    IP: {log.ipAddress || "-"}
                  </span>
                  <p className="mt-1 max-w-xs truncate text-[10px]" title={log.userAgent || ""}>
                    {log.userAgent || "Browser tidak terdeteksi"}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
