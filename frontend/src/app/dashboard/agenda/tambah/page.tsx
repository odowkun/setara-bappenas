"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  CheckCircle2,
  Palette,
  Building2,
  MapPin,
  ExternalLink,
  Navigation,
} from "lucide-react";
import {
  AGENDA_COLOR_PALETTES,
  computeAgendaStatus,
  formatAgendaDateRange,
} from "@/types/agenda";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  officialContentService,
  type TaxonomyItem,
} from "@/services/officialContentService";

export default function TambahAgendaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [title, setTitle] = useState("");
  const [categoryItems, setCategoryItems] = useState<TaxonomyItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);

  // ORGANIZERS FROM STRUCTURE DATA
  const [organizersList, setOrganizersList] = useState<string[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("");
  const [customOrganizer, setCustomOrganizer] = useState<string>("");
  const [isCustomOrganizer, setIsCustomOrganizer] = useState<boolean>(false);

  // CHECKBOX FOR MULTI-DAY EVENT
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);

  const todayValue = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(dateParam || todayValue);
  const [endDate, setEndDate] = useState<string>(dateParam || todayValue);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  // LOCATION & OPTIONAL SINGLE MAP INPUT (URL OR LAT,LNG)
  const [location, setLocation] = useState("");
  const [mapInput, setMapInput] = useState("");

  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("blue");

  useEffect(() => {
    Promise.all([
      officialContentService.getAgendaCategories(),
      officialContentService.getOrganizers(),
    ])
      .then(([categoryRows, organizerRows]) => {
        setCategoryItems(categoryRows);
        setCategories(categoryRows.map((item) => item.name));
        setSelectedCategory((current) => current || categoryRows[0]?.name || "");
        setOrganizersList(organizerRows);
        setSelectedOrganizer((current) => current || organizerRows[0] || "");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Master data gagal dimuat."));
  }, []);

  const finalEndDate = isMultiDay ? endDate : startDate;
  const computedStatus = computeAgendaStatus(startDate, finalEndDate);

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__NEW_CUSTOM__") {
      setIsCustomCategory(true);
      setCustomCategory("");
    } else {
      setIsCustomCategory(false);
      setSelectedCategory(val);
      if (val === "Musrenbang") setSelectedColor("blue");
      else if (val === "Rapat Koordinasi") setSelectedColor("amber");
      else if (val === "Peninjauan Lapangan") setSelectedColor("emerald");
      else if (val === "Bimtek & Pelatihan") setSelectedColor("purple");
      else if (val === "Evaluasi") setSelectedColor("rose");
    }
  };

  const handleOrganizerSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__NEW_CUSTOM_ORG__") {
      setIsCustomOrganizer(true);
      setCustomOrganizer("");
    } else {
      setIsCustomOrganizer(false);
      setSelectedOrganizer(val);
    }
  };

  // Compute test link for Google Maps
  const getTestMapUrl = () => {
    const trimmed = mapInput.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`;
  };

  const handleSave = async (publish: boolean) => {
    const finalCategory = isCustomCategory ? customCategory.trim() : selectedCategory;
    const finalOrganizer = isCustomOrganizer ? customOrganizer.trim() : selectedOrganizer;

    if (!title || !location) {
      toast.error("Silakan isi Judul Agenda dan Lokasi Pelaksanaan!");
      return;
    }

    if (isCustomCategory && !finalCategory) {
      toast.error("Silakan tuliskan nama Kategori Kegiatan Baru!");
      return;
    }

    if (isCustomOrganizer && !finalOrganizer) {
      toast.error("Silakan tuliskan nama Penyelenggara / SKPD!");
      return;
    }

    if (isMultiDay && finalEndDate < startDate) {
      toast.error("Tanggal Selesai tidak boleh lebih awal dari Tanggal Mulai!");
      return;
    }

    // Process mapInput (Optional single field for Google Maps URL or Lat,Lng)
    const trimmedMap = mapInput.trim();
    let finalMapUrl: string | undefined = undefined;
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (trimmedMap) {
      if (trimmedMap.startsWith("http://") || trimmedMap.startsWith("https://")) {
        finalMapUrl = trimmedMap;
      } else {
        const coordinates = trimmedMap.split(",").map(Number);
        if (coordinates.length !== 2 || coordinates.some(Number.isNaN)) {
          toast.error("Koordinat harus berformat latitude, longitude.");
          return;
        }
        [latitude, longitude] = coordinates;
        finalMapUrl = `https://www.google.com/maps?q=${encodeURIComponent(trimmedMap)}`;
      }
    }

    try {
      let category = categoryItems.find((item) => item.name === finalCategory);
      if (!category && isCustomCategory) {
        category = await officialContentService.createAgendaCategory(finalCategory, selectedColor);
      }
      if (!category) {
        toast.error("Kategori agenda resmi belum dipilih.");
        return;
      }

      await officialContentService.createAgenda({
        agenda_category_id: category.id,
        title,
        start_at: `${startDate}T${startTime}:00`,
        end_at: `${finalEndDate}T${endTime}:00`,
        location,
        organizer: finalOrganizer,
        description,
        color: selectedColor,
        map_url: finalMapUrl,
        latitude,
        longitude,
        is_published: publish,
      });
      toast.success(publish
        ? "Agenda tersimpan dan diterbitkan."
        : "Agenda tersimpan sebagai draf.");
      router.push("/dashboard/agenda");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Agenda gagal disimpan.");
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/agenda"
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs shrink-0"
            title="Kembali ke Agenda"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Tambah Agenda Kerja Baru</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Jadwalkan kegiatan Musrenbang, rapat koordinasi, atau peninjauan lapangan daerah.
            </p>
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <form onSubmit={(event) => event.preventDefault()} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              Judul Kegiatan / Agenda *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Evaluasi Realisasi Fisik Triwulan II"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              Kategori Kegiatan *
            </label>
            {!isCustomCategory ? (
              <SearchableSelect
                options={[
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                  { value: "__NEW_CUSTOM__", label: "+ Buat Kategori Baru..." },
                ]}
                value={selectedCategory}
                onChange={(val) => {
                  if (val === "__NEW_CUSTOM__") {
                    setIsCustomCategory(true);
                    setCustomCategory("");
                  } else {
                    setSelectedCategory(String(val));
                  }
                }}
                placeholder="-- Pilih Kategori Kegiatan --"
                searchPlaceholder="Cari kategori kegiatan..."
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ketikkan nama kategori baru..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-blue-50/50 border border-blue-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold transition"
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          {/* PENYELENGGARA / SKPD PENANGGUNG JAWAB SELECTOR FROM STRUKTUR */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Penyelenggara / SKPD Penanggung Jawab *</span>
            </label>
            {!isCustomOrganizer ? (
              <SearchableSelect
                options={[
                  ...organizersList.map((org) => ({ value: org, label: org })),
                  { value: "__NEW_CUSTOM_ORG__", label: "+ Lainnya / Tulis Manual..." },
                ]}
                value={selectedOrganizer}
                onChange={(val) => {
                  if (val === "__NEW_CUSTOM_ORG__") {
                    setIsCustomOrganizer(true);
                    setCustomOrganizer("");
                  } else {
                    setSelectedOrganizer(String(val));
                  }
                }}
                placeholder="-- Pilih SKPD Penanggung Jawab --"
                searchPlaceholder="Cari nama SKPD / Bidang..."
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  value={customOrganizer}
                  onChange={(e) => setCustomOrganizer(e.target.value)}
                  placeholder="Tuliskan nama SKPD / Penyelenggara..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-blue-50/50 border border-blue-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomOrganizer(false)}
                  className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold transition"
                >
                  Pilih dari Struktur
                </button>
              </div>
            )}
          </div>

          {/* CUSTOM BADGE COLOR SELECTOR */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-700">
              <Palette className="w-4 h-4 text-blue-600" />
              <span>Pilih Warna Badge Agenda (Bebas)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {AGENDA_COLOR_PALETTES.map((palette) => {
                const isSelected = selectedColor === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setSelectedColor(palette.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-extrabold transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs scale-105"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${palette.swatch} border border-white shadow-2xs`} />
                    <span>{palette.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOKASI PELAKSANAAN & SINGLE OPTIONAL MAP INPUT */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Lokasi Pelaksanaan (Nama Tempat / Gedung) *</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Aula Utama Kantor BAPPEDA Kab. Halmahera Utara"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-black uppercase text-slate-700">
                  Link Google Maps ATAU Koordinat Peta (Opsional)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMapInput("1.7285, 128.0051");
                    if (!location) setLocation("Aula Utama Kantor BAPPEDA Kab. Halmahera Utara");
                  }}
                  className="px-3 py-1 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  title="Gunakan Titik Koordinat Kantor BAPPEDA Halut"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Titik BAPPEDA Halut</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={mapInput}
                  onChange={(e) => setMapInput(e.target.value)}
                  placeholder="Contoh: https://maps.google.com/?q=... ATAU 1.7285, 128.0051"
                  className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
                {getTestMapUrl() && (
                  <a
                    href={getTestMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <span>Uji Peta</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Bisa diisi link Google Maps / OSM, atau angka koordinat Latitude, Longitude.
              </p>
            </div>
          </div>

          {/* CHECKBOX DURATION TOGGLE */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isMultiDay}
                onChange={(e) => {
                  setIsMultiDay(e.target.checked);
                  if (!e.target.checked) {
                    setEndDate(startDate);
                  }
                }}
                className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Kegiatan berlangsung lebih dari 1 hari (Multi-hari)
              </span>
            </label>

            {/* DATE PICKERS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <CustomDatePicker
                  label={isMultiDay ? "Tanggal Mulai *" : "Tanggal Pelaksanaan *"}
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    if (!isMultiDay || endDate < val) {
                      setEndDate(val);
                    }
                  }}
                />
              </div>

              {isMultiDay && (
                <div>
                  <CustomDatePicker
                    label="Tanggal Selesai *"
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                  />
                </div>
              )}
            </div>

            {/* DURATION RANGE PREVIEW - ONLY SHOWN FOR MULTI-DAY EVENTS */}
            {isMultiDay && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs font-bold text-blue-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Jadwal Pelaksanaan:{" "}
                  <strong className="text-blue-950 font-black">
                    {formatAgendaDateRange(startDate, endDate)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* AUTOMATIC STATUS PREVIEW */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700">
                Status Agenda (Otomatis Terkalkulasi)
              </label>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Status ditentukan secara otomatis berdasarkan tanggal pelaksanaan.
              </p>
            </div>
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-black border shrink-0 ${
                computedStatus === "Berlangsung"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : computedStatus === "Mendatang"
                  ? "bg-blue-100 text-blue-800 border-blue-300"
                  : "bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              {computedStatus}
            </span>
          </div>

          {/* TIME RANGE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                Jam Mulai (WIT) *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                Jam Selesai (WIT) *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              Deskripsi &amp; Poin Utama Agenda
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan gambaran singkat mengenai tujuan dan peserta agenda..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
            />
          </div>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/dashboard/agenda"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition"
          >
            Batal
          </Link>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-black text-xs flex items-center gap-2 border border-slate-300 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terbitkan Agenda</span>
          </button>
        </div>
      </form>
    </div>
  );
}
