"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { AdminDocument } from "@/types/auth";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  FileText,
  FileUp,
  Archive,
  Download,
  Eye,
  History,
  Search,
  Building2,
  MapPin,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { showConfirm, showDeleteConfirm, toast } from "@/lib/swal";
import { resolveDocumentUrl } from "@/services/documentAnalyticsService";

export default function DocumentManagementPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenis, setSelectedJenis] = useState<string>("semua");

  useEffect(() => {
    const activeBidang = user?.role === "admin_bidang" ? user.bidang : undefined;
    setLoading(true);
    adminService.fetchDocuments(activeBidang, user?.role)
      .then((docs) => {
        setDocuments(docs || []);
      })
      .catch((err) => {
        console.error("Gagal memuat dokumen:", err);
        setDocuments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const canManageDoc = (doc: AdminDocument) => {
    if (!user) return false;
    if (user.role === "superadmin" || user.role === "admin_umum") return true;
    if (user.role === "admin_bidang" && user.bidang === doc.bidang) return true;
    return false;
  };

  const handleArchiveDocument = async (id: string, docTitle: string) => {
    const res = await showConfirm({
      title: "Arsipkan Dokumen?",
      text: `Dokumen "${docTitle}" ditarik dari publik, tetapi versi, checksum, log akses, dan histori persetujuan tetap dipertahankan.`,
      icon: "warning",
      confirmButtonText: "Ya, Arsipkan",
    });
    if (res.isConfirmed) {
      const archived = await adminService.archiveDocument(id, "Diarsipkan melalui dashboard dokumen");
      if (archived) {
        const activeBidang = user?.role === "admin_bidang" ? user.bidang : undefined;
        const refreshed = await adminService.fetchDocuments(activeBidang, user?.role);
        setDocuments(refreshed);
        toast.success(`Dokumen "${docTitle}" berhasil diarsipkan.`);
      } else {
        toast.error(`Dokumen "${docTitle}" gagal diarsipkan.`);
      }
    }
  };

  const handleDeleteDocument = async (id: string, docTitle: string) => {
    const res = await showDeleteConfirm(
      docTitle,
      `PERINGATAN: Dokumen induk "${docTitle}" akan dihapus permanen beserta seluruh tagging proyek fisik, data progres monev, lampiran teknis (foto/dokumen), dan sinkronisasi titik GIS ArcGIS!`
    );
    if (res.isConfirmed) {
      const deleted = await adminService.deleteDocument(id, true);
      if (deleted) {
        const activeBidang = user?.role === "admin_bidang" ? user.bidang : undefined;
        const refreshed = await adminService.fetchDocuments(activeBidang, user?.role);
        setDocuments(refreshed);
        toast.success(`Dokumen "${docTitle}" beserta seluruh tagging proyek dan lampiran berhasil dihapus permanen.`);
      } else {
        toast.error(`Gagal menghapus dokumen "${docTitle}".`);
      }
    }
  };

  const handleTogglePublication = async (document: AdminDocument) => {
    try {
      const updated = await adminService.updateDocumentPublication(
        document.id,
        !document.isPublic
      );
      setDocuments((current) =>
        current.map((row) => row.id === document.id ? updated : row)
      );
      toast.success(updated.isPublic
        ? "Dokumen berhasil diterbitkan."
        : "Dokumen ditarik menjadi draf.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status publikasi gagal diperbarui.");
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const docJenis = (doc.jenis || "").toLowerCase().replace(/-/g, "_");
    const matchJenis =
      selectedJenis === "semua" ||
      docJenis === selectedJenis ||
      (selectedJenis === "rpjmd_kab" && docJenis === "rpjmd");
    return matchSearch && matchJenis;
  });
  const pendingReview = documents.filter(
    (document) => document.governanceStatus === "pending_review"
  ).length;
  const migrationQueue = documents.filter(
    (document) => document.storageStatus !== "private"
  ).length;
  const retentionAttention = documents.filter(
    (document) =>
      document.retentionStatus === "due" || document.retentionStatus === "held"
  ).length;

  const jenisSelectOptions = [
    { value: "semua", label: "Semua Jenis Dokumen" },
    { value: "rpjpd", label: "RPJPD (20 Tahunan)" },
    { value: "rpjmn", label: "RPJMN (Nasional)" },
    { value: "rpjmd_prov", label: "RPJMD Prov (Provinsi)" },
    { value: "rpjmd_kab", label: "RPJMD Kab (Kabupaten)" },
    { value: "rkpd", label: "RKPD (Tahunan)" },
    { value: "renstra", label: "Renstra Bidang" },
    { value: "renja", label: "Renja Bidang" },
    { value: "data_sektoral", label: "Data Sektoral" },
  ];

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Repository Dokumen Perencanaan</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            {user?.role === "admin_bidang"
              ? `Manajemen pengunggahan dokumen khusus Bidang ${user.bidang?.toUpperCase()}`
              : "Pengelolaan RPJPD, RPJMD, RKPD, LKPJ, Renstra, & Data Sektoral."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/dokumen/riwayat-unduhan"
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-800 transition flex items-center justify-center gap-2 shrink-0"
          >
            <History className="h-4 w-4" />
            <span>Riwayat Pengunduh</span>
          </Link>
          <Link
            href="/dashboard/dokumen/tambah"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 font-extrabold text-xs text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95 shrink-0"
          >
            <FileUp className="w-4 h-4" />
            <span>Unggah Dokumen Baru</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Menunggu Review",
            value: pendingReview,
            detail: "Perlu keputusan reviewer resmi",
            icon: GitBranch,
            tone: "text-amber-700 bg-amber-50 border-amber-200",
          },
          {
            label: "Perlu Migrasi",
            value: migrationQueue,
            detail: "Berkas lama belum valid di storage privat",
            icon: Archive,
            tone: "text-rose-700 bg-rose-50 border-rose-200",
          },
          {
            label: "Perhatian Retensi",
            value: retentionAttention,
            detail: "Jatuh tempo atau dalam legal hold",
            icon: ShieldCheck,
            tone: "text-blue-700 bg-blue-50 border-blue-200",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border p-4 ${item.tone}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-black">{item.value}</p>
              </div>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-2 text-[10px] font-semibold opacity-80">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul dokumen atau tahun..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="w-full sm:w-64">
          <SearchableSelect
            options={jenisSelectOptions}
            value={selectedJenis}
            onChange={(val) => setSelectedJenis(String(val))}
            placeholder="Pilih Jenis Dokumen"
            searchPlaceholder="Cari jenis..."
          />
        </div>
      </div>

      {/* Document List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4 animate-pulse flex flex-col justify-between min-h-[220px]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                    <div className="h-5 w-12 bg-slate-200 rounded-full" />
                    <div className="h-5 w-14 bg-slate-200 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-3 bg-slate-100 rounded w-28" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="h-7 w-24 bg-slate-200 rounded-xl" />
                  <div className="h-4 w-28 bg-slate-100 rounded" />
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="flex gap-1.5">
                    <div className="h-7 w-20 bg-slate-200 rounded-xl" />
                    <div className="h-7 w-16 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ada dokumen ditemukan</p>
            <p className="text-xs text-slate-400">
              {searchTerm || selectedJenis !== "semua"
                ? "Coba ubah kata kunci pencarian atau filter kategori jenis dokumen."
                : "Belum ada dokumen perencanaan yang diunggah."}
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative group hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex max-w-[75%] flex-wrap items-center justify-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200/80 font-mono">
                      {(doc.jenis || "DOKUMEN").replace(/_/g, " ")}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {doc.tahun || "-"}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      doc.isPublic
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {doc.isPublic ? "Tayang" : "Draf"}
                    </span>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-800">
                      {doc.governanceStatus?.replace("_", " ") ?? "draft"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-700">
                      {doc.classification ?? "internal"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug">{doc.title}</h3>
                  <p className="mt-1 font-mono text-[10px] font-bold text-blue-700">
                    {doc.archiveCode || "Kode arsip dibuat saat migrasi"}
                    {doc.latestVersion?.versionLabel
                      ? ` · v${doc.latestVersion.versionLabel}`
                      : ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bidang: <strong className="text-slate-800 uppercase">{doc.bidang}</strong></span>
                    </span>
                    <span className="font-mono text-slate-400">{doc.ukuran}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {/* Spatial Geotagging Quick Link */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/dokumen/arsip/${doc.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-blue-800"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Kelola Arsip
                    </Link>
                    <Link
                      href={`/dashboard/dokumen/${doc.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-slate-800"
                    >
                      <MapPin className="h-3.5 w-3.5 text-rose-400" />
                      Relasi GIS
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </Link>
                  </div>
                  <Link
                    href={`/dashboard/dokumen/riwayat-unduhan?documentId=${doc.id}`}
                    className="flex items-center gap-3 text-[10px] font-bold text-slate-500 hover:text-blue-700"
                  >
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {doc.views} dilihat
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      {doc.downloads} diunduh
                    </span>
                  </Link>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">
                    Oleh: {doc.uploadedBy}
                  </span>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {user?.role !== "admin_bidang" && (
                      <button
                        type="button"
                        onClick={() => handleTogglePublication(doc)}
                        className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                          doc.isPublic
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {doc.isPublic ? "Tarik dari Publik" : "Terbitkan ke Publik"}
                      </button>
                    )}
                    {doc.fileUrl && (
                      <a
                        href={resolveDocumentUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview Admin
                      </a>
                    )}
                    {canManageDoc(doc) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleArchiveDocument(doc.id, doc.title)}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100 cursor-pointer"
                          title="Arsipkan dokumen tanpa menghapus histori"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id, doc.title)}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                          title="Hapus permanen dokumen induk, tagging proyek, progres, dan lampiran teknis"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
