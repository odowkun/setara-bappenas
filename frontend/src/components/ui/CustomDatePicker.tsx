"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react";
import SearchableSelect, { SearchableOption } from "./SearchableSelect";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES_ID = ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  minYear = 1945,
  maxYear = 2099,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 320 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse initial date or default to current date
  const parseValueDate = (valStr: string) => {
    if (!valStr) return new Date();
    const d = new Date(valStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const currentDate = parseValueDate(value);
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    const d = parseValueDate(value);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  }, [value]);

  // Handle position placement on click
  const handleOpenPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 330;
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16;
      }
      setPopoverPos({
        top: rect.bottom + window.scrollY + 6,
        left: left + window.scrollX,
        width: popoverWidth,
      });
    }
    setIsOpen(!isOpen);
  };

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate days matrix for calendar grid
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const startDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);

  const handleSelectDay = (dayNum: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(dayNum).padStart(2, "0");
    const dateString = `${viewYear}-${m}-${d}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const formatDisplayDate = (valStr: string) => {
    if (!valStr) return "Pilih Tanggal";
    const d = new Date(valStr);
    if (isNaN(d.getTime())) return "Pilih Tanggal";
    const day = String(d.getDate()).padStart(2, "0");
    const month = MONTH_NAMES_ID[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelected = (dayNum: number) => {
    if (!value) return false;
    const d = new Date(value);
    return (
      d.getDate() === dayNum &&
      d.getMonth() === viewMonth &&
      d.getFullYear() === viewYear
    );
  };

  // Generate Year Options without artificial limits
  const currentActualYear = new Date().getFullYear();
  const effectiveMinYear = Math.min(minYear, viewYear - 10, 1945);
  const effectiveMaxYear = Math.max(maxYear, viewYear + 25, 2099);

  const yearOptions: SearchableOption[] = [];
  for (let y = effectiveMaxYear; y >= effectiveMinYear; y--) {
    yearOptions.push({
      value: y,
      label: String(y),
      sublabel: y === currentActualYear ? "Tahun Ini" : undefined,
    });
  }

  return (
    <div className="relative font-sans" ref={triggerRef}>
      {label && <label className="text-[11px] font-bold text-slate-600 block mb-1">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenPopover}
        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 text-slate-900 text-xs font-extrabold flex items-center justify-between shadow-xs transition group focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <span className="flex items-center gap-2.5 font-mono text-xs">
          <CalendarIcon className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
          <span>{formatDisplayDate(value)}</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-700">▼</span>
      </button>

      {/* PORTAL CALENDAR POPOVER */}
      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop Click Off */}
          <div
            className="fixed inset-0 z-[999998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar Box */}
          <div
            style={{
              position: "absolute",
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              width: `${popoverPos.width}px`,
            }}
            className="z-[999999] rounded-3xl bg-white p-4 shadow-2xl border border-slate-200 space-y-3 font-sans animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header: Month & Year Selector */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-center shrink-0 cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-slate-900 text-xs shrink-0">
                  {MONTH_NAMES_ID[viewMonth]}
                </span>

                <div className="w-24 sm:w-28 shrink-0">
                  <SearchableSelect
                    options={yearOptions}
                    value={viewYear}
                    onChange={(val) => setViewYear(Number(val))}
                    placeholder="Tahun"
                    searchPlaceholder="Cari / ketik tahun..."
                    size="sm"
                    creatable={true}
                    createLabelPrefix="Tahun:"
                    className="w-full"
                    buttonClassName="font-black !py-1 !px-2 bg-slate-100 border-slate-200"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-center shrink-0 cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_NAMES_ID.map((d, i) => (
                <span
                  key={d}
                  className={`text-[10px] font-black uppercase ${
                    i === 0 ? "text-rose-500" : "text-slate-400"
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty padding cells for start day */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="w-9 h-9" />
              ))}

              {/* Month days */}
              {Array.from({ length: totalDays }).map((_, idx) => {
                const dayNum = idx + 1;
                const selected = isSelected(dayNum);
                const today = isToday(dayNum);

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`w-9 h-9 rounded-2xl text-xs font-extrabold flex items-center justify-center transition ${
                      selected
                        ? "bg-blue-700 text-white shadow-md shadow-blue-700/30 scale-105"
                        : today
                        ? "border-2 border-blue-600 text-blue-700 font-black bg-blue-50/50"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Quick Footer Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const m = String(today.getMonth() + 1).padStart(2, "0");
                  const d = String(today.getDate()).padStart(2, "0");
                  onChange(`${today.getFullYear()}-${m}-${d}`);
                  setIsOpen(false);
                }}
                className="text-[11px] font-black text-blue-700 hover:underline"
              >
                Set Hari Ini
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
