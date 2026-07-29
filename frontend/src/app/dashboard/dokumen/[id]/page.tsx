"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { proyekService, ProyekDetail, ProyekAttachment } from "@/services/proyekService";
import { AdminDocument } from "@/types/auth";
import {
  FileText,
  MapPin,
  Plus,
  ArrowLeft,
  Upload,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  DollarSign,
  Paperclip,
  Activity,
  Compass,
  FileCheck,
  Search,
  Edit2,
  Download,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, toast } from "@/lib/swal";

// Dynamic import for Leaflet map component (SSR safe)
const GeotaggingMapPicker = dynamic(
  () => import("@/components/gis/GeotaggingMapPicker"),
  { ssr: false, loading: () => <div className="h-[350px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">Memuat Peta Interaktif...</div> }
);

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const docId = params?.id as string;

  const [documentData, setDocumentData] = useState<AdminDocument | null>(null);
  const [projects, setProjects] = useState<ProyekDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State (Geotagging Proyek Spasial)
  const [isGeotagModalOpen, setIsGeotagModalOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    nama_proyek: "",
    bidang: "infrastruktur",
    kecamatan: "Tobelo",
    desa_kelurahan: "",
    lokasi_deskripsi: "",
    latitude: 1.7289,
    longitude: 128.0054,
    pagu_anggaran: 500000000,
    opd_penanggung_jawab: "Dinas PUPR / Bappeda Halut",
  });
  const [submittingGeotag, setSubmittingGeotag] = useState(false);

  // Modal State (Tabular Progress Update)
  const [selectedProjectForUpdate, setSelectedProjectForUpdate] = useState<ProyekDetail | null>(null);
  const [updateProgresForm, setUpdateProgresForm] = useState({
    persentase_progres: 0,
    status_progres: "dalam_proses" as "belum_mulai" | "dalam_proses" | "selesai" | "terkendala",
    realisasi_anggaran: 0,
  });
  const [submittingProgres, setSubmittingProgres] = useState(false);

  // Modal State (Upload Lampiran Teknis)
  const [selectedProjectForAttachment, setSelectedProjectForAttachment] = useState<ProyekDetail | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<string>("foto");
  const [submittingAttachment, setSubmittingAttachment] = useState(false);

  // Geoprocessing State (Buffer Analysis)
  const [isGeoprocessingActive, setIsGeoprocessingActive] = useState(false);
  const [bufferRadius, setBufferRadius] = useState<number>(500);
  const [bufferGeoJson, setBufferGeoJson] = useState<any>(null);
  const [runningGP, setRunningGP] = useState(false);

  // Load Document & Associated Spatial Projects
  useEffect(() => {
    if (!docId) return;

    const allDocs = adminService.getDocuments();
    const foundDoc = allDocs.find((d) => String(d.id) === String(docId)) || {
      id: docId,
      title: "Dokumen Renja Bidang Infrastruktur 2026",
      jenis: "renja",
      bidang: "infrastruktur",
      tahun: "2026",
      ukuran: "5.4 MB",
      downloads: 120,
      views: 340,
      fileUrl: "/documents/renja-infrastruktur-2026.pdf",
      isPublic: true,
      uploadedBy: "Admin Bidang",
      createdAt: new Date().toISOString(),
    };

    setDocumentData(foundDoc);

    proyekService.getProjects(docId).then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, [docId]);

  // Handle Geotagging Submission
  const handleSaveGeotag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.nama_proyek) return toast.error("Nama proyek wajib diisi!");
    setSubmittingGeotag(true);

    try {
      const res = await proyekService.addProjectGeotag(docId, {
        ...newProjectForm,
        realisasi_anggaran: 0,
        persentase_progres: 0,
        status_progres: "belum_mulai",
        created_by: user?.name || "Admin Bidang",
      });

      if (res.success) {
        toast.success("Geotagging lokasi proyek berhasil!");
        showSuccessSwal(
          "Lokasi Proyek Berhasil Ditambahkan!",
          `Disimpan ke database & tersinkronisasi ke ESRI ArcGIS.`
        );
        setIsGeotagModalOpen(false);
        const updatedList = await proyekService.getProjects(docId);
        setProjects(updatedList);
      }
    } catch (err) {
      toast.error("Gagal melakukan geotagging proyek.");
    } finally {
      setSubmittingGeotag(false);
    }
  };

  // Handle Progress Update Submission
  const handleSaveProgresUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForUpdate) return;
    setSubmittingProgres(true);

    try {
      const res = await proyekService.updateProgress(
        selectedProjectForUpdate.id,
        updateProgresForm.persentase_progres,
        updateProgresForm.status_progres,
        updateProgresForm.realisasi_anggaran
      );

      if (res.success) {
        toast.success("Progres fisik & realisasi keuangan berhasil diperbarui!");
        setSelectedProjectForUpdate(null);
        const updatedList = await proyekService.getProjects(docId);
        setProjects(updatedList);
      }
    } catch (err) {
      toast.error("Gagal memperbarui progres proyek.");
    } finally {
      setSubmittingProgres(false);
    }
  };

  // Handle Attachment Upload Submission
  const handleSaveAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForAttachment || !attachmentFile) return toast.error("File wajib dipilih!");
    setSubmittingAttachment(true);

    try {
      const res = await proyekService.uploadTechnicalAttachment(
        selectedProjectForAttachment.id,
        attachmentFile,
        attachmentType
      );

      if (res.success) {
        toast.success(`File lampiran teknis (${attachmentFile.name}) berhasil terunggah!`);
        setSelectedProjectForAttachment(null);
        setAttachmentFile(null);
        const updatedList = await proyekService.getProjects(docId);
        setProjects(updatedList);
      }
    } catch (err) {
      toast.error("Gagal mengunggah lampiran teknis.");
    } finally {
      setSubmittingAttachment(false);
    }
  };

  // Handle Buffer Analysis
  const handleRunGeoprocessing = async () => {
    if (projects.length === 0) return toast.error("Belum ada proyek terdaftar untuk dijalankan analisis buffer!");
    setRunningGP(true);

    const firstProject = projects[0];
    const res = await proyekService.runBufferAnalysis(
      firstProject.latitude,
      firstProject.longitude,
      bufferRadius
    );

    if (res.success && res.data.buffer_geojson) {
      setBufferGeoJson(res.data.buffer_geojson);
      toast.success(`Analisis Geoprocessing Buffer radius ${bufferRadius}m selesai!`);
    }
    setRunningGP(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold text-sm animate-pulse">
        Memuat data dokumen & lokasi proyek Bappeda...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Back Button */}
      <div>
        <Link
          href="/dashboard/dokumen"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Repository Dokumen</span>
        </Link>
      </div>

      {/* Header Dokumen Card (Clean White) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                {documentData?.jenis.toUpperCase()} - TAHUN {documentData?.tahun}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Bidang: <strong className="text-slate-900 uppercase">{documentData?.bidang}</strong>
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">{documentData?.title}</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Oleh: {documentData?.uploadedBy} • Total Proyek Fisik: <strong className="text-blue-700 font-bold">{projects.length} Titik Lokasi</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/geotagging-proyek?docId=${docId}`}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Lokasi Proyek</span>
          </Link>

          {documentData?.fileUrl && (
            <a
              href={documentData.fileUrl}
              download
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Unduh Berkas</span>
            </a>
          )}
        </div>
      </div>

      {/* Banner Panel Analisis Geoprocessing ESRI */}
      {isGeoprocessingActive && (
        <div className="p-5 rounded-3xl bg-purple-950 text-white border border-purple-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black flex items-center gap-2 text-purple-200">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Integrasi Geoprocessing Service (Buffer Spatial Analysis)</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-800 text-purple-200 border border-purple-700">
              ARCGIS GP ENGINE
            </span>
          </div>
          <p className="text-xs text-purple-300 font-medium">
            Menjalankan simulasi perhitungan buffer radius pelayanan fasilitas atau daerah jangkauan dari titik proyek utama.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-purple-900/60 px-3 py-1.5 rounded-xl border border-purple-700">
              <label className="text-xs font-bold text-purple-200">Radius Buffer (Meter):</label>
              <input
                type="number"
                value={bufferRadius}
                onChange={(e) => setBufferRadius(Number(e.target.value))}
                className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-purple-500 text-white text-xs font-bold text-center focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunGeoprocessing}
              disabled={runningGP}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {runningGP ? "Mengolah Spasial di ESRI..." : "Jalankan Analisis Buffer (Render Polygon)"}
            </button>

            {bufferGeoJson && (
              <button
                onClick={() => setBufferGeoJson(null)}
                className="px-3 py-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold hover:bg-rose-900 cursor-pointer"
              >
                Hapus Layer Overlay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Map + Project List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Interactive Map Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>Peta Interaktif Proyek Sektoral</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {projects.length} Titik Lokasi
              </span>
            </div>

            <div className="h-[480px]">
              <GeotaggingMapPicker
                selectedLat={projects.length > 0 ? projects[0].latitude : 1.7289}
                selectedLng={projects.length > 0 ? projects[0].longitude : 128.0054}
                existingProjects={projects}
                bufferGeoJson={bufferGeoJson}
                readOnly={true}
              />
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): List Proyek & Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Daftar Proyek Fisik & Status Monev</span>
          </h3>

          {projects.length === 0 ? (
            <div className="p-6 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-600">Belum ada titik proyek terdaftar</div>
              <p className="text-[11px] text-slate-500">Klik "Tambah Lokasi Proyek" di bagian atas untuk menambahkan titik lokasi.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1 pb-4">
              {projects.map((prj) => (
                <div
                  key={prj.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-blue-400 transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          OBJECTID: #{prj.esri_objectid || "Pending"}
                        </span>
                        <h4 className="mt-1 text-xs font-extrabold text-slate-900 leading-snug">{prj.nama_proyek}</h4>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                          prj.status_progres === "selesai"
                            ? "bg-emerald-100 text-emerald-800"
                            : prj.status_progres === "terkendala"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {prj.status_progres.replace("_", " ")}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span>Progres Fisik Sektoral</span>
                        <span className="text-blue-700 font-extrabold">{prj.persentase_progres}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${prj.persentase_progres}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pagu Anggaran</span>
                        <strong className="text-slate-800 font-bold">Rp {Number(prj.pagu_anggaran).toLocaleString("id-ID")}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Kecamatan/Desa</span>
                        <strong className="text-slate-800 font-bold">{prj.kecamatan || "Tobelo"}</strong>
                      </div>
                    </div>

                    {/* Attachments List */}
                    {prj.attachments && prj.attachments.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 block flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          <span>Lampiran Teknis:</span>
                        </span>
                        {prj.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-700 font-bold truncate block hover:underline"
                          >
                            📎 {att.file_name} ({att.file_size})
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clean Action Buttons with Proper Padding */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => {
                        setSelectedProjectForUpdate(prj);
                        setUpdateProgresForm({
                          persentase_progres: prj.persentase_progres,
                          status_progres: prj.status_progres,
                          realisasi_anggaran: prj.realisasi_anggaran,
                        });
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>Update Progres</span>
                    </button>

                    <button
                      onClick={() => setSelectedProjectForAttachment(prj)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Lampiran</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Geotagging Proyek Pembangunan */}
      {isGeotagModalOpen && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Tambah Detail Lokasi Proyek Renja</h3>
                <p className="text-xs font-medium text-slate-500">Tentukan titik kordinat lokasi proyek pada peta interaktif.</p>
              </div>
              <button
                onClick={() => setIsGeotagModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGeotag} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Proyek Spesifik *</label>
                    <input
                      type="text"
                      required
                      value={newProjectForm.nama_proyek}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, nama_proyek: e.target.value })}
                      placeholder="Contoh: Puskesmas Pembantu Desa Tou"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kecamatan</label>
                      <input
                        type="text"
                        value={newProjectForm.kecamatan}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, kecamatan: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Desa/Kelurahan</label>
                      <input
                        type="text"
                        value={newProjectForm.desa_kelurahan}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, desa_kelurahan: e.target.value })}
                        placeholder="Desa Tou"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Pagu Anggaran (Rp)</label>
                    <input
                      type="number"
                      value={newProjectForm.pagu_anggaran}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, pagu_anggaran: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 space-y-1">
                    <strong className="block font-bold">Koordinat Tertangkap (X/Y):</strong>
                    <div>Latitude: <code className="font-bold text-blue-800">{newProjectForm.latitude}</code></div>
                    <div>Longitude: <code className="font-bold text-blue-800">{newProjectForm.longitude}</code></div>
                  </div>
                </div>

                {/* Interactive Leaflet Pin Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Pilih Titik Lokasi Peta (Drop Pin)</label>
                  <div className="h-[260px]">
                    <GeotaggingMapPicker
                      selectedLat={newProjectForm.latitude}
                      selectedLng={newProjectForm.longitude}
                      onLocationSelect={(lat, lng) => setNewProjectForm({ ...newProjectForm, latitude: lat, longitude: lng })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeotagModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingGeotag}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingGeotag ? "Menyimpan..." : "Simpan Lokasi Proyek"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Data Sektoral & Progres */}
      {selectedProjectForUpdate && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Update Progres Proyek Sektoral</h3>
                <p className="text-xs font-medium text-slate-500">Perbarui status dan persentase realisasi fisik.</p>
              </div>
              <button
                onClick={() => setSelectedProjectForUpdate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Proyek: <strong className="text-slate-900">{selectedProjectForUpdate.nama_proyek}</strong>
            </div>

            <form onSubmit={handleSaveProgresUpdate} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Persentase Progres Realisasi Fisik:</span>
                  <span className="text-blue-700 font-extrabold text-sm">{updateProgresForm.persentase_progres}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={updateProgresForm.persentase_progres}
                  onChange={(e) => setUpdateProgresForm({ ...updateProgresForm, persentase_progres: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status Progres Pembangunan</label>
                <select
                  value={updateProgresForm.status_progres}
                  onChange={(e) => setUpdateProgresForm({ ...updateProgresForm, status_progres: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="belum_mulai">Belum Mulai</option>
                  <option value="dalam_proses">Dalam Proses</option>
                  <option value="selesai">Selesai 100%</option>
                  <option value="terkendala">Terkendala / Restrukturisasi</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Realisasi Anggaran (Rp)</label>
                <input
                  type="number"
                  value={updateProgresForm.realisasi_anggaran}
                  onChange={(e) => setUpdateProgresForm({ ...updateProgresForm, realisasi_anggaran: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForUpdate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProgres}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingProgres ? "Menyimpan..." : "Simpan Progres"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Upload Lampiran Teknis */}
      {selectedProjectForAttachment && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Unggah Lampiran Teknis Proyek</h3>
                <p className="text-xs font-medium text-slate-500">Unggah foto dokumentasi atau berkas DED.</p>
              </div>
              <button
                onClick={() => setSelectedProjectForAttachment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Proyek Target: <strong className="text-slate-900">{selectedProjectForAttachment.nama_proyek}</strong>
            </div>

            <form onSubmit={handleSaveAttachment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Dokumen Teknis</label>
                <select
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="foto">Foto Dokumentasi Lapangan (JPG/PNG)</option>
                  <option value="ded">Dokumen DED (Detail Engineering Design)</option>
                  <option value="amdal">Dokumen AMDAL / Analisis Lingkungan</option>
                  <option value="pdf">Laporan Hasil Pengawasan Monev</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih File Berkas *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForAttachment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAttachment}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingAttachment ? "Uploading..." : "Unggah Berkas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
