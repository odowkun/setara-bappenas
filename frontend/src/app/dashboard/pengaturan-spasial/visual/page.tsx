"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { geoSettingService, GeoSettingData } from "@/services/geoSettingService";
import SearchableSelect, { SearchableOption } from "@/components/ui/SearchableSelect";
import {
  Palette,
  Ruler,
  Save,
  ShieldCheck,
  RefreshCw,
  Check,
  HelpCircle,
  Eye,
  Sparkles,
  FileCheck,
  Globe2,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";

const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false }
);

const UNIT_LUAS_OPTIONS: SearchableOption[] = [
  { value: "ha", label: "Hektar (Ha)", sublabel: "Satuan standar perencanaan tata ruang RTRW/RDTR" },
  { value: "m2", label: "Meter Persegi (m²)", sublabel: "Satuan luasan skala mikro/bangunan fisik" },
];

const UNIT_PANJANG_OPTIONS: SearchableOption[] = [
  { value: "km", label: "Kilometer (Km)", sublabel: "Satuan standar koridor jalan & jaringan irigasi" },
  { value: "m", label: "Meter (m)", sublabel: "Satuan panjang skala detail fisik" },
];

const PRESET_COLORS = [
  { hex: "#7c3aed", name: "Violet Ungu (Resmi Bappeda Halut)" },
  { hex: "#2563eb", name: "Biru Layanan Publik & Infrastruktur" },
  { hex: "#059669", name: "Hijau Kelautan, Kehutanan & RTRW" },
  { hex: "#e11d48", name: "Merah Rawan Bencana & Mitigasi" },
  { hex: "#d97706", name: "Kuning Koridor Pembangunan Fisik" },
];

const SAMPLE_POLYGON_GEOJSON = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [127.983, 1.720],
        [127.997, 1.720],
        [127.997, 1.733],
        [127.983, 1.733],
        [127.983, 1.720],
      ],
    ],
  },
  properties: { name: "Simulasi Kawasan Delineasi Bappeda" },
};

export default function VisualSettingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<GeoSettingData>({
    id: 1,
    default_latitude: 1.7289,
    default_longitude: 128.0054,
    default_zoom_level: 12,
    default_basemap: "esriSatellite",
    esri_feature_service_url: "",
    esri_geoprocessing_url: "",
    auto_sync_esri: true,
    default_layer_color: "#7c3aed",
    default_fill_opacity: 0.35,
    max_kmz_file_mb: 15,
    spatial_reference_srid: "EPSG:4326",
    unit_luas: "ha",
    unit_panjang: "km",
  });

  useEffect(() => {
    geoSettingService
      .getSettings()
      .then((data) => {
        if (data) setForm(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await geoSettingService.updateSettings(form);
      if (res.success && res.data) {
        setForm(res.data);
        toast.success("Standar visual & satuan ukur berhasil diperbarui!");
        showSuccessSwal(
          "Pembaruan Berhasil!",
          "Warna layer spasial, opasitas poligon, dan satuan ukur berhasil disimpan."
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan konfigurasi.");
      showErrorSwal("Gagal Menyimpan", err.message || "Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 font-sans pb-12">
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Memuat Standar Visual & Satuan Ukur...</p>
        </div>
      </div>
    );
  }

  // Real-time measurement readout values based on selected units
  const formattedLuas =
    form.unit_luas === "ha"
      ? "145,20 Hektar (Ha)"
      : "1.452.000 Meter Persegi (m²)";

  const formattedPanjang =
    form.unit_panjang === "km"
      ? "4,85 Kilometer (Km)"
      : "4.850 Meter (m)";

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
            <Palette className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Visual Layer Spasial & Satuan Ukur
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Atur skema warna default untuk garis koridor & poligon lahan, serta tentukan satuan luas dan satuan panjang pada analisis Bappeda.
            </p>
          </div>
        </div>

        {form.updated_by && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diperbarui oleh: <strong>{form.updated_by}</strong></span>
            </span>
          </div>
        )}
      </div>

      <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-start gap-3 shadow-2xs">
        <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-emerald-900">Petunjuk Visualisasi & Simulasi Real-Time</h4>
          <p className="text-emerald-900/80 leading-relaxed font-medium">
            Ubah warna preset, slider transparansi, atau satuan ukur di sebelah kiri. <strong>Peta simulasi di sebelah kanan akan LANGSUNG me-repaint warna poligon dan mengonversi nilai angka luasan secara otomatis!</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls Left (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Skema Warna & Opasitas */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>Skema Warna & Opasitas Layer</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Pilih Warna Layer Spasial & Poligon *</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <input
                    type="color"
                    value={form.default_layer_color}
                    onChange={(e) => setForm({ ...form, default_layer_color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-black text-slate-900 block font-mono uppercase">{form.default_layer_color}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Klik kotak warna di kiri untuk memilih warna bebas</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Transparansi Poligon Lahan</label>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {Math.round(form.default_fill_opacity * 100)}% Opacity
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={form.default_fill_opacity}
                  onChange={(e) => setForm({ ...form, default_fill_opacity: parseFloat(e.target.value) || 0.35 })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Batas Maksimal File KMZ/KML (MB) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={form.max_kmz_file_mb}
                  onChange={(e) => setForm({ ...form, max_kmz_file_mb: parseInt(e.target.value) || 15 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Proyeksi & Satuan Ukur */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-emerald-600" />
              <span>Proyeksi Spasial & Satuan Ukur</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Sistem Referensi Spasial (SRID) *</label>
                <input
                  type="text"
                  required
                  value={form.spatial_reference_srid}
                  onChange={(e) => setForm({ ...form, spatial_reference_srid: e.target.value })}
                  placeholder="EPSG:4326 (WGS 84)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan Luas Area *</label>
                  <SearchableSelect
                    options={UNIT_LUAS_OPTIONS}
                    value={form.unit_luas}
                    onChange={(val) => setForm({ ...form, unit_luas: val as any })}
                    placeholder="-- Satuan Luas --"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan Panjang Koridor *</label>
                  <SearchableSelect
                    options={UNIT_PANJANG_OPTIONS}
                    value={form.unit_panjang}
                    onChange={(val) => setForm({ ...form, unit_panjang: val as any })}
                    placeholder="-- Satuan Panjang --"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive WebGIS Visual Preview Pane (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Live Visual & Measurement Preview Panel</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Simulasi Real-Time</span>
            </span>
          </div>

          {/* Interactive Leaflet Map with Dynamic Buffer Color & Opacity */}
          <div className="h-[360px] rounded-2xl overflow-hidden border border-slate-200 relative">
            <GeotaggingMapPicker
              selectedLat={1.7280}
              selectedLng={127.9900}
              zoomLevel={13}
              bufferGeoJson={SAMPLE_POLYGON_GEOJSON}
              bufferColor={form.default_layer_color}
              bufferFillOpacity={form.default_fill_opacity}
            />
          </div>

          {/* Dynamic Real-Time Measurement Readout Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Simulasi Luas Delineasi</span>
              <span className="text-xs font-black text-emerald-950 block">{formattedLuas}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Panjang Koridor</span>
              <span className="text-xs font-black text-blue-950 block">{formattedPanjang}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase block flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-purple-600" />
                <span>Sistem SRID</span>
              </span>
              <span className="text-xs font-black text-purple-950 font-mono block">{form.spatial_reference_srid}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase block flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-amber-600" />
                <span>Max Upload KMZ</span>
              </span>
              <span className="text-xs font-black text-amber-950 block">Maks. {form.max_kmz_file_mb} MB</span>
            </div>
          </div>

          {/* Global Save Actions Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
              <span>{saving ? "Menyimpan..." : "Simpan Visual & Satuan Ukur"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
