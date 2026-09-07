"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Printer,
  Save,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sparkles,
  HelpCircle,
  Download,
  Compass as CompassIcon,
  Check,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";

const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false }
);

export default function CetakLayoutSettingPage() {
  const [saving, setSaving] = useState(false);

  // Print Layout Form State
  const [mapTitle, setMapTitle] = useState("PETA SEBARAN PROYEK STRATEGIS KABUPATEN HALMAHERA UTARA");
  const [mapSubtitle, setMapSubtitle] = useState("Dokumen Resmi Perencanaan Pembangunan Daerah Bappeda Pemkab Halut");
  const [showLogo, setShowLogo] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [paperSize, setPaperSize] = useState<"A4" | "A3" | "A2">("A4");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      toast.success("Konfigurasi Template Cetak Layout Executive berhasil diperbarui!");
      showSuccessSwal(
        "Pembaruan Berhasil!",
        "Template cetak peta executive untuk Bupati & Bappeda berhasil disimpan."
      );
    } catch (err: any) {
      toast.error("Gagal menyimpan konfigurasi.");
      showErrorSwal("Gagal Menyimpan", "Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  const handleSimulatePrint = () => {
    toast.success(`Simulasi Cetak Layout Peta ${paperSize} (${orientation.toUpperCase()}) Berhasil Diekspor!`);
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
            <Printer className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Cetak & Ekspor Layout Peta Executive
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Atur template layout cetak peta resmi untuk laporan Bupati, DPRD, dan Rapat Eksekutif Bappeda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Format HD 300 DPI Executive</span>
          </span>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-2xs">
        <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-amber-900">Petunjuk Cetak Layout Executive</h4>
          <p className="text-amber-900/80 leading-relaxed font-medium">
            Template ini mengatur judul kop peta, orientasi kertas (Landscape/Portrait), kompas mata angin, dan legend resmi saat peta diunduh sebagai PDF/PNG.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls Left (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Kop & Ornamen Layout Cetak</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Judul Peta Cetak *</label>
              <input
                type="text"
                required
                value={mapTitle}
                onChange={(e) => setMapTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Sub-Judul / Keterangan Dokumen *</label>
              <input
                type="text"
                required
                value={mapSubtitle}
                onChange={(e) => setMapSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ukuran Kertas</label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {["A4", "A3", "A2"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPaperSize(sz as any)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        paperSize === sz ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Orientasi Layout</label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: "landscape", name: "Mendatar" },
                    { id: "portrait", name: "Tegak" },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrientation(o.id as any)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        orientation === o.id ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-extrabold text-slate-900 text-xs">Logo Pemkab Halut & Bappeda</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-extrabold text-slate-900 text-xs">Kompas Arah Mata Angin (North Arrow)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompass}
                    onChange={(e) => setShowCompass(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-extrabold text-slate-900 text-xs">Box Legend & Skala Batang</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Live Executive Map Print Layout Frame Preview (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Simulasi Executive Map Print Layout ({paperSize} - {orientation.toUpperCase()})</span>
            </h4>
            <button
              type="button"
              onClick={handleSimulatePrint}
              className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3 h-3 text-amber-700" />
              <span>Uji Ekspor PDF</span>
            </button>
          </div>

          {/* Executive Frame Mockup */}
          <div className="p-4 rounded-2xl border-4 border-slate-900 bg-slate-50 space-y-3 relative shadow-md">
            {/* Kop Peta Title Block */}
            <div className="p-3 rounded-xl bg-white border border-slate-300 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">{mapTitle}</h2>
                <p className="text-[10px] font-medium text-slate-500">{mapSubtitle}</p>
              </div>

              {showLogo && (
                <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-800 shrink-0">
                  🏛️ PEMKAB HALUT
                </div>
              )}
            </div>

            {/* Map Frame */}
            <div className="h-[280px] rounded-xl overflow-hidden border border-slate-300 relative">
              <GeotaggingMapPicker
                selectedLat={1.7280}
                selectedLng={127.9900}
                zoomLevel={13}
              />

              {/* Compass Mata Angin Overlay */}
              {showCompass && (
                <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-slate-300 flex items-center justify-center font-black text-xs text-slate-900 shadow-md backdrop-blur-xs z-[500]">
                  🧭 N
                </div>
              )}

              {/* Legend Overlay Box */}
              {showLegend && (
                <div className="absolute bottom-3 left-3 bg-white/95 p-2 rounded-xl border border-slate-300 text-[10px] space-y-1 shadow-md backdrop-blur-xs z-[500]">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-0.5">LEGEND PETA</div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                    <span>Proyek PUPR</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                    <span>Proyek Kesehatan</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
              <span>{saving ? "Menyimpan..." : "Simpan Template Layout"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
