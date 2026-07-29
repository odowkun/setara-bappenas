"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Layers, Download, Navigation, Info, CheckCircle2, Camera, Paperclip, Eye, X, FileCheck } from "lucide-react";
import { toast } from "@/lib/swal";
import Swal from "sweetalert2";

import { adminService } from "@/services/adminService";
import { proyekService, ProyekDetail } from "@/services/proyekService";
import { MediaAlbumModal, MediaItem } from "@/components/ui/MediaAlbumModal";

const EsriLeafletMap = dynamic(
  () => import("@/components/gis/EsriLeafletMap"),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[500px] bg-slate-100 animate-pulse rounded-[24px] flex items-center justify-center text-xs font-bold text-slate-500">Memuat Peta Fullscreen Esri ArcGIS Engine...</div> }
);

export const EsriMapView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rawProjects, setRawProjects] = useState<ProyekDetail[]>([]);
  const [albumState, setAlbumState] = useState<{
    isOpen: boolean;
    mediaList: MediaItem[];
    initialIndex: number;
  }>({
    isOpen: false,
    mediaList: [],
    initialIndex: 0,
  });

  React.useEffect(() => {
    proyekService.getProjects().then((data) => {
      setRawProjects(data);
    });
  }, []);

  const DEFAULT_BAPPEDA_PROYEK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e3a8a"/><stop offset="50%" stop-color="%23172554"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="800" height="400" rx="32" fill="url(%23bg)"/><g transform="translate(400, 140)" text-anchor="middle"><circle cx="0" cy="0" r="42" fill="none" stroke="%23f59e0b" stroke-width="6"/><ellipse cx="0" cy="0" rx="20" ry="42" fill="none" stroke="%23f59e0b" stroke-width="5"/><line x1="-42" y1="0" x2="42" y2="0" stroke="%23f59e0b" stroke-width="5"/><line x1="-36" y1="-20" x2="36" y2="-20" stroke="%23f59e0b" stroke-width="4"/><line x1="-36" y1="20" x2="36" y2="20" stroke="%23f59e0b" stroke-width="4"/><text x="0" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" fill="%23ffffff" letter-spacing="-0.5">Kabupaten Halmahera Utara</text><text x="0" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="%23fbbf24">Ibu Kota: Tobelo • 4.951,61 km²</text></g></svg>`;

  const projects = React.useMemo(() => {
    if (rawProjects.length === 0) return [];
    return rawProjects.map((p, idx) => {
      const photoAtt = p.attachments?.find(
        (att) =>
          att.file_type === "foto" ||
          att.file_path.startsWith("data:image/") ||
          att.file_path.startsWith("http") ||
          att.file_path.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
      );

      const photoUrl = photoAtt && photoAtt.file_path ? photoAtt.file_path : DEFAULT_BAPPEDA_PROYEK_SVG;
      const numId = typeof p.id === "number" ? p.id : idx + 1;

      const allAtts = p.attachments || [];
      const imagesList = allAtts.filter(
        (att) =>
          att.file_type === "foto" ||
          att.file_path.startsWith("data:image/") ||
          att.file_path.startsWith("http") ||
          att.file_path.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
      );

      const documentsList = allAtts.filter(
        (att) =>
          att.file_type !== "foto" &&
          !att.file_path.startsWith("data:image/") &&
          !att.file_path.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
      );

      return {
        id: numId,
        realId: p.id,
        documentId: p.document_id,
        rawDoc: (p as any).document,
        attachments: allAtts,
        images: imagesList,
        documents: documentsList,
        name: p.nama_proyek,
        location: p.desa_kelurahan ? `Desa ${p.desa_kelurahan}` : `Kecamatan ${p.kecamatan || "Tobelo"}`,
        kecamatan: p.kecamatan || "Tobelo",
        category: p.bidang ? p.bidang.toUpperCase() : "INFRASTRUKTUR",
        desc: p.lokasi_deskripsi || `Pembangunan fasilitas ${p.nama_proyek} di ${p.kecamatan || "Halmahera Utara"}.`,
        peran: `Pelayanan Publik & Pembangunan ${p.bidang ? p.bidang.toUpperCase() : ""}`,
        budget: `Rp ${(p.pagu_anggaran ? p.pagu_anggaran / 1000000000 : 1).toFixed(1)} Miliar`,
        progress: p.persentase_progres || 0,
        year: 2026,
        status: p.status_progres === "selesai" ? "Selesai (100%)" : `Tahap Pengerjaan (${p.persentase_progres}%)`,
        koordinat: `${p.latitude.toFixed(4)}° N, ${p.longitude.toFixed(4)}° E`,
        lat: p.latitude,
        lng: p.longitude,
        contractor: p.created_by || "Pemerintah Kab. Halmahera Utara",
        image: photoUrl,
      };
    });
  }, [rawProjects]);

  const handleOpenAlbum = (loc: any, startIndex = 0) => {
    if (!loc) return;
    let items: MediaItem[] = [];
    if (loc.images && loc.images.length > 0) {
      items = loc.images.map((img: any) => ({
        id: img.id,
        url: img.file_path,
        title: img.file_name || loc.name,
        type: img.file_type || "foto",
        size: img.file_size,
      }));
    } else if (loc.image) {
      items = [{ id: loc.id, url: loc.image, title: loc.name, type: "foto" }];
    }
    if (items.length > 0) {
      setAlbumState({ isOpen: true, mediaList: items, initialIndex: startIndex });
    } else {
      toast.error("Belum ada foto/video dokumentasi untuk lokasi ini.");
    }
  };

  const handleDownloadDocument = (loc: any) => {
    if (!loc) return;

    const allDocs = adminService.getDocuments();
    const foundDoc =
      loc.rawDoc ||
      allDocs.find((d) => String(d.id) === String(loc.documentId || loc.dokumen_id));

    if (foundDoc) {
      const rawFileUrl = foundDoc.fileUrl || (foundDoc as any).file_path;
      const fullUrl = rawFileUrl
        ? rawFileUrl.startsWith("/storage/")
          ? `http://localhost:8000${rawFileUrl}`
          : rawFileUrl
        : null;

      Swal.fire({
        title: `<div class="flex items-center justify-center gap-2 text-blue-900 font-black text-base"><svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Dokumen Terverifikasi Tim Bappeda</div>`,
        html: `
          <div class="text-left space-y-3 font-sans pt-2">
            <div class="p-3 bg-blue-50/80 rounded-2xl border border-blue-100">
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">${(foundDoc.jenis || "RKPD").toUpperCase()} • TAHUN ${foundDoc.tahun || 2026}</span>
              <h4 class="text-sm font-extrabold text-slate-900 mt-1.5">${foundDoc.title}</h4>
              <p class="text-xs text-slate-500 font-medium mt-0.5">Dokumen Resmi Perencanaan Bappeda Kab. Halmahera Utara</p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
              <div class="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] text-slate-400 block font-bold">OPD / Pengunggah:</span>
                <span class="font-extrabold text-slate-800">${foundDoc.uploadedBy || "Bappeda Halut"}</span>
              </div>
              <div class="p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] text-slate-400 block font-bold">Target Proyek:</span>
                <span class="font-extrabold text-slate-800">${loc.name}</span>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "📄 Buka / Unduh Dokumen Resmi (PDF)",
        cancelButtonText: "Tutup",
        customClass: {
          popup: "rounded-3xl p-6 font-sans border border-slate-200 shadow-2xl bg-white",
          title: "text-base font-black text-slate-900",
          confirmButton:
            "px-5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-700/20 mr-2 transition cursor-pointer",
          cancelButton:
            "px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer",
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          if (fullUrl) {
            window.open(fullUrl, "_blank");
          } else {
            window.open(`/dashboard/dokumen/${foundDoc.id}`, "_blank");
          }
        }
      });
    } else {
      toast.success(`Membuka Dokumen Induk Perencanaan untuk proyek: ${loc.name}`);
      window.open(`/dashboard/dokumen`, "_blank");
    }
  };

  const selectedProject = selectedId !== null ? projects.find((p) => p.id === selectedId) || null : null;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-36 pb-20 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-slate-50 border border-slate-200">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> Peta Geografis Spasial (Esri ArcGIS Engine)
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Peta Sebaran Proyek Pembangunan Halmahera Utara
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success("Mengunduh Layer Spasial (GeoJSON)...")}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200 shadow-sm transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-600" /> Export GeoJSON
          </button>
        </div>
      </div>

      {/* Main Interactive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Left Sidebar: Projects List */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-5 flex flex-col justify-between overflow-y-auto shadow-sm space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" /> Lokasi Proyek Pembangunan (3)
              </span>
            </div>

            <div
              className="space-y-3 max-h-[480px] overflow-y-auto pr-1 text-left custom-scrollbar"
              style={{ overscrollBehavior: "contain" }}
            >
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    selectedId === p.id
                      ? "bg-blue-700 border-blue-700 text-white shadow-md"
                      : "bg-slate-50 border-slate-200 hover:border-blue-300 text-slate-700 hover:bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span className={selectedId === p.id ? "text-amber-300" : "text-blue-700"}>{p.kecamatan}</span>
                    <span className={selectedId === p.id ? "text-blue-100" : "text-slate-500"}>{p.budget}</span>
                  </div>
                  <h4 className={`text-xs font-bold line-clamp-1 ${selectedId === p.id ? "text-white" : "text-slate-900"}`}>{p.name}</h4>
                  <p className={`text-[11px] mt-1 flex items-center gap-1 font-medium ${selectedId === p.id ? "text-blue-100" : "text-slate-500"}`}>
                    <Navigation className="w-3 h-3 text-amber-400" /> {p.location}
                  </p>

                  {/* Thumbnail Photo Preview */}
                  {p.image && (
                    <div className="mt-2.5 w-full h-20 rounded-xl overflow-hidden border border-white/20">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-600" /> Terintegrasi ArcGIS Layer Service
          </div>
        </div>

        {/* Map View Canvas with Live Esri Leaflet Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[28px] p-2 relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="w-full flex-1 rounded-[24px] overflow-hidden min-h-[500px]">
            <EsriLeafletMap
              locations={projects}
              selectedId={selectedId}
              onSelectLocation={(id) => setSelectedId(id)}
              onOpenAlbum={(loc) => handleOpenAlbum(loc)}
            />
          </div>

          {/* Active Detail Modal or Regional Overview Bar */}
          {selectedProject ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left shadow-sm mt-2 text-slate-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedProject.image && (
                  <img src={selectedProject.image} alt={selectedProject.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    {selectedProject.kecamatan} • {selectedProject.koordinat}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {selectedProject.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(selectedProject)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dokumen Terverifikasi Tim Bappeda</span>
                </button>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold text-blue-950">
                  {selectedProject.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left shadow-sm mt-2 text-slate-900 flex items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-700">
                Peta Geospasial Kabupaten Halmahera Utara
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                Klik lokasi proyek pada daftar untuk melihat detail lokasi & foto
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Album Modal (Full 100dvh Portal Overlay) */}
      <MediaAlbumModal
        isOpen={albumState.isOpen}
        onClose={() => setAlbumState((prev) => ({ ...prev, isOpen: false }))}
        mediaList={albumState.mediaList}
        initialIndex={albumState.initialIndex}
      />
    </div>
  );
};
