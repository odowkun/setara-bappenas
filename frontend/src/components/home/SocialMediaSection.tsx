"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Youtube,
  Instagram,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Share2,
  Calendar,
  MapPin,
  Sparkles,
  Heart,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import { API_BASE_URL } from "@/lib/apiClient";
import { extractYouTubeId } from "@/services/heroVideoService";
import {
  OFFICIAL_YOUTUBE_VIDEO,
  OFFICIAL_INSTAGRAM_PROFILE,
  OFFICIAL_INSTAGRAM_POSTS,
  type InstagramPostData,
  type YouTubeVideoData,
} from "@/data/socialMediaData";

export const SocialMediaSection: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<InstagramPostData | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [youtubeData, setYoutubeData] = useState<YouTubeVideoData>(OFFICIAL_YOUTUBE_VIDEO);

  // Fetch dynamic YouTube video settings from backend if available
  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/profil/tentang`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted || !json?.data?.meta_json) return;
        const meta = json.data.meta_json;
        if (meta.youtube_featured_url) {
          const ytId = extractYouTubeId(meta.youtube_featured_url);
          if (ytId) {
            setYoutubeData({
              id: "yt-dynamic",
              youtubeId: ytId,
              videoUrl: meta.youtube_featured_url,
              title: meta.youtube_featured_title || OFFICIAL_YOUTUBE_VIDEO.title,
              description: meta.youtube_featured_desc || OFFICIAL_YOUTUBE_VIDEO.description,
              date: meta.youtube_featured_date || OFFICIAL_YOUTUBE_VIDEO.date,
              location: meta.youtube_featured_location || OFFICIAL_YOUTUBE_VIDEO.location,
              badge: meta.youtube_featured_badge || "Siaran Resmi BAPPEDA HALUT",
              channelTitle: meta.youtube_featured_channel || OFFICIAL_YOUTUBE_VIDEO.channelTitle,
              channelUrl: meta.youtube || OFFICIAL_YOUTUBE_VIDEO.channelUrl,
            });
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedPost) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedPost(null);
        } else if (e.key === "ArrowLeft") {
          handlePrevImage();
        } else if (e.key === "ArrowRight") {
          handleNextImage();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedPost, currentImageIndex]);

  const handleOpenPost = (post: InstagramPostData) => {
    setSelectedPost(post);
    setCurrentImageIndex(0);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedPost) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? selectedPost.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedPost) return;
    setCurrentImageIndex((prev) =>
      prev === selectedPost.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="w-full pt-4 pb-10 sm:pb-16 font-sans">
      {/* SECTION CONTAINER */}
      <div className="space-y-6 sm:space-y-8">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-slate-100 pb-5">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Publikasi Multimedia &amp; Media Sosial</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Kanal Media Sosial BAPPEDA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Ikuti siaran langsung, liputan kegiatan musrenbang, dan warta perencanaan daerah melalui kanal YouTube dan postingan Instagram resmi BAPPEDA Halmahera Utara.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <a
              href={youtubeData.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-xs"
            >
              <Youtube className="w-4 h-4 text-red-600" />
              <span>Kanal YouTube</span>
            </a>
            <a
              href={OFFICIAL_INSTAGRAM_PROFILE.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/80 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-xs"
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram Resmi</span>
            </a>
          </div>
        </div>

        {/* 2-COLUMN SHOWCASE (YOUTUBE ON LEFT + INSTAGRAM ON RIGHT, DESKTOP EQUAL HEIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: YOUTUBE OFFICIAL VIDEO PLAYER (5 of 12 Cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden group h-full">
            {/* VIDEO PLAYER FRAME (Stretches on Desktop to Match Instagram Height) */}
            <div className="relative w-full overflow-hidden bg-black flex items-center justify-center aspect-video lg:aspect-auto lg:flex-1 min-h-[280px] lg:min-h-[360px]">
              {isPlayingVideo ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeData.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={youtubeData.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 absolute inset-0"
                />
              ) : (
                <div
                  onClick={() => setIsPlayingVideo(true)}
                  className="relative w-full h-full cursor-pointer group/video"
                >
                  {/* Video Poster Thumbnail */}
                  <ProgressiveImage
                    src={`https://img.youtube.com/vi/${youtubeData.youtubeId}/maxresdefault.jpg`}
                    alt={youtubeData.title}
                    fallbackSrc="/images/bappeda/fgd-keuangan.png"
                    className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover/video:opacity-100"
                    containerClassName="w-full h-full absolute inset-0"
                  />

                  {/* Dark Cinematic Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top Bar Header Overlay */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 pointer-events-none">
                    <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                        <Youtube className="w-3.5 h-3.5 fill-white" />
                      </div>
                      <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-xs">
                        {youtubeData.channelTitle}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                      HD VIDEO
                    </span>
                  </div>

                  {/* Big Play Button in Center */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/60 group-hover/video:scale-115 transition-transform duration-300 ring-4 ring-white/20">
                      <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white ml-1" />
                    </div>
                  </div>

                  {/* Bottom Video Progress Preview Bar (Matching YouTube Style in Image 2) */}
                  <div className="absolute bottom-3 inset-x-3.5 z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold drop-shadow-md">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>Putar Video Siaran Resmi</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white/80 text-[10px] font-mono">
                      YouTube Official
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* VIDEO METADATA & ACTION */}
            <div className="p-5 sm:p-6 bg-slate-950 text-white flex flex-col justify-between gap-3 sm:gap-4 shrink-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{youtubeData.date}</span>
                  <span className="text-slate-600">•</span>
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300 truncate">{youtubeData.location}</span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2">
                  {youtubeData.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-normal">
                  {youtubeData.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 truncate max-w-[200px]">
                  Kanal: <strong className="text-white">{youtubeData.channelTitle}</strong>
                </span>

                <a
                  href={youtubeData.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-red-400 hover:text-red-300 transition shrink-0"
                >
                  <span>Tonton di YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: INSTAGRAM FEED SHOWCASE (7 of 12 Cols, 6 POSTS) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg p-4 sm:p-6 space-y-4 h-full">
            {/* INSTAGRAM HEADER BRANDING */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
                  <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                    <img
                      src={OFFICIAL_INSTAGRAM_PROFILE.avatarUrl}
                      alt={OFFICIAL_INSTAGRAM_PROFILE.displayName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-slate-900 text-base tracking-tight">
                      {OFFICIAL_INSTAGRAM_PROFILE.displayName}
                    </h3>
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black" title="Akun Resmi Terverifikasi">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    {OFFICIAL_INSTAGRAM_PROFILE.tagline}
                  </p>
                </div>
              </div>

              <a
                href={OFFICIAL_INSTAGRAM_PROFILE.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-95 transition cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Ikuti</span>
              </a>
            </div>

            {/* INSTAGRAM CARDS GRID (6 CARDS MATCHING USER REQUEST) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
              {OFFICIAL_INSTAGRAM_POSTS.slice(0, 6).map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleOpenPost(post)}
                  className="group/card flex flex-col justify-between bg-slate-50 hover:bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 hover:border-pink-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden p-2.5 space-y-2 select-none"
                >
                  {/* Card Header Text */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider uppercase text-blue-700 line-clamp-1">
                      {post.category}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-tight group-hover/card:text-blue-600 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {post.date}
                    </p>
                  </div>

                  {/* Card Bottom Thumbnail Image */}
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 shadow-inner">
                    <ProgressiveImage
                      src={post.images[0]}
                      alt={post.title}
                      fallbackSrc="/images/bappeda/default-news-cover.jpg"
                      className="w-full h-full object-cover group-hover/card:scale-108 transition-transform duration-500"
                      containerClassName="w-full h-full absolute inset-0"
                    />

                    {/* Instagram Icon Overlay on Hover */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/90 text-pink-600 flex items-center justify-center shadow-lg transform scale-80 group-hover/card:scale-100 transition-transform">
                        <Instagram className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Multiple Photos Badge */}
                    {post.images.length > 1 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold">
                        1/{post.images.length}
                      </span>
                    )}
                  </div>

                  {/* Read More Link */}
                  <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-blue-600 group-hover/card:text-blue-700">
                    <span>Baca Selengkapnya</span>
                    <ChevronRight className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* INSTAGRAM FOOTER LINK */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>
                Akun Resmi: <strong className="text-slate-800 font-bold">{OFFICIAL_INSTAGRAM_PROFILE.handle}</strong>
              </span>
              <a
                href={OFFICIAL_INSTAGRAM_PROFILE.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-700 font-bold inline-flex items-center gap-1 transition"
              >
                <span>Lihat Semua Postingan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTAGRAM POST DETAIL MODAL (Matching Image 3) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Close Button Top Right */}
              <button
                onClick={() => setSelectedPost(null)}
                aria-label="Tutup Modal"
                className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* MODAL LEFT: PHOTO CAROUSEL */}
              <div className="relative md:w-7/12 bg-black flex items-center justify-center overflow-hidden aspect-square md:aspect-auto md:min-h-[500px]">
                <ProgressiveImage
                  key={currentImageIndex}
                  src={selectedPost.images[currentImageIndex]}
                  alt={selectedPost.title}
                  fallbackSrc="/images/bappeda/default-news-cover.jpg"
                  className="w-full h-full object-contain"
                  containerClassName="w-full h-full flex items-center justify-center"
                />

                {/* Left/Right Carousel Arrows */}
                {selectedPost.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      aria-label="Foto Sebelumnya"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-white flex items-center justify-center transition active:scale-90 cursor-pointer z-20"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      aria-label="Foto Selanjutnya"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-white flex items-center justify-center transition active:scale-90 cursor-pointer z-20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Pagination Dots at Bottom */}
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20">
                      {selectedPost.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          aria-label={`Slide ${idx + 1}`}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            currentImageIndex === idx
                              ? "w-6 bg-white shadow-md"
                              : "w-2 bg-white/40 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Subtle Brand Watermark at Bottom Left */}
                <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-1 text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                  <span>bappeda.halmaherautarakab.go.id</span>
                </div>
              </div>

              {/* MODAL RIGHT: INSTAGRAM PROFILE & CAPTION (Matching Image 3) */}
              <div className="md:w-5/12 bg-slate-900 text-white flex flex-col justify-between overflow-hidden border-t md:border-t-0 md:border-l border-slate-800">
                {/* Profile Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                      <div className="w-full h-full rounded-full bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden">
                        <img
                          src={OFFICIAL_INSTAGRAM_PROFILE.avatarUrl}
                          alt={OFFICIAL_INSTAGRAM_PROFILE.displayName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-white">
                          {OFFICIAL_INSTAGRAM_PROFILE.handle}
                        </span>
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black">
                          ✓
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {selectedPost.category} • {selectedPost.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Caption Content */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {selectedPost.title}
                    </h3>
                  </div>

                  <div className="whitespace-pre-line text-slate-300">
                    {selectedPost.caption}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <span>{selectedPost.likesCount} suka</span>
                  </div>

                  <a
                    href={selectedPost.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 transition active:scale-95 cursor-pointer"
                  >
                    <span>Buka di Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
