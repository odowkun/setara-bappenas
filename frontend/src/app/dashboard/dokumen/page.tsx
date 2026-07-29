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
  Trash2,
  Download,
  Eye,
  History,
  Search,
  Building2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";

export default function DocumentManagementPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenis, setSelectedJenis] = useState<string>("semua");

  useEffect(() => {
    const activeBidang = user?.role === "admin_bidang" ? user.bidang : undefined;
    adminService.fetchDocuments(activeBidang, user?.role).then((docs) => {
      setDocuments(docs || []);
    });
  }, [user]);

  const handleDeleteDocument = async (id: string, docTitle: string) => {
    const res = await showDeleteConfirm(docTitle);
    if (res.isConfirmed) {
      adminService.deleteDocument(id, user?.name || "Admin");
      const activeBidang = user?.role === "admin_bidang" ? user.bidang : undefined;
      setDocuments(adminService.getDocuments(activeBidang, user?.role));
      toast.success(`Dokumen "${docTitle}" berhasil dihapus!`);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis = selectedJenis === "semua" || doc.jenis === selectedJenis;
    return matchSearch && matchJenis;
  });

  const jenisSelectOptions = [
    { value: "semua", label: "Semua Jenis Dokumen" },
    { value: "rpjpd", label: "RPJPD (20 Tahunan)" },
    { value: "rpjmd", label: "RPJMD (5 Tahunan)" },
    { value: "rkpd", label: "RKPD (Tahunan)" },
    { value: "renstra", label: "Renstra Bidang" },
    { value: "renja", label: "Renja Bidang" },
    { value: "data_sektoral", label: "Data Sektoral" },
  ];

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Repository Dokumen Perencanaan
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {user?.role === "admin_bidang"
                ? `Manajemen pengunggahan dokumen khusus Bidang ${user.bidang?.toUpperCase()}`
                : "Pengelolaan RPJPD, RPJMD, RKPD, LKPJ, Renstra, & Data Sektoral."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard/dokumen/riwayat-unduhan"
            className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
          >
            <History className="h-4 w-4" />
            <span>Riwayat Pengunduh</span>
          </Link>
          <Link
            href="/dashboard/dokumen/tambah"
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white shadow-xs flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Unggah Dokumen Baru</span>
          </Link>
        </div>
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
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative group hover:border-blue-300 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200/80 font-mono">
                    {doc.jenis.replace("_", " ")}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.tahun}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug">{doc.title}</h3>
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
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/dashboard/dokumen/${doc.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] transition shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Detail & Geotagging Spasial (ESRI)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                </Link>
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
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">
                  Oleh: {doc.uploadedBy}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.fileUrl}
                    download
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1.5 transition border border-blue-200 text-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unduh Dokumen</span>
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition border border-rose-200 cursor-pointer"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
