"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { proyekService, ProyekDetail } from "@/services/proyekService";
import { AdminDocument } from "@/types/auth";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  Activity,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Building2,
  DollarSign,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  FileText,
  RefreshCw,
  Edit2,
  Trash2,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, showDeleteConfirm, toast } from "@/lib/swal";

const formatRupiahString = (val: number | string) => {
  const num = typeof val === "number" ? val : parseInt(String(val).replace(/[^0-9]/g, "")) || 0;
  return `Rp ${num.toLocaleString("id-ID")}`;
};

const parseRupiahInput = (str: string) => {
  const cleanStr = str.replace(/[^0-9]/g, "");
  return cleanStr ? parseInt(cleanStr, 10) : 0;
};

export default function UpdateProgresPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("semua");
  const [projects, setProjects] = useState<ProyekDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBidang, setSelectedBidang] = useState<string>("semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("semua");

  // Selected for Edit Modal
  const [editingProject, setEditingProject] = useState<ProyekDetail | null>(null);
  const [progresForm, setProgresForm] = useState({
    persentase_progres: 0,
    status_progres: "dalam_proses" as "dalam_proses" | "selesai" | "terkendala",
    realisasi_anggaran: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadDocuments();
    loadProjects("semua");
  }, []);

  // Lock body scroll when editing modal is open
  useEffect(() => {
    if (editingProject) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setEditingProject(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [editingProject]);

  const loadDocuments = async () => {
    const docs = await adminService.fetchDocuments(user?.bidang, user?.role);
    setDocuments(docs);
  };

  const loadProjects = async (docId?: string) => {
    setLoading(true);
    const targetId = docId !== undefined ? docId : selectedDocId;
    const data = await proyekService.getProjects(
      targetId === "semua" ? undefined : targetId,
      undefined,
      true
    );
    setProjects(data);
    setLoading(false);
  };

  const handleDocIdChange = (val: string | number) => {
    const newId = String(val);
    setSelectedDocId(newId);
    loadProjects(newId);
  };

  const handleOpenEdit = (prj: ProyekDetail) => {
    setEditingProject(prj);
    setProgresForm({
      persentase_progres: prj.persentase_progres,
      status_progres: (prj.status_progres === "belum_mulai" || !prj.status_progres ? "dalam_proses" : prj.status_progres) as "dalam_proses" | "selesai" | "terkendala",
      realisasi_anggaran: prj.realisasi_anggaran,
    });
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setSubmitting(true);

    try {
      const res = await proyekService.updateProgress(
        editingProject.id,
        progresForm.persentase_progres,
        progresForm.status_progres,
        progresForm.realisasi_anggaran
      );

      if (res.success) {
        toast.success("Progres & Data Sektoral Berhasil Diperbarui!");
        showSuccessSwal(
          "Progres & Data Sektoral Diperbarui!",
          `1. MySQL Record Updated\n2. POST /updateFeatures terkirim ke ArcGIS REST API (OBJECTID: #${editingProject.esri_objectid || 'N/A'})\n3. Visualisasi peta otomatis diperbarui secara realtime.`
        );
        setEditingProject(null);
        loadProjects();
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Terjadi kesalahan saat memperbarui progres ke server.";
      toast.error(errorMsg);
      showErrorSwal("Gagal Memperbarui", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResyncEsri = async (projectId: string | number) => {
    try {
      toast.loading("Mengantrikan re-sync ESRI...", { id: "resync" });
      const res = await proyekService.resyncEsri(projectId);
      toast.dismiss("resync");
      toast.success(res.message || "Berhasil mengantrikan re-sync ESRI!");
      loadProjects();
    } catch (err: any) {
      toast.dismiss("resync");
      toast.error(err.message || "Gagal mengantrikan re-sync ESRI.");
    }
  };

  const handleDeleteProject = async (projectId: string | number, projectName: string) => {
    const res = await showDeleteConfirm(projectName);
    if (!res.isConfirmed) return;

    try {
      await proyekService.deleteProject(projectId);
      toast.success(`Paket proyek "${projectName}" berhasil dihapus!`);
      setProjects((prev) => prev.filter((p) => String(p.id) !== String(projectId)));
      if (editingProject && String(editingProject.id) === String(projectId)) {
        setEditingProject(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus proyek dari database.");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchSearch = p.nama_proyek.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.kode_proyek && p.kode_proyek.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchBidang = selectedBidang === "semua" || p.bidang === selectedBidang;
    const matchStatus = selectedStatus === "semua" || p.status_progres === selectedStatus;
    return matchSearch && matchBidang && matchStatus;
  });

  // Calculate Statistics
  const totalAnggaran = projects.reduce((acc, curr) => acc + Number(curr.pagu_anggaran), 0);
  const totalRealisasi = projects.reduce((acc, curr) => acc + Number(curr.realisasi_anggaran), 0);
  const avgProgres = projects.length > 0
    ? Math.round(projects.reduce((acc, curr) => acc + Number(curr.persentase_progres), 0) / projects.length)
    : 0;

  const documentSelectOptions = [
    { value: "semua", label: "📋 Semua Dokumen Induk (Tampilkan Seluruh Proyek)" },
    ...documents.map((doc) => ({
      value: String(doc.id),
      label: `${doc.jenis.toUpperCase()} - ${doc.title} (${doc.tahun})`,
    })),
  ];

  // Dynamic options derived from available projects
  const formatBidangLabel = (b: string) => {
    if (b === "infrastruktur") return "Infrastruktur";
    if (b === "perekonomian") return "Perekonomian";
    if (b === "sosbud") return "Sosial Budaya";
    if (b === "renval") return "Renval";
    return b.charAt(0).toUpperCase() + b.slice(1);
  };

  const formatStatusLabel = (s: string) => {
    if (s === "belum_mulai") return "Belum Mulai";
    if (s === "dalam_proses") return "Dalam Proses";
    if (s === "selesai") return "Selesai 100%";
    if (s === "terkendala") return "Terkendala";
    return s;
  };

  const availableBidangs = Array.from(new Set(projects.map((p) => p.bidang))).filter(Boolean);
  const bidangSelectOptions = [
    { value: "semua", label: "Semua Bidang" },
    ...availableBidangs.map((b) => ({
      value: b,
      label: formatBidangLabel(b),
    })),
  ];

  const availableStatuses = Array.from(new Set(projects.map((p) => p.status_progres))).filter(Boolean);
  const statusSelectOptions = [
    { value: "semua", label: "Semua Status" },
    ...availableStatuses.map((s) => ({
      value: s,
      label: formatStatusLabel(s),
    })),
  ];

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner Clean */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Update Data Sektoral &amp; Progres Pembangunan</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Perbarui status realisasi fisik (%) dan realisasi keuangan proyek pembangunan daerah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200/80 w-fit">
            📊 Total Proyek: {projects.length} Paket
          </span>
        </div>
      </div>

      {/* Input Selection: Dokumen Induk */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-900 block">Pilih Dokumen Induk *</label>
            <p className="text-[11px] text-slate-500 font-medium">
              Pilih dokumen resmi perencanaan untuk memfilter data progres proyek (atau pilih "Semua Dokumen Induk").
            </p>
          </div>
        </div>

        <SearchableSelect
          options={documentSelectOptions}
          value={selectedDocId}
          onChange={handleDocIdChange}
          placeholder="-- Pilih Dokumen Induk Perencanaan --"
          searchPlaceholder="Cari dokumen induk..."
        />
      </div>

      {/* Analytical Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Rata-rata Progres Fisik Daerah</span>
          <div className="text-2xl font-black text-blue-700 flex items-center gap-2">
            <span>{avgProgres}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              PHYSICAL PROGRESS
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${avgProgres}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Total Pagu Anggaran Proyek</span>
          <div className="text-xl font-black text-slate-900">
            Rp {totalAnggaran.toLocaleString("id-ID")}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Dari {projects.length} Paket Proyek Geotagged</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Total Realisasi Keuangan</span>
          <div className="text-xl font-black text-emerald-700">
            Rp {totalRealisasi.toLocaleString("id-ID")}
          </div>
          <p className="text-[10px] text-emerald-600 font-bold">
            Rasio Serapan: {totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama proyek atau kode..."
            className="w-full pl-11 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <SearchableSelect
              options={bidangSelectOptions}
              value={selectedBidang}
              onChange={(val) => setSelectedBidang(String(val))}
              placeholder="Filter Bidang"
              searchPlaceholder="Cari bidang..."
            />
          </div>

          <div className="w-full sm:w-48">
            <SearchableSelect
              options={statusSelectOptions}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(String(val))}
              placeholder="Filter Status"
              searchPlaceholder="Cari status..."
            />
          </div>
        </div>
      </div>

      {/* Main Tabular Data Grid */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Tabel Sinkronisasi Data Sektoral & Progres Monev</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {filteredProjects.length} Proyek Ditampilkan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                <th className="p-3">Ref OBJECTID</th>
                <th className="p-3">Status Sync ESRI</th>
                <th className="p-3">Nama Proyek</th>
                <th className="p-3">Bidang</th>
                <th className="p-3">Pagu Anggaran</th>
                <th className="p-3">Realisasi Keuangan</th>
                <th className="p-3">Progres Fisik</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-3"><div className="h-4 w-14 bg-slate-200 rounded"></div></td>
                    <td className="p-3"><div className="h-5 w-16 bg-slate-200 rounded-full"></div></td>
                    <td className="p-3 space-y-1.5">
                      <div className="h-4 w-44 bg-slate-200 rounded"></div>
                      <div className="h-3 w-24 bg-slate-100 rounded"></div>
                    </td>
                    <td className="p-3"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="p-3"><div className="h-5 w-20 bg-slate-200 rounded-full"></div></td>
                    <td className="p-3 text-right">
                      <div className="h-7 w-24 bg-slate-200 rounded-xl ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                    Tidak ada data proyek yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((prj) => (
                  <tr key={prj.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-blue-700">
                      #{prj.esri_objectid || "None"}
                    </td>
                    <td className="p-3">
                      {prj.esri_sync_status === "synced" && (
                        <span className="text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Synced</span>
                        </span>
                      )}
                      {(!prj.esri_sync_status || prj.esri_sync_status === "pending") && (
                        <span className="text-[9.5px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                          <span>Pending</span>
                        </span>
                      )}
                      {prj.esri_sync_status === "failed" && (
                        <span className="text-[9.5px] font-extrabold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1" title={prj.esri_last_error || "Sync ESRI Gagal"}>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900">{prj.nama_proyek}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{prj.kode_proyek}</div>
                    </td>
                    <td className="p-3 uppercase font-bold text-slate-600">{prj.bidang}</td>
                    <td className="p-3 font-bold text-slate-800">
                      Rp {Number(prj.pagu_anggaran).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 font-bold text-emerald-700">
                      Rp {Number(prj.realisasi_anggaran).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${prj.persentase_progres}%` }} />
                        </div>
                        <span className="font-extrabold text-slate-900">{prj.persentase_progres}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border shadow-2xs ${
                          prj.status_progres === "selesai"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : prj.status_progres === "terkendala"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : prj.status_progres === "dalam_proses"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            prj.status_progres === "selesai"
                              ? "bg-emerald-500"
                              : prj.status_progres === "terkendala"
                              ? "bg-rose-500"
                              : prj.status_progres === "dalam_proses"
                              ? "bg-blue-500"
                              : "bg-slate-400"
                          }`}
                        />
                        <span>{formatStatusLabel(prj.status_progres)}</span>
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(prj.esri_sync_status === "failed" || !prj.esri_objectid) && (
                          <button
                            type="button"
                            onClick={() => handleResyncEsri(prj.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition border border-amber-200 flex items-center gap-1 cursor-pointer"
                            title="Coba Lagi Sinkronisasi ESRI"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                            <span>Re-sync</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(prj)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Progres</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(prj.id, prj.nama_proyek)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 transition cursor-pointer shrink-0"
                          title={`Hapus Proyek ${prj.nama_proyek}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL WITH PORTAL (FULLSCREEN BACKDROP OVERLAY) */}
      {editingProject && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingProject(null);
            }
          }}
          className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200 overscroll-contain"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100 overscroll-contain max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Update Status Progres Proyek</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Perbarui realisasi fisik & keuangan proyek daerah.
                </p>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 space-y-1.5">
              <div className="font-extrabold text-slate-900 text-sm">{editingProject.nama_proyek}</div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] border-t border-blue-200/50">
                <span>Pagu Anggaran: <strong className="text-slate-900 font-extrabold">Rp {Number(editingProject.pagu_anggaran).toLocaleString("id-ID")}</strong></span>
                <span>ESRI OBJECTID: <code className="text-blue-700 font-bold font-mono">#{editingProject.esri_objectid || "N/A"}</code></span>
              </div>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Persentase Progres Realisasi Fisik:</span>
                  <span className="text-blue-700 font-extrabold text-sm">{progresForm.persentase_progres}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progresForm.persentase_progres}
                  onChange={(e) => setProgresForm({ ...progresForm, persentase_progres: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Pembangunan</label>
                <SearchableSelect
                  options={[
                    { value: "dalam_proses", label: "Dalam Proses" },
                    { value: "selesai", label: "Selesai 100%" },
                    { value: "terkendala", label: "Terkendala / Restrukturisasi" },
                  ]}
                  value={progresForm.status_progres === "belum_mulai" ? "dalam_proses" : progresForm.status_progres}
                  onChange={(val) => setProgresForm({ ...progresForm, status_progres: (val as any) || "dalam_proses" })}
                  placeholder="Pilih status pembangunan"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Realisasi Anggaran (Rp) *</label>
                  <span className={`text-[10px] ${progresForm.realisasi_anggaran > Number(editingProject.pagu_anggaran) ? "text-rose-600 font-extrabold" : "text-slate-500 font-medium"}`}>
                    Pagu: <strong className={progresForm.realisasi_anggaran > Number(editingProject.pagu_anggaran) ? "text-rose-700" : "text-slate-900"}>Rp {Number(editingProject.pagu_anggaran).toLocaleString("id-ID")}</strong>
                  </span>
                </div>
                <input
                  type="text"
                  value={formatRupiahString(progresForm.realisasi_anggaran)}
                  onChange={(e) => {
                    const valNum = parseRupiahInput(e.target.value);
                    setProgresForm({ ...progresForm, realisasi_anggaran: valNum });
                  }}
                  placeholder="Rp 0"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-xs focus:outline-none focus:ring-2 transition ${
                    progresForm.realisasi_anggaran > Number(editingProject.pagu_anggaran)
                      ? "bg-rose-50/80 border-rose-400 text-rose-950 focus:ring-rose-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500"
                  }`}
                />
                {progresForm.realisasi_anggaran > Number(editingProject.pagu_anggaran) && (
                  <p className="mt-1.5 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Realisasi melebihi pagu anggaran (tetap dapat disimpan).</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
