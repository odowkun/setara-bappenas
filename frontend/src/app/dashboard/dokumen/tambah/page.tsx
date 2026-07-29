"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { AdminDocument, BidangType, JenisDokumenItem } from "@/types/auth";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ResumableChunkUploader } from "@/components/ui/ResumableChunkUploader";
import { DateRangePlanner } from "@/components/ui/DateRangePlanner";
import { ArrowLeft, Save, CheckCircle2, Lock, Plus, Calendar } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";

export default function TambahDokumenPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [title, setTitle] = useState("");
  const [jenis, setJenis] = useState<string>("renja");
  const [bidang, setBidang] = useState<BidangType>(
    user?.role === "admin_bidang" ? user.bidang || "infrastruktur" : "semua"
  );

  useEffect(() => {
    if (user?.role === "admin_bidang" && user.bidang) {
      setBidang(user.bidang);
    }
  }, [user]);
  
  // Date Range Perencanaan (Lengkap dengan tanggal mulai & selesai)
  const [tanggalMulai, setTanggalMulai] = useState("2026-01-01");
  const [tanggalSelesai, setTanggalSelesai] = useState("2026-12-31");
  const [tahun, setTahun] = useState("2026");

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState("");
  const [description, setDescription] = useState(
    "**Ringkasan Dokumen Perencanaan:**\n\nDokumen ini memuat arah kebijakan strategis pembangunan daerah Kabupaten Halmahera Utara.\n\n- Poin 1: Penurunan angka kemiskinan ekstrem\n- Poin 2: Penguatan infrastruktur konektivitas pulau\n- Poin 3: Digitalisasi tata kelola SPBE"
  );
  const [isSaved, setIsSaved] = useState(false);

  // Dynamic Custom Jenis Dokumen Modal (Superadmin Only)
  const [isAddJenisModalOpen, setIsAddJenisModalOpen] = useState(false);
  const [newJenisName, setNewJenisName] = useState("");
  const [newJenisScope, setNewJenisScope] = useState<'admin_umum' | 'admin_bidang' | 'semua'>("semua");
  const [customJenisList, setCustomJenisList] = useState<JenisDokumenItem[]>([]);

  // Update Year range display when dates change
  useEffect(() => {
    if (tanggalMulai && tanggalSelesai) {
      const yearStart = new Date(tanggalMulai).getFullYear();
      const yearEnd = new Date(tanggalSelesai).getFullYear();
      if (yearStart === yearEnd) {
        setTahun(String(yearStart));
      } else {
        setTahun(`${yearStart}–${yearEnd}`);
      }
    }
  }, [tanggalMulai, tanggalSelesai]);

  // Initial list of Jenis Dokumen berdasarkan Role & Pembagian Bidang User (Bersih Tanpa Parentesis ())
  const getAvailableJenisOptions = () => {
    const isSuperAdmin = user?.role === "superadmin";
    const isAdminUmum = user?.role === "admin_umum";
    const isAdminBidang = user?.role === "admin_bidang";

    const defaultAdminUmumOptions = [
      { value: "rpjpd", label: "RPJPD - Rencana Pembangunan Jangka Panjang Daerah" },
      { value: "rpjmd", label: "RPJMD - Rencana Pembangunan Jangka Menengah Daerah" },
      { value: "rkpd", label: "RKPD - Rencana Kerja Pemerintah Daerah" },
      { value: "lkpj", label: "LKPJ - Laporan Keterangan Pertanggungjawaban" },
    ];

    const defaultAdminBidangOptions = [
      { value: "renstra", label: "Renstra - Rencana Strategis" },
      { value: "renja", label: "Renja - Rencana Kerja" },
      { value: "dik_sektoral", label: "Dik Sektoral" },
      { value: "data_sektoral", label: "Data Sektoral" },
    ];

    const customOptions = customJenisList.map((c) => ({
      value: c.code,
      label: `${c.name} - ${c.scope_role.toUpperCase()}`,
    }));

    if (isSuperAdmin) {
      return [...defaultAdminUmumOptions, ...defaultAdminBidangOptions, ...customOptions];
    }

    if (isAdminUmum) {
      return defaultAdminUmumOptions;
    }

    if (isAdminBidang) {
      return defaultAdminBidangOptions;
    }

    return [...defaultAdminUmumOptions, ...defaultAdminBidangOptions];
  };

  const handleAddCustomJenis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJenisName) return;

    const newCode = newJenisName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const newItem: JenisDokumenItem = {
      id: Date.now(),
      name: newJenisName,
      code: newCode,
      scope_role: newJenisScope,
      is_default: false,
      created_by: user?.name || "SuperAdmin",
    };

    setCustomJenisList([...customJenisList, newItem]);
    setJenis(newCode);
    setNewJenisName("");
    setIsAddJenisModalOpen(false);
    toast.success(`Jenis dokumen baru "${newJenisName}" berhasil disimpan!`);
  };

  const handleUploadSuccess = (uploadedUrl: string, uploadedSize: string) => {
    setFileUrl(uploadedUrl);
    setFileSizeStr(uploadedSize);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) {
      showErrorSwal(
        "Dokumen Belum Siap",
        "Tunggu hingga unggahan selesai dan watermark BAPPEDA HALUT berhasil diterapkan."
      );
      return;
    }

    const lockedBidang = user?.role === "admin_bidang" ? user.bidang || "infrastruktur" : bidang;

    try {
      await adminService.addDocument({
        title,
        jenis,
        bidang: lockedBidang,
        tahun: `${tahun} (${tanggalMulai} s/d ${tanggalSelesai})`,
        ukuran: fileSizeStr,
        fileUrl,
        isPublic: true,
        uploadedBy: user?.name ? `${user.name} (${user.role})` : "Admin Bappeda",
      });

      setIsSaved(true);
      showSuccessSwal(
        "Dokumen Berhasil Diunggah!",
        "Dokumen telah tersimpan dengan watermark BAPPEDA HALUT pada setiap halaman."
      );
      setTimeout(() => {
        router.push("/dashboard/dokumen");
      }, 1500);
    } catch {
      showErrorSwal(
        "Dokumen Gagal Disimpan",
        "Server tidak dapat memverifikasi berkas ber-watermark. Silakan unggah ulang."
      );
    }
  };

  const getBidangLabel = (b?: string) => {
    switch (b) {
      case "infrastruktur":
        return "Bidang 3: Infrastruktur dan Pengembangan Wilayah";
      case "perekonomian":
        return "Bidang 2: Ekonomi dan Sumber Daya Alam";
      case "sosbud":
        return "Bidang 1: Pembangunan Manusia dan Masyarakat";
      case "renval":
        return "Bidang 4: Pengendalian Evaluasi dan Pelaporan";
      default:
        return "Semua Bidang";
    }
  };

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* Clean Back Header without limits or repository badges */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/dokumen"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Unggah Dokumen Perencanaan
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Form pengunggahan dokumen resmi perencanaan daerah Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Dokumen Berhasil Diunggah!</span>
          </div>
        )}
      </div>

      {/* Main Single Page Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2">
              Judul Dokumen Resmi Perencanaan *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rencana Kerja Renja Bidang Infrastruktur Tahun 2026"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jenis Dokumen Select with Add New Button for Superadmin */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-slate-700">
                  Jenis Dokumen *
                </label>
                {user?.role === "superadmin" && (
                  <button
                    type="button"
                    onClick={() => setIsAddJenisModalOpen(true)}
                    className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Jenis Dokumen</span>
                  </button>
                )}
              </div>
              <SearchableSelect
                options={getAvailableJenisOptions()}
                value={jenis}
                onChange={(val) => setJenis(String(val))}
                placeholder="-- Pilih Jenis Dokumen --"
                searchPlaceholder="Cari jenis dokumen..."
              />
            </div>

            {/* Scope Bidang Bappeda (LOCKED for Admin Bidang, SELECT for Superadmin) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">
                Scope Bidang Bappeda *
              </label>

              {user?.role === "admin_bidang" ? (
                <div className="px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>{getBidangLabel(user.bidang)}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">LOCKED</span>
                </div>
              ) : (
                <SearchableSelect
                  options={[
                    { value: "semua", label: "Semua Bidang" },
                    { value: "sosbud", label: "Bidang 1: Pembangunan Manusia dan Masyarakat" },
                    { value: "perekonomian", label: "Bidang 2: Ekonomi dan Sumber Daya Alam" },
                    { value: "infrastruktur", label: "Bidang 3: Infrastruktur dan Pengembangan Wilayah" },
                    { value: "renval", label: "Bidang 4: Pengendalian Evaluasi dan Pelaporan" },
                  ]}
                  value={bidang}
                  onChange={(val) => setBidang(val as BidangType)}
                  placeholder="-- Pilih Bidang --"
                  searchPlaceholder="Cari bidang BAPPEDA..."
                />
              )}
            </div>
          </div>

          {/* Tahun & Periode Perencanaan (Date Range Planner Component) */}
          <DateRangePlanner
            startDate={tanggalMulai}
            endDate={tanggalSelesai}
            onChange={(start, end, yearStr) => {
              setTanggalMulai(start);
              setTanggalSelesai(end);
              setTahun(yearStr);
            }}
          />

          {/* Resumable Chunked File Uploader Component */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2">
              Unggah Berkas Dokumen Perencanaan *
            </label>
            <p className="mb-3 text-[11px] font-medium text-blue-800">
              Watermark BAPPEDA HALUT diterapkan otomatis dengan transparansi rendah agar isi tetap terbaca.
            </p>
            <ResumableChunkUploader
              onUploadSuccess={handleUploadSuccess}
              chunkSizeMB={5}
            />
          </div>

          {/* Rich Text Editor for Document Abstraction & Notes */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2">
              Abstraksi / Catatan Ringkasan Dokumen (Rich Text Editor)
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Tuliskan catatan atau ringkasan dokumen..."
              minHeight="240px"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/dokumen"
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={!fileUrl}
            className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-blue-700/20 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan & Unggah Dokumen Resmi</span>
          </button>
        </div>
      </form>

      {/* MODAL TAMBAH JENIS DOKUMEN BARU (SUPERADMIN ONLY - REACT PORTAL TO BODY) */}
      {isAddJenisModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto w-screen h-screen">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100 my-auto relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900">
                  SUPERADMIN ONLY
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">Tambah Jenis Dokumen Baru Ke Database</h3>
              </div>
              <button
                onClick={() => setIsAddJenisModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomJenis} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Jenis Dokumen Baru *</label>
                <input
                  type="text"
                  required
                  value={newJenisName}
                  onChange={(e) => setNewJenisName(e.target.value)}
                  placeholder="Contoh: Dokumen Kajian Lingkungan Hidup Strategis - KLHS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Scope Izin Peran Pengunggah</label>
                <SearchableSelect
                  options={[
                    { value: "semua", label: "Semua Role" },
                    { value: "admin_umum", label: "Admin Umum" },
                    { value: "admin_bidang", label: "Admin Bidang" },
                  ]}
                  value={newJenisScope}
                  onChange={(val) => setNewJenisScope(val as any)}
                  placeholder="-- Pilih Scope Role --"
                  searchPlaceholder="Cari scope role..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddJenisModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 text-white font-extrabold hover:bg-blue-800 shadow-md shadow-blue-700/20 transition"
                >
                  Simpan Jenis Dokumen
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
