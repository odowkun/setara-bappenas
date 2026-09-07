"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, showDeleteConfirm, toast } from "@/lib/swal";

const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false }
);

interface SpatialLayerItem {
  id: string;
  name: string;
  type: "kabupaten" | "kecamatan" | "rtrw";
  legalBasis: string;
  featureCount: number;
  color: string;
  visible: boolean;
  uploadedAt: string;
}

export default function RtrwBatasSettingPage() {
  const [activeTab, setActiveTab] = useState<"master" | "styling">("master");
  const [saving, setSaving] = useState(false);

  // Form State for Uploading New Spatial Boundary
  const [newLayerType, setNewLayerType] = useState<"kabupaten" | "kecamatan" | "rtrw">("kecamatan");
  const [newLayerName, setNewLayerName] = useState("");
  const [newLegalBasis, setNewLegalBasis] = useState("");
  const [newLayerColor, setNewLayerColor] = useState("#0284c7");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Styling Tab Controls
  const [showKabBoundary, setShowKabBoundary] = useState(true);
  const [boundaryColor, setBoundaryColor] = useState("#ef4444");
  const [dashPattern, setDashPattern] = useState<"dashed" | "solid" | "dotted">("dashed");
  const [showDistrictBoundary, setShowDistrictBoundary] = useState(true);
  const [showRtrwZones, setShowRtrwZones] = useState(true);

  // Active Spatial Layers Master List
  const [layersList, setLayersList] = useState<SpatialLayerItem[]>([
    {
      id: "layer-1",
      name: "Batas Luar Kabupaten Halmahera Utara (Resmi BPS 2026)",
      type: "kabupaten",
      legalBasis: "Permendagri No. 137 Tahun 2017",
      featureCount: 1,
      color: "#ef4444",
      visible: true,
      uploadedAt: "30 Jul 2026",
    },
    {
      id: "layer-2",
      name: "Batas Sub-Wilayah Kecamatan (Tobelo, Galela, Kao)",
      type: "kecamatan",
      legalBasis: "Perda Halut No. 3 Tahun 2020",
      featureCount: 5,
      color: "#0284c7",
      visible: true,
      uploadedAt: "30 Jul 2026",
    },
    {
      id: "layer-3",
      name: "Zona Overlay Peruntukan RTRW (Hutan Lindung & Pemukiman)",
      type: "rtrw",
      legalBasis: "Perda RTRW Halut No. 5 Tahun 2022",
      featureCount: 4,
      color: "#059669",
      visible: true,
      uploadedAt: "30 Jul 2026",
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        showErrorSwal("Ukuran File Terlalu Besar", "Maksimal ukuran file GeoJSON/KMZ adalah 15MB.");
        return;
      }
      setSelectedFile(file);
      toast.success(`File "${file.name}" berhasil dipilih.`);
    }
  };

  const handleAddLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) {
      showErrorSwal("Input Kurang Lengkap", "Silakan isi nama layer data spasial.");
      return;
    }

    const newLayer: SpatialLayerItem = {
      id: `layer-${Date.now()}`,
      name: newLayerName,
      type: newLayerType,
      legalBasis: newLegalBasis || "SK Bupati Halut 2026",
      featureCount: Math.floor(Math.random() * 8) + 1,
      color: newLayerColor,
      visible: true,
      uploadedAt: "Hari ini",
    };

    setLayersList((prev) => [newLayer, ...prev]);
    setNewLayerName("");
    setNewLegalBasis("");
    setSelectedFile(null);

    toast.success("Master layer spasial berhasil ditambahkan!");
    showSuccessSwal(
      "Layer Berhasil Ditambahkan!",
      `Master data "${newLayer.name}" telah disimpan ke database spasial Bappeda.`
    );
  };

  const toggleLayerVisibility = (id: string) => {
    setLayersList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.visible;
          toast.success(`Layer "${item.name}" ${nextState ? "diaktifkan" : "dinonaktifkan"}.`);
          return { ...item, visible: nextState };
        }
        return item;
      })
    );
  };

  const handleDeleteLayer = async (id: string, name: string) => {
    const res = await showDeleteConfirm(name);

    if (res.isConfirmed) {
      setLayersList((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Layer "${name}" berhasil dihapus.`);
    }
  };

  const handleSubmitStyling = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
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
              Kelola master data spasial (GeoJSON/KMZ), batas kabupaten, kecamatan, desa & zona peruntukan RTRW Halut.
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
            Unggah file batas resmi (GeoJSON/KMZ) dari BIG/BPN atau Perda RTRW terbaru. Seluruh layer yang diaktifkan di sini akan langsung direfleksikan pada peta WebGIS Bappeda.
          </p>
        </div>
      </div>

      {/* TAB 1: MASTER DATA & UPLOAD FILE SPASIAL */}
      {activeTab === "master" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload Form Left (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-600" />
              <span>Unggah Data Spasial Baru (GeoJSON / KMZ)</span>
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
                <label className="font-bold text-slate-700 block mb-1.5">File Spasial (.geojson / .kmz / .kml) *</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 text-center hover:bg-slate-100 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".geojson,.json,.kmz,.kml"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileCode className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="font-bold text-slate-700 block text-xs">
                    {selectedFile ? selectedFile.name : "Pilih atau Drag File GeoJSON / KMZ"}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Maksimal file 15MB (SRID EPSG:4326)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Simpan Layer Spasial Baru</span>
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
                          <span>• {item.legalBasis}</span>
                          <span>• {item.featureCount} Feature</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                  <span className="text-[11px] text-slate-500 font-medium">Garis merah luar wilayah Halut</span>
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-600" />
                <span>Live Visual Boundary & RTRW Preview</span>
              </h4>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-600" />
                <span>Real-Time Rendering</span>
              </span>
            </div>

            <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200 relative">
              <GeotaggingMapPicker
                selectedLat={1.6178}
                selectedLng={127.8584}
                zoomLevel={9}
                showBoundary={showKabBoundary}
                boundaryColor={boundaryColor}
                boundaryDashStyle={dashPattern}
                showDistrictBoundary={showDistrictBoundary}
                showRtrwZones={showRtrwZones}
              />
            </div>

            <div className="flex justify-end pt-2">
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
    </div>
  );
}
