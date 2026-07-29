"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { proyekService, ProyekDetail } from "@/services/proyekService";
import { halutRegionService, KECAMATAN_HALUT_DATA } from "@/services/halutRegionService";
import { AdminDocument } from "@/types/auth";
import { showConfirm, showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  MapPin,
  Plus,
  Layers,
  Building2,
  CheckCircle2,
  FileText,
  Lightbulb,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  Trash2,
} from "lucide-react";

// Dynamic import for Leaflet map component (SSR safe)
const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false, loading: () => <div className="h-[400px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">Memuat Peta ESRI Interactive...</div> }
);

export default function GeotaggingProyekPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const paramDocId = searchParams?.get("docId");

  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [projects, setProjects] = useState<ProyekDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);

  useEffect(() => {
    const docs = adminService.getDocuments(user?.role === "admin_bidang" ? user.bidang : undefined);
    setDocuments(docs);
    if (paramDocId && docs.some((d) => String(d.id) === String(paramDocId))) {
      setSelectedDocId(paramDocId);
    } else if (docs.length > 0 && !selectedDocId) {
      setSelectedDocId(docs[0].id);
    }
  }, [user, paramDocId]);

  // OPD Checkbox toggle state
  const [isBappedaOpd, setIsBappedaOpd] = useState(true);

  // Form State
  const [form, setForm] = useState({
    nama_proyek: "",
    bidang: user?.bidang || "infrastruktur",
    kecamatan: "Tobelo",
    desa_kelurahan: "Gamsungi",
    lokasi_deskripsi: "",
    latitude: 1.7289,
    longitude: 128.0054,
    pagu_anggaran: 750000000,
    opd_penanggung_jawab: "Bappeda Kabupaten Halmahera Utara",
  });

  const [displayPagu, setDisplayPagu] = useState<string>("Rp 750.000.000");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleMapLocationSelect = (lat: number, lng: number) => {
    const region = halutRegionService.findRegionByCoords(lat, lng);

    if (region.isWithinHalut) {
      setLocationWarning(null);
      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        kecamatan: region.kecamatan,
        desa_kelurahan: region.desa,
      }));
      toast.success(`Lokasi terdeteksi: Kec. ${region.kecamatan}, Desa ${region.desa}`);
    } else {
      const warnMsg = "Kecamatan & Desa tidak ditemukan (titik di luar wilayah Kabupaten Halmahera Utara)";
      setLocationWarning(warnMsg);
      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        kecamatan: "",
        desa_kelurahan: "",
      }));
      toast.error("Lokasi di luar wilayah Kabupaten Halmahera Utara!");
    }
  };

  // Helper formatting rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handlePaguChange = (rawInput: string) => {
    const numericStr = rawInput.replace(/\D/g, "");
    const numericVal = numericStr ? parseInt(numericStr, 10) : 0;
    setForm({ ...form, pagu_anggaran: numericVal });
    setDisplayPagu(formatRupiah(numericVal));
  };

  useEffect(() => {
    const docs = adminService.getDocuments(user?.role === "admin_bidang" ? user.bidang : undefined);
    setDocuments(docs);
  }, [user]);

  useEffect(() => {
    if (!selectedDocId) {
      setProjects([]);
      return;
    }
    setLoading(true);
    proyekService.getProjects(selectedDocId).then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, [selectedDocId]);

  // Handle Kecamatan Change & Auto Map Fly-To Coordinates
  const handleKecamatanSelect = (kecName: string) => {
    const kecObj = halutRegionService.getKecamatanByName(kecName);
    if (kecObj) {
      const firstDesa = kecObj.desas.length > 0 ? kecObj.desas[0] : null;
      const targetLat = firstDesa ? firstDesa.lat : kecObj.lat;
      const targetLng = firstDesa ? firstDesa.lng : kecObj.lng;

      setForm({
        ...form,
        kecamatan: kecObj.name,
        desa_kelurahan: firstDesa ? firstDesa.name : "",
        latitude: targetLat,
        longitude: targetLng,
      });
    }
  };

  // Handle Desa Change & Auto Map Fly-To Coordinates
  const handleDesaSelect = (desaName: string) => {
    const desasList = halutRegionService.getDesaListByKecamatan(form.kecamatan);
    const desaObj = desasList.find((d) => d.name.toLowerCase() === desaName.toLowerCase());
    if (desaObj) {
      setForm({
        ...form,
        desa_kelurahan: desaObj.name,
        latitude: desaObj.lat,
        longitude: desaObj.lng,
      });
    } else {
      setForm({
        ...form,
        desa_kelurahan: desaName,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return toast.error("Pilih Dokumen Induk terlebih dahulu!");
    if (!form.nama_proyek) return toast.error("Nama proyek wajib diisi!");
    if (!form.opd_penanggung_jawab) return toast.error("OPD Penanggung Jawab wajib diisi!");
    setSubmitting(true);

    try {
      const res = await proyekService.addProjectGeotag(selectedDocId, {
        ...form,
        realisasi_anggaran: 0,
        persentase_progres: 0,
        status_progres: "belum_mulai",
        created_by: user?.name || "Admin Bidang",
      });

      if (res.success) {
        toast.success("Geotagging Proyek Berhasil Disimpan & Tersinkronisasi ke ESRI!");
        showSuccessSwal(
          "Geotagging Proyek Berhasil!",
          `1. Disimpan ke MySQL (proyek_details)\n2. Dikirim via POST /addFeatures ke ArcGIS REST API\n3. Memperoleh ESRI OBJECTID: #${res.data.esri_objectid || 'N/A'}`
        );
        
        setForm({
          ...form,
          nama_proyek: "",
          lokasi_deskripsi: "",
        });
        
        const updatedList = await proyekService.getProjects(selectedDocId);
        setProjects(updatedList);
      }
    } catch (err) {
      toast.error("Gagal menyimpan geotagging proyek.");
      showErrorSwal("Gagal Menyimpan", "Terjadi kesalahan saat menyimpan geotagging proyek.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGeotag = async (projectId: string | number, prjName: string) => {
    if (user?.role !== "superadmin") {
      toast.error("Hanya administrator (SuperAdmin) yang memiliki wewenang untuk menghapus geotagging proyek!");
      return;
    }

    const confirm = await showConfirm({
      title: "Hapus Geotagging Proyek?",
      text: `Apakah Anda yakin ingin menghapus geotagging untuk "${prjName}"? Tindakan ini akan menghapus data dari database lokal & sinkronisasi ArcGIS Feature Service.`,
      icon: "warning"
    });

    if (confirm.isConfirmed) {
      try {
        const success = await proyekService.deleteProject(projectId);
        if (success) {
          toast.success("Geotagging proyek berhasil dihapus!");
          if (selectedDocId) {
            const updatedList = await proyekService.getProjects(selectedDocId);
            setProjects(updatedList);
          }
        } else {
          toast.error("Gagal menghapus geotagging proyek.");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan saat menghapus geotagging proyek.");
      }
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.nama_proyek.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.kecamatan && p.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const documentSelectOptions = documents.map((doc) => ({
    value: doc.id,
    label: `${doc.jenis.toUpperCase()} - ${doc.title} (${doc.tahun})`,
  }));

  const kecamatanSelectOptions = KECAMATAN_HALUT_DATA.map((k) => ({
    value: k.name,
    label: `Kecamatan ${k.name}`,
  }));

  const currentDesasList = halutRegionService.getDesaListByKecamatan(form.kecamatan);
  const desaSelectOptions = currentDesasList.map((d) => ({
    value: d.name,
    label: `Desa/Kel. ${d.name}`,
  }));

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* Header Banner Clean */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Geotagging Proyek Pembangunan (Spasial)
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Penentuan titik koordinat lokasi proyek fisik dari dokumen perencanaan ke atas peta digital.
            </p>
          </div>
        </div>

        {selectedDocId && (
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200/80 w-fit">
            📍 Total Titik Geotagged: {projects.length} Proyek
          </span>
        )}
      </div>

      {/* Input Selection: Dokumen Induk (Clean Label & SearchableSelect) */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-900 block">Pilih Dokumen Induk *</label>
            <p className="text-[11px] text-slate-500 font-medium">
              Pilih dokumen resmi perencanaan tempat proyek fisik ini bernaung.
            </p>
          </div>
        </div>

        <SearchableSelect
          options={documentSelectOptions}
          value={selectedDocId}
          onChange={(val) => setSelectedDocId(String(val))}
          placeholder="-- Pilih Dokumen Induk Perencanaan --"
          searchPlaceholder="Cari dokumen induk..."
        />
      </div>

      {/* Conditional Display: Form & Interactive Map only when Dokumen Induk is selected */}
      {!selectedDocId ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3 font-sans">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-sm">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            Silakan Pilih Dokumen Induk Terlebih Dahulu
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            Pilih salah satu Dokumen Induk pada menu pencarian di atas untuk membuka Form Input Titik Geotagging Baru & Peta Interaktif Penentuan Lokasi Proyek.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Form Geotagging (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-700" />
                <span>Form Input Titik Geotagging Baru</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono">
                POST /addFeatures
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Proyek Pembangunan *</label>
                <input
                  type="text"
                  required
                  value={form.nama_proyek}
                  onChange={(e) => setForm({ ...form, nama_proyek: e.target.value })}
                  placeholder="Contoh: Pembangunan Puskesmas Pembantu Desa Tou"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              {/* Dynamic Kecamatan & Desa Select via SearchableSelect */}
              <div className="space-y-3">
                {locationWarning && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{locationWarning}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kecamatan (Kab. Halut) *</label>
                  <SearchableSelect
                    options={kecamatanSelectOptions}
                    value={form.kecamatan}
                    onChange={(val) => {
                      setLocationWarning(null);
                      handleKecamatanSelect(String(val));
                    }}
                    placeholder="-- Pilih Kecamatan --"
                    searchPlaceholder="Cari kecamatan..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Desa / Kelurahan *</label>
                  <SearchableSelect
                    options={desaSelectOptions}
                    value={form.desa_kelurahan}
                    onChange={(val) => {
                      setLocationWarning(null);
                      handleDesaSelect(String(val));
                    }}
                    placeholder="-- Pilih Desa / Kelurahan --"
                    searchPlaceholder="Cari desa..."
                  />
                </div>
              </div>

              {/* Auto Rupiah Formatted Input */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Pagu Anggaran APBD (Rp) *</span>
                  <span className="text-[10px] text-blue-700 font-mono font-extrabold">Format Otomatis Rp</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={displayPagu}
                    onChange={(e) => handlePaguChange(e.target.value)}
                    placeholder="Rp 0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-blue-900 text-sm focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* OPD Penanggung Jawab Checkbox & Custom Text Input */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block mb-1">OPD Penanggung Jawab *</label>
                
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/50 transition shadow-2xs">
                  <input
                    type="checkbox"
                    checked={isBappedaOpd}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsBappedaOpd(checked);
                      if (checked) {
                        setForm({ ...form, opd_penanggung_jawab: "Bappeda Kabupaten Halmahera Utara" });
                      } else {
                        setForm({ ...form, opd_penanggung_jawab: "" });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-slate-900">
                    Bappeda Kabupaten Halmahera Utara (Default)
                  </span>
                </label>

                {!isBappedaOpd && (
                  <div className="animate-in fade-in duration-200 pt-1">
                    <input
                      type="text"
                      required
                      value={form.opd_penanggung_jawab}
                      onChange={(e) => setForm({ ...form, opd_penanggung_jawab: e.target.value })}
                      placeholder="Masukkan OPD lain (cth: Dinas PUPR, Dinas Kesehatan)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Clean Light-Theme Captured Coordinates Badge */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-black text-blue-900 block uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Koordinat Tertangkap Peta (Leaflet Pin):</span>
                </span>
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-slate-800 shadow-2xs">
                    LAT (Y): <code className="text-blue-700 font-extrabold">{form.latitude}</code>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-slate-800 shadow-2xs">
                    LNG (X): <code className="text-blue-700 font-extrabold">{form.longitude}</code>
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{submitting ? "Mengirim Ke ESRI..." : "Simpan Geotagging & Sync ESRI"}</span>
              </button>
            </form>
          </div>

          {/* Interactive Map (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span>Peta Interaktif Penentuan Titik (Klik di Peta untuk Drop-Pin)</span>
                </h3>
              </div>

              <div className="h-[460px]">
                <GeotaggingMapPicker
                  selectedLat={form.latitude}
                  selectedLng={form.longitude}
                  onLocationSelect={(lat, lng) => handleMapLocationSelect(lat, lng)}
                  existingProjects={projects}
                />
              </div>
            </div>

            {/* Existing Projects List */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase">Daftar Titik Geotagged Terdaftar</h4>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari proyek..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {filteredProjects.map((prj) => (
                  <div
                    key={prj.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        OBJECTID: #{prj.esri_objectid || "Pending"}
                      </span>
                      <h5 className="font-extrabold text-slate-900">{prj.nama_proyek}</h5>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Lat: {prj.latitude}, Lng: {prj.longitude} ({prj.kecamatan || "Tobelo"})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        {prj.status_progres}
                      </span>
                      {user?.role === "superadmin" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGeotag(prj.id, prj.nama_proyek)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition cursor-pointer border border-rose-100"
                          title="Hapus Geotagging"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
