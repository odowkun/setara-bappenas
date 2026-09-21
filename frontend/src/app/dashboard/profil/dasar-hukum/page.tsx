"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch, API_BASE_URL, STORAGE_BASE_URL } from "@/lib/apiClient";
import SearchableSelect, { SearchableOption } from "@/components/ui/SearchableSelect";
import { toast } from "@/lib/swal";
import {
  Scale,
  Save,
  Lock,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  FileCheck,
  X,
  ExternalLink,
  Loader2,
  HardDrive,
} from "lucide-react";
import { uploadFileInChunks, ChunkProgressInfo, formatFileSize } from "@/lib/chunkUpload";

const DEFAULT_KATEGORI_REGULASI_OPTIONS: SearchableOption[] = [
  { value: "Undang-Undang", label: "Undang-Undang" },
  { value: "Peraturan Pemerintah", label: "Peraturan Pemerintah" },
  { value: "Peraturan Presiden", label: "Peraturan Presiden" },
  { value: "Peraturan Menteri", label: "Peraturan Menteri" },
  { value: "Instruksi Menteri", label: "Instruksi Menteri" },
  { value: "Keputusan Menteri", label: "Keputusan Menteri" },
  { value: "Surat Edaran Menteri", label: "Surat Edaran Menteri" },
  { value: "Peraturan Daerah", label: "Peraturan Daerah" },
  { value: "Peraturan Gubernur", label: "Peraturan Gubernur" },
  { value: "Keputusan Gubernur", label: "Keputusan Gubernur" },
  { value: "Instruksi Gubernur", label: "Instruksi Gubernur" },
  { value: "Peraturan Bupati", label: "Peraturan Bupati" },
  { value: "Keputusan Bupati", label: "Keputusan Bupati" },
  { value: "Instruksi Bupati", label: "Instruksi Bupati" },
  { value: "Surat Edaran Bupati", label: "Surat Edaran Bupati" },
];

interface RegulasiItem {
  nama: string;
  tentang: string;
  kategori: string;
  file_url?: string;
}

export default function DasarHukumEditorPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, ChunkProgressInfo>>({});
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Daftar Regulasi Item
  const [regulasiList, setRegulasiList] = useState<RegulasiItem[]>([]);

  // Opsi Kategori Regulasi Dinamis (bisa ditambah opsi baru dari select creatable)
  const [kategoriOptions, setKategoriOptions] = useState<SearchableOption[]>(
    DEFAULT_KATEGORI_REGULASI_OPTIONS
  );

  const handleAddNewKategori = (newKategori: string) => {
    const trimmed = newKategori.trim();
    if (!trimmed) return;
    setKategoriOptions((prev) => {
      if (prev.some((opt) => String(opt.value).toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [...prev, { value: trimmed, label: trimmed }];
    });
    toast.success(`Kategori regulasi "${trimmed}" berhasil ditambahkan ke pilihan!`);
  };

  // Load data from API
  const fetchDasarHukumData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profil/dasar_hukum`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (d.meta_json && Array.isArray(d.meta_json.regulasi)) {
            setRegulasiList(d.meta_json.regulasi);

            // Kumpulkan kategori kustom yang sudah ada di database agar masuk ke opsi pilihan
            const existingCategories = d.meta_json.regulasi
              .map((r: RegulasiItem) => r.kategori)
              .filter((k: string) => Boolean(k && k.trim()));

            if (existingCategories.length > 0) {
              setKategoriOptions((prev) => {
                const map = new Map(prev.map((o) => [String(o.value).toLowerCase(), o]));
                for (const cat of existingCategories) {
                  const key = cat.trim().toLowerCase();
                  if (!map.has(key)) {
                    map.set(key, { value: cat.trim(), label: cat.trim() });
                  }
                }
                return Array.from(map.values());
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Gagal memuat data Dasar Hukum dari database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDasarHukumData();
  }, []);

  // Handlers for Regulasi Item List - Auto scroll to bottom
  const handleAddRegulasi = () => {
    const nextIdx = regulasiList.length;
    setRegulasiList((prev) => [
      ...prev,
      { nama: "", tentang: "", kategori: "Peraturan Daerah", file_url: "" },
    ]);
    setTimeout(() => {
      const el = document.getElementById(`regulasi-card-${nextIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector<HTMLInputElement>("input");
        input?.focus();
      }
    }, 100);
  };

  const handleRemoveRegulasi = (index: number) => {
    setRegulasiList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRegulasiChange = (
    index: number,
    field: keyof RegulasiItem,
    value: string
  ) => {
    setRegulasiList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Upload handler with official watermark via /documents/upload-chunk (Chunked with 500MB max)
  const handleFileUpload = async (index: number, file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Format berkas harus PDF (*.pdf) sesuai standar kearsipan resmi.");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error(
        `Ukuran berkas (${formatFileSize(file.size)}) melebihi batas maksimal yang diizinkan (500 MB).`
      );
      return;
    }

    setUploadingIndex(index);
    try {
      const result = await uploadFileInChunks(file, {
        maxSizeBytes: 500 * 1024 * 1024,
        maxSizeLabel: "500 MB",
        acceptedExtensions: [".pdf"],
        onProgress: (info) => {
          setUploadProgress((prev) => ({ ...prev, [index]: info }));
        },
      });

      handleRegulasiChange(index, "file_url", result.file_url);
      toast.success(
        `Dokumen "${file.name}" (${result.file_size}) berhasil diunggah & watermark diterapkan!`
      );
    } catch (err: any) {
      console.error("Gagal unggah dokumen regulasi:", err);
      toast.error(err?.message || "Terjadi kesalahan saat mengunggah dokumen.");
    } finally {
      setUploadingIndex(null);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await authenticatedFetch("/profil/dasar_hukum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: "Dasar Hukum BAPPEDA Halmahera Utara",
          subtitle: "Peraturan perundang-undangan dan regulasi daerah yang melandasi kelembagaan serta kinerja operasional.",
          content: "Daftar Peraturan & Regulasi Landasan Kerja BAPPEDA Halmahera Utara",
          meta_json: {
            regulasi: regulasiList.filter((r) => r.nama.trim() !== ""),
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        toast.success("Dasar Hukum & Regulasi BAPPEDA berhasil disimpan!");
        setTimeout(() => setSaved(false), 3500);
      } else {
        toast.error("Gagal menyimpan Dasar Hukum ke database!");
      }
    } catch (err) {
      console.error("Gagal menyimpan Dasar Hukum ke database:", err);
      toast.error("Terjadi kesalahan koneksi saat menyimpan Dasar Hukum!");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Pengeditan Dasar Hukum hanya dapat dilakukan oleh role <strong>Administrator (SuperAdmin)</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              Regulasi &amp; Landasan Kerja
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Editor Dasar Hukum &amp; Regulasi</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Kelola daftar peraturan landasan kerja BAPPEDA Halmahera Utara beserta lampiran dokumen PDF resmi.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dasar Hukum Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold animate-pulse bg-white rounded-3xl border border-slate-200">
          Memuat data Dasar Hukum dari database...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* CARD: Daftar Peraturan Perundang-undangan */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    Daftar Peraturan Perundang-undangan ({regulasiList.length} Regulasi)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Regulasi resmi yang melandasi kinerja operasional kelembagaan BAPPEDA
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddRegulasi}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs flex items-center gap-1.5 transition border border-blue-200/80 shadow-2xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Regulasi</span>
              </button>
            </div>

            <div className="space-y-4">
              {regulasiList.map((item, idx) => (
                <div
                  key={idx}
                  id={`regulasi-card-${idx}`}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-50/80 border border-slate-200 space-y-4 hover:border-blue-300 transition-all duration-200 shadow-2xs group scroll-mt-24"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Regulasi Ke-{idx + 1}
                      </span>
                    </div>

                    {regulasiList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRegulasi(idx)}
                        className="px-3 py-1.5 rounded-xl hover:bg-rose-50 text-rose-500 border border-transparent hover:border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="Hapus Regulasi Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Regulasi</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama / Judul Peraturan *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.nama}
                        onChange={(e) => handleRegulasiChange(idx, "nama", e.target.value)}
                        placeholder="Contoh: Peraturan Daerah Kab. Halut No. 5 Tahun 2021"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Kategori Regulasi *
                        </label>
                        <span className="text-[10px] text-blue-600 font-extrabold">
                          + Bisa tambah baru
                        </span>
                      </div>
                      <SearchableSelect
                        options={kategoriOptions}
                        value={item.kategori}
                        onChange={(val) => handleRegulasiChange(idx, "kategori", String(val))}
                        placeholder="Pilih Kategori Regulasi"
                        searchPlaceholder="Cari atau ketik kategori baru..."
                        creatable={true}
                        createLabelPrefix="Tambah kategori baru:"
                        onCreateOption={handleAddNewKategori}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tentang / Rincian Singkat Regulasi *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.tentang}
                      onChange={(e) => handleRegulasiChange(idx, "tentang", e.target.value)}
                      placeholder="Contoh: Rencana Pembangunan Jangka Menengah Daerah 2021-2026"
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* DOKUMEN PERENCANAAN STYLE UPLOAD DROPZONE */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Lampiran Dokumen PDF Resmi *
                    </label>

                    {uploadingIndex === idx ? (
                      <div className="p-8 rounded-3xl border-2 border-dashed border-blue-400 bg-blue-50/60 flex flex-col items-center justify-center space-y-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                        <div className="space-y-1.5 w-full max-w-md">
                          <div className="flex items-center justify-between text-xs font-black text-blue-900">
                            <span>Mengunggah Berkas Dokumen (Chunk Dinamis)...</span>
                            <span className="font-mono">{uploadProgress[idx]?.percent ?? 0}%</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-blue-200/70 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[idx]?.percent ?? 0}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {uploadProgress[idx]?.statusText || "Menghubungkan berkas ke repository resmi daerah..."}
                          </p>
                        </div>
                      </div>
                    ) : !item.file_url ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverIndex(idx);
                        }}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverIndex(null);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileUpload(idx, e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => {
                          const input = document.getElementById(`regulasi-file-${idx}`) as HTMLInputElement;
                          input?.click();
                        }}
                        className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center relative overflow-hidden group shadow-xs ${
                          dragOverIndex === idx
                            ? "border-blue-600 bg-blue-50/80 scale-[1.01] shadow-lg shadow-blue-500/10"
                            : "border-slate-200 hover:border-blue-500 bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        {/* Subtle Background Glow Accent */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                        <div className="relative z-10 space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-700/20 group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="w-7 h-7 text-white" />
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="font-black text-slate-900 text-xs sm:text-sm tracking-tight group-hover:text-blue-700 transition">
                              Pilih atau Tarik Berkas Dokumen PDF Di Sini
                            </h3>
                            <p className="text-slate-500 font-medium text-[11px]">
                              Format resmi kearsipan BAPPEDA HALUT (Wajib berkas *.pdf)
                            </p>
                          </div>

                          <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5">
                            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 font-black text-[11px] border border-blue-200 shadow-2xs flex items-center gap-1.5">
                              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                              <span>Maksimal 500 MB (Chunk Dinamis)</span>
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-red-50 text-red-700 font-extrabold text-[11px] border border-red-200/80 shadow-2xs flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-red-600" />
                              <span>Hanya Menerima Dokumen PDF (*.pdf)</span>
                            </span>
                          </div>
                        </div>

                        <input
                          id={`regulasi-file-${idx}`}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(idx, e.target.files[0]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      /* Selected File Card View (Dokumen Perencanaan style) */
                      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                        <div className="flex items-center gap-3.5 overflow-hidden">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-blue-700/20">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden space-y-1">
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                              {decodeURIComponent(item.file_url.split("/").pop() || "Dokumen-Regulasi.pdf")}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                                PDF
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Watermark BAPPEDA Terverifikasi</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition shadow-2xs"
                            title="Buka Dokumen PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                            <span>Buka PDF</span>
                          </a>

                          <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 hover:border-blue-300 transition shadow-2xs">
                            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ganti PDF</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(idx, e.target.files[0]);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRegulasiChange(idx, "file_url", "")}
                            className="px-3 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Menyimpan Data..." : "Simpan Dasar Hukum"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
