"use client";

import React from "react";
import { PenTool, Square, Slash, MapPin, Trash2, CheckCircle2, Info } from "lucide-react";
import { calculatePolygonAreaHa, calculateLineLengthKm } from "@/lib/gis/kmzParser";

export interface DelineationData {
  geojson: any;
  tipeGeometri: "point" | "polygon" | "polyline";
  luasAreaHa: number;
  panjangKm: number;
}

interface DelineationMapDrawerProps {
  activeTool: "polygon" | "polyline" | "point" | null;
  onToolChange: (tool: "polygon" | "polyline" | "point" | null) => void;
  delineationResult: DelineationData | null;
  onReset: () => void;
  className?: string;
}

export const DelineationMapDrawer: React.FC<DelineationMapDrawerProps> = ({
  activeTool,
  onToolChange,
  delineationResult,
  onReset,
  className = "",
}) => {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm font-sans ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Studio Delineasi Spasial</h4>
            <p className="text-[11px] text-slate-500">Pilih mode lalu klik titik-titik pada peta di samping</p>
          </div>
        </div>

        {delineationResult && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Delineasi</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onToolChange(activeTool === "polygon" ? null : "polygon")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeTool === "polygon"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Poligon Lahan</span>
        </button>

        <button
          type="button"
          onClick={() => onToolChange(activeTool === "polyline" ? null : "polyline")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeTool === "polyline"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Slash className="w-3.5 h-3.5" />
          <span>Koridor Line</span>
        </button>

        <button
          type="button"
          onClick={() => onToolChange(activeTool === "point" ? null : "point")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeTool === "point"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Titik Pin</span>
        </button>
      </div>

      {activeTool && (
        <div className="mt-3 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center space-x-2 animate-in fade-in duration-200">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {activeTool === "polygon" && "Mode Poligon Aktif: Klik beberapa titik pada peta untuk membentuk area tapak lahan."}
            {activeTool === "polyline" && "Mode Koridor Line Aktif: Klik beberapa titik pada peta untuk menghubungkan jalur infrastruktur."}
            {activeTool === "point" && "Mode Titik Pin Aktif: Klik pada titik peta tempat proyek berada."}
          </span>
        </div>
      )}

      {delineationResult && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950">
          <div className="font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Delineasi Spasial Aktif</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
            <div>Geometri: <strong className="capitalize text-slate-900">{delineationResult.tipeGeometri}</strong></div>
            {delineationResult.luasAreaHa > 0 && (
              <div>Luas Tapak: <strong className="text-emerald-700">{delineationResult.luasAreaHa} Ha</strong></div>
            )}
            {delineationResult.panjangKm > 0 && (
              <div>Panjang Koridor: <strong className="text-blue-700">{delineationResult.panjangKm} Km</strong></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DelineationMapDrawer;
