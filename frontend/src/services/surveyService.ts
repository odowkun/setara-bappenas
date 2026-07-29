const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

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
  saran_masukan?: string;
  created_at: string;
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

export const defaultSurveys: SurveyResponseItem[] = [
  {
    id: 1,
    nama_responden: "Drs. M. Tani",
    email: "mtani@halutkab.go.id",
    pekerjaan: "ASN Perangkat Daerah",
    jenis_layanan: "Layanan Konsultasi RKPD & Perencanaan Daerah",
    u1_persyaratan: 5,
    u2_prosedur: 5,
    u3_kecepatan: 5,
    u4_produk: 5,
    u5_sikap: 5,
    ikm_score: 100.0,
    saran_masukan: "Proses verifikasi dokumen usulan sangat cepat dan responsif.",
    created_at: "2026-07-24 10:15:00",
  },
  {
    id: 2,
    nama_responden: "Sarah M. Pdt",
    email: "sarah.m@gmail.com",
    pekerjaan: "Wiraswasta / Masyarakat",
    jenis_layanan: "Pelayanan Informasi Publik & GIS Peta Spasial",
    u1_persyaratan: 4,
    u2_prosedur: 5,
    u3_kecepatan: 4,
    u4_produk: 5,
    u5_sikap: 5,
    ikm_score: 92.0,
    saran_masukan: "Sistem peta digital sangat membantu dalam konsultasi tata ruang.",
    created_at: "2026-07-24 11:30:00",
  },
];

export const defaultQuestions: SurveyQuestionItem[] = [
  { id: 1, service_id: null, title: "1. Kejelasan Persyaratan Pelayanan", description: "Keselarasan persyaratan pelayanan dengan jenis pelayanannya.", question_type: "rating", order_index: 1, is_active: true },
  { id: 2, service_id: null, title: "2. Kemudahan Prosedur & Alur Pelayanan", description: "Kemudahan tahapan pelayanan yang diberikan kepada masyarakat.", question_type: "rating", order_index: 2, is_active: true },
  { id: 3, service_id: null, title: "3. Kecepatan Waktu Pelayanan", description: "Target waktu penyelesaian pelayanan sesuai standar yang ditetapkan.", question_type: "rating", order_index: 3, is_active: true },
  { id: 4, service_id: null, title: "4. Kualitas Produk / Informasi Hasil Layanan", description: "Kesesuaian hasil pelayanan dengan dokumen/informasi yang dijanjikan.", question_type: "rating", order_index: 4, is_active: true },
  { id: 5, service_id: null, title: "5. Sikap & Keramahan Petugas BAPPEDA", description: "Kematangan, kesopanan, dan kesiapan petugas dalam merespons publik.", question_type: "rating", order_index: 5, is_active: true },
];

export const defaultServices: SurveyServiceItem[] = [
  { id: 1, name: "BAPPEDA Halmahera Utara (Kantor Utama)", is_active: true },
  { id: 2, name: "Bidang Perencanaan Pembangunan & Evaluasi", is_active: true },
  { id: 3, name: "Bidang Pembangunan Manusia & Masyarakat (PMM)", is_active: true },
  { id: 4, name: "Bidang Ekonomi & Sumber Daya Alam (SDA)", is_active: true },
  { id: 5, name: "Bidang Infrastruktur & Pengembangan Wilayah (IPW)", is_active: true },
  { id: 6, name: "Bidang Pengendalian, Evaluasi & Pelaporan (PEP)", is_active: true },
  { id: 7, name: "Sekretariat BAPPEDA", is_active: true },
  { id: 8, name: "Layanan Informasi Publik & GIS Peta Spasial", is_active: true },
];

export async function fetchSurveyConfig(): Promise<{ questions: SurveyQuestionItem[]; services: SurveyServiceItem[] }> {
  try {
    const res = await fetch(`${API_BASE}/surveys/config`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return {
          questions: json.data.questions || defaultQuestions,
          services: json.data.services || defaultServices,
        };
      }
    }
  } catch (e) {
    console.warn("API fetch survey config failed, fallback to local storage / defaults:", e);
  }

  if (typeof window !== "undefined") {
    const qStored = localStorage.getItem("bappeda_survey_questions");
    const sStored = localStorage.getItem("bappeda_survey_services");
    return {
      questions: qStored ? JSON.parse(qStored) : defaultQuestions,
      services: sStored ? JSON.parse(sStored) : defaultServices,
    };
  }

  return { questions: defaultQuestions, services: defaultServices };
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
    const res = await fetch(`${API_BASE}/surveys/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, service_id, question_type, options, is_required }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API add question fallback to local:", e);
  }

  if (typeof window !== "undefined") {
    const qStored = localStorage.getItem("bappeda_survey_questions");
    const list: SurveyQuestionItem[] = qStored ? JSON.parse(qStored) : defaultQuestions;
    const newItem: SurveyQuestionItem = {
      id: Date.now(),
      service_id,
      title,
      description,
      question_type,
      options,
      is_required,
      order_index: list.length + 1,
      is_active: true,
    };
    localStorage.setItem("bappeda_survey_questions", JSON.stringify([...list, newItem]));
  }
  return true;
}

export async function deleteSurveyQuestion(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/surveys/questions/${id}`, { method: "DELETE" });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API delete question fallback to local:", e);
  }

  if (typeof window !== "undefined") {
    const qStored = localStorage.getItem("bappeda_survey_questions");
    const list: SurveyQuestionItem[] = qStored ? JSON.parse(qStored) : defaultQuestions;
    const updated = list.filter((q) => q.id !== id);
    localStorage.setItem("bappeda_survey_questions", JSON.stringify(updated));
  }
  return true;
}

export async function reorderSurveyQuestions(orderedIds: number[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/surveys/questions/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered_ids: orderedIds }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API reorder question fallback to local:", e);
  }

  return true;
}

export async function addSurveyService(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/surveys/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API add service fallback to local:", e);
  }

  if (typeof window !== "undefined") {
    const sStored = localStorage.getItem("bappeda_survey_services");
    const list: SurveyServiceItem[] = sStored ? JSON.parse(sStored) : defaultServices;
    const newItem: SurveyServiceItem = { id: Date.now(), name, is_active: true };
    localStorage.setItem("bappeda_survey_services", JSON.stringify([...list, newItem]));
  }
  return true;
}

export async function deleteSurveyService(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/surveys/services/${id}`, { method: "DELETE" });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API delete service fallback to local:", e);
  }

  if (typeof window !== "undefined") {
    const sStored = localStorage.getItem("bappeda_survey_services");
    const list: SurveyServiceItem[] = sStored ? JSON.parse(sStored) : defaultServices;
    const updated = list.filter((s) => s.id !== id);
    localStorage.setItem("bappeda_survey_services", JSON.stringify(updated));
  }
  return true;
}

export async function fetchSurveysSummary(): Promise<{ surveys: SurveyResponseItem[]; summary: SurveySummaryData }> {
  try {
    const res = await fetch(`${API_BASE}/surveys`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return {
          surveys: json.data.surveys || defaultSurveys,
          summary: json.data.summary,
        };
      }
    }
  } catch (e) {
    console.warn("API fetch surveys failed, fallback to local storage:", e);
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("bappeda_surveys");
    const list: SurveyResponseItem[] = stored ? JSON.parse(stored) : defaultSurveys;
    const total = list.length;
    const avg = total > 0 ? list.reduce((acc, curr) => acc + curr.ikm_score, 0) / total : 90.0;

    let mutu = "A";
    let kategori = "Sangat Baik";
    if (avg < 76.61) {
      mutu = "B";
      kategori = "Baik";
    }

    return {
      surveys: list,
      summary: {
        total_responden: total,
        ikm_score: Number(avg.toFixed(2)),
        mutu_pelayanan: mutu,
        kategori,
        u1_avg: 4.8,
        u2_avg: 4.7,
        u3_avg: 4.6,
        u4_avg: 4.8,
        u5_avg: 4.9,
      },
    };
  }

  return {
    surveys: defaultSurveys,
    summary: {
      total_responden: defaultSurveys.length,
      ikm_score: 96.0,
      mutu_pelayanan: "A",
      kategori: "Sangat Baik",
      u1_avg: 4.8,
      u2_avg: 4.7,
      u3_avg: 4.6,
      u4_avg: 4.8,
      u5_avg: 4.9,
    },
  };
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
    console.warn("API submit survey failed, storing to localStorage:", e);
  }

  // Fallback save to localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("bappeda_surveys");
    const list: SurveyResponseItem[] = stored ? JSON.parse(stored) : defaultSurveys;
    const u1 = Number(data.u1_persyaratan || 5);
    const u2 = Number(data.u2_prosedur || 5);
    const u3 = Number(data.u3_kecepatan || 5);
    const u4 = Number(data.u4_produk || 5);
    const u5 = Number(data.u5_sikap || 5);
    const rawAvg = (u1 + u2 + u3 + u4 + u5) / 5;
    const ikmScore = (rawAvg / 5) * 100;

    const newItem: SurveyResponseItem = {
      id: Date.now(),
      nama_responden: data.nama_responden || "Masyarakat Umum",
      email: data.email,
      pekerjaan: data.pekerjaan || "Wiraswasta / Masyarakat",
      jenis_layanan: data.jenis_layanan,
      u1_persyaratan: u1,
      u2_prosedur: u2,
      u3_kecepatan: u3,
      u4_produk: u4,
      u5_sikap: u5,
      ikm_score: Number(ikmScore.toFixed(2)),
      saran_masukan: data.saran_masukan,
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    };

    localStorage.setItem("bappeda_surveys", JSON.stringify([newItem, ...list]));
    return true;
  }

  return false;
}

export async function fetchKritikList(): Promise<KritikSaranItem[]> {
  let apiItems: KritikSaranItem[] = [];
  try {
    const res = await fetch(`${API_BASE}/kritik`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        apiItems = json.data;
      }
    }
  } catch (e) {
    console.warn("API fetch kritik failed, fallback to local storage:", e);
  }

  let localItems: KritikSaranItem[] = [];
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("bappeda_kritiks");
    if (stored) {
      try {
        localItems = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }
    }
  }

  // Combine both API items and local items seamlessly!
  const combinedMap = new Map<number, KritikSaranItem>();
  apiItems.forEach((item) => combinedMap.set(item.id, item));
  localItems.forEach((item) => combinedMap.set(item.id, item));

  const result = Array.from(combinedMap.values()).sort((a, b) =>
    b.created_at > a.created_at ? 1 : -1
  );

  return result;
}

export async function submitKritik(data: {
  nama: string;
  email: string;
  telepon?: string;
  skpd_tujuan: string;
  subjek: string;
  pesan: string;
}): Promise<boolean> {
  let success = false;
  try {
    const res = await fetch(`${API_BASE}/kritik`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      success = true;
    }
  } catch (e) {
    console.warn("API submit kritik failed, storing to local storage:", e);
  }

  // Always store to localStorage as well for instant frontend & admin dashboard sync
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("bappeda_kritiks");
    const list: KritikSaranItem[] = stored ? JSON.parse(stored) : [];
    const newItem: KritikSaranItem = {
      id: Date.now(),
      ...data,
      status: "Menunggu Tanggapan",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    localStorage.setItem("bappeda_kritiks", JSON.stringify([newItem, ...list]));
    success = true;
  }

  return success;
}
