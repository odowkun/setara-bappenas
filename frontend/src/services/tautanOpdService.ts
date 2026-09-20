import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";

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

export const tautanOpdService = {
  async getItems(publicOnly = false): Promise<TautanOpdItem[]> {
    try {
      const suffix = publicOnly ? "?public=1" : "";
      const res = await fetch(`${API_BASE_URL}/tautan-opd${suffix}`, { cache: "no-store" });
      if (!res.ok) return [];

      const json = await res.json();
      if (!Array.isArray(json.data)) return [];

      return json.data.map((item: any) => {
        let rawLogo = item.logoUrl || item.logo_url || "";
        if (typeof rawLogo === "string" && rawLogo) {
          rawLogo = rawLogo.replace(/^https?:\/\/[^\/]+(:8100)?\//, "/");
          if (rawLogo.startsWith("/uploads/tautan-opd/")) {
            rawLogo = rawLogo.replace("/uploads/tautan-opd/", "/storage/tautan-opd/");
          }
        }

        return {
          id: String(item.id),
          name: item.name,
          logoUrl: rawLogo || "/images/bappeda/logo-halut.png",
          url: item.url || null,
          orderIndex: Number(item.orderIndex ?? item.order_index ?? 0),
          isActive: Boolean(item.isActive ?? item.is_active ?? true),
        };
      });
    } catch (error) {
      console.error("[tautanOpdService] Gagal memuat tautan OPD:", error);
      return [];
    }
  },

  async saveItem(payload: TautanOpdPayload, id?: string): Promise<boolean> {
    try {
      const res = await authenticatedFetch(`/tautan-opd${id ? `/${id}` : ""}`, {
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
      const res = await authenticatedFetch(`/tautan-opd/${id}`, { method: "DELETE" });
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

      const res = await authenticatedFetch(`/tautan-opd/upload-logo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("[tautanOpdService] Upload failed with status", res.status, errorData);
        return null;
      }

      const json = await res.json();
      let logoUrl = json.data?.logo_url || null;
      if (typeof logoUrl === "string" && logoUrl) {
        logoUrl = logoUrl.replace(/^https?:\/\/[^\/]+(:8100)?\//, "/");
      }
      return logoUrl;
    } catch (error) {
      console.error("[tautanOpdService] Gagal mengunggah logo OPD:", error);
      return null;
    }
  },
};
