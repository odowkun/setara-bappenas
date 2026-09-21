"use client";

import React, { useEffect, useState } from "react";
import {
  Youtube,
  Save,
  Loader2,
  CheckCircle2,
  Calendar,
  MapPin,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";
import { toast } from "@/lib/swal";
import {
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "@/services/heroVideoService";
import { OFFICIAL_YOUTUBE_VIDEO } from "@/data/socialMediaData";

export default function YouTubeSocialMediaSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingTentang, setExistingTentang] = useState<any>(null);

  // Form states
  const [videoUrl, setVideoUrl] = useState(OFFICIAL_YOUTUBE_VIDEO.videoUrl);
  const [title, setTitle] = useState(OFFICIAL_YOUTUBE_VIDEO.title);
  const [description, setDescription] = useState(OFFICIAL_YOUTUBE_VIDEO.description);
  const [date, setDate] = useState(OFFICIAL_YOUTUBE_VIDEO.date);
  const [location, setLocation] = useState(OFFICIAL_YOUTUBE_VIDEO.location);
  const [channelTitle, setChannelTitle] = useState(OFFICIAL_YOUTUBE_VIDEO.channelTitle);
  const [channelUrl, setChannelUrl] = useState(OFFICIAL_YOUTUBE_VIDEO.channelUrl);

  const youtubeId = extractYouTubeId(videoUrl);
  const isYouTube = Boolean(youtubeId);
  const thumbnailPreview = youtubeId
    ? getYouTubeThumbnailUrl(youtubeId, "maxres")
    : "/images/bappeda/fgd-keuangan.png";

  useEffect(() => {
    fetch(`${API_BASE_URL}/profil/tentang`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json?.data) return;
        setExistingTentang(json.data);
        const meta = json.data.meta_json;
        if (meta) {
          if (meta.youtube_featured_url) setVideoUrl(meta.youtube_featured_url);
          if (meta.youtube_featured_title) setTitle(meta.youtube_featured_title);
          if (meta.youtube_featured_desc) setDescription(meta.youtube_featured_desc);
          if (meta.youtube_featured_date) setDate(meta.youtube_featured_date);
          if (meta.youtube_featured_location) setLocation(meta.youtube_featured_location);
          if (meta.youtube_featured_channel) setChannelTitle(meta.youtube_featured_channel);
          if (meta.youtube) setChannelUrl(meta.youtube);
        }
      })
      .catch((err) => console.error("Gagal memuat profil tentang:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isYouTube) {
      toast.error("Format link YouTube tidak valid. Harap masukkan tautan video YouTube yang benar.");
      return;
    }

    setSaving(true);
    try {
      const prevMeta = existingTentang?.meta_json || {};
      const res = await authenticatedFetch("/profil/tentang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: existingTentang?.title || "Tentang BAPPEDA Halmahera Utara",
          subtitle:
            existingTentang?.subtitle ||
            "Sejarah Pembentukan dan Peran Strategis BAPPEDA Kabupaten Halmahera Utara",
          content: existingTentang?.content || "",
          meta_json: {
            ...prevMeta,
            youtube_featured_url: videoUrl.trim(),
            youtube_featured_title: title.trim(),
            youtube_featured_desc: description.trim(),
            youtube_featured_date: date.trim(),
            youtube_featured_location: location.trim(),
            youtube_featured_channel: channelTitle.trim(),
            youtube: channelUrl.trim() || prevMeta.youtube,
          },
        }),
      });

      if (res.ok) {
        toast.success("Video YouTube unggulan berhasil diperbarui dan tayang di Beranda!");
      } else {
        toast.error("Gagal menyimpan pengaturan video YouTube.");
      }
    } catch {
      toast.error("Terjadi kendala koneksi saat menyimpan pengaturan video.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setVideoUrl(OFFICIAL_YOUTUBE_VIDEO.videoUrl);
    setTitle(OFFICIAL_YOUTUBE_VIDEO.title);
    setDescription(OFFICIAL_YOUTUBE_VIDEO.description);
    setDate(OFFICIAL_YOUTUBE_VIDEO.date);
    setLocation(OFFICIAL_YOUTUBE_VIDEO.location);
    setChannelTitle(OFFICIAL_YOUTUBE_VIDEO.channelTitle);
    setChannelUrl(OFFICIAL_YOUTUBE_VIDEO.channelUrl);
    toast.success("Formulir direset ke pengaturan default siaran resmi.");
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Memuat konfigurasi video YouTube...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-red-700 text-[10px] font-black uppercase tracking-wider">
            <Youtube className="w-3.5 h-3.5 text-red-600" />
            <span>Kanal Media Sosial — Beranda Publik</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Pengaturan Video YouTube Siaran Resmi
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Kelola tautan video YouTube yang disematkan secara khusus pada kolom kiri kartu media sosial di beranda portal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <form onSubmit={handleSave} className="space-y-4">
            {/* YouTube Video URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>Link / URL Video YouTube *</span>
                </span>
                {isYouTube ? (
                  <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ID: {youtubeId}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold">
                    Contoh: https://www.youtube.com/watch?v=...
                  </span>
                )}
              </label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=ABs7uaqojsY"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Mendukung format tautan YouTube biasa, short link (youtu.be), shorts, maupun live stream.
              </p>
            </div>

            {/* Video Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Siaran / Agenda *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul siaran video kegiatan..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Date & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tanggal Kegiatan</span>
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="Contoh: 17 September 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lokasi Kegiatan</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Ruang Rapat Utama BAPPEDA, Tobelo"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Video Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Ringkas Siaran
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan ringkasan singkat kegiatan yang ada di dalam video..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
              />
            </div>

            {/* Channel Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kanal YouTube
                </label>
                <input
                  type="text"
                  value={channelTitle}
                  onChange={(e) => setChannelTitle(e.target.value)}
                  placeholder="Bappeda Halmahera Utara Official"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Kanal YouTube
                </label>
                <input
                  type="url"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@bappedahalmaherautara"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan &amp; Tayangkan Video YouTube</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Live Preview Card (Sama Persis di Beranda)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              Responsif
            </span>
          </div>

          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Video Player / Thumbnail Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
              {youtubeId ? (
                <iframe
                  src={getYouTubeEmbedUrl(youtubeId, false)}
                  title={title || "Preview Video"}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                  <p className="text-xs font-bold">Masukkan URL YouTube untuk melihat pratinjau</p>
                </div>
              )}
            </div>

            {/* Bottom Metadata */}
            <div className="p-5 bg-slate-950 text-white space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{date || "Tanggal Siaran"}</span>
                <span className="text-slate-600">•</span>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 truncate">{location || "Lokasi"}</span>
              </div>

              <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-2">
                {title || "Judul Video Siaran Resmi"}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {description || "Deskripsi ringkas materi dan paparan perencanaan pembangunan..."}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-[10px] text-slate-400">
                  Kanal: <strong className="text-white">{channelTitle}</strong>
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400">
                  <span>YouTube Official</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
