export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
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
  createdAt?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const galeriService = {
  /**
   * Fetch galeri albums directly from backend database API.
   */
  async getAlbums(category?: string, search?: string): Promise<AlbumItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== "Semua") params.append("category", category);
      if (search) params.append("search", search);

      const res = await fetch(`${API_BASE_URL}/galeri?${params.toString()}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return json.data.map((item: any) => {
            const mediaList: MediaItem[] = Array.isArray(item.media)
              ? item.media
              : [
                  {
                    id: `m-${item.id}`,
                    type: "image",
                    url: item.coverImage || item.cover_image || "/uploads/galeri/9d5fe4642d674252cfd3d8be1b0eca61.jpg",
                    title: item.title,
                  },
                ];

            const photos = mediaList.filter((m) => m.type !== "video").length;
            const videos = mediaList.filter((m) => m.type === "video").length;

            return {
              id: String(item.id),
              title: item.title,
              category: item.category || "General",
              eventDate: item.eventDate || item.event_date || "2024-06-15",
              description: item.description || item.title,
              coverImage: item.coverImage || item.cover_image || "/uploads/galeri/9d5fe4642d674252cfd3d8be1b0eca61.jpg",
              photoCount: photos,
              videoCount: videos,
              media: mediaList,
              createdAt: item.createdAt || item.created_at || "2024-06-15",
            };
          });
        }
      }
    } catch (error) {
      console.error("[galeriService] Error fetching galeri from database API:", error);
    }
    return [];
  },

  /**
   * Delete galeri album from database.
   */
  async deleteAlbum(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/galeri/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (e) {
      console.error("[galeriService] Delete album database request failed:", e);
      return false;
    }
  },
};
