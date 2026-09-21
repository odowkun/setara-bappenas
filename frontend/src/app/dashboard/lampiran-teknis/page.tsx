"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { proyekService, ProyekDetail, ProyekAttachment } from "@/services/proyekService";
import { AdminDocument } from "@/types/auth";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { compressImageFile, CompressionResult } from "@/utils/imageCompressor";
import { SkeletonImage } from "@/components/ui/SkeletonImage";
import { STORAGE_BASE_URL } from "@/lib/apiClient";
import {
  Paperclip,
  Upload,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Download,
  Plus,
  X,
  Loader2,
  Sparkles,
  FileCheck,
  FolderCheck,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { showSuccessSwal, showErrorSwal, showDeleteConfirm, toast } from "@/lib/swal";

export default function LampiranTeknisPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("semua");
  const [projects, setProjects] = useState<ProyekDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [categories, setCategories] = useState([
    { value: "Foto Dokumentasi Lapangan", label: "Foto Dokumentasi Lapangan (JPG/PNG)" },
    { value: "Dokumen DED", label: "Dokumen DED (Detail Engineering Design)" },
    { value: "Dokumen AMDAL", label: "Dokumen AMDAL / Analisis Lingkungan" },
    { value: "Laporan Monev", label: "Laporan Hasil Pengawasan Monev (PDF)" },
    { value: "Surat Izin / SK", label: "Surat Keputusan / Izin Penyelenggaraan" },
    { value: "+tambah_kategori", label: "➕ + Tambah Kategori Baru..." },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Foto Dokumentasi Lapangan");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Multi-File Upload & Compression States
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ [key: string]: { url: string; saved?: string | number; origSize?: string; compSize?: string } }>({});
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [docsData, projData] = await Promise.all([
        adminService.fetchDocuments(user?.bidang, user?.role),
        proyekService.getProjects(undefined, undefined, true),
      ]);
      setDocuments(docsData || []);
      setProjects(projData || []);

      if (projData.length > 0) {
        setSelectedProjectId(String(projData[0].id));
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data proyek.");
    } finally {
      setLoading(false);
    }
  };

  // Filter Projects based on selected Dokumen Induk
  const filteredProjects = selectedDocId === "semua"
    ? projects
    : projects.filter((p) => String(p.document_id || (p as any).dokumen_id) === selectedDocId);

  // Auto update selectedProjectId if current selected project is no longer in filtered list
  useEffect(() => {
    if (filteredProjects.length > 0) {
      const exists = filteredProjects.some((p) => String(p.id) === selectedProjectId);
      if (!exists) {
        setSelectedProjectId(String(filteredProjects[0].id));
      }
    } else {
      setSelectedProjectId("");
    }
  }, [selectedDocId, filteredProjects, selectedProjectId]);

  const documentSelectOptions = [
    { value: "semua", label: "📋 Semua Dokumen Induk (Tampilkan Seluruh Proyek)" },
    ...documents.map((doc) => ({
      value: String(doc.id),
      label: `${doc.jenis.toUpperCase()} - ${doc.title} (${doc.tahun})`,
    })),
  ];

  const projectSelectOptions = filteredProjects.map((p) => ({
    value: String(p.id),
    label: `${p.nama_proyek} (#${p.esri_objectid || p.kode_proyek})`,
  }));

  // Handle Category Select Change
  const handleCategorySelectChange = (val: string | number) => {
    const valStr = String(val);
    if (valStr === "+tambah_kategori") {
      setIsAddingCategory(true);
    } else {
      setIsAddingCategory(false);
      setSelectedCategory(valStr);
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      return toast.error("Masukkan nama kategori baru!");
    }
    const catName = newCategoryName.trim();
    const newOpt = { value: catName, label: catName };

    // Insert before the "+tambah_kategori" item
    const updated = [
      ...categories.filter((c) => c.value !== "+tambah_kategori"),
      newOpt,
      { value: "+tambah_kategori", label: "➕ + Tambah Kategori Baru..." },
    ];
    setCategories(updated);
    setSelectedCategory(catName);
    setNewCategoryName("");
    setIsAddingCategory(false);
    toast.success(`Kategori "${catName}" berhasil ditambahkan!`);
  };

  // Process multiple selected files (with automatic image compression)
  const processSelectedFiles = async (rawFiles: FileList | File[]) => {
    const incoming = Array.from(rawFiles);
    if (incoming.length === 0) return;

    setIsCompressing(true);
    const newFilesList: File[] = [...files];
    const newPreviewsMap = { ...previews };

    for (const rawFile of incoming) {
      if (rawFile.size > 500 * 1024 * 1024) {
        toast.error(`Berkas "${rawFile.name}" melebihi batas maksimal yang diizinkan (500 MB).`);
        continue;
      }

      // Check duplicate by name + size
      if (newFilesList.some((f) => f.name === rawFile.name && f.size === rawFile.size)) {
        continue;
      }

      if (rawFile.type.startsWith("image/")) {
        try {
          const res = await compressImageFile(rawFile);
          newFilesList.push(res.compressedFile);
          newPreviewsMap[res.compressedFile.name] = {
            url: res.previewUrl,
            saved: res.savedPercentage,
            origSize: `${res.originalSizeMB} MB`,
            compSize: `${res.compressedSizeMB} MB`,
          };
        } catch (err) {
          console.error("Gagal mengkompresi gambar", err);
          newFilesList.push(rawFile);
          newPreviewsMap[rawFile.name] = { url: URL.createObjectURL(rawFile) };
        }
      } else {
        newFilesList.push(rawFile);
        if (rawFile.type.includes("pdf") || rawFile.name.endsWith(".pdf")) {
          newPreviewsMap[rawFile.name] = { url: "/images/icons/pdf-icon.png" };
        }
      }
    }

    setFiles(newFilesList);
    setPreviews(newPreviewsMap);
    setIsCompressing(false);
    toast.success(`Berhasil menambahkan ${incoming.length} berkas ke daftar unggah.`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const fileToRemove = files[indexToRemove];
    const updatedFiles = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(updatedFiles);

    if (fileToRemove && previews[fileToRemove.name]) {
      const updatedPreviews = { ...previews };
      delete updatedPreviews[fileToRemove.name];
      setPreviews(updatedPreviews);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return toast.error("Pilih proyek terlebih dahulu!");
    if (files.length === 0) return toast.error("Pilih atau geser setidaknya 1 berkas file!");
    if (!selectedCategory) return toast.error("Pilih kategori lampiran teknis!");

    setSubmitting(true);
    let successCount = 0;
    try {
      for (const singleFile of files) {
        const res = await proyekService.uploadTechnicalAttachment(
          selectedProjectId,
          singleFile,
          selectedCategory
        );
        if (res.success) successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} Berkas Lampiran Teknis Berhasil Diunggah!`);
        showSuccessSwal(
          "Lampiran Teknis Berhasil Diunggah!",
          `1. Total ${successCount} berkas disinkronkan dengan titik proyek Bappeda\n2. Kategori: ${selectedCategory}\n3. Berkas siap diakses di Dashboard GIS Peta & Laporan.`
        );
        setFiles([]);
        setPreviews({});
        // Refresh project list
        const updated = await proyekService.getProjects(undefined, undefined, true);
        setProjects(updated);
      }
    } catch (err) {
      toast.error("Gagal mengunggah lampiran teknis.");
      showErrorSwal("Gagal Unggah", "Terjadi kesalahan saat mengunggah lampiran teknis.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (att: ProyekAttachment) => {
    const result = await showDeleteConfirm(att.file_name);
    if (!result.isConfirmed) return;
    try {
      await proyekService.deleteAttachment(att.id);
      // Optimistic UI: remove from local state
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          attachments: p.attachments?.filter((a) => String(a.id) !== String(att.id)),
        }))
      );
      toast.success(`Lampiran "${att.file_name}" berhasil dihapus!`);
    } catch {
      toast.error("Gagal menghapus lampiran.");
    }
  };

  const selectedProject = projects.find((p) => String(p.id) === String(selectedProjectId));

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <Paperclip className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Upload Lampiran Teknis Spasial
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Kelola dan unggah berkas spasial, foto dokumentasi lapangan, DED, dan AMDAL proyek daerah.
            </p>
          </div>
        </div>

        {/* Global Document Tag Filter */}
        <div className="w-full md:w-80">
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Filter Dokumen Induk (Renja/Renstra)
          </label>
          <SearchableSelect
            options={documentSelectOptions}
            value={selectedDocId}
            onChange={(val) => setSelectedDocId(String(val))}
            placeholder="Pilih Dokumen Induk"
            searchPlaceholder="Cari dokumen..."
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Form Unggah Lampiran Teknis (Multi-File)</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Pilih proyek target & kategori lampiran. Anda dapat mengunggah banyak berkas sekaligus.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            {/* Target Project Select */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilih Proyek Target *</label>
              {filteredProjects.length > 0 ? (
                <SearchableSelect
                  options={projectSelectOptions}
                  value={selectedProjectId}
                  onChange={(val) => setSelectedProjectId(String(val))}
                  placeholder="Pilih Proyek Target"
                  searchPlaceholder="Cari nama atau kode proyek..."
                />
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold">
                  Tidak ada proyek pada dokumen induk ini.
                </div>
              )}
            </div>

            {/* Dynamic Category Select with custom category feature */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">Kategori Lampiran Teknis *</label>
                {isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Batal Tambah
                  </button>
                )}
              </div>

              {!isAddingCategory ? (
                <SearchableSelect
                  options={categories}
                  value={selectedCategory}
                  onChange={handleCategorySelectChange}
                  placeholder="Pilih Kategori Lampiran"
                  searchPlaceholder="Cari atau buat kategori..."
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nama Kategori Baru..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-blue-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drag & Drop Multi-File Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">Pilih Berkas File (Bisa Multi-Upload) *</label>
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFiles([]); setPreviews({}); }}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Hapus Semua ({files.length})
                  </button>
                )}
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer group ${
                  isDragging
                    ? "border-blue-600 bg-blue-50/80"
                    : files.length > 0
                    ? "border-blue-300 bg-blue-50/30"
                    : "border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20"
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />

                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none py-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-700/20 group-hover:scale-110 transition-transform duration-300">
                    {isCompressing ? (
                      <Loader2 className="w-7 h-7 animate-spin text-white" />
                    ) : (
                      <UploadCloud className="w-7 h-7 text-white" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-700 transition">
                      {isCompressing
                        ? "Mengompresi Gambar Otomatis..."
                        : files.length > 0
                        ? "Klik atau Tarik Tambahan Berkas Lagi Di Sini"
                        : "Pilih atau Tarik Berkas Lampiran Teknis Di Sini"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Mendukung multi-upload berkas DED, AMDAL, foto lapangan, dan PDF
                    </p>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-black text-[10px] border border-blue-200 shadow-2xs flex items-center gap-1">
                      <span>Maks. 500 MB</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 font-black text-[10px] border border-red-200/80 shadow-2xs flex items-center gap-1">
                      <FileText className="w-3 h-3 text-red-600" />
                      <span>PDF</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-200/80 shadow-2xs flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span>DED / AMDAL</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-black text-[10px] border border-purple-200/80 shadow-2xs flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-purple-600" />
                      <span>JPG / PNG</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Files List with Isolated Relative Thumbnails */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {files.map((fileItem, idx) => {
                    const prev = previews[fileItem.name];
                    const isImg = fileItem.type.startsWith("image/");

                    return (
                      <div
                        key={`${fileItem.name}-${idx}`}
                        className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          {isImg && prev?.url ? (
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-200">
                              <img
                                src={prev.url}
                                alt={fileItem.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          <div className="truncate flex-1">
                            <strong className="block text-slate-900 truncate font-extrabold text-xs">
                              {fileItem.name}
                            </strong>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              <span>{(fileItem.size / 1024 / 1024).toFixed(2)} MB</span>
                              {prev?.saved && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  Hemat {prev.saved}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                          title="Hapus berkas ini"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || isCompressing || !selectedProjectId || files.length === 0}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Paperclip className="w-4 h-4" />
              <span>{submitting ? `Mengunggah (${files.length} Berkas)...` : `Unggah ${files.length > 0 ? files.length : ''} Lampiran Teknis`}</span>
            </button>
          </form>
        </div>

        {/* Selected Project Attachment List (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Berkas Lampiran Teknis Terlampir
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Target Proyek: <strong className="text-blue-700">{selectedProject?.nama_proyek || "Semua Proyek"}</strong>
              </p>
            </div>
            {selectedProject && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono w-fit">
                OBJECTID: #{selectedProject.esri_objectid || selectedProject.kode_proyek}
              </span>
            )}
          </div>

          {selectedProject?.attachments && selectedProject.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedProject.attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 relative group hover:border-blue-300 transition shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                      {att.file_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{att.file_size}</span>
                  </div>

                  <h5 className="text-xs font-extrabold text-slate-900 truncate">{att.file_name}</h5>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">ID: #{att.id}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att)}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 font-bold text-[10px] hover:bg-rose-600 hover:text-white transition flex items-center gap-1 border border-rose-200 hover:border-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                      <a
                        href={att.file_path.startsWith("/storage/") ? `${STORAGE_BASE_URL}${att.file_path}` : att.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Buka File</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 space-y-2">
              <Paperclip className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Belum ada lampiran teknis terunggah</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Gunakan form di sebelah kiri untuk mengunggah foto dokumentasi lapangan, DED, atau dokumen AMDAL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
