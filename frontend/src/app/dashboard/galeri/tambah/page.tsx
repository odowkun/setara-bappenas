"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderPlus,
  Save,
  Image as ImageIcon,
  Video,
  UploadCloud,
  Trash2,
  Layers,
  CheckSquare,
  Square,
  Star,
  Loader2,
} from "lucide-react";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { galeriService } from "@/services/galeriService";
import { toast } from "@/lib/swal";

interface MediaUploadItem {
  id: string;
  type: "image" | "video";
  url: string;
  masterUrl: string;
  title: string;
}

export default function TambahGaleriPage() {
  const router = useRouter();

  // Checkbox Mode: If true -> Album with multiple upload; If false -> Single photo/video
  const [isAlbumMode, setIsAlbumMode] = useState(true);

  // Form Fields
  const [albumName, setAlbumName] = useState("");
  const [singleTitle, setSingleTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));

  // Multi / Single Media Items & Cover Selection
  const [mediaItems, setMediaItems] = useState<MediaUploadItem[]>([]);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  // File Upload Handlers
  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const selectedFiles = isAlbumMode
        ? Array.from(files)
        : Array.from(files).slice(0, 1);
      const uploaded = await Promise.all(
        selectedFiles.map(async (file, index): Promise<MediaUploadItem> => {
          const stored = await galeriService.uploadMedia(file);
          return {
            id: `media-${Date.now()}-${index}`,
            type: file.type.startsWith("video/") ? "video" : "image",
            url: stored.webUrl,
            masterUrl: stored.masterUrl,
            title: file.name.replace(/\.[^/.]+$/, ""),
          };
        })
      );

      if (isAlbumMode) {
        setMediaItems((current) => {
          const rows = [...current, ...uploaded];
          setCoverMediaId((currentCover) => currentCover || rows[0]?.id || null);
          return rows;
        });
      } else {
        setMediaItems(uploaded);
        setCoverMediaId(uploaded[0]?.id || null);
      }
      toast.success(`${uploaded.length} media tersimpan di server.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Media gagal diunggah.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = (id: string) => {
    const updated = mediaItems.filter((item) => item.id !== id);
    setMediaItems(updated);
    if (coverMediaId === id) {
      setCoverMediaId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleUpdateCaption = (id: string, newTitle: string) => {
    setMediaItems(
      mediaItems.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  const handleSave = async (isPublished: boolean) => {
    const title = (isAlbumMode ? albumName : singleTitle).trim();
    if (!title || !category.trim()) {
      toast.error("Judul dan kategori galeri wajib diisi.");
      return;
    }
    if (isPublished && (!eventDate || mediaItems.length === 0 || !coverMediaId)) {
      toast.error("Tanggal, media, dan sampul wajib lengkap sebelum diterbitkan.");
      return;
    }

    const cover = mediaItems.find((item) => item.id === coverMediaId);
    setSaving(true);
    try {
      await galeriService.createAlbum({
        title,
        category: category.trim(),
        event_date: eventDate || null,
        description: description.trim(),
        cover_image: cover?.url || null,
        media: mediaItems.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          master_url: item.masterUrl,
          title: item.title,
        })),
        is_published: isPublished,
      });
      toast.success(isPublished
        ? "Galeri tersimpan dan diterbitkan."
        : "Galeri tersimpan sebagai draf.");
      router.push("/dashboard/galeri");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Galeri gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/galeri"
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs shrink-0"
            title="Kembali ke Galeri"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FolderPlus className="w-6 h-6 text-blue-600 shrink-0" />
              <span>{isAlbumMode ? "Buat Album Galeri Baru" : "Unggah Galeri Dokumentasi Single"}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {isAlbumMode
                ? "Centang album untuk mengelompokkan beberapa foto & video sekaligus, lalu pilih foto sampul depan album."
                : "Unggah 1 foto atau 1 video dokumentasi kegiatan daerah."}
            </p>
          </div>
        </div>

      </div>

      {/* FORM UTAMA */}
      <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
        {/* CHECKBOX SELECTION FOR ALBUM MODE */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div
            onClick={() => setIsAlbumMode(!isAlbumMode)}
            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3.5 ${
              isAlbumMode
                ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                : "bg-slate-50 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="shrink-0">
              {isAlbumMode ? (
                <CheckSquare className="w-6 h-6 text-blue-600" />
              ) : (
                <Square className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                Simpan Sebagai Album Kegiatan (Multiple Upload Foto & Video)
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAlbumMode
                  ? "✓ Mode Album Aktif: Anda dapat mengetik nama album, mengunggah beberapa foto & video, serta memilih foto sampul depan."
                  : "Mode Single: Centang di sini jika ingin membuat album baru dengan beberapa berkas foto & video."}
              </p>
            </div>
          </div>

          {/* DYNAMIC FORM FIELDS DEPENDING ON CHECKBOX */}
          {isAlbumMode ? (
            /* ALBUM MODE FIELDS */
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Album Kegiatan * (Ketik Langsung Nama Album)
                </label>
                <input
                  type="text"
                  required
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="Contoh: Dokumentasi Forum Musrenbang RKPD 2026..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Kegiatan
                  </label>
                  <CustomDatePicker
                    value={eventDate}
                    onChange={(val) => setEventDate(val)}
                    minYear={2020}
                    maxYear={2035}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi / Catatan Album
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Catatan atau rangkuman kegiatan..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-xs font-bold text-slate-900 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE FILE MODE FIELDS */
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Foto / Video Dokumentasi *
                </label>
                <input
                  type="text"
                  required
                  value={singleTitle}
                  onChange={(e) => setSingleTitle(e.target.value)}
                  placeholder="Contoh: Foto Peninjauan Lapangan Jembatan Tobelo..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Kegiatan
                </label>
                <CustomDatePicker
                  value={eventDate}
                  onChange={(val) => setEventDate(val)}
                  minYear={2020}
                  maxYear={2035}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kategori Galeri *
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Contoh: Musrenbang, Rapat, atau Monitoring"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
            />
          </div>
        </div>

        {/* MEDIA UPLOAD & COVER SELECTION SECTION */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {isAlbumMode ? "Berkas Foto & Video Album (Pilih Foto Sampul Depan)" : "Berkas Dokumentasi Utama"}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isAlbumMode
                    ? "Klik bintang pada berkas foto/video untuk menjadikannya sampul utama tampilan depan album."
                    : "Pilih 1 berkas foto atau video."}
                </p>
              </div>
            </div>

            {isAlbumMode && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                {mediaItems.length} Media Terpilih
              </span>
            )}
          </div>

          {/* DOKUMEN PERENCANAAN STYLE FILE UPLOAD DROPZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files);
              }
            }}
            onClick={() => {
              const input = document.getElementById("galeri-file-input") as HTMLInputElement;
              input?.click();
            }}
            className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center relative overflow-hidden group shadow-xs ${
              isDragOver
                ? "border-blue-600 bg-blue-50/80 scale-[1.01] shadow-lg shadow-blue-500/10"
                : "border-slate-200 hover:border-blue-500 bg-white hover:bg-slate-50/50"
            }`}
          >
            {/* Subtle Background Glow Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-700/20 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-0.5">
                <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight group-hover:text-blue-700 transition">
                  {isAlbumMode
                    ? "Pilih atau Tarik Berkas Foto & Video Album Di Sini"
                    : "Pilih atau Tarik Berkas Foto / Video Di Sini"}
                </h3>
                <p className="text-slate-500 font-medium text-xs">
                  {isAlbumMode
                    ? "Mendukung multi-upload sekaligus (Bisa pilih banyak gambar & video)"
                    : "Pilih 1 file foto dokumentasi atau video kegiatan"}
                </p>
              </div>

              {/* Extension Pills */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
                <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-black text-[10px] border border-purple-200/80 shadow-2xs flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-purple-600" />
                  <span>JPG</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-black text-[10px] border border-indigo-200/80 shadow-2xs flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-indigo-600" />
                  <span>PNG</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-200/80 shadow-2xs flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-blue-600" />
                  <span>WEBP</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-black text-[10px] border border-amber-200/80 shadow-2xs flex items-center gap-1">
                  <Video className="w-3 h-3 text-amber-600" />
                  <span>MP4 / WEBM</span>
                </span>
              </div>
            </div>

            <input
              id="galeri-file-input"
              type="file"
              multiple={isAlbumMode}
              accept="image/*,video/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {uploading && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Media sedang diunggah dan disimpan ke server...</span>
            </div>
          )}

          {/* PREVIEW MEDIA ITEMS WITH COVER SELECTION BUTTON */}
          {mediaItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {mediaItems.map((item, idx) => {
                const isCover = coverMediaId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border space-y-2.5 relative group transition ${
                      isCover
                        ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                      {item.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" controls />
                      )}

                      {/* Type Badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-md flex items-center gap-1">
                        {item.type === "image" ? (
                          <ImageIcon className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Video className="w-3 h-3 text-rose-400" />
                        )}
                        <span>#{idx + 1} {item.type.toUpperCase()}</span>
                      </span>

                      {/* Cover Photo Badge */}
                      {isAlbumMode && isCover && (
                        <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-500 text-white shadow-md flex items-center gap-1 animate-in fade-in">
                          <Star className="w-3 h-3 fill-current" />
                          <span>SAMPUL DEPAN ALBUM</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition"
                        title="Hapus Media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* SELECT AS COVER BUTTON */}
                    {isAlbumMode && (
                      <button
                        type="button"
                        onClick={() => setCoverMediaId(item.id)}
                        className={`w-full py-1.5 px-2.5 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition ${
                          isCover
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isCover ? "fill-current" : "text-amber-500"}`} />
                        <span>{isCover ? "Sampul Depan Utama" : "Pilih Sebagai Sampul Depan"}</span>
                      </button>
                    )}

                    {isAlbumMode && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Keterangan Foto/Video #{idx + 1}
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateCaption(item.id, e.target.value)}
                          placeholder="Keterangan media..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SUBMIT ACTION BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/galeri"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition text-center justify-center flex items-center"
          >
            Batal
          </Link>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || uploading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-black text-xs border border-slate-300 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || uploading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Terbitkan Galeri</span>
          </button>
        </div>
      </form>
    </div>
  );
}
