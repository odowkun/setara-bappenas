import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";

export interface RunningTextItem {
  id: number;
  content: string;
  tag: string;
  url?: string | null;
  isActive: boolean;
  orderIndex: number;
  createdBy?: string;
  createdAt?: string;
}

export interface RunningTextPayload {
  content: string;
  tag?: string;
  url?: string | null;
  is_active?: boolean;
  order_index?: number;
}

export const runningTextService = {
  async getPublicItems(): Promise<RunningTextItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/running-texts`, { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      if (!Array.isArray(json.data)) return [];

      return json.data.map((item: any) => ({
        id: Number(item.id),
        content: item.content,
        tag: item.tag || "INFORMASI",
        url: item.url || null,
        isActive: Boolean(item.is_active ?? item.isActive ?? true),
        orderIndex: Number(item.order_index ?? item.orderIndex ?? 0),
        createdBy: item.created_by,
        createdAt: item.created_at,
      }));
    } catch (error) {
      console.error("[runningTextService] Gagal memuat public running text:", error);
      return [];
    }
  },

  async getAdminItems(): Promise<RunningTextItem[]> {
    try {
      const res = await authenticatedFetch("/admin/running-texts");
      if (!res.ok) return [];
      const json = await res.json();
      if (!Array.isArray(json.data)) return [];

      return json.data.map((item: any) => ({
        id: Number(item.id),
        content: item.content,
        tag: item.tag || "INFORMASI",
        url: item.url || null,
        isActive: Boolean(item.is_active ?? item.isActive ?? true),
        orderIndex: Number(item.order_index ?? item.orderIndex ?? 0),
        createdBy: item.created_by,
        createdAt: item.created_at,
      }));
    } catch (error) {
      console.error("[runningTextService] Gagal memuat admin running text:", error);
      return [];
    }
  },

  async createItem(payload: RunningTextPayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authenticatedFetch("/admin/running-texts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: data.message || (res.ok ? "Berhasil menambahkan teks berjalan" : "Gagal menambahkan teks berjalan"),
      };
    } catch (error) {
      console.error("[runningTextService] Gagal menambah running text:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async updateItem(id: number, payload: RunningTextPayload): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authenticatedFetch(`/admin/running-texts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: data.message || (res.ok ? "Berhasil memperbarui teks berjalan" : "Gagal memperbarui teks berjalan"),
      };
    } catch (error) {
      console.error("[runningTextService] Gagal update running text:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async toggleItem(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authenticatedFetch(`/admin/running-texts/${id}/toggle`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
        },
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: data.message || (res.ok ? "Status berhasil diubah" : "Gagal mengubah status"),
      };
    } catch (error) {
      console.error("[runningTextService] Gagal toggle running text:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },

  async deleteItem(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authenticatedFetch(`/admin/running-texts/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: data.message || (res.ok ? "Berhasil menghapus teks berjalan" : "Gagal menghapus teks berjalan"),
      };
    } catch (error) {
      console.error("[runningTextService] Gagal delete running text:", error);
      return { success: false, message: "Terjadi kesalahan jaringan" };
    }
  },
};
