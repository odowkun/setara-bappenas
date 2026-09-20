import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";
import { computeAgendaStatus, type AgendaEvent } from "@/types/agenda";

export interface TaxonomyItem {
  id: number;
  name: string;
  color?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  type: string;
  typeId: number;
  isImportant: boolean;
  validUntil: string;
  pdfUrl: string;
  fileType: string;
  content: string;
  createdAt: string;
  isPublished: boolean;
}

interface ApiAgenda {
  id: number;
  agenda_category_id: number;
  category?: TaxonomyItem;
  title: string;
  start_at: string;
  end_at: string;
  location?: string;
  organizer?: string;
  description?: string;
  color?: string;
  map_url?: string;
  latitude?: string | number;
  longitude?: string | number;
  is_published: boolean;
}

interface ApiAnnouncement {
  id: number;
  announcement_type_id: number;
  type?: TaxonomyItem;
  title: string;
  content?: string;
  is_important: boolean;
  valid_until?: string;
  file_path?: string;
  file_type?: string;
  created_at: string;
  is_published: boolean;
}

async function publicJson(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Server gagal memuat data resmi (${response.status}).`);
  }
  return response.json();
}

async function adminJson(endpoint: string, options: RequestInit = {}) {
  const response = await authenticatedFetch(endpoint, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Server menolak permintaan (${response.status}).`);
  }
  return response.json();
}

function mapAgenda(item: ApiAgenda): AgendaEvent {
  const start = new Date(item.start_at);
  const end = new Date(item.end_at);
  const formatDate = (value: Date) => value.toISOString().slice(0, 10);
  const formatTime = (value: Date) => value.toTimeString().slice(0, 5);

  return {
    id: String(item.id),
    categoryId: item.agenda_category_id,
    title: item.title,
    category: item.category?.name || "Tanpa Kategori",
    startDate: formatDate(start),
    endDate: formatDate(end),
    startTime: formatTime(start),
    endTime: formatTime(end),
    location: item.location || "",
    organizer: item.organizer || "",
    description: item.description || "",
    status: computeAgendaStatus(formatDate(start), formatDate(end)),
    color: item.color || item.category?.color || "blue",
    mapUrl: item.map_url || "",
    coordinates:
      item.latitude !== null && item.latitude !== undefined &&
      item.longitude !== null && item.longitude !== undefined
        ? `${item.latitude}, ${item.longitude}`
        : "",
    isPublished: item.is_published,
  };
}

function mapAnnouncement(item: ApiAnnouncement): AnnouncementItem {
  return {
    id: String(item.id),
    title: item.title,
    type: item.type?.name || "Tanpa Tipe",
    typeId: item.announcement_type_id,
    isImportant: Boolean(item.is_important),
    validUntil: item.valid_until || "",
    pdfUrl: item.file_path
      ? `${API_BASE_URL}/pengumuman/${item.id}/attachment`
      : "",
    fileType: item.file_type || "",
    content: item.content || "",
    createdAt: item.created_at,
    isPublished: item.is_published,
  };
}

export const officialContentService = {
  async getAgendas(admin = false): Promise<AgendaEvent[]> {
    const json = admin
      ? await adminJson("/admin/agendas")
      : await publicJson("/agendas");
    return Array.isArray(json.data) ? json.data.map(mapAgenda) : [];
  },

  async getAgenda(id: string): Promise<AgendaEvent> {
    const json = await adminJson(`/admin/agendas/${id}`);
    return mapAgenda(json.data);
  },

  async createAgenda(data: Record<string, unknown>): Promise<AgendaEvent> {
    const json = await adminJson("/agendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return mapAgenda(json.data);
  },

  async updateAgenda(id: string, data: Record<string, unknown>): Promise<AgendaEvent> {
    const json = await adminJson(`/agendas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return mapAgenda(json.data);
  },

  async updateAgendaPublication(id: string, isPublished: boolean): Promise<AgendaEvent> {
    const json = await adminJson(`/agendas/${id}/publication`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: isPublished }),
    });
    return mapAgenda(json.data);
  },

  async deleteAgenda(id: string): Promise<void> {
    await adminJson(`/agendas/${id}`, { method: "DELETE" });
  },

  async getAgendaCategories(): Promise<TaxonomyItem[]> {
    const json = await publicJson("/agenda-categories");
    return Array.isArray(json.data) ? json.data : [];
  },

  async createAgendaCategory(name: string, color = "blue"): Promise<TaxonomyItem> {
    const json = await adminJson("/agenda-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    return json.data;
  },

  async getAnnouncements(admin = false): Promise<AnnouncementItem[]> {
    const json = admin
      ? await adminJson("/admin/pengumuman")
      : await publicJson("/pengumuman");
    return Array.isArray(json.data) ? json.data.map(mapAnnouncement) : [];
  },

  async getAnnouncement(id: string): Promise<AnnouncementItem> {
    const json = await adminJson(`/admin/pengumuman/${id}`);
    return mapAnnouncement(json.data);
  },

  async saveAnnouncement(data: FormData, id?: string): Promise<AnnouncementItem> {
    if (id) data.append("_method", "PUT");
    const json = await adminJson(id ? `/pengumuman/${id}` : "/pengumuman", {
      method: "POST",
      body: data,
    });
    return mapAnnouncement(json.data);
  },

  async updateAnnouncementPublication(
    id: string,
    isPublished: boolean
  ): Promise<AnnouncementItem> {
    const json = await adminJson(`/pengumuman/${id}/publication`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: isPublished }),
    });
    return mapAnnouncement(json.data);
  },

  async togglePinAnnouncement(id: string): Promise<AnnouncementItem> {
    const json = await adminJson(`/pengumuman/${id}/pin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    return mapAnnouncement(json.data);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await adminJson(`/pengumuman/${id}`, { method: "DELETE" });
  },

  async getAnnouncementTypes(): Promise<TaxonomyItem[]> {
    const json = await publicJson("/announcement-types");
    return Array.isArray(json.data) ? json.data : [];
  },

  async createAnnouncementType(name: string): Promise<TaxonomyItem> {
    const json = await adminJson("/announcement-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return json.data;
  },

  async getNewsCategories(): Promise<TaxonomyItem[]> {
    const json = await publicJson("/news-categories");
    return Array.isArray(json.data) ? json.data : [];
  },

  async createNewsCategory(name: string): Promise<TaxonomyItem> {
    const json = await adminJson("/news-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return json.data;
  },

  async getOrganizers(): Promise<string[]> {
    const json = await publicJson("/pejabat");
    const rows = Array.isArray(json.data?.flat) ? json.data.flat : [];
    return Array.from(
      new Set(
        rows
          .map((item: { position?: string }) => item.position?.trim())
          .filter((value: string | undefined): value is string => Boolean(value))
      )
    );
  },
};
