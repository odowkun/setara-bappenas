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
  pagu_anggaran: number;
  realisasi_anggaran: number;
  persentase_progres: number;
  status_progres: 'belum_mulai' | 'dalam_proses' | 'selesai' | 'terkendala';
  opd_penanggung_jawab?: string;
  created_by?: string;
  created_at?: string;
  attachments?: ProyekAttachment[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const PROYEK_LOCAL_KEY = "bappeda_proyek_details";

export const proyekService = {
  // 1. Fetch List Proyek langsung dari Database API
  getProjects: async (documentId?: string | number, bidang?: string): Promise<ProyekDetail[]> => {
    try {
      let url = `${API_BASE_URL}/proyek-details`;
      const params = new URLSearchParams();
      if (documentId) params.append('document_id', String(documentId));
      if (bidang && bidang !== 'semua') params.append('bidang', bidang);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          if (typeof window !== "undefined") {
            localStorage.setItem(PROYEK_LOCAL_KEY, JSON.stringify(json.data));
          }
          return json.data;
        }
      }
    } catch (e) {
      console.warn("[proyekService] Backend API connection check, reading cached database records:", e);
    }

    // Local Storage Cache (hanya jika offline, tidak ada dummy fallback)
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PROYEK_LOCAL_KEY);
    const list: ProyekDetail[] = stored ? JSON.parse(stored) : [];

    return list.filter((p) => {
      if (documentId && String(p.document_id) !== String(documentId)) return false;
      if (bidang && bidang !== 'semua' && p.bidang !== bidang) return false;
      return true;
    });
  },

  // 2. Geotagging Proyek Pembangunan (Fitur 2: Geotagging Spasial)
  addProjectGeotag: async (
    documentId: string | number,
    data: Omit<ProyekDetail, "id" | "document_id" | "kode_proyek" | "created_at">
  ): Promise<{ success: boolean; data: ProyekDetail; esri_status?: any }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${documentId}/proyek`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data, esri_status: json.esri_status };
      }
    } catch (e) {
      console.warn("[proyekService] Failed to post to backend, using local fallback", e);
    }

    // Fallback Local Storage
    const newProject: ProyekDetail = {
      ...data,
      id: `prj-${Date.now()}`,
      document_id: documentId,
      kode_proyek: `PRJ-RENJA-2026-${Math.floor(100 + Math.random() * 900)}`,
      esri_objectid: Math.floor(1000 + Math.random() * 9000), // Simulated ESRI OBJECTID
      created_at: new Date().toISOString(),
      attachments: [],
    };

    const projects = await proyekService.getProjects();
    const updated = [newProject, ...projects];
    if (typeof window !== "undefined") {
      localStorage.setItem(PROYEK_LOCAL_KEY, JSON.stringify(updated));
    }

    return {
      success: true,
      data: newProject,
      esri_status: { success: true, objectId: newProject.esri_objectid, is_mock: true },
    };
  },

  // 3. Tabular Update Data Sektoral & Progres (Fitur 3: Tabular Update 2-Way ESRI Sync)
  updateProgress: async (
    projectId: string | number,
    persentase_progres: number,
    status_progres: 'belum_mulai' | 'dalam_proses' | 'selesai' | 'terkendala',
    realisasi_anggaran?: number
  ): Promise<{ success: boolean; data: ProyekDetail }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/proyek-details/${projectId}/progres`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ persentase_progres, status_progres, realisasi_anggaran }),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
    } catch (e) {
      console.warn("[proyekService] Failed backend update, fallback to LocalStorage", e);
    }

    // Local Storage update fallback
    const projects = await proyekService.getProjects();
    const idx = projects.findIndex((p) => String(p.id) === String(projectId));
    if (idx !== -1) {
      projects[idx].persentase_progres = persentase_progres;
      projects[idx].status_progres = status_progres;
      if (realisasi_anggaran !== undefined) projects[idx].realisasi_anggaran = realisasi_anggaran;

      if (typeof window !== "undefined") {
        localStorage.setItem(PROYEK_LOCAL_KEY, JSON.stringify(projects));
      }
      return { success: true, data: projects[idx] };
    }

    throw new Error("Proyek tidak ditemukan");
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

      const res = await fetch(`${API_BASE_URL}/proyek-details/${projectId}/attachment`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
    } catch (e) {
      console.warn("[proyekService] Attachment upload API offline, using local fallback", e);
    }

    // Local Storage Attachment fallback
    const newAttachment: ProyekAttachment = {
      id: `att-${Date.now()}`,
      proyek_detail_id: projectId,
      file_name: file.name,
      file_path: URL.createObjectURL(file),
      file_type: fileType,
      file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      esri_attachment_id: Math.floor(500 + Math.random() * 500),
      created_at: new Date().toISOString(),
    };

    const projects = await proyekService.getProjects();
    const idx = projects.findIndex((p) => String(p.id) === String(projectId));
    if (idx !== -1) {
      if (!projects[idx].attachments) projects[idx].attachments = [];
      projects[idx].attachments!.push(newAttachment);
      if (typeof window !== "undefined") {
        localStorage.setItem(PROYEK_LOCAL_KEY, JSON.stringify(projects));
      }
    }

    return { success: true, data: newAttachment };
  },

  deleteAttachment: async (attachmentId: string | number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/proyek-attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.ok) return true;
    } catch (e) {
      console.warn("[proyekService] Failed to delete attachment from API", e);
    }

    // Local Storage Fallback
    const projects = await proyekService.getProjects();
    let updated = false;
    for (const p of projects) {
      if (p.attachments) {
        const initialLen = p.attachments.length;
        p.attachments = p.attachments.filter((a) => String(a.id) !== String(attachmentId));
        if (p.attachments.length !== initialLen) updated = true;
      }
    }
    if (updated && typeof window !== "undefined") {
      localStorage.setItem(PROYEK_LOCAL_KEY, JSON.stringify(projects));
    }
    return true;
  },

  deleteProject: async (projectId: string | number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/proyek-details/${projectId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.ok) return true;
    } catch (e) {
      console.warn("[proyekService] Failed to delete project from API", e);
    }

    // Local Storage Fallback
    const projects = await proyekService.getProjects();
    const updated = projects.filter((p) => String(p.id) !== String(projectId));
    if (updated.length !== projects.length && typeof window !== "undefined") {
      localStorage.setItem(PROYEK_LOCAL_KEY, JSON.stringify(updated));
    }
    return true;
  },

  // 5. Geoprocessing Buffer Analysis (Fitur 5: Geoprocessing ESRI Analysis)
  runBufferAnalysis: async (
    lat: number,
    lng: number,
    radiusMeters: number
  ): Promise<{ success: boolean; data: any }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/gis/geoprocessing/buffer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng, radius: radiusMeters }),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data };
      }
    } catch (e) {
      console.warn("[proyekService] Geoprocessing API offline, using dynamic math calculation", e);
    }

    // Fallback Math calculation for circle polygon GeoJSON
    const steps = 32;
    const coordinates: [number, number][] = [];
    const earthRadius = 6378137;
    const dLat = radiusMeters / earthRadius;
    const dLng = radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180));

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      const pLat = lat + (dLat * Math.sin(theta) * 180) / Math.PI;
      const pLng = lng + (dLng * Math.cos(theta) * 180) / Math.PI;
      coordinates.push([pLng, pLat]);
    }

    return {
      success: true,
      data: {
        buffer_geojson: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { radius_meters: radiusMeters, center: [lat, lng] },
              geometry: { type: "Polygon", coordinates: [coordinates] },
            },
          ],
        },
      },
    };
  },
};
