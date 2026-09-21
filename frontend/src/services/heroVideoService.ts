import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";

export interface HeroVideoSetting {
  id?: number;
  video_url: string;
  poster_url: string | null;
  badge_title: string;
  badge_subtitle: string;
  title: string;
  subtitle: string;
  is_active: boolean;
  updated_by?: string;
  updated_at?: string;
}

export interface HeroVideoPayload {
  video_url: string;
  poster_url?: string | null;
  badge_title?: string;
  badge_subtitle?: string;
  title: string;
  subtitle?: string | null;
  is_active?: boolean;
}

/**
 * Ekstraksi YouTube Video ID dari berbagai format URL (youtu.be, watch?v=, embed/, shorts/, dll.)
 */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Buat URL embed YouTube no-cookie yang aman dan responsif
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay = true): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
}

/**
 * Dapatkan URL thumbnail YouTube resolusi tinggi / standar
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: "maxres" | "hq" = "maxres"): string {
  return quality === "maxres"
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}


export const heroVideoService = {
  async getHeroVideo(): Promise<HeroVideoSetting | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/hero-video`, { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (error) {
      console.error("[heroVideoService] Gagal memuat hero video publik:", error);
      return null;
    }
  },

  async getAdminHeroVideo(): Promise<HeroVideoSetting | null> {
    try {
      const res = await authenticatedFetch("/admin/hero-video");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (error) {
      console.error("[heroVideoService] Gagal memuat hero video admin:", error);
      return null;
    }
  },

  async updateHeroVideo(payload: HeroVideoPayload): Promise<{ success: boolean; message?: string; data?: HeroVideoSetting }> {
    try {
      const res = await authenticatedFetch("/admin/hero-video", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: json.message || (res.ok ? "Pengaturan video berhasil diperbarui" : "Gagal memperbarui pengaturan video"),
        data: json.data,
      };
    } catch (error) {
      console.error("[heroVideoService] Gagal update hero video:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async uploadFile(file: File): Promise<{ success: boolean; url?: string; type?: string; message?: string }> {
    try {
      const formData = new FormData();
      formData.append("media", file);

      const res = await authenticatedFetch("/media/upload-optimized", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      const fileUrl = json.data?.web_url || json.data?.url || json.data?.master_url;

      if (res.ok && fileUrl) {
        return {
          success: true,
          url: fileUrl,
          type: json.data?.type || (file.type.startsWith("video/") ? "video" : "image"),
        };
      }

      return {
        success: false,
        message: json.message || "Gagal mengunggah file media",
      };
    } catch (error) {
      console.error("[heroVideoService] Gagal upload file:", error);
      return { success: false, message: "Terjadi kesalahan saat upload" };
    }
  },
};
