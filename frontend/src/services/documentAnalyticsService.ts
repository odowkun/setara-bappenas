import {
  DocumentDownloadLogResponse,
  DocumentDownloadResult,
  DocumentPreviewResult,
} from "@/types/documentAnalytics";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

interface ApiErrorBody {
  message?: string;
}

interface PreviewApiResponse {
  data: {
    document_id: string | number;
    version_id: string | number;
    version: string;
    preview_url: string;
    expires_at: string;
    views: number;
    unique_views: number;
  };
}

interface DownloadApiResponse {
  data: {
    document_id: string | number;
    version_id: string | number;
    version: string;
    download_url: string;
    expires_at: string;
    downloads: number;
    views: number;
  };
}

interface DownloadLogApiResponse {
  data: Array<{
    id: string | number;
    document_id: string | number;
    document_title: string;
    document_jenis: string;
    document_bidang: string;
    email: string;
    ip_address: string | null;
    user_agent: string | null;
    downloaded_at: string;
  }>;
  summary: {
    total_downloads: number;
    unique_emails: number;
    downloads_today: number;
  };
}

async function requestJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("bappeda_sanctum_token")
      : null;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(errorBody.message || "Permintaan statistik dokumen gagal.");
  }

  return response.json() as Promise<T>;
}

export function resolveDocumentUrl(url: string): string {
  return url.startsWith("/storage/") || url.startsWith("/api/")
    ? `${BACKEND_BASE_URL}${url}`
    : url;
}

export const documentAnalyticsService = {
  async recordPreview(documentId: string): Promise<DocumentPreviewResult> {
    const visitorStorageKey = "bappeda_document_visitor_id";
    let visitorId =
      typeof window !== "undefined"
        ? localStorage.getItem(visitorStorageKey)
        : null;
    if (!visitorId && typeof window !== "undefined") {
      visitorId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(visitorStorageKey, visitorId);
    }

    const response = await requestJson<PreviewApiResponse>(
      `/documents/${documentId}/preview`,
      {
        method: "POST",
        body: JSON.stringify({ visitor_id: visitorId }),
      }
    );

    return {
      documentId: String(response.data.document_id),
      versionId: String(response.data.version_id),
      version: response.data.version,
      previewUrl: response.data.preview_url,
      expiresAt: response.data.expires_at,
      views: response.data.views,
      uniqueViews: response.data.unique_views,
    };
  },

  async registerDownload(
    documentId: string,
    email: string
  ): Promise<DocumentDownloadResult> {
    const response = await requestJson<DownloadApiResponse>(
      `/documents/${documentId}/download`,
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );

    return {
      documentId: String(response.data.document_id),
      versionId: String(response.data.version_id),
      version: response.data.version,
      downloadUrl: response.data.download_url,
      expiresAt: response.data.expires_at,
      downloads: response.data.downloads,
      views: response.data.views,
    };
  },

  async fetchDownloadLogs(documentId?: string): Promise<DocumentDownloadLogResponse> {
    const query = documentId
      ? `?document_id=${encodeURIComponent(documentId)}`
      : "";
    const response = await requestJson<DownloadLogApiResponse>(
      `/document-download-logs${query}`
    );

    return {
      logs: response.data.map((log) => ({
        id: String(log.id),
        documentId: String(log.document_id),
        documentTitle: log.document_title,
        documentJenis: log.document_jenis,
        documentBidang: log.document_bidang,
        email: log.email,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        downloadedAt: log.downloaded_at,
      })),
      summary: {
        totalDownloads: response.summary.total_downloads,
        uniqueEmails: response.summary.unique_emails,
        downloadsToday: response.summary.downloads_today,
      },
    };
  },
};
