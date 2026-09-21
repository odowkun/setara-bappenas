"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import L from "@/lib/gis/leafletPatch";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/context/AuthContext";
import { geoSettingService, GeoSettingData } from "@/services/geoSettingService";
import {
  Layers,
  Save,
  ShieldCheck,
  RefreshCw,
  Info,
  Check,
  ZoomOut,
  Maximize2,
  ZoomIn,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";

// Mini Live Leaflet Map Component with customizable zoom level
const MiniBasemapMap = dynamic(
  () =>
    Promise.resolve(({ basemapId, zoomLevel }: { basemapId: string; zoomLevel: number }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const mapRef = useRef<L.Map | null>(null);

      useEffect(() => {
        const centerLat = zoomLevel === 10 ? 1.6178 : 1.7280;
        const centerLng = zoomLevel === 10 ? 127.8584 : 127.9900;

        if (!containerRef.current) return;

        if (!mapRef.current) {
          const map = L.map(containerRef.current, {
            center: [centerLat, centerLng],
            zoom: zoomLevel,
            minZoom: 8,
            maxZoom: 19,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            touchZoom: false,
          });

          let url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
          let subdomains: string | string[] = "abcd";

          if (basemapId === "googleHybrid") {
            url = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
            subdomains = "abc";
          } else if (basemapId === "googleStreet") {
            url = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
            subdomains = "abc";
          } else if (basemapId === "esriSatellite") {
            url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            subdomains = [];
          } else if (basemapId === "esriTopo") {
            url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
            subdomains = [];
          }

          L.tileLayer(url, { subdomains, maxZoom: 19 }).addTo(map);
          mapRef.current = map;
        } else {
          mapRef.current.setView([centerLat, centerLng], zoomLevel, { animate: true });
        }

        const t1 = setTimeout(() => mapRef.current?.invalidateSize(), 250);
        return () => clearTimeout(t1);
      }, [basemapId, zoomLevel]);

      return <div ref={containerRef} className="w-full h-full pointer-events-none" />;
    }),
  { ssr: false }
);

const BASEMAP_CARDS = [
  {
    id: "esriSatellite",
    title: "🏔️ Esri Satelit World Imagery",
    description: "Citra penginderaan jauh standar GIS profesional Esri.",
    tag: "Rekomendasi Utama",
    tagColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "googleHybrid",
    title: "🛰️ Google Satelit + Batas Label",
    description: "Citra satelit resolusi tinggi Google Maps dengan nama kecamatan & desa.",
    tag: "Citra Google Satelit",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "googleStreet",
    title: "🛣️ Google Maps Jalan",
    description: "Vektor jaringan jalan & rute transportasi.",
    tag: "Nama Jalan Lengkap",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "esriTopo",
    title: "🗺️ Esri Topografi",
    description: "Peta kontur, topografi, dan batas elevasi daratan.",
    tag: "Topografi & Kontur",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

function BasemapCardItem({
  card,
  isSelected,
  onSelect,
}: {
  card: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [activeZoom, setActiveZoom] = useState<number>(13);

  return (
    <div
      onClick={onSelect}
      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative space-y-4 ${
        isSelected
          ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${card.tagColor}`}>
            {card.tag}
          </span>
          <h3 className="text-base font-black text-slate-900 mt-1">{card.title}</h3>
        </div>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition shrink-0 ${
            isSelected
              ? "bg-blue-600 border-blue-600 text-white shadow-xs"
              : "border-slate-300 bg-white text-transparent"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
        </div>
      </div>

      <p className="text-xs text-slate-500 font-medium leading-relaxed">
        {card.description}
      </p>

      {/* Interactive Scale Switcher Tabs */}
      <div
        className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {[
          { level: 10, label: "🌐 Skala Jauh", sub: "Kabupaten (Z10)", icon: ZoomOut },
          { level: 13, label: "🗺️ Skala Sedang", sub: "Kecamatan (Z13)", icon: Maximize2 },
          { level: 16, label: "📍 Skala Dekat", sub: "Detail Fisik (Z16)", icon: ZoomIn },
        ].map((tab) => {
          const isActive = activeZoom === tab.level;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.level}
              type="button"
              onClick={() => setActiveZoom(tab.level)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              <TabIcon className="w-3 h-3 text-blue-600" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Big Crisp Live Map Preview Window (h-56) */}
      <div className="h-56 rounded-2xl border border-slate-200 overflow-hidden relative shadow-2xs bg-slate-100 group">
        <MiniBasemapMap basemapId={card.id} zoomLevel={activeZoom} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-3 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-black text-white bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
            {activeZoom === 10
              ? "🌐 Skala Jauh: Wilayah Kabupaten Halut (Zoom 10)"
              : activeZoom === 13
              ? "🗺️ Skala Sedang: Kawasan Tobelo & Kecamatan (Zoom 13)"
              : "📍 Skala Dekat: Detail Jalan & Pemukiman (Zoom 16)"}
          </span>
          <span className="text-[9px] font-mono text-slate-300 font-semibold bg-slate-900/60 px-2 py-0.5 rounded-md hidden sm:inline">
            Klik Tab Di Atas Untuk Zoom
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BasemapSettingPage() {
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
        toast.success("Pilihan Basemap Utama berhasil diperbarui!");
        showSuccessSwal(
          "Pembaruan Berhasil!",
          "Basemap utama peta spasial berhasil disimpan ke database."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded-3xl bg-white border border-slate-200 p-5 space-y-3">
              <div className="aspect-video w-full rounded-2xl bg-slate-200" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <Layers className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Pilihan Basemap Utama (Peta Dasar Publik)
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Tentukan jenis peta dasar default yang akan terbuka secara otomatis saat publik mengakses WebGIS Bappeda.
            </p>
          </div>
        </div>

        {form.updated_by && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Diperbarui oleh: <strong>{form.updated_by}</strong></span>
            </span>
          </div>
        )}
      </div>

      <div className="p-4 rounded-3xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-blue-900">Petunjuk Pemilihan Basemap (Ukuran Presisi & Interaktif)</h4>
          <p className="text-blue-900/80 leading-relaxed font-medium">
            Setiap kartu dilengkapi dengan frame peta berukuran besar (`h-56`). Anda dapat menekan tombol tab <strong>🌐 Skala Jauh</strong>, <strong>🗺️ Skala Sedang</strong>, atau <strong>📍 Skala Dekat</strong> di atas frame peta untuk melihat simulasi animasi perbesaran peta.
          </p>
        </div>
      </div>

      {/* 2x2 Grid of Rich Basemap Cards with Interactive Big Map Frame */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BASEMAP_CARDS.map((card) => {
          const isSelected = form.default_basemap === card.id;
          return (
            <BasemapCardItem
              key={card.id}
              card={card}
              isSelected={isSelected}
              onSelect={() => setForm({ ...form, default_basemap: card.id as any })}
            />
          );
        })}
      </div>

      {/* Global Save Actions Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> : <Save className="w-4 h-4 text-amber-300" />}
          <span>{saving ? "Menyimpan..." : "Simpan Basemap Utama"}</span>
        </button>
      </div>
    </div>
  );
}
