"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  FolderPlus,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  UploadCloud,
  Trash2,
  Layers,
  Calendar,
  CheckSquare,
  Square,
  Star,
  Check,
} from "lucide-react";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";

interface MediaUploadItem {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  fileSize: string;
}

export default function TambahGaleriPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Checkbox Mode: If true -> Album with multiple upload; If false -> Single photo/video
  const [isAlbumMode, setIsAlbumMode] = useState(true);

  // Form Fields
  const [albumName, setAlbumName] = useState("");
  const [singleTitle, setSingleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("2026-07-24");

  // Multi / Single Media Items & Cover Selection
  const [mediaItems, setMediaItems] = useState<MediaUploadItem[]>([]);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // File Upload Handlers
  const handleFileUpload = (files: FileList) => {
    const newItems: MediaUploadItem[] = [];
    Array.from(files).forEach((file, index) => {
      const isVideo = file.type.startsWith("video/");
      const blobUrl = URL.createObjectURL(file);
      const itemId = `media-${Date.now()}-${index}`;
      newItems.push({
        id: itemId,
        type: isVideo ? "video" : "image",
        url: blobUrl,
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      });
    });

    if (isAlbumMode) {
      setMediaItems((prev) => {
        const updated = [...prev, ...newItems];
        if (!coverMediaId && updated.length > 0) {
          setCoverMediaId(updated[0].id); // Default set first photo as cover
        }
        return updated;
      });
    } else {
      setMediaItems(newItems.slice(0, 1));
      if (newItems.length > 0) {
        setCoverMediaId(newItems[0].id);
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlbumMode && !albumName.trim()) return;
    if (!isAlbumMode && !singleTitle.trim()) return;
    if (mediaItems.length === 0) return;

    setIsSaved(true);
    setTimeout(() => {
      router.push("/dashboard/galeri");
    }, 1500);
  };

  return (
    <div className="space-y-4 w-full max-w-[1400px] mx-auto font-sans">
      {/* HEADER CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {isSaved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dokumentasi Galeri Berhasil Disimpan ke Database!</span>
          </div>
        )}
      </div>

      {/* FORM UTAMA */}
      <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* FILE UPLOAD DROPZONE */}
          <label className="p-8 rounded-3xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 cursor-pointer text-center block transition group">
            <UploadCloud className="w-10 h-10 text-blue-600 mx-auto group-hover:scale-110 transition" />
            <div className="mt-2">
              <p className="font-black text-slate-900 text-sm">
                {isAlbumMode
                  ? "Klik atau Seret Berkas (Multiple Upload Foto & Video Album)"
                  : "Klik atau Seret Berkas Foto / Video"}
              </p>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                {isAlbumMode
                  ? "Bisa memilih banyak file sekaligus (JPG, PNG, WEBP, MP4, WEBM)"
                  : "Pilih 1 file foto (JPG/PNG) atau video (MP4)"}
              </p>
            </div>
            <input
              type="file"
              multiple={isAlbumMode}
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files);
                }
              }}
            />
          </label>

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
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            href="/dashboard/galeri"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isAlbumMode ? "Simpan Album ke Database" : "Simpan Galeri ke Database"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
