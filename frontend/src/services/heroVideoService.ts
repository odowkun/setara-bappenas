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
      if (res.ok && json.data?.url) {
        return {
          success: true,
          url: json.data.url,
          type: json.data.type,
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
