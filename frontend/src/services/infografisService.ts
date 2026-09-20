import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";

export interface InfografisItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  imageUrl: string;
  description?: string | null;
  isPinned: boolean;
  isPublished: boolean;
  orderIndex: number;
  viewCount: number;
  createdBy?: string;
  publishedAt?: string;
  createdAt?: string;
}

export interface InfografisPayload {
  title: string;
  category?: string;
  image_url: string;
  description?: string | null;
  is_pinned?: boolean;
  is_published?: boolean;
  order_index?: number;
}

export interface InfografisPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

function mapInfografis(item: any): InfografisItem {
  return {
    id: Number(item.id),
    title: item.title,
    slug: item.slug,
    category: item.category || "Perencanaan",
    imageUrl: item.image_url || item.imageUrl || "/images/bappeda/fgd-keuangan.png",
    description: item.description || null,
    isPinned: Boolean(item.is_pinned ?? item.isPinned),
    isPublished: Boolean(item.is_published ?? item.isPublished ?? true),
    orderIndex: Number(item.order_index ?? item.orderIndex ?? 0),
    viewCount: Number(item.view_count ?? item.viewCount ?? 0),
    createdBy: item.created_by,
    publishedAt: item.published_at,
    createdAt: item.created_at,
  };
}

export const infografisService = {
  async getPinnedItems(limit = 5): Promise<InfografisItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/infografis?pinned=1&limit=${limit}`, { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      if (!Array.isArray(json.data)) return [];
      return json.data.map(mapInfografis);
    } catch (error) {
      console.error("[infografisService] Gagal memuat pinned infografis:", error);
      return [];
    }
  },

  async getPublicItems(page = 1, category?: string, search?: string): Promise<{ data: InfografisItem[]; pagination?: InfografisPagination }> {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (category && category !== "Semua") params.set("category", category);
      if (search && search.trim()) params.set("search", search.trim());

      const res = await fetch(`${API_BASE_URL}/infografis?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return { data: [] };
      const json = await res.json();
      return {
        data: Array.isArray(json.data) ? json.data.map(mapInfografis) : [],
        pagination: json.pagination,
      };
    } catch (error) {
      console.error("[infografisService] Gagal memuat daftar infografis:", error);
      return { data: [] };
    }
  },

  async getItemDetail(idOrSlug: string | number): Promise<InfografisItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/infografis/${idOrSlug}`, { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ? mapInfografis(json.data) : null;
    } catch (error) {
      console.error("[infografisService] Gagal memuat detail infografis:", error);
      return null;
    }
  },

  async recordView(id: number): Promise<number | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/infografis/${id}`, { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json();
      return Number(json.data?.view_count ?? 0);
    } catch (error) {
      console.error("[infografisService] Gagal mencatat tayangan infografis:", error);
      return null;
    }
  },

  async getAdminItems(category?: string, search?: string): Promise<InfografisItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== "Semua") params.set("category", category);
      if (search && search.trim()) params.set("search", search.trim());

      const res = await authenticatedFetch(`/admin/infografis?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      if (!Array.isArray(json.data)) return [];
      return json.data.map(mapInfografis);
    } catch (error) {
      console.error("[infografisService] Gagal memuat admin infografis:", error);
      return [];
    }
  },

  async createItem(payload: InfografisPayload): Promise<{ success: boolean; message?: string; data?: InfografisItem }> {
    try {
      const res = await authenticatedFetch("/admin/infografis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: json.message || (res.ok ? "Infografis berhasil disimpan" : "Gagal menyimpan infografis"),
        data: json.data ? mapInfografis(json.data) : undefined,
      };
    } catch (error) {
      console.error("[infografisService] Gagal create infografis:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async updateItem(id: number, payload: InfografisPayload): Promise<{ success: boolean; message?: string; data?: InfografisItem }> {
    try {
      const res = await authenticatedFetch(`/admin/infografis/${id}`, {
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
        message: json.message || (res.ok ? "Infografis berhasil diperbarui" : "Gagal memperbarui infografis"),
        data: json.data ? mapInfografis(json.data) : undefined,
      };
    } catch (error) {
      console.error("[infografisService] Gagal update infografis:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async togglePin(id: number): Promise<{ success: boolean; message?: string; data?: InfografisItem }> {
    try {
      const res = await authenticatedFetch(`/admin/infografis/${id}/pin`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: json.message,
        data: json.data ? mapInfografis(json.data) : undefined,
      };
    } catch (error) {
      console.error("[infografisService] Gagal toggle pin infografis:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async togglePublish(id: number): Promise<{ success: boolean; message?: string; data?: InfografisItem }> {
    try {
      const res = await authenticatedFetch(`/admin/infografis/${id}/publish`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: json.message,
        data: json.data ? mapInfografis(json.data) : undefined,
      };
    } catch (error) {
      console.error("[infografisService] Gagal toggle publish infografis:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async deleteItem(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authenticatedFetch(`/admin/infografis/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: json.message || (res.ok ? "Infografis berhasil dihapus" : "Gagal menghapus infografis"),
      };
    } catch (error) {
      console.error("[infografisService] Gagal delete infografis:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async uploadImage(file: File): Promise<{ success: boolean; url?: string; message?: string }> {
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
        };
      }

      return {
        success: false,
        message: json.message || "Gagal mengunggah gambar infografis",
      };
    } catch (error) {
      console.error("[infografisService] Gagal upload infografis image:", error);
      return { success: false, message: "Terjadi kesalahan saat upload" };
    }
  },
};
