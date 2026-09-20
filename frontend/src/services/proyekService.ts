import {
  API_BASE_URL,
  authenticatedFetch,
} from "@/lib/apiClient";

export interface ProyekAttachment {
  id: string | number;
  proyek_detail_id: string | number;
  file_name: string;
  file_path: string;
  file_type: string; // foto, ded, amdal, pdf, doc
  file_size: string;
  esri_attachment_id?: number;
  uploaded_by?: string;
  created_at?: string;
}

export interface ProyekDetail {
  id: string | number;
  document_id: string | number;
  kode_proyek: string;
  nama_proyek: string;
  bidang: string; // infrastruktur, perekonomian, sosbud, renval
  kecamatan?: string;
  desa_kelurahan?: string;
  lokasi_deskripsi?: string;
  latitude: number;
  longitude: number;
  esri_objectid?: number;
  esri_sync_status?: 'pending' | 'synced' | 'failed';
  esri_synced_at?: string;
  esri_last_error?: string;
  pagu_anggaran: number;
  realisasi_anggaran: number;
  persentase_progres: number;
  status_progres: 'belum_mulai' | 'dalam_proses' | 'selesai' | 'terkendala';
  opd_penanggung_jawab?: string;
  created_by?: string;
  created_at?: string;
  document?: {
    id: string | number;
    title?: string;
    tahun?: string;
  };
  attachments?: ProyekAttachment[];
}

export const proyekService = {
  // 1. Fetch List Proyek langsung dari Database API
  getProjects: async (
    documentId?: string | number,
    bidang?: string,
    adminMode = false
  ): Promise<ProyekDetail[]> => {
    try {
      let endpoint = adminMode ? "/admin/proyek-details" : "/proyek-details";
      const params = new URLSearchParams();
      if (documentId) params.append('document_id', String(documentId));
      if (bidang && bidang !== 'semua') params.append('bidang', bidang);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const res = adminMode
        ? await authenticatedFetch(endpoint, { cache: "no-store" })
        : await fetch(`${API_BASE_URL}${endpoint}`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
          });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (e) {
      console.error("[proyekService] Data proyek resmi gagal dimuat:", e);
    }

    return [];
  },

  // 2. Geotagging Proyek Pembangunan (Fitur 2: Geotagging Spasial)
  addProjectGeotag: async (
    documentId: string | number,
    data: Omit<
      ProyekDetail,
      "id" | "document_id" | "kode_proyek" | "created_at" | "created_by" | "document" | "attachments"
    >
  ): Promise<{ success: boolean; data: ProyekDetail; esri_status?: any }> => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/documents/${documentId}/proyek`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data, esri_status: json.esri_status };
      }
      throw new Error(`Server menolak geotagging proyek (${res.status}).`);
    } catch (e) {
      console.warn("[proyekService] Failed to post to backend", e);
      throw e;
    }
  },

  // 3. Tabular Update Data Sektoral & Progres (Fitur 3: Tabular Update 2-Way ESRI Sync)
  updateProgress: async (
    projectId: string | number,
    persentase_progres: number,
    status_progres: 'belum_mulai' | 'dalam_proses' | 'selesai' | 'terkendala',
    realisasi_anggaran?: number
  ): Promise<{ success: boolean; data: ProyekDetail }> => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/proyek-details/${projectId}/progres`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ persentase_progres, status_progres, realisasi_anggaran }),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
      throw new Error(`Server menolak pembaruan progres (${res.status}).`);
    } catch (e) {
      console.warn("[proyekService] Failed backend update", e);
      throw e;
    }
  },

  // 4. Upload Lampiran Spasial Teknis (Fitur 4: ESRI Attachments)
  uploadTechnicalAttachment: async (
    projectId: string | number,
    file: File,
    fileType: string = "foto"
  ): Promise<{ success: boolean; data: ProyekAttachment }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", fileType);

      const res = await authenticatedFetch(`${API_BASE_URL}/proyek-details/${projectId}/attachment`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
      throw new Error(`Server menolak lampiran (${res.status}).`);
    } catch (e) {
      console.warn("[proyekService] Attachment upload API failed", e);
      throw e;
    }
  },

  deleteAttachment: async (attachmentId: string | number): Promise<boolean> => {
    try {
      const res = await authenticatedFetch(`/proyek-attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Gagal menghapus lampiran (Kode: ${res.status})`);
      }
      return true;
    } catch (e) {
      console.warn("[proyekService] Failed to delete attachment from API", e);
      throw e;
    }
  },

  deleteProject: async (projectId: string | number): Promise<boolean> => {
    try {
      const res = await authenticatedFetch(`/proyek-details/${projectId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Gagal menghapus proyek (Kode: ${res.status})`);
      }
      return true;
    } catch (e) {
      console.warn("[proyekService] Failed to delete project from API", e);
      throw e;
    }
  },

  // 5. Geoprocessing Buffer Analysis (Fitur 5: Geoprocessing ESRI Analysis)
  runBufferAnalysis: async (
    lat: number,
    lng: number,
    radiusMeters: number,
    metadata: {
      id?: string;
      name: string;
      projectId?: string | number;
      category?: string;
      color?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; data: any }> => {
    try {
      const endpoint = metadata.id
        ? `${API_BASE_URL}/gis/geoprocessing/analyses/${metadata.id}`
        : `${API_BASE_URL}/gis/geoprocessing/buffer`;
      const res = await authenticatedFetch(endpoint, {
        method: metadata.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: metadata.name,
          proyek_detail_id: metadata.projectId,
          category: metadata.category,
          color: metadata.color,
          notes: metadata.notes,
          latitude: lat,
          longitude: lng,
          radius: radiusMeters,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
      throw new Error(`Server menolak analisis GIS (${res.status}).`);
    } catch (e) {
      console.warn("[proyekService] Geoprocessing API failed", e);
      throw e;
    }
  },

  getBufferAnalyses: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gis/geoprocessing/analyses`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Server gagal memuat analisis (${res.status}).`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
      console.error("[proyekService] Riwayat analisis resmi gagal dimuat:", error);
      return [];
    }
  },

  deleteBufferAnalysis: async (id: string | number): Promise<void> => {
    const res = await authenticatedFetch(`${API_BASE_URL}/gis/geoprocessing/analyses/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Analisis gagal dihapus (${res.status}).`);
  },

  resyncEsri: async (id: string | number): Promise<{ success: boolean; message: string; data: any }> => {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/proyek-details/${id}/resync-esri`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Re-sync ESRI gagal (${res.status}).`);
    return { success: true, message: json.message, data: json.data };
  },
};
