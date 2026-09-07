"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch, API_BASE_URL } from "@/lib/apiClient";
import SearchableSelect from "@/components/ui/SearchableSelect";
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
} from "lucide-react";

const KATEGORI_REGULASI_OPTIONS = [
  { value: "Undang-Undang", label: "Undang-Undang" },
  { value: "Peraturan Pemerintah", label: "Peraturan Pemerintah" },
  { value: "Peraturan Presiden", label: "Peraturan Presiden" },
  { value: "Peraturan Menteri", label: "Peraturan Menteri" },
  { value: "Peraturan Daerah", label: "Peraturan Daerah" },
  { value: "Peraturan Bupati", label: "Peraturan Bupati" },
  { value: "Keputusan Bupati", label: "Keputusan Bupati" },
  { value: "Instruksi Bupati", label: "Instruksi Bupati" },
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

  // Daftar Regulasi Item
  const [regulasiList, setRegulasiList] = useState<RegulasiItem[]>([]);

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

  // Handlers for Regulasi Item List
  const handleAddRegulasi = () => {
    setRegulasiList((prev) => [
      ...prev,
      { nama: "", tentang: "", kategori: "Peraturan Daerah", file_url: "" },
    ]);
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

  // Compact File Upload Handler
  const handleFileUpload = (index: number, file: File) => {
    toast.error(`Lampiran "${file.name}" belum diunggah. Gunakan repository Dokumen agar file memiliki URL resmi.`);
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
    <div className="space-y-4 w-full max-w-[1400px] mx-auto font-sans">
      {/* HEADER CARD (FLUID & COMPACT PADDING) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Editor Dasar Hukum & Regulasi
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Kelola daftar peraturan landasan kerja BAPPEDA Halmahera Utara beserta lampiran dokumen PDF resmi.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
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
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs flex items-center gap-1.5 transition border border-blue-200/80 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Regulasi</span>
              </button>
            </div>

            <div className="space-y-3">
              {regulasiList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-blue-200 transition shadow-2xs group"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        Regulasi Ke-{idx + 1}
                      </span>
                    </div>

                    {regulasiList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRegulasi(idx)}
                        className="px-2.5 py-1 rounded-lg hover:bg-rose-50 text-rose-500 border border-transparent hover:border-rose-200 font-bold text-xs flex items-center gap-1 transition"
                        title="Hapus Regulasi Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kategori Regulasi
                      </label>
                      <SearchableSelect
                        options={KATEGORI_REGULASI_OPTIONS}
                        value={item.kategori}
                        onChange={(val) => handleRegulasiChange(idx, "kategori", String(val))}
                        placeholder="Pilih Kategori Regulasi"
                        searchPlaceholder="Cari kategori regulasi..."
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* SLEEK & COMPACT DOCUMENT ATTACHMENT */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      {item.file_url ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-[11px] font-bold text-emerald-800 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.file_url}</span>
                          <button
                            type="button"
                            onClick={() => handleRegulasiChange(idx, "file_url", "")}
                            className="p-0.5 rounded-full hover:bg-emerald-200 text-emerald-700 transition"
                            title="Hapus Dokumen"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Belum ada dokumen PDF terlampir
                        </span>
                      )}
                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 font-black text-xs transition shrink-0 shadow-2xs">
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>{item.file_url ? "Ganti PDF" : "Unggah PDF"}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(idx, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
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
