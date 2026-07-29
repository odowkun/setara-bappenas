"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { proyekService, ProyekDetail } from "@/services/proyekService";
import { AdminDocument } from "@/types/auth";
import SearchableSelect, { SearchableOption } from "@/components/ui/SearchableSelect";
import {
  Compass,
  Sliders,
  Play,
  Trash2,
  Edit,
  Eye,
  Download,
  Plus,
  Sparkles,
  Shield,
  Layers,
  Activity,
  Tag,
  MapPin,
  CheckCircle2,
  FileText,
  Building2,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, showDeleteConfirm, toast } from "@/lib/swal";

// Dynamic import for Leaflet map component (SSR safe)
const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[500px] rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">
        Memuat Studio Analisis Spasial GIS...
      </div>
    ),
  }
);

export interface SavedSpatialAnalysis {
  id: string;
  nama_analisis: string;
  dokumen_id?: string;
  dokumen_judul?: string;
  kategori: string;
  kategori_custom?: string;
  proyek_id: string;
  proyek_nama: string;
  kecamatan: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  warna_layer: string;
  catatan?: string;
  buffer_geojson: any;
  created_at: string;
  created_by: string;
}

const CATEGORY_OPTIONS: SearchableOption[] = [
  { value: "kesehatan", label: "🏥 Pelayanan Kesehatan (Puskesmas / RSUD / Pustu)" },
  { value: "pendidikan", label: "🏫 Zonasi Akses Pendidikan (SD / SMP / SMA)" },
  { value: "air_irigasi", label: "💧 Jangkauan Air Bersih & Irigasi Pertanian" },
  { value: "mitigasi_bencana", label: "🌋 Kawasan Rawan Bencana (Erupsi Dukono / Banjir)" },
  { value: "infrastruktur", label: "🛣️ Dampak Infrastruktur Jalan & Lingkungan" },
  { value: "kustom", label: "🏷️ Kategori Kustom (Ketik Kategori Sendiri)" },
];

const COLOR_OPTIONS = [
  { value: "#7c3aed", name: "Violet / Ungu", bg: "bg-purple-600" },
  { value: "#2563eb", name: "Biru Layanan", bg: "bg-blue-600" },
  { value: "#059669", name: "Hijau Lingkungan", bg: "bg-emerald-600" },
  { value: "#e11d48", name: "Merah Bahaya", bg: "bg-rose-600" },
  { value: "#d97706", name: "Kuning Perencanaan", bg: "bg-amber-600" },
];

// Helper to generate a real-time GeoJSON Circle Polygon for live map preview
function createGeoJsonCircle(lat: number, lng: number, radiusMeters: number, points = 64) {
  const km = radiusMeters / 1000;
  const ret: [number, number][] = [];
  const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([lng + x, lat + y]);
  }
  ret.push(ret[0]);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ret],
        },
        properties: {
          radius_meters: radiusMeters,
        },
      },
    ],
  };
}

const INITIAL_MOCK_GEOPROCESSING_ANALYSES: SavedSpatialAnalysis[] = [
  {
    id: "GEO-2026-001",
    nama_analisis: "Analisis Radius Layanan Puskesmas Pembantu Desa Tou",
    dokumen_id: "doc-1",
    dokumen_judul: "RPJMD Kabupaten Halmahera Utara Tahun 2026–2031",
    kategori: "kesehatan",
    proyek_id: "prj-1",
    proyek_nama: "Pembangunan Puskesmas Pembantu Desa Tou",
    kecamatan: "Kao Barat",
    latitude: 1.2584,
    longitude: 127.8923,
    radius_meters: 1500,
    warna_layer: "#2563eb",
    catatan: "Radius layanan 1.5 KM menjangkau 4 desa pesisir Kao Barat dengan perkiraan 3.400 jiwa penerima manfaat.",
    buffer_geojson: createGeoJsonCircle(1.2584, 127.8923, 1500),
    created_at: "24 Jul 2026, 14:30",
    created_by: "Dr. Jan W. N. Papilaya, M.Si",
  },
  {
    id: "GEO-2026-002",
    nama_analisis: "Zonasi Mitigasi Bahaya Erupsi Gunung Dukono & Pemukiman",
    dokumen_id: "doc-1",
    dokumen_judul: "RPJMD Kabupaten Halmahera Utara Tahun 2026–2031",
    kategori: "mitigasi_bencana",
    proyek_id: "prj-3",
    proyek_nama: "Pembangunan Pos Pengamatan & Evakuasi Bencana Galela",
    kecamatan: "Galela",
    latitude: 1.8378,
    longitude: 127.8189,
    radius_meters: 3000,
    warna_layer: "#e11d48",
    catatan: "Zona merah radius 3 KM dari kawah aktif Dukono. Semua fasilitas publik baru wajib di luar zona lingkaran merah ini.",
    buffer_geojson: createGeoJsonCircle(1.8378, 127.8189, 3000),
    created_at: "22 Jul 2026, 09:15",
    created_by: "Ir. Hendra Kusuma",
  },
  {
    id: "GEO-2026-003",
    nama_analisis: "Jangkauan Pipa Distribusi Air Bersih Tobelo Central",
    dokumen_id: "doc-2",
    dokumen_judul: "RKPD Kabupaten Halmahera Utara Tahun 2026",
    kategori: "air_irigasi",
    proyek_id: "prj-2",
    proyek_nama: "Rehabilitasi Drainase & Jaringan Air Perkotaan Tobelo",
    kecamatan: "Tobelo",
    latitude: 1.7289,
    longitude: 128.0054,
    radius_meters: 2500,
    warna_layer: "#059669",
    catatan: "Cakupan jaringan pipa utama PDAM Tobelo radius 2.5 KM untuk menjangkau Kelurahan Gamsungi dan Wosia.",
    buffer_geojson: createGeoJsonCircle(1.7289, 128.0054, 2500),
    created_at: "20 Jul 2026, 16:45",
    created_by: "Siti Rahmawati, S.STP",
  },
];

export default function GeoprocessingAnalisisPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("semua");
  const [projects, setProjects] = useState<ProyekDetail[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedSpatialAnalysis[]>([]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [namaAnalisis, setNamaAnalisis] = useState<string>("");
  const [kategori, setKategori] = useState<string>("kesehatan");
  const [kategoriCustom, setKategoriCustom] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [radiusMeters, setRadiusMeters] = useState<number>(1000);
  const [warnaLayer, setWarnaLayer] = useState<string>("#7c3aed");
  const [catatan, setCatatan] = useState<string>("");

  // Map Active View State
  const [activeBufferGeoJson, setActiveBufferGeoJson] = useState<any>(null);
  const [activeBufferColor, setActiveBufferColor] = useState<string>("#7c3aed");
  const [activeProjectLat, setActiveProjectLat] = useState<number>(1.7289);
  const [activeProjectLng, setActiveProjectLng] = useState<number>(128.0054);
  const [running, setRunning] = useState(false);

  // Load initial data (Documents + Projects + History)
  useEffect(() => {
    Promise.all([adminService.getDocuments(), proyekService.getProjects()]).then(
      ([docsData, projectsData]) => {
        setDocuments(docsData);
        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProjectId(String(projectsData[0].id));
          setActiveProjectLat(projectsData[0].latitude);
          setActiveProjectLng(projectsData[0].longitude);
        }
      }
    );

    // Load saved analyses from localStorage with fallback to INITIAL_MOCK_GEOPROCESSING_ANALYSES
    const localSaved = localStorage.getItem("halut_geoprocessing_history");
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAnalyses(parsed);
          setActiveProjectLat(parsed[0].latitude);
          setActiveProjectLng(parsed[0].longitude);
          setActiveBufferGeoJson(parsed[0].buffer_geojson);
          setActiveBufferColor(parsed[0].warna_layer);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved spatial analyses", e);
      }
    }

    // Seed default mock analyses if none exist
    setSavedAnalyses(INITIAL_MOCK_GEOPROCESSING_ANALYSES);
    localStorage.setItem("halut_geoprocessing_history", JSON.stringify(INITIAL_MOCK_GEOPROCESSING_ANALYSES));
    setActiveProjectLat(INITIAL_MOCK_GEOPROCESSING_ANALYSES[0].latitude);
    setActiveProjectLng(INITIAL_MOCK_GEOPROCESSING_ANALYSES[0].longitude);
    setActiveBufferGeoJson(INITIAL_MOCK_GEOPROCESSING_ANALYSES[0].buffer_geojson);
    setActiveBufferColor(INITIAL_MOCK_GEOPROCESSING_ANALYSES[0].warna_layer);
  }, []);

  // Filter projects by selected document
  const filteredProjects = useMemo(() => {
    if (!selectedDocId || selectedDocId === "semua") return projects;
    const matched = projects.filter(
      (p) => String(p.document_id || (p as any).dokumen_id || "") === String(selectedDocId)
    );
    return matched.length > 0 ? matched : projects;
  }, [projects, selectedDocId]);

  // Keep selectedProjectId valid when document changes
  useEffect(() => {
    if (filteredProjects.length > 0) {
      const exists = filteredProjects.some((p) => String(p.id) === String(selectedProjectId));
      if (!exists) {
        setSelectedProjectId(String(filteredProjects[0].id));
      }
    }
  }, [filteredProjects, selectedProjectId]);

  // Document options for SearchableSelect
  const docOptions: SearchableOption[] = [
    { value: "semua", label: "📁 Semua Dokumen Perencanaan Bappeda" },
    ...documents.map((d) => ({
      value: String(d.id),
      label: `📄 ${d.title}`,
      sublabel: `Jenis: ${d.jenis ? d.jenis.toUpperCase() : "DOKUMEN"} • Tahun: ${d.tahun || "2026"}`,
    })),
  ];

  // Project options for SearchableSelect
  const projectOptions: SearchableOption[] = filteredProjects.map((p) => ({
    value: String(p.id),
    label: `${p.nama_proyek}`,
    sublabel: `Kec. ${p.kecamatan || "Tobelo"} • Pagu: Rp ${(p.pagu_anggaran || 0).toLocaleString("id-ID")}`,
  }));

  // Selected project object
  const selectedProject = projects.find((p) => String(p.id) === String(selectedProjectId)) || filteredProjects[0];

  // Auto-generate live real-time GeoJSON Circle Buffer on Map as slider moves!
  useEffect(() => {
    if (selectedProject) {
      setActiveProjectLat(selectedProject.latitude);
      setActiveProjectLng(selectedProject.longitude);

      // Generate live buffer circle overlay
      const liveCircle = createGeoJsonCircle(
        selectedProject.latitude,
        selectedProject.longitude,
        radiusMeters
      );
      setActiveBufferGeoJson(liveCircle);
      setActiveBufferColor(warnaLayer);
    }
  }, [selectedProjectId, selectedProject, radiusMeters, warnaLayer]);

  // Save to localStorage helper
  const updateSavedAnalyses = (newList: SavedSpatialAnalysis[]) => {
    setSavedAnalyses(newList);
    localStorage.setItem("halut_geoprocessing_history", JSON.stringify(newList));
  };

  // Handle Form Submission (Create or Update)
  const handleSaveAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return toast.error("Pilih titik proyek terlebih dahulu!");
    if (!namaAnalisis.trim()) return toast.error("Isikan nama/label analisis spasial!");
    if (kategori === "kustom" && !kategoriCustom.trim()) {
      return toast.error("Tentukan label kategori kustom!");
    }

    setRunning(true);

    try {
      // Execute ESRI ArcGIS Buffer Calculation API
      const res = await proyekService.runBufferAnalysis(
        selectedProject.latitude,
        selectedProject.longitude,
        radiusMeters
      );

      const bufferGeoJson =
        res.success && res.data.buffer_geojson
          ? res.data.buffer_geojson
          : createGeoJsonCircle(selectedProject.latitude, selectedProject.longitude, radiusMeters);

      const selectedDocObj = documents.find((d) => String(d.id) === String(selectedDocId));
      const displayKategoriLabel =
        kategori === "kustom"
          ? kategoriCustom.trim()
          : CATEGORY_OPTIONS.find((c) => c.value === kategori)?.label || kategori;

      if (editingId) {
        // Update Existing Analysis
        const updatedList = savedAnalyses.map((item) =>
          item.id === editingId
            ? {
                ...item,
                nama_analisis: namaAnalisis.trim(),
                dokumen_id: selectedDocId,
                dokumen_judul: selectedDocObj ? selectedDocObj.title : "Dokumen Umum Bappeda",
                kategori,
                kategori_custom: kategoriCustom.trim(),
                proyek_id: String(selectedProject.id),
                proyek_nama: selectedProject.nama_proyek,
                kecamatan: selectedProject.kecamatan || "Tobelo",
                latitude: selectedProject.latitude,
                longitude: selectedProject.longitude,
                radius_meters: radiusMeters,
                warna_layer: warnaLayer,
                catatan: catatan.trim(),
                buffer_geojson: bufferGeoJson,
              }
            : item
        );
        updateSavedAnalyses(updatedList);
        toast.success("Analisis Spasial berhasil diperbarui!");
        showSuccessSwal(
          "Perubahan Disimpan!",
          `Parameter analisis "${namaAnalisis}" berhasil diperbarui dengan radius ${radiusMeters}m.`
        );
      } else {
        // Create New Analysis Record
        const newRecord: SavedSpatialAnalysis = {
          id: `GEO-${Date.now()}`,
          nama_analisis: namaAnalisis.trim(),
          dokumen_id: selectedDocId,
          dokumen_judul: selectedDocObj ? selectedDocObj.title : "Dokumen Perencanaan Bappeda",
          kategori,
          kategori_custom: kategoriCustom.trim(),
          proyek_id: String(selectedProject.id),
          proyek_nama: selectedProject.nama_proyek,
          kecamatan: selectedProject.kecamatan || "Tobelo",
          latitude: selectedProject.latitude,
          longitude: selectedProject.longitude,
          radius_meters: radiusMeters,
          warna_layer: warnaLayer,
          catatan: catatan.trim(),
          buffer_geojson: bufferGeoJson,
          created_at: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          created_by: user?.name || "Perencana Bappeda",
        };

        updateSavedAnalyses([newRecord, ...savedAnalyses]);
        toast.success("Analisis Spasial Baru Berhasil Disimpan!");
        showSuccessSwal(
          "Analisis Geoprocessing Berhasil!",
          `1. Radius ${radiusMeters}m dikalkulasi ESRI Engine & dirender di Peta.\n2. Label "${displayKategoriLabel}" berhasil ditautkan.\n3. Data tersimpan di Riwayat Analisis Bappeda.`
        );
      }

      resetForm();
    } catch (err) {
      toast.error("Gagal menjalankan analisis Geoprocessing Buffer.");
      showErrorSwal("Gagal Analisis", "Terjadi kesalahan saat memproses data spasial.");
    } finally {
      setRunning(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNamaAnalisis("");
    setKategori("kesehatan");
    setKategoriCustom("");
    setRadiusMeters(1000);
    setWarnaLayer("#7c3aed");
    setCatatan("");
  };

  const mapSectionRef = React.useRef<HTMLDivElement>(null);

  // Load Analysis onto Map + Smooth Scroll to Map
  const handleViewOnMap = (item: SavedSpatialAnalysis) => {
    setActiveProjectLat(item.latitude);
    setActiveProjectLng(item.longitude);
    setActiveBufferGeoJson(item.buffer_geojson);
    setActiveBufferColor(item.warna_layer);
    toast.success(`Menampilkan Poligon "${item.nama_analisis}" di Peta`);

    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Populate Edit Form + Smooth Scroll to Form/Map
  const handleEdit = (item: SavedSpatialAnalysis) => {
    setEditingId(item.id);
    setNamaAnalisis(item.nama_analisis);
    if (item.dokumen_id) setSelectedDocId(item.dokumen_id);
    setKategori(item.kategori);
    setKategoriCustom(item.kategori_custom || "");
    setSelectedProjectId(item.proyek_id);
    setRadiusMeters(item.radius_meters);
    setWarnaLayer(item.warna_layer);
    setCatatan(item.catatan || "");
    setActiveBufferGeoJson(item.buffer_geojson);
    setActiveBufferColor(item.warna_layer);
    toast.success(`Mode Edit: ${item.nama_analisis}`);

    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Delete Analysis with SweetAlert2
  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await showDeleteConfirm(name);

    if (isConfirmed) {
      const newList = savedAnalyses.filter((item) => item.id !== id);
      updateSavedAnalyses(newList);
      if (editingId === id) resetForm();
      toast.success("Analisis Spasial berhasil dihapus.");
    }
  };

  // Export GeoJSON File
  const handleExportGeoJSON = (item: SavedSpatialAnalysis) => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item.buffer_geojson, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `buffer-analysis-${item.id}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`GeoJSON ${item.id} berhasil diunduh!`);
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner Clean */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
            <Compass className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Studio Analisis Spasial & Geoprocessing Bappeda
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Kalkulasi radius dampak pembangunan, jangkauan pelayanan publik & zonasi mitigasi bencana di Halmahera Utara.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{savedAnalyses.length} Analisis Spasial Tersimpan</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Left Control Form (5 Cols) + Right Interactive Map (7 Cols) */}
      <div ref={mapSectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch scroll-mt-6">
        {/* Form Parameter Analisis (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {editingId ? "Edit Parameter Analisis Spasial" : "Input Parameter Analisis Spasial"}
                </h3>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveAnalysis} className="space-y-3 text-xs">
              {/* 1. Pilih Dokumen Perencanaan (RKPD / RPJMD) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  1. Pilih Dokumen Perencanaan (RKPD / RPJMD) *
                </label>
                <SearchableSelect
                  options={docOptions}
                  value={selectedDocId}
                  onChange={(val) => setSelectedDocId(String(val))}
                  placeholder="-- Pilih Dokumen Perencanaan Bappeda --"
                />
              </div>

              {/* 2. Target Proyek Pembangunan Fisik */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Target Proyek Pembangunan Fisik *
                </label>
                <SearchableSelect
                  options={projectOptions}
                  value={selectedProjectId}
                  onChange={(val) => setSelectedProjectId(String(val))}
                  placeholder="-- Pilih Proyek Pembangunan Fisik --"
                />
              </div>

              {/* 3. Label / Nama Analisis */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Nama / Label Analisis Spasial *
                </label>
                <input
                  type="text"
                  required
                  value={namaAnalisis}
                  onChange={(e) => setNamaAnalisis(e.target.value)}
                  placeholder="Contoh: Radius Layanan Puskesmas Pembantu Luari"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* 4. Kategori Dampak Spasial */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  4. Kategori Analisis Spasial *
                </label>
                <SearchableSelect
                  options={CATEGORY_OPTIONS}
                  value={kategori}
                  onChange={(val) => setKategori(String(val))}
                  placeholder="-- Pilih Kategori Dampak --"
                />
              </div>

              {/* Conditional Custom Category Input */}
              {kategori === "kustom" && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 animate-fadeIn">
                  <label className="font-bold text-amber-900 block text-[11px]">
                    Ketik Label Kategori Kustom Sendiri *
                  </label>
                  <input
                    type="text"
                    required
                    value={kategoriCustom}
                    onChange={(e) => setKategoriCustom(e.target.value)}
                    placeholder="Contoh: Kawasan Strategis Pariwisata Pasir Putih"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              )}

              {/* 5. Parameter Radius Dampak (Slider + Preset) */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Radius Jangkauan Buffer:</span>
                  <span className="text-purple-700 font-black text-xs px-2.5 py-0.5 rounded-lg bg-purple-100 border border-purple-200">
                    {radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`}
                  </span>
                </div>

                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-700"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>100m</span>
                  <span>1km</span>
                  <span>5km</span>
                  <span>10km</span>
                </div>

                {/* Preset Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500">Preset:</span>
                  {[500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRadiusMeters(preset)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition cursor-pointer ${
                        radiusMeters === preset
                          ? "bg-purple-700 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {preset >= 1000 ? `${preset / 1000}km` : `${preset}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Color Palette Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Warna Poligon Overlay Peta
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setWarnaLayer(c.value)}
                      className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                        warnaLayer === c.value
                          ? "border-purple-600 bg-purple-50 shadow-sm"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shadow-xs`}></span>
                      <span className="text-[9px] font-bold text-slate-600 truncate w-full text-center">
                        {c.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Catatan Analyst Bappeda */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan / Rekomendasi Spasial Bappeda (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan analisis teknis jangkauan wilayah..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none"
                />
              </div>

              {/* Submit Actions */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={running}
                  className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-black text-xs shadow-md shadow-purple-700/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 text-amber-300" />
                  <span>
                    {running
                      ? "Mengolah Poligon ESRI..."
                      : editingId
                      ? "Simpan Perubahan Analisis Spasial"
                      : "Jalankan & Simpan Analisis Spasial Baru"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Map Viewer (7 Cols) - Height matches left card perfectly */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-full space-y-3">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Preview Studio Poligon Spasial (ESRI Layer)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Overlay Poligon Buffer Real-Time ({radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`})
                </p>
              </div>

              {activeBufferGeoJson && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-extrabold px-3 py-1 rounded-full text-white shadow-sm flex items-center gap-1.5 shrink-0"
                    style={{ backgroundColor: activeBufferColor }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>POLIGON REAL-TIME ACTIVE</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveBufferGeoJson(null)}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer shrink-0"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Map Container fitting full height of card */}
            <div className="flex-1 min-h-[460px] lg:min-h-[580px] mt-3 rounded-2xl overflow-hidden border border-slate-200 relative">
              <GeotaggingMapPicker
                selectedLat={activeProjectLat}
                selectedLng={activeProjectLng}
                existingProjects={projects}
                bufferGeoJson={activeBufferGeoJson}
                bufferColor={activeBufferColor}
                readOnly={true}
              />
            </div>
          </div>

          {/* Bottom Card Summary Footer */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Target: <strong>{selectedProject?.nama_proyek || "Proyek Halut"}</strong> (Lat {activeProjectLat.toFixed(4)}, Lng {activeProjectLng.toFixed(4)})
              </span>
            </div>
            <span className="text-[10px] font-mono text-purple-800 font-bold bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
              Radius: {radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`}
            </span>
          </div>
        </div>
      </div>

      {/* Riwayat & Data Tabel Analisis Spasial Tersimpan (CRUD History Table) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Daftar Riwayat Analisis Spasial Tersimpan</span>
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Daftar hasil analisis geoprocessing jangkauan dampak yang telah disimpan oleh perencana Bappeda.
            </p>
          </div>
        </div>

        {savedAnalyses.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center font-bold">
              🌐
            </div>
            <div className="text-sm font-bold text-slate-800">Belum Ada Riwayat Analisis Spasial</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Gunakan panel parameter di atas untuk membuat dan menyimpan kalkulasi radius dampak geoprocessing pertama Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Nama & Label Analisis</th>
                  <th className="py-3 px-4">Dokumen Perencanaan</th>
                  <th className="py-3 px-4">Kategori Spasial</th>
                  <th className="py-3 px-4">Proyek Target & Lokasi</th>
                  <th className="py-3 px-4">Radius Dampak</th>
                  <th className="py-3 px-4">Waktu & Pembuat</th>
                  <th className="py-3 px-4 text-center">Aksi MONEV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {savedAnalyses.map((item) => {
                  const displayCat =
                    item.kategori === "kustom"
                      ? item.kategori_custom
                      : CATEGORY_OPTIONS.find((c) => c.value === item.kategori)?.label || item.kategori;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: item.warna_layer }}
                          ></span>
                          <span>{item.nama_analisis}</span>
                        </div>
                        {item.catatan && (
                          <div className="text-[11px] font-normal text-slate-500 italic mt-0.5">
                            "{item.catatan}"
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.dokumen_judul || "Dokumen RKPD/RPJMD"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200 max-w-[180px] truncate"
                          title={displayCat}
                        >
                          {displayCat}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.proyek_nama}</div>
                        <div className="text-[11px] text-slate-500">Kec. {item.kecamatan}</div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-purple-700">
                        {item.radius_meters >= 1000
                          ? `${(item.radius_meters / 1000).toFixed(1)} km`
                          : `${item.radius_meters} m`}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div>{item.created_at}</div>
                        <div className="font-bold text-slate-700">{item.created_by}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewOnMap(item)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                            title="Tampilkan di Peta Overlay"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition cursor-pointer"
                            title="Edit Parameter Analisis"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportGeoJSON(item)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                            title="Unduh File GeoJSON"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.nama_analisis)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Hapus Analisis Spasial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
