"use client";

import React, { useState } from "react";
import { parseKmzOrKmlFile, ParsedKmzResult } from "@/lib/gis/kmzParser";
import { Upload, FileCode2, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/lib/swal";
import KmzFeaturePreview from "./KmzFeaturePreview";

interface KmzUploaderProps {
  onKmzParsed: (result: ParsedKmzResult, color: string) => void;
  onClear?: () => void;
  className?: string;
  hideHeader?: boolean;
}

const PRESET_COLORS = [
  { hex: "#7c3aed", label: "Violet RTRW" },
  { hex: "#2563eb", label: "Biru Infrastruktur" },
  { hex: "#059669", label: "Hijau Lingkungan" },
  { hex: "#e11d48", label: "Merah Rawan Bencana" },
  { hex: "#d97706", label: "Kuning Perencanaan" },
];

export const KmzUploader: React.FC<KmzUploaderProps> = ({
  onKmzParsed,
  onClear,
  className = "",
  hideHeader = false,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedKmzResult | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#7c3aed");
  const [showFullPreview, setShowFullPreview] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["kmz", "kml", "geojson", "json"].includes(ext || "")) {
      toast.error("Format file harus berupa .kmz, .kml, atau .geojson");
      return;
    }

    try {
      setIsParsing(true);
      const result = await parseKmzOrKmlFile(file);
      setParsedData(result);
      onKmzParsed(result, selectedColor);
      toast.success(`Berhasil mengimpor ${result.summary.totalFeatures} objek spasial dari file ${file.name}`);
    } catch (err: any) {
      console.error("KMZ parse error:", err);
      toast.error(err.message || "Gagal mengurai file spasial");
    } finally {
      setIsParsing(false);
    }
  };

  const handleColorChange = (colorHex: string) => {
    setSelectedColor(colorHex);
    if (parsedData) {
      onKmzParsed(parsedData, colorHex);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setShowFullPreview(false);
    if (onClear) onClear();
  };

  return (
    <div className={hideHeader ? `w-full font-sans ${className}` : `rounded-2xl border border-slate-200 bg-white p-5 shadow-sm font-sans ${className}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Import File Spasial (.KMZ / .KML / .GeoJSON)</h4>
              <p className="text-xs text-slate-500">Unggah peta rencana RTRW, delineasi lahan, atau koridor proyek</p>
            </div>
          </div>
          {parsedData && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Layer</span>
            </button>
          )}
        </div>
      )}

      {hideHeader && parsedData && (
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setShowFullPreview((prev) => !prev)}
            className="text-xs font-bold text-purple-700 hover:bg-purple-50 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showFullPreview ? "Sembunyikan Isian KMZ" : "Lihat Isian & Placemark KMZ"}</span>
            {showFullPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Layer</span>
          </button>
        </div>
      )}

      {!parsedData ? (
        <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-xl bg-purple-50/40 hover:bg-purple-50 cursor-pointer transition-all">
          <input
            type="file"
            accept=".kmz,.kml,.geojson,.json"
            onChange={handleFileChange}
            disabled={isParsing}
            className="hidden"
          />
          {isParsing ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="text-xs font-bold text-purple-700">Mengurai Struktur Spasial KMZ...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 py-1 text-center">
              <div className="p-3 bg-white shadow-sm rounded-full text-purple-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700">Pilih file .KMZ / .KML / .GeoJSON dari Komputer</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Mendukung format Google Earth, Ina-Geoportal & ArcGIS Pro</p>
              </div>
            </div>
          )}
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-purple-950">File Terurai: {parsedData.fileName}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 pt-1">
                  <div>• Total Objek: <strong className="text-slate-800">{parsedData.summary.totalFeatures}</strong></div>
                  <div>• Poligon Tapak: <strong className="text-slate-800">{parsedData.summary.polygonsCount}</strong></div>
                  <div>• Koridor/Jalur: <strong className="text-slate-800">{parsedData.summary.polylinesCount}</strong></div>
                  <div>• Titik Acuan: <strong className="text-slate-800">{parsedData.summary.pointsCount}</strong></div>
                  {parsedData.summary.totalAreaHa > 0 && (
                    <div className="col-span-2 text-purple-700 font-medium">
                      • Estimasi Total Luas Area: <strong>{parsedData.summary.totalAreaHa} Ha</strong>
                    </div>
                  )}
                  {parsedData.summary.totalLengthKm > 0 && (
                    <div className="col-span-2 text-blue-700 font-medium">
                      • Estimasi Total Panjang Koridor: <strong>{parsedData.summary.totalLengthKm} Km</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFullPreview((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showFullPreview ? "Tutup Preview" : "Preview Isian KMZ"}</span>
            </button>
          </div>

          {/* Full Content Preview Drawer */}
          {showFullPreview && (
            <KmzFeaturePreview
              parsedResult={parsedData}
              color={selectedColor}
              compact={hideHeader}
              onClear={handleReset}
            />
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Skema Warna Layer Spasial Peta</span>
            </label>
            <div className="flex items-center space-x-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleColorChange(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedColor === c.hex
                      ? "border-slate-800 scale-110 shadow-md"
                      : "border-white hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                title="Pilih Warna Custom"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KmzUploader;

