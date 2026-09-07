export interface AgendaEvent {
  id: string;
  categoryId?: number;
  title: string;
  category: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  status: "Mendatang" | "Berlangsung" | "Selesai";
  description: string;
  color?: string;       // Optional custom color badge palette ID
  mapUrl?: string;      // Optional Google Maps link or OpenStreetMap URL
  coordinates?: string; // Optional Latitude, Longitude (e.g., "1.7285, 128.0051")
  date?: string;        // fallback
  isPublished?: boolean;
}

export const AGENDA_COLOR_PALETTES = [
  {
    id: "blue",
    name: "Biru Musrenbang",
    bg: "bg-blue-100/90 text-blue-950 border-blue-300",
    activeBg: "bg-blue-600 text-white border-blue-700 shadow-md font-black z-30",
    text: "text-blue-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-blue-600",
    border: "border-blue-300",
    swatch: "bg-blue-600",
  },
  {
    id: "emerald",
    name: "Hijau Emerald",
    bg: "bg-emerald-100/90 text-emerald-950 border-emerald-300",
    activeBg: "bg-emerald-600 text-white border-emerald-700 shadow-md font-black z-30",
    text: "text-emerald-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-emerald-600",
    border: "border-emerald-300",
    swatch: "bg-emerald-600",
  },
  {
    id: "amber",
    name: "Kuning Amber",
    bg: "bg-amber-100/90 text-amber-950 border-amber-300",
    activeBg: "bg-amber-500 text-white border-amber-600 shadow-md font-black z-30",
    text: "text-amber-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-amber-500",
    border: "border-amber-300",
    swatch: "bg-amber-500",
  },
  {
    id: "purple",
    name: "Ungu Bimtek",
    bg: "bg-purple-100/90 text-purple-950 border-purple-300",
    activeBg: "bg-purple-600 text-white border-purple-700 shadow-md font-black z-30",
    text: "text-purple-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-purple-600",
    border: "border-purple-300",
    swatch: "bg-purple-600",
  },
  {
    id: "rose",
    name: "Merah Evaluasi",
    bg: "bg-rose-100/90 text-rose-950 border-rose-300",
    activeBg: "bg-rose-600 text-white border-rose-700 shadow-md font-black z-30",
    text: "text-rose-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-rose-600",
    border: "border-rose-300",
    swatch: "bg-rose-600",
  },
  {
    id: "teal",
    name: "Teal Cyan",
    bg: "bg-teal-100/90 text-teal-950 border-teal-300",
    activeBg: "bg-teal-600 text-white border-teal-700 shadow-md font-black z-30",
    text: "text-teal-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-teal-600",
    border: "border-teal-300",
    swatch: "bg-teal-600",
  },
  {
    id: "orange",
    name: "Oranye Jingga",
    bg: "bg-orange-100/90 text-orange-950 border-orange-300",
    activeBg: "bg-orange-600 text-white border-orange-700 shadow-md font-black z-30",
    text: "text-orange-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-orange-600",
    border: "border-orange-300",
    swatch: "bg-orange-600",
  },
  {
    id: "indigo",
    name: "Indigo Persis",
    bg: "bg-indigo-100/90 text-indigo-950 border-indigo-300",
    activeBg: "bg-indigo-600 text-white border-indigo-700 shadow-md font-black z-30",
    text: "text-indigo-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-indigo-600",
    border: "border-indigo-300",
    swatch: "bg-indigo-600",
  },
];

export function computeAgendaStatus(
  startDate: string,
  endDate?: string,
  referenceDateStr: string = new Date().toISOString().slice(0, 10)
): "Mendatang" | "Berlangsung" | "Selesai" {
  const s = startDate || "";
  const e = endDate || s;
  const ref = referenceDateStr || new Date().toISOString().slice(0, 10);

  if (e < ref) {
    return "Selesai";
  }
  if (ref >= s && ref <= e) {
    return "Berlangsung";
  }
  return "Mendatang";
}

const categoryColors: Record<
  string,
  { bg: string; activeBg: string; text: string; activeText: string; dot: string; border: string }
> = {
  Musrenbang: {
    bg: "bg-blue-100/90 text-blue-950 border-blue-300",
    activeBg: "bg-blue-600 text-white border-blue-700 shadow-md font-black z-30",
    text: "text-blue-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-blue-600",
    border: "border-blue-300",
  },
  "Rapat Koordinasi": {
    bg: "bg-amber-100/90 text-amber-950 border-amber-300",
    activeBg: "bg-amber-500 text-white border-amber-600 shadow-md font-black z-30",
    text: "text-amber-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-amber-500",
    border: "border-amber-300",
  },
  "Peninjauan Lapangan": {
    bg: "bg-emerald-100/90 text-emerald-950 border-emerald-300",
    activeBg: "bg-emerald-600 text-white border-emerald-700 shadow-md font-black z-30",
    text: "text-emerald-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-emerald-600",
    border: "border-emerald-300",
  },
  "Bimtek & Pelatihan": {
    bg: "bg-purple-100/90 text-purple-950 border-purple-300",
    activeBg: "bg-purple-600 text-white border-purple-700 shadow-md font-black z-30",
    text: "text-purple-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-purple-600",
    border: "border-purple-300",
  },
  Evaluasi: {
    bg: "bg-rose-100/90 text-rose-950 border-rose-300",
    activeBg: "bg-rose-600 text-white border-rose-700 shadow-md font-black z-30",
    text: "text-rose-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-rose-600",
    border: "border-rose-300",
  },
};

export const getCategoryStyle = (cat: string, customColorId?: string) => {
  if (customColorId) {
    const foundPalette = AGENDA_COLOR_PALETTES.find((p) => p.id === customColorId);
    if (foundPalette) return foundPalette;
  }

  if (categoryColors[cat]) return categoryColors[cat];
  return {
    bg: "bg-indigo-100/90 text-indigo-950 border-indigo-300",
    activeBg: "bg-indigo-600 text-white border-indigo-700 shadow-md font-black z-30",
    text: "text-indigo-950 font-bold",
    activeText: "text-white font-black",
    dot: "bg-indigo-600",
    border: "border-indigo-300",
  };
};

export const formatAgendaDateRange = (startDate: string, endDate?: string) => {
  if (!endDate || startDate === endDate) {
    return startDate;
  }
  return `${startDate} s/d ${endDate}`;
};

/**
 * Assigns fixed vertical track index (0, 1, 2...) for each event across dates
 * so multi-day events stay perfectly aligned on the same horizontal row/track across date cells.
 */
export function assignEventTracks(events: AgendaEvent[]): Map<string, number> {
  const sorted = [...events].sort((a, b) => {
    const sA = a.startDate || a.date || "";
    const sB = b.startDate || b.date || "";
    if (sA !== sB) return sA.localeCompare(sB);
    const eA = a.endDate || sA;
    const eB = b.endDate || sB;
    return eB.localeCompare(eA); // longer duration first
  });

  const eventTracks = new Map<string, number>();
  const dateUsedTracks = new Map<string, Set<number>>();

  sorted.forEach((ev) => {
    const sDate = ev.startDate || ev.date || "";
    const eDate = ev.endDate || sDate;

    // Build dates array
    const dates: string[] = [];
    let cur = new Date(sDate);
    const end = new Date(eDate);

    while (cur <= end) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, "0");
      const day = String(cur.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      cur.setDate(cur.getDate() + 1);
    }

    // Find the smallest trackIndex unused by all dates in this event's range
    let trackIndex = 0;
    while (true) {
      let isAvailable = true;
      for (const d of dates) {
        const used = dateUsedTracks.get(d);
        if (used && used.has(trackIndex)) {
          isAvailable = false;
          break;
        }
      }
      if (isAvailable) break;
      trackIndex++;
    }

    // Mark trackIndex as used for all dates
    dates.forEach((d) => {
      if (!dateUsedTracks.has(d)) {
        dateUsedTracks.set(d, new Set<number>());
      }
      dateUsedTracks.get(d)!.add(trackIndex);
    });

    eventTracks.set(ev.id, trackIndex);
  });

  return eventTracks;
}
