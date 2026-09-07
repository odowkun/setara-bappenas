"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch } from "@/lib/apiClient";
import { toast } from "@/lib/swal";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  Briefcase,
  Save,
  Lock,
  CheckCircle2,
  Plus,
  Trash2,
  Shield,
} from "lucide-react";

export default function TupoksiEditorPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 1. Tugas Pokok
  const [tugasPokok, setTugasPokok] = useState("");

  // 2. Rincian Fungsi Strategis (List of strings)
  const [fungsiList, setFungsiList] = useState<string[]>([]);

  // Load data from Laravel API
  const fetchTupoksiData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/profil/tugas_fungsi");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (d.content) {
            setTugasPokok(d.content);
          }
          if (d.meta_json && Array.isArray(d.meta_json.fungsi)) {
            setFungsiList(d.meta_json.fungsi);
          }
        }
      }
    } catch (err) {
      console.error("Gagal memuat data Tugas & Fungsi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTupoksiData();
  }, []);

  // Handlers for list
  const handleAddFungsi = () => {
    setFungsiList((prev) => [...prev, ""]);
  };

  const handleRemoveFungsi = (index: number) => {
    setFungsiList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFungsiChange = (index: number, val: string) => {
    setFungsiList((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await authenticatedFetch("http://localhost:8000/api/v1/profil/tugas_fungsi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: "Tugas Pokok & Fungsi Organisasi",
          subtitle: "Peran Strategis Perencanaan dan Evaluasi Pembangunan Daerah",
          content: tugasPokok,
          meta_json: {
            fungsi: fungsiList.filter((f) => f.trim() !== ""),
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        toast.success("Tugas Pokok & Fungsi BAPPEDA berhasil disimpan!");
        setTimeout(() => setSaved(false), 3500);
      } else {
        toast.error("Gagal menyimpan Tugas & Fungsi ke database!");
      }
    } catch (err) {
      console.error("Gagal menyimpan data Tugas & Fungsi ke database:", err);
      toast.error("Terjadi kesalahan koneksi saat menyimpan Tugas & Fungsi!");
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
          Pengeditan Tugas Pokok & Fungsi hanya dapat dilakukan oleh role <strong>Administrator (SuperAdmin)</strong>.
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
            Editor Tugas Pokok & Fungsi (Tupoksi)
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Kelola uraian tugas pokok dan rincian poin fungsi kelembagaan BAPPEDA Halmahera Utara.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tupoksi Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold animate-pulse bg-white rounded-3xl border border-slate-200">
          Memuat data Tugas & Fungsi dari database...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* CARD 1: Uraian Tugas Pokok Organisasi (RichTextEditor) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  1. Uraian Tugas Pokok Organisasi
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Format uraian narasi tugas pokok kelembagaan BAPPEDA dengan RichTextEditor
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Isi Narasi Tugas Pokok *
              </label>
              <RichTextEditor
                value={tugasPokok}
                onChange={setTugasPokok}
                placeholder="Tuliskan uraian Tugas Pokok BAPPEDA..."
                minHeight="200px"
              />
            </div>
          </div>

          {/* CARD 2: Poin-poin Fungsi Strategis Organisasi */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    2. Rincian Poin-Poin Fungsi Strategis ({fungsiList.length} Poin)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Poin-poin fungsi teknis yang akan tampil berurutan pada halaman publik
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddFungsi}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs flex items-center gap-1.5 transition border border-blue-200/80 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Poin Fungsi</span>
              </button>
            </div>

            <div className="space-y-3">
              {fungsiList.map((fungsiItem, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3.5 hover:border-blue-200 transition shadow-2xs group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    required
                    value={fungsiItem}
                    onChange={(e) => handleFungsiChange(idx, e.target.value)}
                    placeholder={`Tuliskan rincian fungsi ke-${idx + 1}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  {fungsiList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFungsi(idx)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 border border-transparent hover:border-rose-200 transition shrink-0"
                      title="Hapus Fungsi Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
              <span>{saving ? "Menyimpan Data..." : "Simpan Tugas & Fungsi"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
