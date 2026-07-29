"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Target, Save, Lock, CheckCircle2 } from "lucide-react";

export default function VisiMisiEditorPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);
  const [saved, setSaved] = useState(false);

  const [visi, setVisi] = useState(
    "<p><strong>Terwujudnya Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara yang Berkualitas, Inklusif, Berkelanjutan, dan Berbasis Teknologi SPBE Tahun 2026.</strong></p>"
  );

  const [misi, setMisi] = useState(
    "<h2>Misi Pembangunan Daerah:</h2><ol><li><strong>Meningkatkan Kualitas Perencanaan</strong>: Menyusun dokumen RKPD dan RPJMD berstandar tinggi berbasis data presisi.</li><li><strong>Pembangunan Infrastruktur Berkelanjutan</strong>: Mempercepat konektivitas antar wilayah pulau dan transportasi daerah.</li><li><strong>Transformasi Digital SPBE</strong>: Memperluas digitalisasi layanan publik dan manajemen aspirasi warga.</li><li><strong>Penguatan Ekonomi & SDA</strong>: Mengoptimalkan sektor maritim, pertanian, dan pariwisata daerah.</li></ol>"
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Pengeditan Visi & Misi hanya dapat dilakukan oleh role <strong>Administrator (SuperAdmin)</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              SUB-MENU PROFIL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Editor Visi & Misi Pembangunan Daerah
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Kelola Visi dan Misi strategis Kabupaten Halmahera Utara yang ditampilkan pada portal publik.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Visi Misi Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Visi */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span>1. Visi Utama BAPPEDA Halut (Tiptap Visual WYSIWYG)</span>
          </h2>
          <RichTextEditor
            value={visi}
            onChange={setVisi}
            placeholder="Tuliskan Visi..."
            minHeight="140px"
          />
        </div>

        {/* Misi */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-700" />
            <span>2. Misi Strategis Pembangunan Daerah (Tiptap Visual WYSIWYG)</span>
          </h2>
          <RichTextEditor
            value={misi}
            onChange={setMisi}
            placeholder="Tuliskan poin-poin Misi..."
            minHeight="260px"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Visi & Misi</span>
          </button>
        </div>
      </form>
    </div>
  );
}
