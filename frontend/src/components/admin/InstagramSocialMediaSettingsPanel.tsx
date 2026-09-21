"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Instagram,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  MoveUp,
  MoveDown,
  ExternalLink,
  Heart,
  Check,
  X,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";
import { toast, showDeleteConfirm, showConfirm } from "@/lib/swal";
import { galeriService } from "@/services/galeriService";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import {
  OFFICIAL_INSTAGRAM_PROFILE,
  OFFICIAL_INSTAGRAM_POSTS,
  type InstagramPostData,
  type InstagramProfileData,
} from "@/data/socialMediaData";

const formatDateToIndonesian = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) return dateStr;
  const [y, m, d] = dateStr.split("-");
  if (y && m && d) {
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthIdx = parseInt(m, 10) - 1;
    const monthName = monthNames[monthIdx] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  }
  return dateStr;
};

export default function InstagramSocialMediaSettingsPanel() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingTentang, setExistingTentang] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Profile states
  const [profile, setProfile] = useState<InstagramProfileData>(OFFICIAL_INSTAGRAM_PROFILE);

  // Posts list state (Exact 2 posts for home grid)
  const [posts, setPosts] = useState<InstagramPostData[]>(OFFICIAL_INSTAGRAM_POSTS.slice(0, 2));

  // Edit / Add modal state (100% automatic via URL)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Quick extract via Instagram URL state
  const [extractUrlInput, setExtractUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<InstagramPostData | null>(null);

  // Load from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/profil/tentang`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json?.data) return;
        setExistingTentang(json.data);
        const meta = json.data.meta_json;
        if (meta) {
          if (Array.isArray(meta.instagram_posts) && meta.instagram_posts.length > 0) {
            setPosts(meta.instagram_posts.slice(0, 2));
          } else {
            setPosts(OFFICIAL_INSTAGRAM_POSTS.slice(0, 2));
          }
          if (meta.instagram_profile) {
            setProfile((prev) => ({
              ...prev,
              ...meta.instagram_profile,
            }));
          }
        }
      })
      .catch((err) => console.error("Gagal memuat profil tentang:", err))
      .finally(() => setLoading(false));
  }, []);

  // Save changes to backend
  const handleSaveToBackend = async (newPosts: InstagramPostData[], newProfile: InstagramProfileData) => {
    setSaving(true);
    try {
      const prevMeta = existingTentang?.meta_json || {};
      const postsToSave = newPosts.slice(0, 2);
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
            instagram_profile: newProfile,
            instagram_posts: postsToSave,
          },
        }),
      });

      if (res.ok) {
        toast.success("Feed Instagram berhasil disimpan!");
      } else {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Gagal menyimpan feed Instagram.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  // Quick auto-extraction handler
  const handleExtractFromInstagram = async (urlToExtract?: string) => {
    const url = (urlToExtract || extractUrlInput).trim();
    if (!url) {
      toast.error("Silakan masukkan tautan postingan Instagram terlebih dahulu.");
      return null;
    }
    if (!url.includes("instagram.com") && !url.includes("instagr.am")) {
      toast.error("URL tidak valid. Harap gunakan link postingan Instagram (cth: https://www.instagram.com/p/...).");
      return null;
    }

    setIsExtracting(true);
    try {
      const data = await galeriService.extractInstagramPost(url);
      const finalDate = data.date
        ? (formatDateToIndonesian(data.date) || data.date)
        : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

      const newPostData: InstagramPostData = {
        id: editingPostId || `ig-${Date.now()}`,
        title: data.title || "Postingan Instagram BAPPEDA",
        category: data.category || "WARTA PERENCANAAN",
        date: finalDate,
        images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ["/images/bappeda/default-news-cover.jpg"],
        caption: data.caption || "",
        likesCount: typeof data.likesCount === "number" && data.likesCount > 0 ? data.likesCount : null,
        postUrl: data.postUrl || url,
      };

      setExtractedPreview(newPostData);
      toast.success("Berhasil mengambil data foto & narasi postingan Instagram!");
      return newPostData;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil data dari Instagram.");
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  // Open modal for Create
  const handleOpenCreateForm = (prefillUrl?: string) => {
    if (posts.length >= 2) {
      toast.error("Maksimal 2 postingan feed Instagram (Slot 1 & Slot 2). Silakan edit atau hapus postingan yang sudah ada.");
      return;
    }
    setEditingPostId(null);
    setExtractUrlInput(prefillUrl || "");
    setExtractedPreview(null);
    setIsFormOpen(true);
  };

  // Open modal for Edit / Ganti via Link
  const handleOpenEditForm = (post: InstagramPostData) => {
    setEditingPostId(post.id);
    setExtractUrlInput(post.postUrl || "");
    setExtractedPreview(post);
    setIsFormOpen(true);
  };

  // Submit Modal Form (100% Automatic)
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();

    let postToSave = extractedPreview;

    // If user hasn't clicked "Tarik Data Otomatis" yet, extract first from input
    if (!postToSave) {
      const trimmed = extractUrlInput.trim();
      if (!trimmed) {
        toast.error("Silakan masukkan tautan postingan Instagram.");
        return;
      }
      postToSave = await handleExtractFromInstagram(trimmed);
      if (!postToSave) return;
    }

    let updatedPosts: InstagramPostData[];
    if (editingPostId) {
      updatedPosts = posts.map((p) => (p.id === editingPostId ? postToSave! : p));
    } else {
      if (posts.length >= 2) {
        toast.error("Maksimal 2 postingan feed Instagram (Slot 1 & Slot 2). Silakan edit postingan yang ada.");
        return;
      }
      updatedPosts = [...posts, postToSave].slice(0, 2);
    }

    setPosts(updatedPosts);
    setIsFormOpen(false);
    await handleSaveToBackend(updatedPosts, profile);
  };

  // Delete post
  const handleDeletePost = async (id: string, title: string) => {
    const res = await showDeleteConfirm(title);
    if (!res.isConfirmed) return;

    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    await handleSaveToBackend(updated, profile);
    toast.success(`Postingan "${title}" berhasil dihapus.`);
  };

  // Move post order
  const handleMovePost = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === posts.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newPosts = [...posts];
    const temp = newPosts[index];
    newPosts[index] = newPosts[targetIndex];
    newPosts[targetIndex] = temp;

    setPosts(newPosts);
    await handleSaveToBackend(newPosts, profile);
  };

  // Reset to default
  const handleResetToDefault = async () => {
    const res = await showConfirm({
      title: "Reset ke 2 Postingan Bawaan?",
      text: "Dua postingan Instagram akan dikembalikan ke data default resmi template BAPPEDA.",
      confirmButtonText: "Ya, Reset Sekarang",
    });
    if (!res.isConfirmed) return;

    const defaultPosts = OFFICIAL_INSTAGRAM_POSTS.slice(0, 2);
    setPosts(defaultPosts);
    setProfile(OFFICIAL_INSTAGRAM_PROFILE);
    await handleSaveToBackend(defaultPosts, OFFICIAL_INSTAGRAM_PROFILE);
    toast.success("Postingan Instagram berhasil di-reset ke 2 postingan default.");
  };

  if (loading) {
    return (
      <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-xs font-semibold text-slate-500">Memuat konfigurasi feed Instagram...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider">
            <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span>Feed Instagram Resmi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Postingan Instagram Media Sosial
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-3xl leading-relaxed">
            Kelola 2 postingan Instagram resmi yang tampil pada kolom kanan kartu media sosial beranda (Slot 1: Kiri, Slot 2: Kanan).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={saving}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateForm()}
            disabled={saving || posts.length >= 2}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50 ${
              posts.length >= 2
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md shadow-pink-500/25"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{posts.length >= 2 ? "Slot Postingan Penuh (2/2)" : "Tambah Postingan Instagram"}</span>
          </button>
        </div>
      </div>

      {/* PROFILE SETTINGS CARD */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-xs">
              <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center">
                <Instagram className="w-4 h-4 text-pink-600" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Profil Akun Instagram Resmi</h3>
              <p className="text-[11px] text-slate-400 font-medium">Informasi akun yang muncul pada header kartu di beranda</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveToBackend(posts, profile)}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Simpan Profil</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Nama Tampilan (Display Name)</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
              placeholder="cth: BAPPEDA HALUT"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Username / Handle</label>
            <input
              type="text"
              value={profile.handle}
              onChange={(e) => setProfile({ ...profile, handle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
              placeholder="cth: @bappeda_halut"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Link URL Profil Instagram</label>
            <input
              type="url"
              value={profile.profileUrl}
              onChange={(e) => setProfile({ ...profile, profileUrl: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
              placeholder="https://www.instagram.com/bappeda_halut"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-700">Tagline / Deskripsi Singkat</label>
            <input
              type="text"
              value={profile.tagline}
              onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
              placeholder="cth: Sinergi Lokal, Solusi Global — Halmahera Utara Hebat"
            />
          </div>
        </div>
      </div>

      {/* POSTS LIST SECTION */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Daftar Postingan Instagram ({posts.length} dari 2 Slot)</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              *Tepat 2 postingan yang tampil berdampingan dengan video YouTube siaran resmi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Tersimpan: <strong className="text-purple-700 font-black">{posts.length} / 2 Postingan</strong>
            </span>
            {posts.length < 2 && (
              <button
                type="button"
                onClick={() => handleOpenCreateForm()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-95 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tarik dari Link IG</span>
              </button>
            )}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
            <Instagram className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Belum ada postingan Instagram yang ditambahkan.</p>
            <button
              type="button"
              onClick={() => handleOpenCreateForm()}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post, idx) => {
              return (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between bg-white border-slate-200 hover:shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Top status bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                          {idx === 0 ? "Slot 1 (Kiri)" : "Slot 2 (Kanan)"}
                        </span>
                        <span className="text-[10px] font-black tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {post.category}
                        </span>
                      </div>

                      {/* Order Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMovePost(idx, "up")}
                          disabled={idx === 0 || saving}
                          title="Geser Naik"
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePost(idx, "down")}
                          disabled={idx === posts.length - 1 || saving}
                          title="Geser Turun"
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content Row */}
                    <div className="flex gap-3.5">
                      {/* Thumbnail Preview */}
                      <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200/80 shadow-inner">
                        <ProgressiveImage
                          src={post.images[0]}
                          alt={post.title}
                          fallbackSrc="/images/bappeda/default-news-cover.jpg"
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full absolute inset-0"
                        />
                        {post.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[8px] font-black flex items-center gap-0.5 shadow-xs">
                            <Layers className="w-2.5 h-2.5 text-pink-400" />
                            <span>{post.images.length} Slide</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Details */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>{post.date}</span>
                          {post.likesCount != null && post.likesCount > 0 ? (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-rose-500 font-bold">
                                <Heart className="w-3 h-3 fill-rose-500" />
                                {post.likesCount}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 italic">Tanpa likes</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {post.caption}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                    >
                      <span>Lihat di Instagram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-2">
                      {post.likesCount != null && post.likesCount > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = posts.map((p) => (p.id === post.id ? { ...p, likesCount: null } : p));
                            setPosts(updated);
                            await handleSaveToBackend(updated, profile);
                            toast.success("Indikator likes dihapus (tanpa likes).");
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                          title="Hapus tampilan likes pada postingan ini"
                        >
                          <span>Hapus Likes</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(post)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id, post.title)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT POST MODAL (PORTALED TO DOCUMENT.BODY TO PREVENT HEADER LEAKS) */}
      {mounted && isFormOpen && createPortal(
        <div className="fixed inset-0 z-[999999] overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingPostId ? "Ganti Postingan Instagram via Link" : "Tambah Postingan Instagram via Link"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cukup masukkan tautan postingan Instagram resmi, data ditarik otomatis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitModal} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* INSTAGRAM LINK INPUT */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-xs shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900 tracking-tight">
                      Tautan Postingan Instagram Resmi
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100/90 px-2.5 py-0.5 rounded-full">
                    100% Otomatis
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Cukup tempel link postingan Instagram BAPPEDA (misal: <code className="text-purple-700 font-mono bg-white/90 px-1.5 py-0.5 rounded text-[11px] font-bold">https://www.instagram.com/p/...</code>). Sistem akan otomatis mendeteksi foto, judul kegiatan, narasi, dan tanggal tanpa perlu input manual.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      required
                      value={extractUrlInput}
                      onChange={(e) => setExtractUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleExtractFromInstagram();
                        }
                      }}
                      placeholder="https://www.instagram.com/p/..."
                      disabled={isExtracting}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-white border border-purple-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-2xs disabled:opacity-50"
                    />
                    {extractUrlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setExtractUrlInput("");
                          setExtractedPreview(null);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExtractFromInstagram()}
                    disabled={isExtracting || !extractUrlInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs transition shrink-0 active:scale-95"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengambil Data...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tarik Data Otomatis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* LIVE EXTRACTED PREVIEW CARD */}
              {extractedPreview ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">Preview Data Terdeteksi</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                      Siap Dipasang
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
                        <ProgressiveImage
                          src={extractedPreview.images?.[0] || "/images/bappeda/default-news-cover.jpg"}
                          alt={extractedPreview.title}
                          className="w-full h-full object-contain"
                        />
                        {extractedPreview.images?.length > 1 && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[8px] font-black flex items-center gap-0.5 shadow-xs">
                            <Layers className="w-2.5 h-2.5 text-pink-400" />
                            <span>{extractedPreview.images.length}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            {extractedPreview.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {extractedPreview.date}
                          </span>
                          {extractedPreview.images?.length > 1 && (
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-blue-600" />
                              <span>{extractedPreview.images.length} Slide Carousel</span>
                            </span>
                          )}
                          {extractedPreview.likesCount != null && extractedPreview.likesCount > 0 ? (
                            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 fill-rose-500" />
                              {extractedPreview.likesCount} suka
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              (Tanpa likes)
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {extractedPreview.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {extractedPreview.caption}
                        </p>
                        {extractedPreview.likesCount != null && extractedPreview.likesCount > 0 && (
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => setExtractedPreview({ ...extractedPreview, likesCount: null })}
                              className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Hapus Indikator Likes (Jadikan Tanpa Likes)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail strip if multiple slides */}
                    {extractedPreview.images?.length > 1 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500">
                          Pratinjau Seluruh Slide ({extractedPreview.images.length} Slide Terdeteksi &amp; Siap Ditampilkan):
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {extractedPreview.images.map((imgSrc, sIdx) => (
                            <div
                              key={sIdx}
                              className="relative w-12 h-16 rounded-md overflow-hidden bg-slate-900 border border-slate-200 shrink-0"
                            >
                              <ProgressiveImage
                                src={imgSrc}
                                alt={`Slide ${sIdx + 1}`}
                                className="w-full h-full object-contain"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[7px] text-white text-center font-bold">
                                #{sIdx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Belum ada data postingan diambil
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Masukkan URL di atas dan klik tombol "Tarik Data Otomatis" atau langsung klik simpan.
                  </p>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving || isExtracting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-xs inline-flex items-center gap-2 shadow-md shadow-pink-500/25 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {saving || isExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingPostId ? "Simpan Perubahan Postingan" : "Pasang Postingan ke Beranda"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
