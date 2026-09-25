"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  FileCode,
  Layers,
  MapPin,
  Maximize2,
  Trash2,
  CheckCircle2,
  Search,
  Eye,
  ChevronRight,
  Info,
  Copy,
  Check,
  Table,
  FileSpreadsheet,
} from "lucide-react";
import { ParsedKmzResult, ParsedKmzFeatureItem } from "@/lib/gis/kmzParser";
import { toast } from "@/lib/swal";

// Dynamic import of Leaflet mini map with no SSR
const KmzMiniMapPreview = dynamic(
  () => import("@/components/gis/KmzMiniMapPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[240px] w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
        Memuat peta preview spasial...
      </div>
    ),
  }
);

interface KmzFeaturePreviewProps {
  parsedResult: ParsedKmzResult;
  color?: string;
  onClear?: () => void;
  compact?: boolean;
}

export default function KmzFeaturePreview({
  parsedResult,
  color = "#0284c7",
  onClear,
  compact = false,
}: KmzFeaturePreviewProps) {
  const [activeTab, setActiveTab] = useState<"map" | "features" | "table">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<ParsedKmzFeatureItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return parsedResult.features;
    const q = searchQuery.toLowerCase();
    return parsedResult.features.filter((f) => {
      const matchName = f.name.toLowerCase().includes(q);
      const matchType = f.geometryType.toLowerCase().includes(q);
      const matchProps = Object.values(f.properties || {}).some((v) =>
        String(v).toLowerCase().includes(q)
      );
      return matchName || matchType || matchProps;
    });
  }, [parsedResult.features, searchQuery]);

  // Copy raw GeoJSON to clipboard
  const handleCopyGeoJson = () => {
    if (!parsedResult.geojson) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(parsedResult.geojson, null, 2));
      setCopied(true);
      toast.success("Data spasial GeoJSON berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin GeoJSON");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden text-xs font-sans animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header Bar */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl text-white shadow-xs shrink-0"
            style={{ backgroundColor: color }}
          >
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 truncate max-w-[220px] sm:max-w-xs text-xs block">
                {parsedResult.fileName}
              </span>
              <span className="uppercase text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {parsedResult.fileType}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
              <span>{formatFileSize(parsedResult.fileSize)}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                Terurai (WGS84 EPSG:4326)
              </span>
            </div>
          </div>
        </div>

        {/* Clear Button */}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            title="Ganti atau hapus file yang diunggah"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Ganti File</span>
          </button>
        )}
      </div>

      {/* Metric Breakdown Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white border-b border-slate-100">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-medium block">Total Fitur</span>
          <strong className="text-slate-900 font-black text-sm block mt-0.5">
            {parsedResult.summary.totalFeatures}
            <span className="text-[10px] font-normal text-slate-400 ml-1">objek</span>
          </strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-medium block">Poligon Wilayah</span>
          <strong className="text-slate-900 font-black text-sm block mt-0.5">
            {parsedResult.summary.polygonsCount}
            {parsedResult.summary.totalAreaHa > 0 ? (
              <span className="text-[10px] font-bold text-emerald-700 ml-1">
                ({parsedResult.summary.totalAreaHa.toLocaleString("id-ID")} Ha)
              </span>
            ) : null}
          </strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-medium block">Garis / Koridor</span>
          <strong className="text-slate-900 font-black text-sm block mt-0.5">
            {parsedResult.summary.polylinesCount}
            {parsedResult.summary.totalLengthKm > 0 ? (
              <span className="text-[10px] font-bold text-blue-700 ml-1">
                ({parsedResult.summary.totalLengthKm.toLocaleString("id-ID")} km)
              </span>
            ) : null}
          </strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-medium block">Titik Acuan</span>
          <strong className="text-slate-900 font-black text-sm block mt-0.5">
            {parsedResult.summary.pointsCount}
            <span className="text-[10px] font-normal text-slate-400 ml-1">titik</span>
          </strong>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded-t-xl font-bold text-[11px] border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "map"
                ? "border-rose-600 text-rose-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Peta Interaktif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("features")}
            className={`px-3 py-1.5 rounded-t-xl font-bold text-[11px] border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "features"
                ? "border-rose-600 text-rose-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Isian Placemark ({parsedResult.features.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("table")}
            className={`px-3 py-1.5 rounded-t-xl font-bold text-[11px] border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "table"
                ? "border-rose-600 text-rose-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabel Atribut</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopyGeoJson}
          className="text-[10px] text-slate-600 hover:text-slate-900 font-bold px-2 py-1 rounded-lg hover:bg-slate-200/60 transition flex items-center gap-1 cursor-pointer"
          title="Salin GeoJSON ke clipboard"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Disalin" : "Salin GeoJSON"}</span>
        </button>
      </div>

      {/* Tab 1: Mini Map Live Preview */}
      {activeTab === "map" && (
        <div className="p-3">
          <KmzMiniMapPreview
            geojson={parsedResult.geojson}
            color={color}
            bounds={parsedResult.summary.bounds}
            height={compact ? "200px" : "240px"}
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>💡 Sorot atau klik objek di peta untuk melihat nama dan atribut placemark</span>
            <span>WGS84 Lat/Lng</span>
          </div>
        </div>
      )}

      {/* Tab 2: Features / Placemark Cards */}
      {activeTab === "features" && (
        <div className="p-3 space-y-2">
          {/* Search Box */}
          {parsedResult.features.length > 3 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama fitur atau atribut..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-600"
              />
            </div>
          )}

          {/* Features List */}
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredFeatures.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada fitur yang cocok dengan pencarian "{searchQuery}"
              </div>
            ) : (
              filteredFeatures.map((feat, idx) => (
                <div
                  key={feat.id || idx}
                  onClick={() => setSelectedFeature(feat)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    selectedFeature?.id === feat.id
                      ? "border-rose-600 bg-rose-50/50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {feat.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span className="font-mono uppercase font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-[9px]">
                          {feat.geometryType}
                        </span>
                        {feat.areaHa ? (
                          <span className="font-bold text-emerald-700">
                            {feat.areaHa.toLocaleString("id-ID")} Ha
                          </span>
                        ) : null}
                        {feat.lengthKm ? (
                          <span className="font-bold text-blue-700">
                            {feat.lengthKm.toLocaleString("id-ID")} km
                          </span>
                        ) : null}
                        {feat.coordinatesCount ? (
                          <span>{feat.coordinatesCount} titik sudut</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Attributes Table */}
      {activeTab === "table" && (
        <div className="p-3">
          <div className="max-h-[220px] overflow-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Nama Objek</th>
                  <th className="py-2 px-3">Tipe</th>
                  <th className="py-2 px-3">Metrik Luas / Panjang</th>
                  <th className="py-2 px-3">Atribut Terdaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedResult.features.map((feat, idx) => (
                  <tr key={feat.id || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{feat.name}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold uppercase">
                        {feat.geometryType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {feat.areaHa
                        ? `${feat.areaHa.toLocaleString("id-ID")} Ha`
                        : feat.lengthKm
                        ? `${feat.lengthKm.toLocaleString("id-ID")} km`
                        : `${feat.coordinatesCount || 1} Titik`}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Object.entries(feat.properties || {}).slice(0, 3).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-mono"
                          >
                            <strong>{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Feature Detail Modal / Inspector */}
      {selectedFeature && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-rose-600" />
              <span>Detail Atribut: {selectedFeature.name}</span>
            </h5>
            <button
              type="button"
              onClick={() => setSelectedFeature(null)}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              Tutup ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px]">Tipe Geometri</span>
              <strong className="text-slate-800">{selectedFeature.geometryType}</strong>
            </div>
            {selectedFeature.areaHa ? (
              <div>
                <span className="text-slate-400 block text-[10px]">Estimasi Luas</span>
                <strong className="text-emerald-700">{selectedFeature.areaHa} Ha</strong>
              </div>
            ) : null}
            {selectedFeature.lengthKm ? (
              <div>
                <span className="text-slate-400 block text-[10px]">Estimasi Panjang</span>
                <strong className="text-blue-700">{selectedFeature.lengthKm} km</strong>
              </div>
            ) : null}
          </div>

          {/* Properties Grid */}
          {Object.keys(selectedFeature.properties || {}).length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">Daftar Data / Properti KML:</span>
              <div className="max-h-28 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-slate-200 font-mono text-[10px]">
                {Object.entries(selectedFeature.properties).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500">{k}:</span>
                    <strong className="text-slate-800 text-right">{String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
