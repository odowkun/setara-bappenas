"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Video,
  Upload,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Link2,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/lib/swal";
import {
  heroVideoService,
  HeroVideoSetting,
  HeroVideoPayload,
} from "@/services/heroVideoService";

export default function HeroVideoSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Form state
  const [videoUrl, setVideoUrl] = useState("/videos/sambutan-bappenas.mp4");
  const [posterUrl, setPosterUrl] = useState("/images/bappeda/fgd-keuangan.png");
  const [badgeTitle, setBadgeTitle] = useState("VIDEO SAMBUTAN PEMBUKAAN");
  const [badgeSubtitle, setBadgeSubtitle] = useState("Pembangunan Halut 2026");
  const [title, setTitle] = useState("Sambutan & Arah Kebijakan Pembangunan");
  const [subtitle, setSubtitle] = useState(
    "Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara."
  );
  const [isActive, setIsActive] = useState(true);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  // Preview video state
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);

  // File input refs
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = async () => {
    setLoading(true);
    const data = await heroVideoService.getAdminHeroVideo();
    if (data) {
      setVideoUrl(data.video_url || "/videos/sambutan-bappenas.mp4");
      setPosterUrl(data.poster_url || "/images/bappeda/fgd-keuangan.png");
      setBadgeTitle(data.badge_title || "VIDEO SAMBUTAN PEMBUKAAN");
      setBadgeSubtitle(data.badge_subtitle || "Pembangunan Halut 2026");
      setTitle(data.title || "Sambutan & Arah Kebijakan Pembangunan");
      setSubtitle(
        data.subtitle ||
          "Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara."
      );
      setIsActive(data.is_active ?? true);
      setLastUpdatedBy(data.updated_by || null);
      setLastUpdatedAt(data.updated_at || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Ukuran video melebihi batas maksimal (100MB).");
      return;
    }

    setUploadingVideo(true);
    const res = await heroVideoService.uploadFile(file);
    setUploadingVideo(false);

    if (res.success && res.url) {
      setVideoUrl(res.url);
      toast.success("File video berhasil diunggah!");
    } else {
      toast.error(res.message || "Gagal mengunggah video.");
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran gambar melebihi batas maksimal (10MB).");
      return;
    }

    setUploadingPoster(true);
    const res = await heroVideoService.uploadFile(file);
    setUploadingPoster(false);

    if (res.success && res.url) {
      setPosterUrl(res.url);
      toast.success("Cover poster berhasil diunggah!");
    } else {
      toast.error(res.message || "Gagal mengunggah poster.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      toast.error("URL atau file video tidak boleh kosong.");
      return;
    }
    if (!title.trim()) {
      toast.error("Judul video sambutan tidak boleh kosong.");
      return;
    }

    setSaving(true);
    const payload: HeroVideoPayload = {
      video_url: videoUrl.trim(),
      poster_url: posterUrl?.trim() || null,
      badge_title: badgeTitle.trim(),
      badge_subtitle: badgeSubtitle.trim(),
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      is_active: isActive,
    };

    const res = await heroVideoService.updateHeroVideo(payload);
    setSaving(false);

    if (res.success) {
      toast.success(res.message || "Pengaturan video berhasil disimpan!");
      if (res.data) {
        setLastUpdatedBy(res.data.updated_by || null);
        setLastUpdatedAt(res.data.updated_at || null);
      }
    } else {
      toast.error(res.message || "Gagal menyimpan pengaturan video.");
    }
  };

  const togglePreviewPlay = async () => {
    if (!previewVideoRef.current) return;
    if (previewPlaying) {
      previewVideoRef.current.pause();
      setPreviewPlaying(false);
    } else {
      try {
        await previewVideoRef.current.play();
        setPreviewPlaying(true);
      } catch (err) {
        console.error("Preview video play error:", err);
        setPreviewPlaying(false);
      }
    }
  };

  const togglePreviewMute = () => {
    if (!previewVideoRef.current) return;
    previewVideoRef.current.muted = !previewMuted;
    setPreviewMuted(!previewMuted);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Memuat konfigurasi video sambutan...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Configuration Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 tracking-wider">
            <Video className="w-3.5 h-3.5 text-amber-600" />
            Hero Opening Presentation Video
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Pengaturan Video Sambutan Utama Beranda
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl font-medium leading-relaxed">
            Sesuaikan video pembuka yang tampil pada halaman depan (beranda) portal BAPPEDA. Anda dapat mengunggah file video langsung atau memasukkan URL/path video.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all ${
              isActive
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            {isActive ? (
              <>
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Tayang di Beranda</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-slate-400" />
                <span>Disembunyikan</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-600" />
              <span>Sumber Video &amp; Poster</span>
            </h3>

            {/* Video File / URL Input */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                File / URL Video <span className="text-rose-500">*</span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Contoh: /videos/sambutan-bappenas.mp4 atau https://..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="file"
                  ref={videoFileInputRef}
                  onChange={handleVideoUpload}
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingVideo}
                  onClick={() => videoFileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 font-extrabold text-xs transition border border-blue-200 dark:border-blue-700 shrink-0"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Upload Video (MP4)
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Mendukung file MP4, MOV hingga 100MB yang tersimpan di server lokal atau tautan video langsung.
              </p>
            </div>

            {/* Poster Image / URL Input */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Cover Poster / Thumbnail Video
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="Contoh: /images/bappeda/fgd-keuangan.png atau https://..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="file"
                  ref={posterFileInputRef}
                  onChange={handlePosterUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingPoster}
                  onClick={() => posterFileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-extrabold text-xs transition border border-slate-200 dark:border-slate-700 shrink-0"
                >
                  {uploadingPoster ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5" /> Upload Poster
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Tampil sebagai poster cover saat video belum diputar.
              </p>
            </div>
          </div>

          {/* Metadata & Overlay Badges */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Teks Sambutan &amp; Overlay Badge</span>
            </h3>

            {/* Badge Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Badge Kiri (Label Pembuka)
                </label>
                <input
                  type="text"
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  placeholder="Contoh: VIDEO SAMBUTAN PEMBUKAAN"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Badge Kanan (Aksen Emas)
                </label>
                <input
                  type="text"
                  value={badgeSubtitle}
                  onChange={(e) => setBadgeSubtitle(e.target.value)}
                  placeholder="Contoh: Pembangunan Halut 2026"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Main Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Judul Utama Sambutan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Sambutan & Arah Kebijakan Pembangunan"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Deskripsi Paparan Kebijakan
              </label>
              <textarea
                rows={3}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Contoh: Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {lastUpdatedBy ? (
                <span>
                  Terakhir diperbarui oleh <strong className="text-slate-700 dark:text-slate-300">{lastUpdatedBy}</strong>
                  {lastUpdatedAt ? ` (${new Date(lastUpdatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })})` : ""}
                </span>
              ) : (
                <span>Belum pernah diperbarui kustom.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || uploadingVideo || uploadingPoster}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 transition active:scale-95 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Perubahan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Pengaturan Video
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Interactive Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Pratinjau Langsung (Live Preview)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                Tampilan Beranda
              </span>
            </div>

            {/* Exact Replica of Hero Video Card */}
            <div className="relative rounded-[28px] overflow-hidden border-2 border-white/80 shadow-2xl bg-slate-950 aspect-video group">
              <video
                ref={previewVideoRef}
                poster={posterUrl || "/images/bappeda/fgd-keuangan.png"}
                playsInline
                loop
                muted={previewMuted}
                onPlay={() => setPreviewPlaying(true)}
                onPause={() => setPreviewPlaying(false)}
                className="w-full h-full object-cover"
                key={videoUrl}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>

              {/* Poster Skeleton Fallback if not playing */}
              {!previewPlaying && (
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={posterUrl || "/images/bappeda/fgd-keuangan.png"}
                    alt="Video Cover"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
                </div>
              )}

              {/* Header Badges */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{badgeTitle || "VIDEO SAMBUTAN"}</span>
                </div>

                {badgeSubtitle && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-950 bg-amber-400 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-amber-300">
                    {badgeSubtitle}
                  </div>
                )}
              </div>

              {/* Big Center Play Button */}
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="pointer-events-auto w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 text-blue-950 backdrop-blur-xl flex items-center justify-center shadow-xl border-2 border-white/80 transform hover:scale-105 active:scale-95 transition"
                  aria-label={previewPlaying ? "Pause Video" : "Play Video"}
                >
                  {previewPlaying ? (
                    <Pause className="w-6 h-6 text-blue-950 fill-blue-950" />
                  ) : (
                    <Play className="w-6 h-6 text-blue-950 fill-blue-950 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Footer Metadata & Controls */}
              <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-end justify-between gap-3">
                <div className="space-y-1 max-w-[75%]">
                  <h4 className="text-sm font-black text-white leading-snug line-clamp-1 drop-shadow-sm">
                    {title || "Sambutan & Arah Kebijakan"}
                  </h4>
                  <p className="text-[10px] text-slate-300 font-medium line-clamp-2 leading-relaxed">
                    {subtitle || "Paparan strategi sinkronisasi perencanaan daerah..."}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={togglePreviewMute}
                    className="p-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md transition border border-white/30"
                    title={previewMuted ? "Unmute" : "Mute"}
                  >
                    {previewMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Pratinjau di atas merefleksikan posisi, teks, dan ukuran video persis seperti yang akan dinikmati pengunjung di halaman depan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
