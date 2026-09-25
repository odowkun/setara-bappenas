"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Shield,
  Save,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sparkles,
  HelpCircle,
  Upload,
  FileCode,
  Layers,
  Trash2,
  Plus,
  CheckCircle2,
  FileCheck,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, showDeleteConfirm, showConfirm, toast } from "@/lib/swal";
import KmzUploader from "@/components/gis/KmzUploader";
import KmzFeaturePreview from "@/components/gis/KmzFeaturePreview";
import { parseKmzOrKmlFile, ParsedKmzResult } from "@/lib/gis/kmzParser";
import { geoSettingService, GeoSettingData, SpatialLayerItem } from "@/services/geoSettingService";

const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false }
);

const KmzMiniMapPreview = dynamic(
  () => import("@/components/gis/KmzMiniMapPreview"),
  { ssr: false }
);

export default function RtrwBatasSettingPage() {
  const [activeTab, setActiveTab] = useState<"master" | "styling">("master");
  const [saving, setSaving] = useState(false);

  // GeoSettings & Custom Boundary state from Database
  const [geoSetting, setGeoSetting] = useState<GeoSettingData | null>(null);
  const [loadingSetting, setLoadingSetting] = useState(true);
  const [boundaryUploading, setBoundaryUploading] = useState(false);
  const [stagedKmzResult, setStagedKmzResult] = useState<ParsedKmzResult | null>(null);
  const [stagedKmzColor, setStagedKmzColor] = useState<string>("#ef4444");

  // Form State for Uploading New Secondary Spatial Boundary (Kecamatan/RTRW)
  const [newLayerType, setNewLayerType] = useState<"kabupaten" | "kecamatan" | "rtrw">("kecamatan");
  const [newLayerName, setNewLayerName] = useState("");
  const [newLegalBasis, setNewLegalBasis] = useState("");
  const [newLayerColor, setNewLayerColor] = useState("#0284c7");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingLayer, setSubmittingLayer] = useState(false);
  const [isParsingNewLayer, setIsParsingNewLayer] = useState(false);
  const [newLayerParsedResult, setNewLayerParsedResult] = useState<ParsedKmzResult | null>(null);
  const [inspectingLayer, setInspectingLayer] = useState<SpatialLayerItem | null>(null);

  // Styling Tab Controls
  const [showKabBoundary, setShowKabBoundary] = useState(true);
  const [boundaryColor, setBoundaryColor] = useState("#ef4444");
  const [dashPattern, setDashPattern] = useState<"dashed" | "solid" | "dotted">("dashed");
  const [showDistrictBoundary, setShowDistrictBoundary] = useState(true);
  const [showRtrwZones, setShowRtrwZones] = useState(true);

  // Active Spatial Layers Master List (Dynamically synced with database)
  const [layersList, setLayersList] = useState<SpatialLayerItem[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(false);

  // Load geo-settings on mount
  const loadGeoSettings = async () => {
    try {
      setLoadingSetting(true);
      const data = await geoSettingService.getSettings();
      setGeoSetting(data);
      if (data.custom_boundary_color) {
        setBoundaryColor(data.custom_boundary_color);
      }
    } catch (err) {
      console.error("Gagal memuat geo settings:", err);
    } finally {
      setLoadingSetting(false);
    }
  };

  // Load secondary spatial layers from database
  const loadSpatialLayers = async () => {
    try {
      setLoadingLayers(true);
      const layers = await geoSettingService.getSpatialLayers();
      setLayersList(layers);
    } catch (err) {
      console.error("Gagal memuat layer spasial:", err);
    } finally {
      setLoadingLayers(false);
    }
  };

  useEffect(() => {
    loadGeoSettings();
    loadSpatialLayers();
  }, []);

  // Compute active boundary GeoJSON: Priority 1. Staged KMZ, 2. Database custom GeoJSON, 3. null (fallback to BPS halut-boundary.json)
  const activeBoundaryGeoJson = useMemo(() => {
    if (stagedKmzResult?.geojson) {
      return stagedKmzResult.geojson;
    }
    if (geoSetting?.custom_boundary_geojson) {
      try {
        return typeof geoSetting.custom_boundary_geojson === "string"
          ? JSON.parse(geoSetting.custom_boundary_geojson)
          : geoSetting.custom_boundary_geojson;
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [stagedKmzResult, geoSetting]);

  // Handle file parsed from KmzUploader
  const handleKmzParsed = (result: ParsedKmzResult, color: string) => {
    setStagedKmzResult(result);
    setStagedKmzColor(color);
    setBoundaryColor(color);
    toast.success(`File "${result.fileName}" berhasil diurai (${result.summary.totalFeatures} fitur). Siap disinkronkan ke database.`);
  };

  const handleClearStagedKmz = () => {
    setStagedKmzResult(null);
  };

  // Save uploaded KMZ boundary to database via API
  const handleSaveCustomBoundary = async () => {
    if (!stagedKmzResult) {
      showErrorSwal("File Belum Dipilih", "Silakan unggah dan pilih file KMZ/KML terlebih dahulu.");
      return;
    }

    try {
      setBoundaryUploading(true);
      const res = await geoSettingService.uploadCustomBoundary({
        file_name: stagedKmzResult.fileName,
        geojson: stagedKmzResult.geojson,
        features_count: stagedKmzResult.summary.totalFeatures,
        area_ha: stagedKmzResult.summary.totalAreaHa,
        length_km: stagedKmzResult.summary.totalLengthKm,
        color: stagedKmzColor,
      });

      if (res.success && res.data) {
        setGeoSetting(res.data);
        setStagedKmzResult(null);
        toast.success("Batas wilayah Halmahera Utara berhasil disinkronkan ke database!");
        showSuccessSwal(
          "Sinkronisasi Berhasil!",
          `Garis batas wilayah Kabupaten Halmahera Utara kini resmi menggunakan file "${res.data.custom_boundary_name}". Seluruh peta WebGIS akan menggunakan batas baru ini.`
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan batas wilayah.");
      showErrorSwal("Gagal Menyimpan", err.message || "Terjadi kesalahan sistem saat menyimpan ke database.");
    } finally {
      setBoundaryUploading(false);
    }
  };

  // Reset custom boundary back to default official BPS boundary
  const handleResetToDefault = async () => {
    const confirm = await showConfirm({
      title: "Reset Batas Wilayah ke Default BPS?",
      text: "Garis batas kustom akan dihapus dari server dan sistem akan otomatis kembali menggunakan garis batas resmi bawaan BPS (Permendagri No. 137 Tahun 2017).",
      confirmButtonText: "Ya, Kembalikan ke BPS",
      cancelButtonText: "Batal",
      icon: "warning",
    });

    if (!confirm.isConfirmed) return;

    try {
      setBoundaryUploading(true);
      const res = await geoSettingService.resetCustomBoundary();
      if (res.success && res.data) {
        setGeoSetting(res.data);
        setStagedKmzResult(null);
        setBoundaryColor("#ef4444");
        toast.success("Batas wilayah berhasil di-reset ke standar resmi BPS.");
        showSuccessSwal(
          "Berhasil Di-Reset!",
          "Garis batas wilayah Halmahera Utara telah dikembalikan ke standar resmi BPS (Permendagri No. 137)."
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mereset batas wilayah.");
      showErrorSwal("Gagal Reset", err.message || "Terjadi kesalahan saat mereset ke database.");
    } finally {
      setBoundaryUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        showErrorSwal("Ukuran File Terlalu Besar", "Maksimal ukuran file GeoJSON/KMZ adalah 15MB.");
        return;
      }
      setSelectedFile(file);

      // Parse spatial content immediately
      try {
        setIsParsingNewLayer(true);
        const parsed = await parseKmzOrKmlFile(file);
        setNewLayerParsedResult(parsed);

        // Auto-fill Layer Name if empty
        if (!newLayerName.trim()) {
          const rawName = file.name.replace(/\.[^/.]+$/, "");
          const cleanName = rawName
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          setNewLayerName(cleanName);
        }

        toast.success(
          `File "${file.name}" berhasil diurai (${parsed.summary.totalFeatures} objek spasial). Preview isian siap ditampilkan!`
        );
      } catch (err: any) {
        console.error("Gagal mengurai file spasial:", err);
        toast.error(err.message || "Gagal mengurai file spasial.");
        showErrorSwal("Gagal Membaca File Spasial", err.message || "File KMZ/KML/GeoJSON tidak dapat diurai.");
        setNewLayerParsedResult(null);
      } finally {
        setIsParsingNewLayer(false);
      }
    }
  };

  const handleAddLayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) {
      showErrorSwal("Input Kurang Lengkap", "Silakan isi nama layer data spasial.");
      return;
    }

    try {
      setSubmittingLayer(true);
      const res = await geoSettingService.createSpatialLayer({
        name: newLayerName.trim(),
        type: newLayerType,
        legal_basis: newLegalBasis.trim() || "SK Bupati Halut 2026",
        feature_count: newLayerParsedResult?.summary.totalFeatures || 1,
        color: newLayerColor,
        visible: true,
        file_name: newLayerParsedResult?.fileName || selectedFile?.name || undefined,
        geojson: newLayerParsedResult?.geojson || undefined,
      });

      setLayersList((prev) => [res.data, ...prev]);
      setNewLayerName("");
      setNewLegalBasis("");
      setSelectedFile(null);
      setNewLayerParsedResult(null);

      toast.success("Master layer spasial berhasil ditambahkan ke database!");
      showSuccessSwal(
        "Layer Berhasil Ditambahkan!",
        `Master data "${res.data.name}" (${res.data.feature_count || 1} objek spasial) telah disimpan ke database spasial Bappeda.`
      );
    } catch (err: any) {
      toast.error("Gagal menambahkan layer spasial");
      showErrorSwal("Gagal Menambahkan", err.message || "Terjadi kesalahan sistem.");
    } finally {
      setSubmittingLayer(false);
    }
  };

  const toggleLayerVisibility = async (id: number | string) => {
    try {
      const res = await geoSettingService.toggleSpatialLayer(id);
      setLayersList((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...item, visible: res.data.visible } : item))
      );
      toast.success(`Layer "${res.data.name}" ${res.data.visible ? "diaktifkan" : "dinonaktifkan"}.`);
    } catch (err: any) {
      toast.error("Gagal mengubah visibilitas layer");
      showErrorSwal("Gagal Mengubah Status", err.message || "Terjadi kesalahan.");
    }
  };

  const handleDeleteLayer = async (id: number | string, name: string) => {
    const res = await showDeleteConfirm(name);

    if (res.isConfirmed) {
      try {
        await geoSettingService.deleteSpatialLayer(id);
        setLayersList((prev) => prev.filter((item) => String(item.id) !== String(id)));
        toast.success(`Layer "${name}" berhasil dihapus dari database.`);
      } catch (err: any) {
        toast.error("Gagal menghapus layer spasial");
        showErrorSwal("Gagal Menghapus", err.message || "Terjadi kesalahan sistem.");
      }
    }
  };

  const handleSubmitStyling = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await geoSettingService.updateSettings({
        default_layer_color: boundaryColor,
      });

      toast.success("Konfigurasi Batas Administrasi & RTRW berhasil disimpan!");
      showSuccessSwal(
        "Pembaruan Berhasil!",
        "Pengaturan garis batas wilayah kabupaten & overlay RTRW berhasil diperbarui."
      );
    } catch (err: any) {
      toast.error("Gagal menyimpan konfigurasi.");
      showErrorSwal("Gagal Menyimpan", "Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 font-bold shrink-0">
            <Shield className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Batas Administrasi & Overlay RTRW
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Kelola batas wilayah kabupaten (GeoJSON/KMZ kustom vs BPS resmi), sub-wilayah kecamatan, desa & zona RTRW Halut.
            </p>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("master")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === "master"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Master Data & Upload Spasial</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("styling")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === "styling"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Styling & Live Map Preview</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-rose-50/80 border border-rose-200 text-rose-950 flex items-start gap-3 shadow-2xs">
        <HelpCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-rose-900">Pusat Manajemen Spasial Resmi Bappeda</h4>
          <p className="text-rose-900/80 leading-relaxed font-medium">
            Unggah file batas kustom (.KMZ / .KML) dari BIG/BPN atau Perda RTRW terbaru untuk menggantikan garis kabupaten default. Jika sewaktu-waktu di-reset, peta akan otomatis kembali menggunakan batas resmi bawaan BPS (Permendagri No. 137).
          </p>
        </div>
      </div>

      {/* TAB 1: MASTER DATA & UPLOAD FILE SPASIAL */}
      {activeTab === "master" && (
        <div className="space-y-6">
          {/* Section 1: Batas Kabupaten Halmahera Utara Master Control */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Garis Batas Utama Kabupaten Halmahera Utara
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sumber data garis batas acuan untuk seluruh modul Geotagging, WebGIS, dan Analisis Spasial
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {geoSetting?.has_custom_boundary ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Batas Kustom Aktif</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      disabled={boundaryUploading}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Kembalikan ke batas resmi BPS"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                      <span>Reset ke Default BPS</span>
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Batas Resmi BPS Default (Permendagri No. 137)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Current Active Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Status Sumber Data</span>
                <strong className="text-slate-800 text-xs block mt-0.5">
                  {geoSetting?.has_custom_boundary
                    ? `File KMZ Kustom: ${geoSetting.custom_boundary_name}`
                    : "BPS / Kemendagri (Permendagri No. 137)"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Estimasi Luas Wilayah</span>
                <strong className="text-slate-800 text-xs block mt-0.5">
                  {geoSetting?.custom_boundary_area_ha
                    ? `${Number(geoSetting.custom_boundary_area_ha).toLocaleString("id-ID")} Ha`
                    : "389.162 Ha (3.891,62 km²)"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fitur Spasial</span>
                <strong className="text-slate-800 text-xs block mt-0.5">
                  {geoSetting?.custom_boundary_features_count
                    ? `${geoSetting.custom_boundary_features_count} Objek Geometri`
                    : "1 MultiPolygon Resmi"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Terakhir Diperbarui</span>
                <strong className="text-slate-800 text-xs block mt-0.5">
                  {geoSetting?.custom_boundary_uploaded_at
                    ? new Date(geoSetting.custom_boundary_uploaded_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Standar Sistem Bappeda"}
                </strong>
              </div>
            </div>

            {/* Upload Area for New KMZ Boundary */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span>Unggah File Batas Wilayah Baru (.KMZ / .KML)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    File KMZ akan otomatis diurai di browser dan dapat langsung disinkronkan ke database server
                  </p>
                </div>
              </div>

              <KmzUploader
                onKmzParsed={handleKmzParsed}
                onClear={handleClearStagedKmz}
              />

              {/* Action Bar when Staged KMZ is ready */}
              {stagedKmzResult && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-purple-950">
                        File "{stagedKmzResult.fileName}" siap disimpan sebagai batas resmi!
                      </p>
                      <p className="text-purple-700 text-[11px]">
                        {stagedKmzResult.summary.totalFeatures} fitur • {stagedKmzResult.summary.polygonsCount} poligon • Estimasi {stagedKmzResult.summary.totalAreaHa} Ha
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab("styling")}
                      className="px-4 py-2.5 rounded-xl border border-purple-300 bg-white text-purple-700 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-purple-600" />
                      <span>Lihat Preview di Peta</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomBoundary}
                      disabled={boundaryUploading}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {boundaryUploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Check className="w-4 h-4 text-white" />
                      )}
                      <span>{boundaryUploading ? "Menyimpan ke Database..." : "Simpan & Sinkronkan Batas Resmi"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Secondary Spatial Layers (Kecamatan / Desa / RTRW) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload Form Left (5 Cols) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-rose-600" />
                <span>Unggah Layer Spasial Sub-Wilayah / RTRW</span>
              </h3>

              <form onSubmit={handleAddLayer} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Kategori Data Spasial *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "kabupaten", name: "Kabupaten" },
                      { id: "kecamatan", name: "Kecamatan/Desa" },
                      { id: "rtrw", name: "Zona RTRW" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewLayerType(t.id as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          newLayerType === t.id
                            ? "border-rose-600 bg-rose-50 text-rose-700 shadow-2xs"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Layer Spasial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Batas Resmi Kec. Tobelo Barat 2026"
                    value={newLayerName}
                    onChange={(e) => setNewLayerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Landasan Hukum / No. Perda</label>
                  <input
                    type="text"
                    placeholder="Contoh: Perda Halut No. 5 Tahun 2022"
                    value={newLegalBasis}
                    onChange={(e) => setNewLegalBasis(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Warna Default Stroke / Layer *</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <input
                      type="color"
                      value={newLayerColor}
                      onChange={(e) => setNewLayerColor(e.target.value)}
                      className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent p-0 shrink-0"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-black text-slate-900 block font-mono uppercase">{newLayerColor}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Klik warna untuk mengubah</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    File Spasial (.geojson / .kmz / .kml) *
                  </label>

                  {isParsingNewLayer ? (
                    <div className="border-2 border-dashed border-rose-300 rounded-2xl p-6 bg-rose-50/40 text-center flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                      <span className="text-xs font-bold text-rose-900">
                        Mengurai dan membaca isian data spasial KMZ/GeoJSON...
                      </span>
                      <p className="text-[11px] text-rose-600">
                        Memeriksa koordinat, poligon, dan atribut placemark
                      </p>
                    </div>
                  ) : newLayerParsedResult ? (
                    <div className="space-y-2">
                      <KmzFeaturePreview
                        parsedResult={newLayerParsedResult}
                        color={newLayerColor}
                        onClear={() => {
                          setSelectedFile(null);
                          setNewLayerParsedResult(null);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-2xl p-5 bg-slate-50 hover:bg-rose-50/30 text-center transition cursor-pointer relative group">
                      <input
                        type="file"
                        accept=".geojson,.json,.kmz,.kml"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileCode className="w-8 h-8 text-slate-400 group-hover:text-rose-600 mx-auto mb-1 transition-colors" />
                      <span className="font-bold text-slate-700 block text-xs">
                        Pilih atau Drag File GeoJSON / KMZ / KML
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Maksimal file 15MB (SRID EPSG:4326) • Preview isian akan langsung muncul
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingLayer}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {submittingLayer ? (
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-white" />
                  )}
                  <span>{submittingLayer ? "Menyimpan ke Database..." : "Simpan Layer Spasial Tambahan"}</span>
                </button>
              </form>
            </div>

            {/* Master Layers List Right (7 Cols) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  <span>Daftar Master Data Layer Spasial Aktif</span>
                </h3>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {layersList.length} Layer Terdaftar
                </span>
              </div>

              {loadingLayers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-40 bg-slate-200 rounded" />
                        <div className="h-4 w-12 bg-slate-200 rounded" />
                      </div>
                      <div className="h-3 w-60 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : layersList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Belum ada layer spasial tersimpan. Tambahkan layer baru melalui formulir di samping.
                </div>
              ) : (
                <div className="space-y-3">
                  {layersList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0"
                            style={{ backgroundColor: item.color }}
                          ></span>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                              <span className="bg-slate-200 px-2 py-0.5 rounded-md font-bold uppercase text-slate-700">
                                {item.type}
                              </span>
                              <span>• {item.legal_basis || "Dasar Hukum Resmi"}</span>
                              <span>• {item.feature_count ?? 1} Feature</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.geojson && (
                            <button
                              type="button"
                              onClick={() => setInspectingLayer(item)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition cursor-pointer"
                              title="Lihat Preview Peta & Data"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={() => toggleLayerVisibility(item.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleDeleteLayer(item.id, item.name)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="Hapus Layer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STYLING & LIVE MAP PREVIEW */}
      {activeTab === "styling" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Controls Left (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-600" />
              <span>Pengaturan Garis Batas & Overlay</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">Tampilkan Garis Batas Kabupaten</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {geoSetting?.has_custom_boundary || stagedKmzResult
                      ? "Garis batas kustom aktif"
                      : "Garis batas resmi bawaan BPS"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showKabBoundary}
                    onChange={(e) => setShowKabBoundary(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Pilih Warna Garis Batas Wilayah *</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <input
                    type="color"
                    value={boundaryColor}
                    onChange={(e) => setBoundaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-black text-slate-900 block font-mono uppercase">{boundaryColor}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Klik kotak warna di kiri untuk memilih warna bebas</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-2">Gaya Garis (Stroke Dash Style)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "dashed", name: "Putus-putus" },
                    { id: "solid", name: "Garis Utuh" },
                    { id: "dotted", name: "Titik-titik" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDashPattern(item.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        dashPattern === item.id
                          ? "border-rose-600 bg-rose-50 text-rose-700 shadow-2xs"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="font-extrabold text-slate-900 block text-xs">Garis Batas Kecamatan & Desa</span>
                    <span className="text-[11px] text-slate-500 font-medium">Batas sub-wilayah internal</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDistrictBoundary}
                      onChange={(e) => setShowDistrictBoundary(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="font-extrabold text-slate-900 block text-xs">Overlay Zona Peruntukan RTRW</span>
                    <span className="text-[11px] text-slate-500 font-medium">Zona Hutan, Pemukiman & Pariwisata</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRtrwZones}
                      onChange={(e) => setShowRtrwZones(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Live Map Preview Right (7 Cols) */}
          <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 sticky top-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-600" />
                <span>Live Visual Boundary & RTRW Preview</span>
              </h4>

              {/* Source Indicator Pill */}
              <div>
                {stagedKmzResult ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Preview KMZ Upload: {stagedKmzResult.fileName}</span>
                  </span>
                ) : geoSetting?.has_custom_boundary ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Batas Kustom Aktif: {geoSetting.custom_boundary_name}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Batas Resmi BPS (Permendagri No. 137)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200 relative">
              <GeotaggingMapPicker
                selectedLat={1.6178}
                selectedLng={127.8584}
                zoomLevel={9}
                customBoundaryGeoJson={activeBoundaryGeoJson}
                showBoundary={showKabBoundary}
                boundaryColor={boundaryColor}
                boundaryDashStyle={dashPattern}
                showDistrictBoundary={showDistrictBoundary}
                showRtrwZones={showRtrwZones}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 font-medium">
                {geoSetting?.has_custom_boundary && (
                  <span className="text-emerald-700 font-bold">
                    ✓ Sinkron dengan database WebGIS Bappeda
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSubmitStyling}
                disabled={saving}
                className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
                <span>{saving ? "Menyimpan..." : "Simpan Batas Administrasi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INSPECTION FOR MASTER LAYER */}
      {inspectingLayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden text-xs space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0"
                  style={{ backgroundColor: inspectingLayer.color }}
                />
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{inspectingLayer.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                    <span className="uppercase font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {inspectingLayer.type}
                    </span>
                    <span>• {inspectingLayer.legal_basis || "Dasar Hukum"}</span>
                    <span>• {inspectingLayer.feature_count ?? 1} Feature</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingLayer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Map Preview */}
            <div className="h-[280px] rounded-2xl overflow-hidden border border-slate-200">
              <KmzMiniMapPreview
                geojson={
                  typeof inspectingLayer.geojson === "string"
                    ? JSON.parse(inspectingLayer.geojson)
                    : inspectingLayer.geojson
                }
                color={inspectingLayer.color}
                height="280px"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingLayer(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
