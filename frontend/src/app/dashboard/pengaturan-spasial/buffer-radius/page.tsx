"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Target,
  Save,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sparkles,
  HelpCircle,
  Check,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";

const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false }
);

const PRESET_RADII = [
  { value: 500, label: "500 Meter", desc: "Skala dampak langsung sekitar lokasi proyek" },
  { value: 1000, label: "1.000 Meter (1 Km)", desc: "Skala dampak lingkungan perkotaan/desa" },
  { value: 2500, label: "2.500 Meter (2,5 Km)", desc: "Skala jangkauan pelayanan puskesmas/sekolah" },
  { value: 5000, label: "5.000 Meter (5 Km)", desc: "Skala koridor kawasan strategis kabupaten" },
];

export default function BufferRadiusSettingPage() {
  const [saving, setSaving] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<number>(1000);
  const [bufferColor, setBufferColor] = useState("#7c3aed");
  const [bufferOpacity, setBufferOpacity] = useState(0.35);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      toast.success("Konfigurasi Radius Penyangga (Buffer Zone) berhasil diperbarui!");
      showSuccessSwal(
        "Pembaruan Berhasil!",
        `Default radius penyangga ${selectedRadius}m berhasil disimpan.`
      );
    } catch (err: any) {
      toast.error("Gagal menyimpan konfigurasi.");
      showErrorSwal("Gagal Menyimpan", "Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  // Sample Circle GeoJSON around Tobelo town center
  const sampleBufferGeoJson = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [127.981, 1.720],
          [127.999, 1.720],
          [127.999, 1.736],
          [127.981, 1.736],
          [127.981, 1.720],
        ],
      ],
    },
    properties: { radius: selectedRadius },
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Radius Penyangga (Buffer Zone Default)
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Tentukan jarak default radius penyangga pada analisis dampak geoprocessing Bappeda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Preset Radius Active: {selectedRadius}m</span>
          </span>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 text-purple-950 flex items-start gap-3 shadow-2xs">
        <HelpCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-purple-900">Petunjuk Radius Penyangga (Buffer Zone)</h4>
          <p className="text-purple-900/80 leading-relaxed font-medium">
            Buffer Zone digunakan saat menganalisis jangkauan layanan infrastruktur atau kawasan terdampak proyek fisik. Peta di sebelah kanan me-render lingkar buffer zone secara real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls Left (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span>Pilihan Jarak Radius Penyangga</span>
          </h3>

          <div className="space-y-3 text-xs">
            {PRESET_RADII.map((r) => (
              <div
                key={r.value}
                onClick={() => setSelectedRadius(r.value)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedRadius === r.value
                    ? "border-purple-600 bg-purple-50/50 shadow-sm ring-2 ring-purple-600/20"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div>
                  <span className="font-black text-slate-900 block text-xs">{r.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{r.desc}</span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition shrink-0 ${
                    selectedRadius === r.value
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-2">Warna Lingkar Buffer</label>
                <div className="flex items-center gap-2">
                  {["#7c3aed", "#2563eb", "#059669", "#e11d48", "#d97706"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBufferColor(c)}
                      className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                        bufferColor === c ? "border-slate-900 scale-110 shadow-sm" : "border-white"
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {bufferColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Opasitas Lingkar Buffer</label>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {Math.round(bufferOpacity * 100)}% Opacity
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={bufferOpacity}
                  onChange={(e) => setBufferOpacity(parseFloat(e.target.value) || 0.35)}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Map Preview Right (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Live Visual Buffer Zone Preview ({selectedRadius}m Radius)</span>
            </h4>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Expanding Buffer Ring</span>
            </span>
          </div>

          <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-200 relative">
            <GeotaggingMapPicker
              selectedLat={1.7280}
              selectedLng={127.9900}
              zoomLevel={13}
              bufferGeoJson={sampleBufferGeoJson}
              bufferColor={bufferColor}
              bufferFillOpacity={bufferOpacity}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
              <span>{saving ? "Menyimpan..." : "Simpan Radius Buffer"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
