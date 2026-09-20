import { authenticatedFetch, API_BASE_URL } from "@/lib/apiClient";

const API_BASE = API_BASE_URL;

export type QuestionType =
  | "rating"
  | "text"
  | "paragraph"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "date";

export interface SurveyQuestionItem {
  id: number;
  service_id?: number | null;
  service_name?: string;
  title: string;
  description?: string;
  question_type: QuestionType;
  options?: string;
  is_required?: boolean;
  order_index: number;
  is_active: boolean;
}

export interface SurveyServiceItem {
  id: number;
  name: string;
  is_active: boolean;
}

export interface SurveyResponseItem {
  id: number;
  nama_responden: string;
  email?: string;
  pekerjaan?: string;
  jenis_layanan: string;
  u1_persyaratan: number;
  u2_prosedur: number;
  u3_kecepatan: number;
  u4_produk: number;
  u5_sikap: number;
  ikm_score: number;
  mutu_pelayanan?: string;
  kategori?: string;
  saran_masukan?: string;
  created_at: string;
}

export function getIkmGrade(score: number): {
  mutu: string;
  kategori: string;
  badgeClass: string;
  cardClass: string;
  textClass: string;
} {
  const num = Number(score) || 0;
  if (num >= 88.31) {
    return {
      mutu: "A",
      kategori: "Sangat Baik",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
      cardClass: "bg-emerald-50 border-emerald-200",
      textClass: "text-emerald-700",
    };
  }
  if (num >= 76.61) {
    return {
      mutu: "B",
      kategori: "Baik",
      badgeClass: "bg-blue-100 text-blue-900 border-blue-200",
      cardClass: "bg-blue-50 border-blue-200",
      textClass: "text-blue-700",
    };
  }
  if (num >= 65.00) {
    return {
      mutu: "C",
      kategori: "Kurang Baik",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
      cardClass: "bg-amber-50 border-amber-200",
      textClass: "text-amber-700",
    };
  }
  return {
    mutu: "D",
    kategori: "Tidak Baik",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-200",
    cardClass: "bg-rose-50 border-rose-200",
    textClass: "text-rose-700",
  };
}

export interface SurveySummaryData {
  total_responden: number;
  ikm_score: number;
  mutu_pelayanan: string;
  kategori: string;
  u1_avg: number;
  u2_avg: number;
  u3_avg: number;
  u4_avg: number;
  u5_avg: number;
}

export interface KritikSaranItem {
  id: number;
  nama: string;
  email: string;
  telepon?: string;
  skpd_tujuan: string;
  subjek: string;
  pesan: string;
  status: string;
  catatan_balasan?: string;
  created_at: string;
}

export async function fetchSurveyConfig(): Promise<{ questions: SurveyQuestionItem[]; services: SurveyServiceItem[] }> {
  try {
    const res = await fetch(`${API_BASE}/surveys/config`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return {
          questions: Array.isArray(json.data.questions) ? json.data.questions : [],
          services: Array.isArray(json.data.services) ? json.data.services : [],
        };
      }
    }
  } catch (e) {
    console.error("Konfigurasi survei resmi gagal dimuat:", e);
  }

  return { questions: [], services: [] };
}

export async function addSurveyQuestion(
  title: string,
  description?: string,
  service_id?: number | null,
  question_type: QuestionType = "rating",
  options?: string,
  is_required: boolean = false
): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`${API_BASE}/surveys/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, service_id, question_type, options, is_required }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API add question failed:", e);
  }
  return false;
}

export async function deleteSurveyQuestion(id: number): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`${API_BASE}/surveys/questions/${id}`, { method: "DELETE" });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API delete question failed:", e);
  }
  return false;
}

export async function reorderSurveyQuestions(orderedIds: number[]): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`${API_BASE}/surveys/questions/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered_ids: orderedIds }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API reorder question fallback to local:", e);
  }

  return false;
}

export async function addSurveyService(name: string): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`${API_BASE}/surveys/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API add service failed:", e);
  }
  return false;
}

export async function deleteSurveyService(id: number): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`${API_BASE}/surveys/services/${id}`, { method: "DELETE" });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API delete service failed:", e);
  }
  return false;
}

export async function fetchSurveysSummary(): Promise<{ surveys: SurveyResponseItem[]; summary: SurveySummaryData }> {
  try {
    const res = await authenticatedFetch(`${API_BASE}/surveys`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return {
          surveys: Array.isArray(json.data.surveys) ? json.data.surveys : [],
          summary: json.data.summary,
        };
      }
    }
  } catch (e) {
    console.warn("API fetch surveys failed:", e);
  }

  return {
    surveys: [],
    summary: {
      total_responden: 0,
      ikm_score: 0,
      mutu_pelayanan: "-",
      kategori: "Data tidak tersedia",
      u1_avg: 0,
      u2_avg: 0,
      u3_avg: 0,
      u4_avg: 0,
      u5_avg: 0,
    },
  };
}

export async function fetchPublicSurveySummary(): Promise<SurveySummaryData> {
  const res = await fetch(`${API_BASE}/surveys/summary`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Ringkasan survei tidak dapat dimuat.");
  }

  const json = await res.json();
  return json.data.summary as SurveySummaryData;
}

export async function submitSurvey(data: any): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/surveys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return true;
    }
  } catch (e) {
    console.warn("API submit survey failed:", e);
  }

  return false;
}

export async function fetchKritikList(): Promise<KritikSaranItem[]> {
  let apiItems: KritikSaranItem[] = [];
  try {
    const res = await authenticatedFetch(`${API_BASE}/kritik`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        apiItems = json.data;
      }
    }
  } catch (e) {
    console.warn("API fetch kritik failed:", e);
  }
  return apiItems;
}

export async function submitKritik(data: {
  nama: string;
  email: string;
  telepon?: string;
  skpd_tujuan: string;
  subjek: string;
  pesan: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/kritik`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return true;
    }
  } catch (e) {
    console.warn("API submit kritik failed:", e);
  }
  return false;
}

export interface PublicKritikItem {
  id: number;
  nama: string;
  skpd_tujuan: string;
  subjek: string;
  pesan: string;
  status: string;
  catatan_balasan?: string;
  created_at: string;
}

export async function fetchPublicKritikList(): Promise<PublicKritikItem[]> {
  try {
    const res = await fetch(`${API_BASE}/kritik/public`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn("API fetch public kritik failed:", e);
  }
  return [];
}
