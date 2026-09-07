export interface TautanOpdItem {
  id: string;
  name: string;
  logoUrl: string;
  url?: string | null;
  orderIndex: number;
  isActive: boolean;
}

export interface TautanOpdPayload {
  name: string;
  logo_url: string;
  url?: string | null;
  order_index?: number;
  is_active?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const tautanOpdService = {
  async getItems(publicOnly = false): Promise<TautanOpdItem[]> {
    try {
      const suffix = publicOnly ? "?public=1" : "";
      const res = await fetch(`${API_BASE_URL}/tautan-opd${suffix}`, { cache: "no-store" });
      if (!res.ok) return [];

      const json = await res.json();
      if (!Array.isArray(json.data)) return [];

      return json.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        logoUrl: item.logoUrl || item.logo_url || "/images/bappeda/logo-halut.png",
        url: item.url || null,
        orderIndex: Number(item.orderIndex ?? item.order_index ?? 0),
        isActive: Boolean(item.isActive ?? item.is_active ?? true),
      }));
    } catch (error) {
      console.error("[tautanOpdService] Gagal memuat tautan OPD:", error);
      return [];
    }
  },

  async saveItem(payload: TautanOpdPayload, id?: string): Promise<boolean> {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/tautan-opd${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (error) {
      console.error("[tautanOpdService] Gagal menyimpan tautan OPD:", error);
      return false;
    }
  },

  async deleteItem(id: string): Promise<boolean> {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/tautan-opd/${id}`, { method: "DELETE" });
      return res.ok;
    } catch (error) {
      console.error("[tautanOpdService] Gagal menghapus tautan OPD:", error);
      return false;
    }
  },

  async uploadLogo(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await authenticatedFetch(`${API_BASE_URL}/tautan-opd/upload-logo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) return null;

      const json = await res.json();
      return json.data?.logo_url || null;
    } catch (error) {
      console.error("[tautanOpdService] Gagal mengunggah logo OPD:", error);
      return null;
    }
  },
};
import { authenticatedFetch } from "@/lib/apiClient";
