"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  type InstagramProfileData,
  type YouTubeVideoData,
} from "@/data/socialMediaData";

export const SocialMediaSection: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [selectedPost, setSelectedPost] = useState<InstagramPostData | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [youtubeData, setYoutubeData] = useState<YouTubeVideoData>(OFFICIAL_YOUTUBE_VIDEO);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPostData[]>(OFFICIAL_INSTAGRAM_POSTS);
  const [instagramProfile, setInstagramProfile] = useState<InstagramProfileData>(OFFICIAL_INSTAGRAM_PROFILE);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dynamic YouTube video & Instagram settings from backend if available
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

        // Dynamic Instagram posts from dashboard
        if (Array.isArray(meta.instagram_posts) && meta.instagram_posts.length > 0) {
          setInstagramPosts(meta.instagram_posts);
        }

        // Dynamic Instagram profile from dashboard
        if (meta.instagram_profile) {
          setInstagramProfile((prev) => ({
            ...prev,
            ...meta.instagram_profile,
          }));
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
        <div className="space-y-2 sm:space-y-3 max-w-3xl border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] sm:text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Publikasi Multimedia &amp; Media Sosial</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Kanal Media Sosial BAPPEDA
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Ikuti siaran langsung, liputan kegiatan musrenbang, dan warta perencanaan daerah melalui kanal YouTube dan postingan Instagram resmi BAPPEDA Halmahera Utara.
          </p>
        </div>

        {/* 2-COLUMN BALANCED SHOWCASE (YOUTUBE PURE VIDEO ON LEFT + INSTAGRAM FEED ON RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: YOUTUBE OFFICIAL VIDEO (WITH MATCHING HEADER BRANDING) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg p-4 sm:p-5 space-y-3.5 h-full">
            {/* YOUTUBE HEADER BRANDING (Matching Instagram's Header Exactly) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-md shrink-0">
                  <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                    <img
                      src={instagramProfile.avatarUrl || "/images/bappeda/logo-halut.png"}
                      alt={youtubeData.channelTitle}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                      {youtubeData.channelTitle || "BAPPEDA HALUT OFFICIAL"}
                    </h3>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black" title="Kanal Resmi Terverifikasi">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 line-clamp-1">
                    Kanal Video Dokumentasi &amp; Siaran Resmi BAPPEDA
                  </p>
                </div>
              </div>

              <a
                href={youtubeData.channelUrl || "https://www.youtube.com/@bappedahalmaherautara"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition cursor-pointer shrink-0"
              >
                <Youtube className="w-3.5 h-3.5 fill-white" />
                <span>Berlangganan</span>
              </a>
            </div>

            {/* TRUE 16:9 WIDESCREEN VIDEO FRAME (Never stretched or cropped) */}
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-md border border-slate-200/80 group/video flex-1">
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
                  className="relative w-full h-full cursor-pointer"
                >
                  {/* Video Poster Thumbnail (True 16:9 aspect ratio, 0% squish or crop) */}
                  <ProgressiveImage
                    src={`https://img.youtube.com/vi/${youtubeData.youtubeId}/maxresdefault.jpg`}
                    alt={youtubeData.title}
                    fallbackSrc="/images/bappeda/fgd-keuangan.png"
                    className="w-full h-full object-cover group-hover/video:scale-103 transition-transform duration-700 ease-out opacity-95 group-hover/video:opacity-100"
                    containerClassName="w-full h-full absolute inset-0"
                  />

                  {/* Subtle Dark Vignette for contrast on video overlay elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

                  {/* Top Bar Overlay */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-md">
                      <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                        <Youtube className="w-2.5 h-2.5 fill-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white tracking-wide truncate max-w-[160px] sm:max-w-xs">
                        {youtubeData.channelTitle}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow-md animate-pulse">
                      HD VIDEO
                    </span>
                  </div>

                  {/* Big Play Button in Center */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/70 group-hover/video:scale-110 group-hover/video:bg-red-500 transition-all duration-300 ring-4 ring-white/25">
                      <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Status Bar */}
                  <div className="absolute bottom-3 inset-x-3.5 z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 text-white/95 text-[11px] font-semibold drop-shadow-md">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>Putar Video Siaran Resmi</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white/90 text-[9px] font-mono border border-white/10">
                      YouTube Official
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* YOUTUBE FOOTER LINK (Matching Instagram's Footer Exactly) */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span className="text-[11px] truncate max-w-[200px] sm:max-w-xs">
                Siaran: <strong className="text-slate-800 font-bold">{youtubeData.title}</strong>
              </span>
              <a
                href={youtubeData.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1 text-xs transition shrink-0"
              >
                <span>Tonton di YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: INSTAGRAM FEED (2 BALANCED CARDS IN 2-COLS, EQUAL HEIGHT) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg p-4 sm:p-5 space-y-3.5 h-full">
            {/* INSTAGRAM HEADER BRANDING */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md shrink-0">
                  <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                    <img
                      src={instagramProfile.avatarUrl}
                      alt={instagramProfile.displayName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                      {instagramProfile.displayName}
                    </h3>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black" title="Akun Resmi Terverifikasi">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 line-clamp-1">
                    {instagramProfile.tagline}
                  </p>
                </div>
              </div>

              <a
                href={instagramProfile.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-95 transition cursor-pointer shrink-0"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Ikuti</span>
              </a>
            </div>

            {/* INSTAGRAM CARDS GRID (2 BALANCED CARDS IN 2 COLUMNS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {instagramPosts.slice(0, 2).map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleOpenPost(post)}
                  className="group/card flex flex-col justify-between bg-slate-50 hover:bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 hover:border-pink-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden p-2.5 space-y-2 select-none"
                >
                  {/* Card Header Text */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                      {post.category}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 line-clamp-1 group-hover/card:text-blue-600 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {post.date}
                    </p>
                  </div>

                  {/* Card Bottom Thumbnail Image */}
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-200 shadow-inner">
                    <ProgressiveImage
                      src={post.images[0]}
                      alt={post.title}
                      fallbackSrc="/images/bappeda/default-news-cover.jpg"
                      className="w-full h-full object-cover group-hover/card:scale-106 transition-transform duration-500"
                      containerClassName="w-full h-full absolute inset-0"
                    />

                    {/* Instagram Icon Overlay on Hover */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/95 text-pink-600 flex items-center justify-center shadow-md transform scale-80 group-hover/card:scale-100 transition-transform">
                        <Instagram className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Multiple Photos Badge */}
                    {post.images.length > 1 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-xs text-white text-[9px] font-bold">
                        1/{post.images.length}
                      </span>
                    )}
                  </div>

                  {/* Read More Link */}
                  <div className="pt-0.5 flex items-center justify-between text-[11px] font-bold text-blue-600 group-hover/card:text-blue-700">
                    <span>Baca Selengkapnya</span>
                    <ChevronRight className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* INSTAGRAM FOOTER LINK */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span className="text-[11px]">
                Akun: <strong className="text-slate-800 font-bold">{instagramProfile.handle}</strong>
              </span>
              <a
                href={instagramProfile.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-700 font-bold inline-flex items-center gap-1 text-xs transition"
              >
                <span>Lihat Semua Postingan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTAGRAM POST DETAIL MODAL (Portaled to document.body to prevent scroll jumping) */}
      {/* ========================================================================= */}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedPost && (
              <div
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                className="fixed inset-0 z-[999999] overflow-y-auto"
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedPost(null)}
                  className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
                />

                {/* Centering Flex Wrapper (min-h-full prevents Flexbox negative scroll clipping) */}
                <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
                  {/* Modal Dialog Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-5xl my-auto text-left bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[85vh] md:h-[560px] lg:h-[600px]"
                  >
                    {/* Close Button Top Right */}
                    <button
                      onClick={() => setSelectedPost(null)}
                      aria-label="Tutup Modal"
                      className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* MODAL LEFT: PHOTO CAROUSEL */}
                    <div className="relative md:w-7/12 bg-black flex items-center justify-center overflow-hidden aspect-square md:aspect-auto md:h-full">
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

                    {/* MODAL RIGHT: INSTAGRAM PROFILE & CAPTION */}
                    <div className="md:w-5/12 bg-slate-900 text-white flex flex-col justify-between overflow-hidden border-t md:border-t-0 md:border-l border-slate-800 md:h-full">
                      {/* Profile Header */}
                      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                            <div className="w-full h-full rounded-full bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden">
                              <img
                                src={instagramProfile.avatarUrl}
                                alt={instagramProfile.displayName}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-white">
                                {instagramProfile.handle}
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
                      <div
                        data-lenis-prevent="true"
                        data-lenis-prevent-wheel="true"
                        className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal"
                      >
                        <div className="space-y-1.5">
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
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
};
