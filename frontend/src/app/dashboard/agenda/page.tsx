"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListFilter,
  X,
  ExternalLink,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";
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

export default function AdminAgendaPage() {
  const [agendas, setAgendas] = useState<AgendaEvent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeModalEvent, setActiveModalEvent] = useState<AgendaEvent | null>(null);

  useEffect(() => {
    Promise.all([
      officialContentService.getAgendas(true),
      officialContentService.getAgendaCategories(),
    ])
      .then(([agendaRows, categoryRows]) => {
        setAgendas(agendaRows);
        setCategories(categoryRows.map((item) => item.name));
      })
      .catch((error) => {
        console.error("Data agenda resmi tidak dapat dimuat:", error);
        setAgendas([]);
        setCategories([]);
      });
  }, []);

  const handleDelete = async (id: string) => {
    const target = agendas.find((item) => item.id === id);
    const res = await showDeleteConfirm(target ? target.title : "agenda kegiatan");
    if (res.isConfirmed) {
      try {
        await officialContentService.deleteAgenda(id);
        setAgendas((current) => current.filter((item) => item.id !== id));
        if (activeModalEvent?.id === id) {
          setActiveModalEvent(null);
        }
        toast.success("Agenda kegiatan berhasil dihapus dari database!");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Agenda gagal dihapus.");
      }
    }
  };

  const handleTogglePublication = async (item: AgendaEvent) => {
    try {
      const updated = await officialContentService.updateAgendaPublication(
        item.id,
        !item.isPublished
      );
      setAgendas((current) => current.map((row) => row.id === item.id ? updated : row));
      toast.success(updated.isPublished
        ? "Agenda berhasil diterbitkan."
        : "Agenda ditarik menjadi draf.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status publikasi gagal diperbarui.");
    }
  };

  const filteredAgendas = agendas.filter((item) => {
    const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const allDynamicCategories = Array.from(
    new Set([...categories, ...agendas.map((a) => a.category)])
  );

  // Compute fixed vertical track map for perfect alignment across cells
  const eventTracksMap = assignEventTracks(filteredAgendas);

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

    return filteredAgendas.filter((e) => {
      const s = e.startDate || e.date || "";
      const ed = e.endDate || s;
      return formattedDate >= s && formattedDate <= ed;
    });
  };

  // Pagination Math for Table View
  const totalPages = Math.ceil(filteredAgendas.length / itemsPerPage) || 1;
  const paginated = filteredAgendas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* ADMIN HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>MANAJEMEN AGENDA &amp; KALENDER KEGIATAN</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Agenda Kerja BAPPEDA</h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola jadwal Musrenbang, rapat koordinasi, dan peninjauan lapangan daerah.
          </p>
        </div>

        <Link
          href="/dashboard/agenda/tambah"
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Agenda Baru</span>
        </Link>
      </div>

      {/* APPLE CALENDAR TOOLBAR CONTROL BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* MONTH NAVIGATION */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-700 transition"
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
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-700 transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {MONTHS_NAME[month]} {year}
            </h2>
          </div>

          {/* SEARCH & VIEW MODE SWITCHER */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari agenda, lokasi..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
              />
            </div>

            {/* SWITCHER BUTTONS */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 font-black text-xs">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                  viewMode === "calendar"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tampilan Kalender</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Tabel Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC CATEGORIES FILTER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl font-black transition whitespace-nowrap shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua Kategori ({agendas.length})
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
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* APPLE CALENDAR GRID VIEW */}
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
                  className={`min-h-[125px] p-2 transition-all flex flex-col justify-between group hover:bg-blue-50/30 ${
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

                    {/* QUICK ADD BUTTON ON HOVER */}
                    <Link
                      href={`/dashboard/agenda/tambah?date=${year}-${String(month + 1).padStart(
                        2,
                        "0"
                      )}-${String(dayNum).padStart(2, "0")}`}
                      className="p-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition opacity-0 group-hover:opacity-100"
                      title="Tambah Agenda Tanggal Ini"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Link>
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
                        // SINGLE DAY DISCRETE PILL
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setActiveModalEvent(ev)}
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
                          onClick={() => setActiveModalEvent(ev)}
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
        /* TABLE VIEW */
        <div className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-4 px-6">Rentang Tanggal &amp; Waktu</th>
                  <th className="py-4 px-6">Judul Agenda</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6">Lokasi / Tempat</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      Tidak ada agenda kegiatan ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const currentStatus = computeAgendaStatus(item.startDate || item.date || "", item.endDate);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-900">
                          <div>
                            {formatAgendaDateRange(item.startDate || item.date || "", item.endDate)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {item.startTime} - {item.endTime} WIT
                          </div>
                        </td>

                        <td className="py-4 px-6 font-extrabold text-slate-900 max-w-xs">
                          {item.title}
                          <div className="text-[10px] text-slate-400 font-medium line-clamp-1">
                            {item.organizer}
                          </div>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-100">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-4 px-6 max-w-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{item.location}</span>
                            {(item.mapUrl || item.coordinates) && (
                              <a
                                href={item.mapUrl || `https://www.google.com/maps?q=${encodeURIComponent(item.coordinates || item.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-black transition inline-flex items-center gap-1 shrink-0"
                                title="Buka lokasi di Google Maps"
                              >
                                <span>Peta</span>
                                <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              currentStatus === "Berlangsung"
                                ? "bg-emerald-100 text-emerald-800"
                                : currentStatus === "Mendatang"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                            >
                              {currentStatus}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              item.isPublished
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}>
                              {item.isPublished ? "Tayang" : "Draf"}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePublication(item)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black transition cursor-pointer ${
                                item.isPublished
                                  ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.isPublished ? "Jadikan Draf" : "Terbitkan"}
                            </button>
                            <Link
                              href={`/dashboard/agenda/edit/${item.id}`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition"
                              title="Edit Agenda"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                              title="Hapus Agenda"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION BAR FOR TABLE */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-600">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTOR MODAL FOR CLICKED ITEM */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative">
            <button
              type="button"
              onClick={() => setActiveModalEvent(null)}
              className="absolute top-6 right-6 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase">
                  {activeModalEvent.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                  {computeAgendaStatus(activeModalEvent.startDate || activeModalEvent.date || "", activeModalEvent.endDate)}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {activeModalEvent.title}
              </h2>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Tanggal Pelaksanaan:{" "}
                  <strong className="text-slate-900">
                    {formatAgendaDateRange(
                      activeModalEvent.startDate || activeModalEvent.date || "",
                      activeModalEvent.endDate
                    )}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Waktu: <strong className="text-slate-900">{activeModalEvent.startTime} - {activeModalEvent.endTime} WIT</strong></span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Lokasi: <strong className="text-slate-900">{activeModalEvent.location}</strong></span>
                </div>
                {(activeModalEvent.mapUrl || activeModalEvent.coordinates) && (
                  <a
                    href={activeModalEvent.mapUrl || `https://www.google.com/maps?q=${encodeURIComponent(activeModalEvent.coordinates || activeModalEvent.location)}`}
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
                <span>Organizer: <strong className="text-slate-900">{activeModalEvent.organizer}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDelete(activeModalEvent.id)}
                className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Agenda</span>
              </button>

              <Link
                href={`/dashboard/agenda/edit/${activeModalEvent.id}`}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-600/20"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Agenda</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
