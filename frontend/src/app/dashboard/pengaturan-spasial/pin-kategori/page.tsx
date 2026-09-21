"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Save,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sparkles,
  HelpCircle,
  Building2,
  HeartPulse,
  GraduationCap,
  Bus,
  Compass,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";
import { geoSettingService } from "@/services/geoSettingService";

const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false }
);

const OPD_SECTORS = [
  { id: "pupr", name: "Dinas PUPR & Infrastruktur", defaultColor: "#2563eb", icon: Building2, count: "14 Proyek Fisik" },
  { id: "kesehatan", name: "Dinas Kesehatan & RSUD", defaultColor: "#e11d48", icon: HeartPulse, count: "8 Proyek Fisik" },
  { id: "pendidikan", name: "Dinas Pendidikan & Sekolah", defaultColor: "#7c3aed", icon: GraduationCap, count: "12 Proyek Fisik" },
  { id: "perhubungan", name: "Dinas Perhubungan & Bandara", defaultColor: "#d97706", icon: Bus, count: "5 Proyek Fisik" },
  { id: "bappeda", name: "Bappeda & Sekretariat Daerah", defaultColor: "#059669", icon: Compass, count: "19 Proyek Fisik" },
];

export default function PinKategoriSettingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectorColors, setSectorColors] = useState<Record<string, string>>({
    pupr: "#2563eb",
    kesehatan: "#e11d48",
    pendidikan: "#7c3aed",
    perhubungan: "#d97706",
    bappeda: "#059669",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await geoSettingService.getSettings();
        if (data?.sector_pin_colors_json && typeof data.sector_pin_colors_json === "object") {
          setSectorColors((prev) => ({ ...prev, ...data.sector_pin_colors_json }));
        }
      } catch (err) {
        console.error("Gagal memuat data sektor pin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleColorChange = (id: string, color: string) => {
    setSectorColors((prev) => ({ ...prev, [id]: color }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await geoSettingService.updateSettings({
        sector_pin_colors_json: sectorColors,
      });
      toast.success("Kategori Pin & Ikon Sektoral OPD berhasil disimpan ke database!");
      showSuccessSwal(
        "Pembaruan Berhasil!",
        "Skema warna pin marker & legend sektoral OPD berhasil disimpan ke database."
      );
    } catch (err: any) {
      toast.error("Gagal menyimpan konfigurasi.");
      showErrorSwal("Gagal Menyimpan", err.message || "Terjadi kesalahan sistem.");
    } finally {
      setSaving(false);
    }
  };

  // Sample project pins mapped with current sector colors
  const sampleProjects = [
    { id: 1, nama_proyek: "Peningkatan Jalan Trans Tobelo-Galela (PUPR)", latitude: 1.7310, longitude: 127.9890, persentase_progres: 85, status_progres: "Selesai" },
    { id: 2, nama_proyek: "Pembangunan Gedung Baru RSUD Tobelo (Kesehatan)", latitude: 1.7240, longitude: 127.9940, persentase_progres: 60, status_progres: "Proses" },
    { id: 3, nama_proyek: "Rehabilitasi Ruang Kelas SMP Negeri 1 Tobelo (Pendidikan)", latitude: 1.7290, longitude: 127.9820, persentase_progres: 100, status_progres: "Selesai" },
    { id: 4, nama_proyek: "Pengembangan Terminal Pelabuhan Tobelo (Perhubungan)", latitude: 1.7340, longitude: 128.0010, persentase_progres: 40, status_progres: "Proses" },
  ];

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Kategori Pin Marker & Legend OPD Sektoral
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Kelola skema warna penanda pin lokasi proyek fisik berdasarkan sektor dinas / OPD penanggung jawab.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>5 Sektor OPD Terdaftar</span>
          </span>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-start gap-3 shadow-2xs">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-blue-900">Petunjuk Kategori Pin Sektoral</h4>
          <p className="text-blue-900/80 leading-relaxed font-medium">
            Membedakan warna pin marker memudahkan pimpinan & publik mengenali sektor proyek fisik secara visual pada peta GIS Bappeda Halmahera Utara.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sector Pin Colors List Left (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Warna Pin Berdasarkan Sektor OPD</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            {OPD_SECTORS.map((sector) => {
              const IconComp = sector.icon;
              const currentColor = sectorColors[sector.id] || sector.defaultColor;
              return (
                <div
                  key={sector.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: currentColor }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">{sector.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{sector.count}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => handleColorChange(sector.id, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Map Preview Right (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Live Visual Pin Marker Preview (Kawasan Tobelo)</span>
            </h4>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Multi-Sector Legend</span>
            </span>
          </div>

          <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-200 relative">
            <GeotaggingMapPicker
              selectedLat={1.7280}
              selectedLng={127.9900}
              zoomLevel={13}
              existingProjects={sampleProjects}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
              <span>{saving ? "Menyimpan..." : "Simpan Kategori Pin OPD"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
