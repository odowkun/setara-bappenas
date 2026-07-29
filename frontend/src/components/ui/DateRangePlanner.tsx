"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, Check, AlertTriangle } from "lucide-react";
import { CustomDatePicker } from "./CustomDatePicker";

interface DateRangePlannerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string, yearDisplay: string) => void;
}

export const DateRangePlanner: React.FC<DateRangePlannerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [start, setStart] = useState(startDate || "2026-01-01");
  const [end, setEnd] = useState(endDate || "2026-12-31");
  const [activePreset, setActivePreset] = useState<string>("renja");
  const [validationError, setValidationError] = useState<string | null>(null);

  const sanitizeAndClampDate = (dateVal: string): string => {
    if (!dateVal) return "2026-01-01";
    
    const parts = dateVal.split("-");
    if (parts.length === 3) {
      let [yearStr, monthStr, dayStr] = parts;
      
      if (yearStr.length > 4) {
        yearStr = "2099";
      }

      let yearNum = parseInt(yearStr, 10);
      if (isNaN(yearNum)) yearNum = 2026;

      if (yearNum < 2000) yearStr = "2000";
      if (yearNum > 2099) yearStr = "2099";

      return `${yearStr}-${monthStr.padStart(2, "0")}-${dayStr.padStart(2, "0")}`;
    }

    return dateVal;
  };

  useEffect(() => {
    const cleanStart = sanitizeAndClampDate(start);
    const cleanEnd = sanitizeAndClampDate(end);

    if (cleanStart !== start) setStart(cleanStart);
    if (cleanEnd !== end) setEnd(cleanEnd);

    const d1 = new Date(cleanStart);
    const d2 = new Date(cleanEnd);

    if (d1 > d2) {
      setValidationError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai!");
    } else {
      setValidationError(null);
    }

    const yearStart = d1.getFullYear();
    const yearEnd = d2.getFullYear();

    let yearStr = String(yearStart);
    if (yearStart !== yearEnd) {
      yearStr = `${yearStart}–${yearEnd}`;
    }

    onChange(cleanStart, cleanEnd, yearStr);
  }, [start, end]);

  const handlePresetSelect = (preset: string) => {
    setActivePreset(preset);
    const currentYear = new Date().getFullYear();

    if (preset === "renja") {
      setStart(`${currentYear}-01-01`);
      setEnd(`${currentYear}-12-31`);
    } else if (preset === "rpjmd") {
      setStart(`${currentYear}-01-01`);
      setEnd(`${currentYear + 5}-12-31`);
    } else if (preset === "rpjpd") {
      setStart(`${currentYear}-01-01`);
      setEnd(`${currentYear + 20}-12-31`);
    }
  };

  const getDurationText = () => {
    if (!start || !end) return "";
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (d1 > d2) return "Rentang Tidak Valid";

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = (diffDays / 365.25).toFixed(1);

    if (parseFloat(years) >= 1) {
      return `${years.replace(".0", "")} Tahun (~${diffDays} Hari)`;
    }
    return `${diffDays} Hari`;
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/90 border border-slate-200 shadow-sm space-y-5 font-sans">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>Periode Tanggal Perencanaan Lengkap</span>
              <span className="text-amber-500 font-normal">*</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Tentukan jadwal pelaksanaan & jangka waktu dokumen kebijakan daerah
            </p>
          </div>
        </div>

        {/* Duration Live Counter Badge */}
        <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
          <Clock className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="text-slate-600 font-semibold">Durasi:</span>
          <span className="font-extrabold text-blue-900 font-mono">{getDurationText()}</span>
        </div>
      </div>

      {/* Validation Warning Alert */}
      {validationError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Quick Preset Pills Row */}
      <div className="space-y-2">
        <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
          Pilih Template Periode Cepat:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePresetSelect("renja")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activePreset === "renja"
                ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {activePreset === "renja" && <Check className="w-3.5 h-3.5 text-white" />}
            <span>Renja / RKPD (1 Tahun)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("rpjmd")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activePreset === "rpjmd"
                ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {activePreset === "rpjmd" && <Check className="w-3.5 h-3.5 text-white" />}
            <span>RPJMD (5 Tahun)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("rpjpd")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activePreset === "rpjpd"
                ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {activePreset === "rpjpd" && <Check className="w-3.5 h-3.5 text-white" />}
            <span>RPJPD (20 Tahun)</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePreset("custom")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activePreset === "custom"
                ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {activePreset === "custom" && <Check className="w-3.5 h-3.5 text-white" />}
            <span>Kustom Tanggal</span>
          </button>
        </div>
      </div>

      {/* Custom Interactive React DatePicker Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Start Date Custom Picker */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Tanggal Mulai Perencanaan:</span>
            </span>
          </div>

          <CustomDatePicker
            value={start}
            onChange={(val) => {
              setStart(val);
              setActivePreset("custom");
            }}
            minYear={2020}
            maxYear={2035}
          />
        </div>

        {/* End Date Custom Picker */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Tanggal Selesai Perencanaan:</span>
            </span>
          </div>

          <CustomDatePicker
            value={end}
            onChange={(val) => {
              setEnd(val);
              setActivePreset("custom");
            }}
            minYear={2020}
            maxYear={2035}
          />
        </div>
      </div>
    </div>
  );
};
