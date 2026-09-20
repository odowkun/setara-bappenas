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
} from "lucide-react";

import { SeamlessBackgroundVideo } from "@/components/home/SeamlessBackgroundVideo";
import { heroVideoService, HeroVideoSetting } from "@/services/heroVideoService";

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

  const togglePlay = async () => {
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
    <section className="relative pt-28 sm:pt-36 pb-8 sm:pb-16 overflow-hidden bg-blue-900">
      {/* SEAMLESS BACKGROUND VIDEO: Dual-Video Crossfade with Deep Royal Blue & Gold Overlay Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <SeamlessBackgroundVideo
          srcWebm="/videos/pulau-meti.webm"
          srcMp4="/videos/pulau-meti.mp4"
        />
        {/* Royal Blue & Navy Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-blue-900/90 to-white z-20 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-12 relative z-20">
        {/* CLEAN THIN HEADLINE */}
        <div className="text-center max-w-4xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-6">
          <h1 className="text-2xl sm:text-5xl lg:text-7xl font-semibold text-white leading-snug sm:leading-[1.15] tracking-normal drop-shadow-md">
            Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara
          </h1>
        </div>

        <DocumentQuickMenu floatingOnScroll showTicker />

        {/* SINGLE FULL-WIDTH HERO OPENING VIDEO PRESENTATION CARD */}
        {(heroVideo?.is_active ?? true) && (
          <div className="max-w-5xl mx-auto pt-4">
            <div className="relative rounded-[36px] overflow-hidden border-4 border-white/90 shadow-2xl bg-slate-950 aspect-video group">
              {/* HTML5 Video Player with Fallback Poster */}
              <video
                ref={videoRef}
                key={heroVideo?.video_url || "/videos/sambutan-bappenas.mp4"}
                poster={heroVideo?.poster_url || "/images/bappeda/fgd-keuangan.png"}
                playsInline
                loop
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-cover transition duration-700 group-hover:scale-102"
              >
                <source
                  src={heroVideo?.video_url || "/videos/sambutan-bappenas.mp4"}
                  type="video/mp4"
                />
              </video>

              {/* Poster Skeleton Fallback if video isn't playing */}
              {!isPlaying && (
                <div className="absolute inset-0 pointer-events-none">
                  <SkeletonImage
                    src={heroVideo?.poster_url || "/images/bappeda/fgd-keuangan.png"}
                    alt="Video Sambutan Pembukaan"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
                </div>
              )}

              {/* Video Header Badge Overlay */}
              <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>
                    {heroVideo?.badge_title || "VIDEO SAMBUTAN PEMBUKAAN"}
                  </span>
                </div>

                {(heroVideo?.badge_subtitle || !heroVideo) && (
                  <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-blue-950 bg-amber-400 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-amber-300">
                    {heroVideo?.badge_subtitle || "Pembangunan Halut 2026"}
                  </div>
                )}
              </div>

              {/* Center Interactive Big 3D Play Button (GOLDEN ACCENT) */}
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <button
                  onClick={togglePlay}
                  className="pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-400 hover:bg-amber-300 text-blue-950 backdrop-blur-xl flex items-center justify-center shadow-2xl border-4 border-white/80 transform hover:scale-110 active:scale-95 transition duration-300 group-hover:shadow-amber-400/50"
                  aria-label={isPlaying ? "Pause Video" : "Play Video"}
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 text-blue-950 fill-blue-950" />
                  ) : (
                    <Play className="w-10 h-10 text-blue-950 fill-blue-950 ml-1" />
                  )}
                </button>
              </div>

              {/* Video Footer Metadata & Control Bar */}
              <div className="absolute bottom-0 inset-x-0 z-20 p-6 sm:p-8 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                    {heroVideo?.title || "Sambutan & Arah Kebijakan Pembangunan"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 leading-relaxed">
                    {heroVideo?.subtitle ||
                      "Paparan strategi sinkronisasi perencanaan pembangunan nasional (RPJPN) dengan Kabupaten Halmahera Utara."}
                  </p>
                </div>

              {/* Quick Audio & Fullscreen Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={toggleMute}
                  className="p-3 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md transition border border-white/30"
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
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
                    className="p-3 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md transition border border-white/30"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
