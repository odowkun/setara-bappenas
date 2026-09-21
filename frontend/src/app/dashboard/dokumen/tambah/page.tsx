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
import { ArrowLeft, Save, CheckCircle2, Lock, Plus, X, FileUp } from "lucide-react";
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
    user?.role === "admin_bidang" && user.bidang ? user.bidang : "semua"
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
  const [description, setDescription] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [ownerOpd, setOwnerOpd] = useState(
    "BAPPEDA Kabupaten Halmahera Utara"
  );
  const [classification, setClassification] = useState<
    "public" | "internal" | "confidential" | "restricted"
  >("public");
  const [retentionPolicy, setRetentionPolicy] = useState<
    "permanent" | "active_5_years" | "active_10_years" | "custom"
  >("permanent");
  const [keywords, setKeywords] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Dynamic Custom Jenis Dokumen Modal (Superadmin Only)
  const [isAddJenisModalOpen, setIsAddJenisModalOpen] = useState(false);
  const [newJenisName, setNewJenisName] = useState("");
  const [newJenisScope, setNewJenisScope] = useState<'admin_umum' | 'admin_bidang' | 'semua'>("semua");
  const [customJenisList, setCustomJenisList] = useState<JenisDokumenItem[]>([]);

  useEffect(() => {
    if (!user?.role) return;
    adminService.fetchJenisDokumenItems(user.role)
      .then((rows) => {
        setCustomJenisList(rows);
        setJenis((current) =>
          rows.some((item) => item.code === current)
            ? current
            : rows[0]?.code || ""
        );
      })
      .catch((error) => toast.error(
        error instanceof Error ? error.message : "Jenis dokumen gagal dimuat."
      ));
  }, [user?.role]);

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

  const getAvailableJenisOptions = () => {
    return customJenisList.map((c) => ({
      value: c.code,
      label: `${c.name} - ${c.scope_role.toUpperCase()}`,
    }));
  };

  const handleAddCustomJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJenisName) return;

    const newCode = newJenisName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    try {
      const created = await adminService.createJenisDokumen({
        name: newJenisName.trim(),
        code: newCode,
        scope_role: newJenisScope,
      });
      setCustomJenisList((current) => [...current, created]);
      setJenis(created.code);
      setNewJenisName("");
      setIsAddJenisModalOpen(false);
      toast.success(`Jenis dokumen "${created.name}" tersimpan di database.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Jenis dokumen gagal disimpan.");
    }
  };

  const handleUploadSuccess = (uploadedUrl: string, uploadedSize: string, fileName?: string) => {
    setFileUrl(uploadedUrl);
    setFileSizeStr(uploadedSize);
    if (fileName && !title.trim()) {
      const cleanTitle = fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
      setTitle(cleanTitle);
      toast.success(`Judul dokumen terisi otomatis dari nama berkas.`);
    }
  };

  const handleSave = async (submitForReview: boolean) => {
    if (!fileUrl) {
      showErrorSwal(
        "Berkas Belum Diunggah",
        "Silakan unggah berkas PDF perencanaan terlebih dahulu hingga muncul tanda hijau berkas berhasil diunggah utuh."
      );
      return;
    }

    if (!title.trim()) {
      showErrorSwal(
        "Judul Dokumen Belum Diisi",
        "Silakan lengkapi kolom Judul Dokumen Resmi Perencanaan di bagian atas formulir terlebih dahulu."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!user) {
      showErrorSwal("Sesi Belum Siap", "Identitas pengelola belum dimuat dari server.");
      return;
    }
    let lockedBidang: BidangType = bidang;
    if (user.role === "admin_bidang") {
      const actorBidang = user.bidang;
      if (!actorBidang) {
        showErrorSwal("Bidang Belum Diatur", "Akun ini belum memiliki bidang resmi.");
        return;
      }
      lockedBidang = actorBidang;
    }

    try {
      await adminService.addDocument({
        title,
        summary: description,
        jenis,
        bidang: lockedBidang,
        tahun,
        tanggalMulai,
        tanggalSelesai,
        ukuran: fileSizeStr,
        fileUrl,
        isPublic: submitForReview,
        documentNumber,
        ownerOpd,
        keywords: keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        classification:
          user.role === "admin_bidang" ? "internal" : classification,
        retentionPolicy,
        uploadedBy: `${user.name} (${user.role})`,
      });

      setIsSaved(true);
      const isDirectPublish = submitForReview && (user.role === "superadmin" || user.role === "admin_umum");
      showSuccessSwal(
        isDirectPublish
          ? "Dokumen Berhasil Diterbitkan ke Publik"
          : submitForReview
          ? "Dokumen Diajukan untuk Review"
          : "Draf Arsip Privat Tersimpan",
        isDirectPublish
          ? "Dokumen telah tersimpan dan langsung tayang pada repository publik Dokumen BAPPEDA."
          : submitForReview
          ? "Reviewer resmi akan memeriksa checksum, klasifikasi, dan metadata sebelum publikasi."
          : "Versi pertama dan checksum tersimpan di storage privat; dokumen belum tampil ke publik."
      );
      router.push("/dashboard/dokumen");
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
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Clean Back Header without limits or repository badges */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/dokumen"
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs shrink-0"
            title="Kembali ke Dokumen"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileUp className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Unggah Dokumen Perencanaan</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Form pengunggahan dokumen resmi perencanaan daerah Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dokumen Berhasil Diunggah!</span>
          </div>
        )}
      </div>

      {/* Main Single Page Form */}
      <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
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

          <div className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/50 p-5">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Tata Kelola Arsip
              </h2>
              <p className="mt-1 text-[11px] font-medium text-slate-600">
                Tentukan kepemilikan, klasifikasi akses, dan masa retensi sejak versi pertama.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-extrabold text-slate-700">
                  Nomor Dokumen Resmi
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder="Contoh: 000.7/123/BAPPEDA/2026"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-slate-700">
                  OPD Pemilik Arsip *
                </label>
                <input
                  type="text"
                  required
                  value={ownerOpd}
                  onChange={(event) => setOwnerOpd(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-extrabold text-slate-700">
                  Klasifikasi Akses
                </label>
                {user?.role === "admin_bidang" ? (
                  <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-xs font-bold text-amber-900">
                    <Lock className="h-4 w-4" />
                    Internal — reviewer menentukan akses publik
                  </div>
                ) : (
                  <SearchableSelect
                    options={[
                      { value: "internal", label: "Internal" },
                      { value: "public", label: "Publik" },
                      { value: "confidential", label: "Rahasia" },
                      { value: "restricted", label: "Terbatas" },
                    ]}
                    value={classification}
                    onChange={(value) =>
                      setClassification(value as typeof classification)
                    }
                    placeholder="Pilih klasifikasi"
                    searchPlaceholder="Cari klasifikasi..."
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-extrabold text-slate-700">
                  Kebijakan Retensi
                </label>
                <SearchableSelect
                  options={[
                    { value: "permanent", label: "Permanen" },
                    { value: "active_5_years", label: "Aktif 5 tahun" },
                    { value: "active_10_years", label: "Aktif 10 tahun" },
                    { value: "custom", label: "Tanggal khusus (atur setelah simpan)" },
                  ]}
                  value={retentionPolicy}
                  onChange={(value) =>
                    setRetentionPolicy(value as typeof retentionPolicy)
                  }
                  placeholder="Pilih kebijakan retensi"
                  searchPlaceholder="Cari kebijakan..."
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-700">
                Kata Kunci Pencarian
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="Pisahkan dengan koma, contoh: RKPD, infrastruktur, Galela"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
          </div>

          {/* Resumable Chunked File Uploader Component */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-extrabold text-slate-700">
                Unggah Berkas Dokumen Induk Perencanaan (Wajib PDF, Maksimal 5 GB) *
              </label>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black flex items-center gap-1">
                <span>Dukungan Dokumen Induk s/d 5 GB</span>
              </span>
            </div>
            <p className="mb-3 text-[11px] font-medium text-blue-800 leading-relaxed">
              Format resmi kearsipan: <strong>PDF (*.pdf)</strong>. Maksimal ukuran berkas: <strong>5 GB</strong>. Didukung teknologi <em>resumable chunked upload</em> dengan ukuran irisan dinamis otomatis (1 MB - 40 MB) menyesuaikan besar dokumen untuk keandalan dan kecepatan transfer jaringan. Watermark BAPPEDA HALUT diterapkan otomatis dengan transparansi rendah agar isi tetap terbaca.
            </p>
            <ResumableChunkUploader
              acceptedTypes=".pdf"
              onUploadSuccess={handleUploadSuccess}
              chunkSizeMB="dynamic"
              maxSizeGB={5}
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
            type="button"
            onClick={() => handleSave(false)}
            disabled={!fileUrl}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-extrabold text-xs border border-slate-300 flex items-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={!fileUrl}
            className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-blue-700/20 flex items-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {user?.role === "superadmin" || user?.role === "admin_umum"
                ? "Simpan & Terbitkan ke Publik (Tayang)"
                : "Simpan & Ajukan Review"}
            </span>
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
                <X className="h-4 w-4" />
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
