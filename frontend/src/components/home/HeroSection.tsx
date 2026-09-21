"use client";

import React, { useState, useRef } from "react";
import { DocumentQuickMenu } from "@/components/documents/DocumentQuickMenu";
import { SkeletonImage } from "@/components/ui/SkeletonImage";
import {
  GoldenBell3D,
  Calendar3D,
  BudgetCash3D,
  BlueFolder3D,
} from "@/components/ui/Icons3D";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";

import { SeamlessBackgroundVideo } from "@/components/home/SeamlessBackgroundVideo";
import {
  heroVideoService,
  HeroVideoSetting,
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "@/services/heroVideoService";

export const HeroSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heroVideo, setHeroVideo] = useState<HeroVideoSetting | null>(null);

  React.useEffect(() => {
    heroVideoService
      .getHeroVideo()
      .then((data) => {
        if (data) setHeroVideo(data);
      })
      .catch((err) => {
        console.warn("[HeroSection] Gagal memuat hero video setting:", err);
      });
  }, []);

  const currentVideoUrl = heroVideo?.video_url || "/videos/sambutan-bappenas.mp4";
  const youtubeId = extractYouTubeId(currentVideoUrl);
  const isYouTube = Boolean(youtubeId);
  const effectivePoster =
    heroVideo?.poster_url ||
    (youtubeId ? getYouTubeThumbnailUrl(youtubeId, "maxres") : "/images/bappeda/fgd-keuangan.png");

  const togglePlay = async () => {
    if (isYouTube) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError") {
            console.error("Video play error:", err);
          }
          setIsPlaying(false);
        }
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };


  return (
    <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-14 overflow-hidden bg-blue-900">
      {/* SEAMLESS BACKGROUND VIDEO: Dual-Video Crossfade with Deep Royal Blue & Gold Overlay Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <SeamlessBackgroundVideo
          srcWebm="/videos/pulau-meti.webm"
          srcMp4="/videos/pulau-meti.mp4"
        />
        {/* Royal Blue & Navy Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-blue-900/90 to-white z-20 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-9 relative z-20">
        {/* CLEAN REFINED HEADLINE */}
        <div className="text-center max-w-4xl sm:max-w-5xl mx-auto pt-2 sm:pt-4">
          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold text-white leading-snug sm:leading-[1.2] tracking-tight drop-shadow-md">
            Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl lg:text-2xl font-extrabold text-amber-300 tracking-wider sm:tracking-widest uppercase drop-shadow-md">
            &ldquo;Sinergi Lokal, Solusi Global&rdquo;
          </p>
        </div>

        <DocumentQuickMenu floatingOnScroll showTicker />

        {/* SINGLE PROPORTIONAL HERO OPENING VIDEO PRESENTATION CARD */}
        {(heroVideo?.is_active ?? true) && (
          <div className="max-w-3xl lg:max-w-4xl mx-auto pt-1 sm:pt-3">
            <div className="relative rounded-2xl sm:rounded-[32px] overflow-hidden border-2 sm:border-4 border-white/90 shadow-2xl bg-slate-950 aspect-video group">
              {isYouTube ? (
                /* YouTube Video Player Embed */
                isPlaying ? (
                  <div className="absolute inset-0 z-20 bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(youtubeId!, true)}
                      title={heroVideo?.title || "Video Sambutan BAPPEDA"}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                    <button
                      type="button"
                      onClick={() => setIsPlaying(false)}
                      className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] sm:text-xs font-extrabold backdrop-blur-md border border-white/20 shadow-xl cursor-pointer transition active:scale-95"
                      title="Tutup Video Sambutan"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      <span>Tutup Video</span>
                    </button>
                  </div>
                ) : null
              ) : (
                /* HTML5 Video Player with Dynamic Key for instant update */
                <video
                  ref={videoRef}
                  key={currentVideoUrl}
                  src={currentVideoUrl}
                  poster={effectivePoster}
                  playsInline
                  loop
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-102"
                />
              )}

              {/* Poster Skeleton Fallback if video isn't playing */}
              {!isPlaying && (
                <div className="absolute inset-0 pointer-events-none">
                  <SkeletonImage
                    src={effectivePoster}
                    alt="Video Sambutan Pembukaan"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
                </div>
              )}

              {/* Video Header Badge Overlay */}
              {!isPlaying && (
                <div className="absolute top-3.5 sm:top-5 left-3.5 sm:left-5 right-3.5 sm:right-5 z-20 flex items-center justify-between pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-bold shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                    <span>
                      {heroVideo?.badge_title || "VIDEO SAMBUTAN PEMBUKAAN"}
                    </span>
                  </div>

                  {(heroVideo?.badge_subtitle || !heroVideo) && (
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-blue-950 bg-amber-400 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-amber-300">
                      {heroVideo?.badge_subtitle || "Pembangunan Halut 2026"}
                    </div>
                  )}
                </div>
              )}

              {/* Center Interactive Big 3D Play Button (GOLDEN ACCENT) */}
              {!isPlaying && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={togglePlay}
                    className="pointer-events-auto w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-amber-400 hover:bg-amber-300 text-blue-950 backdrop-blur-xl flex items-center justify-center shadow-2xl border-2 sm:border-4 border-white/80 transform hover:scale-110 active:scale-95 transition duration-300 group-hover:shadow-amber-400/50 cursor-pointer"
                    aria-label="Play Video"
                  >
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 text-blue-950 fill-blue-950 ml-0.5 sm:ml-1" />
                  </button>
                </div>
              )}

              {/* Video Footer Metadata & Control Bar */}
              {!isPlaying && (
                <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-end justify-between gap-3 sm:gap-4">
                  <div className="space-y-1 max-w-xl sm:max-w-2xl">
                    <h3 className="text-sm sm:text-lg font-black text-white leading-snug drop-shadow-md">
                      {heroVideo?.title || "Sambutan & Arah Kebijakan Pembangunan"}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {heroVideo?.subtitle ||
                        "Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara."}
                    </p>
                  </div>

                  {/* Quick Audio & Fullscreen Buttons for Direct Video */}
                  {!isYouTube && (
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        onClick={toggleMute}
                        className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md transition border border-white/30 cursor-pointer"
                        title={isMuted ? "Unmute Audio" : "Mute Audio"}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        ) : (
                          <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            if (videoRef.current.requestFullscreen) {
                              videoRef.current.requestFullscreen();
                            }
                          }
                        }}
                        className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md transition border border-white/30 cursor-pointer"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
