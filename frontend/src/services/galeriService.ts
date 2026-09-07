import {
  API_BASE_URL,
  authenticatedFetch,
} from "@/lib/apiClient";

export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  masterUrl?: string;
  title: string;
}

export interface AlbumItem {
  id: string;
  title: string;
  category: string;
  eventDate: string;
  description: string;
  coverImage: string;
  photoCount: number;
  videoCount: number;
  media: MediaItem[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export interface AlbumPayload {
  title: string;
  category: string;
  event_date: string | null;
  description: string;
  cover_image: string | null;
  media: Array<{
    id: string;
    type: "image" | "video";
    url: string;
    master_url?: string;
    title: string;
  }>;
  is_published?: boolean;
}

interface GalleryApiEnvelope {
  data?: unknown;
  message?: string;
}

function mapAlbum(value: unknown): AlbumItem {
  const item = value as Record<string, unknown>;
  const media = Array.isArray(item.media)
    ? item.media.map((raw) => {
        const row = raw as Record<string, unknown>;
        return {
          id: String(row.id ?? ""),
          type: row.type === "video" ? "video" as const : "image" as const,
          url: String(row.url ?? ""),
          masterUrl: row.master_url ? String(row.master_url) : undefined,
          title: String(row.title ?? ""),
        };
      })
    : [];

  return {
    id: String(item.id),
    title: String(item.title ?? ""),
    category: String(item.category ?? ""),
    eventDate: String(item.eventDate ?? item.event_date ?? ""),
    description: String(item.description ?? ""),
    coverImage: String(item.coverImage ?? item.cover_image ?? ""),
    photoCount: Number(item.photoCount ?? media.filter((row) => row.type === "image").length),
    videoCount: Number(item.videoCount ?? media.filter((row) => row.type === "video").length),
    media,
    isPublished: Boolean(item.isPublished ?? item.is_published),
    publishedAt: item.publishedAt || item.published_at
      ? String(item.publishedAt ?? item.published_at)
      : undefined,
    createdAt: item.createdAt || item.created_at
      ? String(item.createdAt ?? item.created_at)
      : undefined,
  };
}

async function parseResponse(response: Response): Promise<GalleryApiEnvelope> {
  const body = await response.json().catch(() => ({})) as GalleryApiEnvelope;
  if (!response.ok) {
    throw new Error(body.message || `Server menolak permintaan galeri (${response.status}).`);
  }
  return body;
}

export const galeriService = {
  async getAlbums(
    category?: string,
    search?: string,
    admin = false
  ): Promise<AlbumItem[]> {
    const params = new URLSearchParams();
    if (category && category !== "Semua") params.set("category", category);
    if (search) params.set("search", search);
    const query = params.toString();
    const endpoint = `${admin ? "/admin" : ""}/galeri${query ? `?${query}` : ""}`;
    const response = admin
      ? await authenticatedFetch(endpoint)
      : await fetch(`${API_BASE_URL}${endpoint}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
    const json = await parseResponse(response);

    return Array.isArray(json.data) ? json.data.map(mapAlbum) : [];
  },

  async getAlbum(id: string): Promise<AlbumItem> {
    const json = await parseResponse(
      await authenticatedFetch(`/admin/galeri/${id}`)
    );
    if (!json.data) throw new Error("Album galeri tidak ditemukan di database.");
    return mapAlbum(json.data);
  },

  async createAlbum(payload: AlbumPayload): Promise<AlbumItem> {
    const json = await parseResponse(
      await authenticatedFetch("/galeri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    if (!json.data) throw new Error("Server tidak mengembalikan album yang disimpan.");
    return mapAlbum(json.data);
  },

  async updateAlbum(id: string, payload: AlbumPayload): Promise<AlbumItem> {
    const json = await parseResponse(
      await authenticatedFetch(`/galeri/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    if (!json.data) throw new Error("Server tidak mengembalikan album yang diperbarui.");
    return mapAlbum(json.data);
  },

  async updatePublication(id: string, isPublished: boolean): Promise<AlbumItem> {
    const json = await parseResponse(
      await authenticatedFetch(`/galeri/${id}/publication`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: isPublished }),
      })
    );
    if (!json.data) throw new Error("Status publikasi galeri tidak dikonfirmasi server.");
    return mapAlbum(json.data);
  },

  async deleteAlbum(id: string): Promise<void> {
    await parseResponse(
      await authenticatedFetch(`/galeri/${id}`, { method: "DELETE" })
    );
  },

  async uploadMedia(file: File): Promise<{
    masterUrl: string;
    webUrl: string;
    thumbUrl: string;
  }> {
    const body = new FormData();
    body.append("media", file);
    const json = await parseResponse(
      await authenticatedFetch("/media/upload-optimized", {
        method: "POST",
        body,
      })
    );
    const data = json.data as Record<string, unknown> | undefined;
    if (!data?.master_url || !data?.web_url) {
      throw new Error("Server tidak mengembalikan URL media permanen.");
    }

    return {
      masterUrl: String(data.master_url),
      webUrl: String(data.web_url),
      thumbUrl: String(data.thumb_url ?? data.web_url),
    };
  },
};
