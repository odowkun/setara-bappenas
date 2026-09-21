"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { geoSettingService, GeoSettingData } from "@/services/geoSettingService";
import {
  Compass,
  Globe,
  Save,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Eye,
  MapPin,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";

const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false }
);

export default function ViewportSettingPage() {
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
        toast.success("Pusat koordinat & zoom level berhasil diperbarui!");
        showSuccessSwal(
          "Pembaruan Berhasil!",
          "Titik koordinat pusat dan level perbesaran peta awal publik berhasil disimpan."
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
      <div className="w-full space-y-6 font-sans pb-12 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-5 w-64 bg-slate-200 rounded-lg" />
              <div className="h-3.5 w-80 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-8 w-24 bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 rounded-3xl bg-white border border-slate-200 p-6 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
          <div className="h-40 rounded-3xl bg-white border border-slate-200 p-6 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Viewport & Pusat Koordinat Peta Awal
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Atur posisi titik tengah (Latitude/Longitude) dan tingkat perbesaran peta awal publik.
            </p>
          </div>
        </div>

        {form.updated_by && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Diperbarui oleh: <strong>{form.updated_by}</strong></span>
            </span>
          </div>
        )}
      </div>

      {/* User Friendly Guide Card */}
      <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 text-purple-950 flex items-start gap-3 shadow-2xs">
        <HelpCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-purple-900">Fungsi Halaman Viewport & Peta Awal</h4>
          <p className="text-purple-900/80 leading-relaxed font-medium">
            Pengaturan ini menentukan titik fokus awal saat publik atau staf Bappeda membuka fitur peta spasial.
            Anda dapat menentukan Latitude, Longitude, dan menggeser slider Zoom Level di bawah ini, lalu melihat perubahan posisi peta secara langsung pada panel live preview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Input Koordinat (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>Input Koordinat Awal Peta</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Latitude / Garis Lintang (Y) *</label>
              <input
                type="number"
                step="any"
                required
                value={form.default_latitude}
                onChange={(e) => setForm({ ...form, default_latitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
              />
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">Contoh Halmahera Utara: 1.7289</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Longitude / Garis Bujur (X) *</label>
              <input
                type="number"
                step="any"
                required
                value={form.default_longitude}
                onChange={(e) => setForm({ ...form, default_longitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
              />
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">Contoh Halmahera Utara: 128.0054</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Perbesaran Peta Awal (Zoom Level: {form.default_zoom_level}) *
              </label>
              <input
                type="range"
                min="6"
                max="18"
                value={form.default_zoom_level}
                onChange={(e) => setForm({ ...form, default_zoom_level: parseInt(e.target.value) || 12 })}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>Zoom 6 (Provinsi)</span>
                <span className="text-purple-700 font-extrabold">Zoom 12 (Halut)</span>
                <span>Zoom 18 (Detail)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-black text-xs shadow-md shadow-purple-700/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> : <Save className="w-4 h-4 text-amber-300" />}
                <span>{saving ? "Menyimpan..." : "Simpan Viewport & Zoom Peta"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Peta Interactive (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Live Visual Preview Peta Awal</span>
            </h4>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              Live Fly-To & Zoom Animated
            </span>
          </div>

          <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-200">
            <GeotaggingMapPicker
              selectedLat={form.default_latitude}
              selectedLng={form.default_longitude}
              zoomLevel={form.default_zoom_level}
              onLocationSelect={(lat: number, lng: number) => {
                setForm({
                  ...form,
                  default_latitude: lat,
                  default_longitude: lng,
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
