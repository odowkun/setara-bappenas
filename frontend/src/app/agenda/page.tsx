"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Search,
  Filter,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  X,
  FileText,
  Share2,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import {
  AgendaEvent,
  getCategoryStyle,
  formatAgendaDateRange,
  assignEventTracks,
  computeAgendaStatus,
} from "@/types/agenda";
import { officialContentService } from "@/services/officialContentService";

const DAYS_NAME = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS_NAME = [
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

export default function AgendaPage() {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    Promise.all([
      officialContentService.getAgendas(),
      officialContentService.getAgendaCategories(),
    ])
      .then(([agendaRows, categoryRows]) => {
        setEvents(agendaRows);
        setCategories(categoryRows.map((item) => item.name));
      })
      .catch((error) => {
        console.error("Data agenda resmi tidak dapat dimuat:", error);
        setEvents([]);
        setCategories([]);
      });
  }, []);

  const filteredEvents = events.filter((item) => {
    const matchCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const allDynamicCategories = Array.from(
    new Set([...categories, ...events.map((a) => a.category)])
  );

  // Compute fixed vertical track map for perfect alignment
  const eventTracksMap = assignEventTracks(filteredEvents);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevMonthTrailingDays = Array.from(
    { length: startDayOfWeek },
    (_, i) => prevMonthDays - startDayOfWeek + i + 1
  );

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalGridCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
  const nextMonthLeadingDays = Array.from(
    { length: totalGridCells - (startDayOfWeek + daysInMonth) },
    (_, i) => i + 1
  );

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const isToday = (dayNum: number) => {
    const now = new Date();
    return dayNum === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  const getEventsForDate = (dayNum: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      dayNum
    ).padStart(2, "0")}`;

    return filteredEvents.filter((e) => {
      const s = e.startDate || e.date || "";
      const ed = e.endDate || s;
      return formattedDate >= s && formattedDate <= ed;
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-10">
        {/* HERO TITLE BANNER & BREADCRUMB (DISESUAIKAN DENGAN HALAMAN LAINNYA) */}
        <div className="py-2 space-y-4 text-center flex flex-col items-center justify-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">Media &amp; Agenda</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-700 font-extrabold">Agenda Kerja</span>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>AGENDA KERJA &amp; KALENDER KEGIATAN REGIONAL</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Agenda &amp; Jadwal Kegiatan BAPPEDA Halmahera Utara
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Pantau jadwal pelaksanaan Musrenbang, rapat koordinasi perencanaan, peninjauan lapangan proyek strategis, dan forum konsultasi publik daerah.
            </p>
          </div>
        </div>

        {/* APPLE CALENDAR TOOLBAR CONTROL BAR */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* MONTH NAVIGATION */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={today}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {MONTHS_NAME[month]} {year}
              </h2>
            </div>

            {/* SEARCH & VIEW SWITCHER */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari kata kunci agenda..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-2xs shrink-0 font-black text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                    viewMode === "calendar"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kalender</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Daftar Agenda</span>
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC CATEGORY FILTER PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl font-black transition whitespace-nowrap shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Semua Kategori ({events.length})
            </button>

            {allDynamicCategories.map((cat) => {
              const style = getCategoryStyle(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* APPLE CALENDAR MAIN VIEW */}
        {viewMode === "calendar" ? (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            {/* WEEKDAY HEADERS */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
              {DAYS_NAME.map((d, i) => (
                <div
                  key={d}
                  className={`py-3 text-xs font-black tracking-wider uppercase ${
                    i >= 5 ? "text-rose-600" : "text-slate-700"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* MONTH GRID CELLS */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 text-slate-800">
              {/* TRAILING PREVIOUS MONTH DAYS */}
              {prevMonthTrailingDays.map((d) => (
                <div
                  key={`prev-${d}`}
                  className="min-h-[125px] p-2 bg-slate-50/50 text-slate-300 pointer-events-none"
                >
                  <span className="w-7 h-7 text-xs font-bold flex items-center justify-center">{d}</span>
                </div>
              ))}

              {/* CURRENT MONTH DAYS */}
              {currentMonthDays.map((dayNum, dayIdx) => {
                const dayEvents = getEventsForDate(dayNum);
                const currentToday = isToday(dayNum);
                const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                  dayNum
                ).padStart(2, "0")}`;

                const colIndex = (startDayOfWeek + dayIdx) % 7; // 0 = Mon, 6 = Sun

                // Calculate max track index for this cell to build fixed height slots
                let maxTrack = -1;
                dayEvents.forEach((ev) => {
                  const tr = eventTracksMap.get(ev.id) ?? 0;
                  if (tr > maxTrack) maxTrack = tr;
                });

                const slotsArray: (AgendaEvent | null)[] = Array.from(
                  { length: maxTrack + 1 },
                  () => null
                );
                dayEvents.forEach((ev) => {
                  const tr = eventTracksMap.get(ev.id) ?? 0;
                  slotsArray[tr] = ev;
                });

                return (
                  <div
                    key={`curr-${dayNum}`}
                    className={`min-h-[125px] p-2 transition-all flex flex-col justify-between group hover:bg-blue-50/20 ${
                      currentToday
                        ? "bg-blue-50/40 ring-1 ring-blue-500/30 ring-inset"
                        : "bg-white"
                    }`}
                  >
                    {/* FIXED 28px HEIGHT DATE BADGE FOR PERFECT VERTICAL ALIGNMENT */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition ${
                          currentToday
                            ? "bg-red-600 text-white shadow-xs"
                            : "text-slate-800"
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {/* APPLE CALENDAR EVENT BANNERS & SLOTS */}
                    <div className="space-y-1.5 my-1 flex-1">
                      {slotsArray.map((ev, trackIdx) => {
                        if (!ev) {
                          // Empty slot placeholder to keep vertical alignment across cells
                          return <div key={`empty-${trackIdx}`} className="h-6" />;
                        }

                        const style = getCategoryStyle(ev.category, ev.color);
                        const sDate = ev.startDate || ev.date || "";
                        const eDate = ev.endDate || sDate;
                        const isMultiDay = eDate > sDate;
                        const isHovered = hoveredEventId === ev.id;

                        const bgStyleClass = isHovered ? style.activeBg : style.bg;
                        const textStyleClass = isHovered ? style.activeText : style.text;
                        const dotStyleClass = isHovered ? "bg-white" : style.dot;

                        if (!isMultiDay) {
                          // SINGLE DAY EVENT PILL
                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              onMouseEnter={() => setHoveredEventId(ev.id)}
                              onMouseLeave={() => setHoveredEventId(null)}
                              className={`h-6 px-2 rounded-full border text-[11px] cursor-pointer transition-all shadow-2xs hover:scale-[1.02] flex items-center gap-1.5 ${bgStyleClass}`}
                              title={ev.title}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyleClass}`} />
                              <span className={`truncate ${textStyleClass}`}>{ev.title}</span>
                            </div>
                          );
                        }

                        // APPLE CALENDAR CONTINUOUS MULTI-DAY SPANNING BANNER
                        const isStartDay = formattedDate === sDate;
                        const isEndDay = formattedDate === eDate;
                        const isMiddleDay = formattedDate > sDate && formattedDate < eDate;
                        const isWeekStart = colIndex === 0;

                        let bannerShape = `h-6 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border-y relative ${
                          isHovered ? "z-30 scale-y-105" : "z-10"
                        } `;

                        if (isStartDay) {
                          bannerShape += `rounded-l-full rounded-r-none -mr-2.5 pr-2 pl-2 border-l shadow-2xs ${bgStyleClass}`;
                        } else if (isEndDay) {
                          bannerShape += `rounded-r-full rounded-l-none -ml-2.5 pl-2 pr-2 border-r shadow-2xs ${bgStyleClass}`;
                        } else {
                          // middle day - stretch continuously edge-to-edge
                          bannerShape += `rounded-none -mx-2.5 px-2 border-x-0 ${bgStyleClass}`;
                        }

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            onMouseEnter={() => setHoveredEventId(ev.id)}
                            onMouseLeave={() => setHoveredEventId(null)}
                            className={bannerShape}
                            title={`${ev.title} (${formatAgendaDateRange(sDate, eDate)})`}
                          >
                            {/* DOT IS ONLY RENDERED AT THE VERY START OF THE BANNER OR AT THE START OF A NEW WEEK */}
                            {(isStartDay || (isMiddleDay && isWeekStart)) && (
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyleClass}`} />
                            )}
                            
                            {isStartDay && (
                              <span className={`truncate ${textStyleClass}`}>
                                {ev.title}
                              </span>
                            )}

                            {isMiddleDay && (
                              <span className={`truncate text-[10px] ${isWeekStart || isHovered ? textStyleClass : "opacity-80 font-medium"}`}>
                                {isWeekStart ? `↳ ${ev.title}` : ev.title}
                              </span>
                            )}

                            {isEndDay && (
                              <span className={`truncate text-[10px] ${textStyleClass}`}>
                                {isStartDay ? ev.title : `Selesai (${ev.endTime || "15:00"})`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* LEADING NEXT MONTH DAYS */}
              {nextMonthLeadingDays.map((d) => (
                <div
                  key={`next-${d}`}
                  className="min-h-[125px] p-2 bg-slate-50/50 text-slate-300 pointer-events-none"
                >
                  <span className="w-7 h-7 text-xs font-bold flex items-center justify-center">{d}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* LIST TIMELINE VIEW */
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-400 font-bold">
                Tidak ada agenda kegiatan ditemukan sesuai pencarian.
              </div>
            ) : (
              filteredEvents.map((item) => {
                const style = getCategoryStyle(item.category, item.color);
                const currentStatus = computeAgendaStatus(item.startDate || item.date || "", item.endDate);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvent(item)}
                    className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-500/50 transition cursor-pointer shadow-xs hover:shadow-md space-y-4 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${style.bg} ${style.text} ${style.border}`}>
                          {item.category}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            currentStatus === "Berlangsung"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : currentStatus === "Mendatang"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </div>

                      <div className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{formatAgendaDateRange(item.startDate || item.date || "", item.endDate)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.startTime} - {item.endTime} WIT</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.location}</span>
                        {(item.mapUrl || item.coordinates) && (
                          <a
                            href={item.mapUrl || `https://www.google.com/maps?q=${encodeURIComponent(item.coordinates || item.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-black transition inline-flex items-center gap-1"
                            title="Buka lokasi di Google Maps"
                          >
                            <span>Peta</span>
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.organizer}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* APPLE INSPECTOR MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase">
                  {selectedEvent.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                  {computeAgendaStatus(selectedEvent.startDate || selectedEvent.date || "", selectedEvent.endDate)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {selectedEvent.title}
              </h2>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Pelaksanaan:{" "}
                  <strong className="text-slate-900">
                    {formatAgendaDateRange(
                      selectedEvent.startDate || selectedEvent.date || "",
                      selectedEvent.endDate
                    )}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Waktu: <strong className="text-slate-900">{selectedEvent.startTime} - {selectedEvent.endTime} WIT</strong></span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Lokasi: <strong className="text-slate-900">{selectedEvent.location}</strong></span>
                </div>
                {(selectedEvent.mapUrl || selectedEvent.coordinates) && (
                  <a
                    href={selectedEvent.mapUrl || `https://www.google.com/maps?q=${encodeURIComponent(selectedEvent.coordinates || selectedEvent.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-black transition flex items-center gap-1 shrink-0"
                  >
                    <span>Buka Peta</span>
                    <ExternalLink className="w-3 h-3 text-emerald-700" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Organizer: <strong className="text-slate-900">{selectedEvent.organizer}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Deskripsi Agenda</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {selectedEvent.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
