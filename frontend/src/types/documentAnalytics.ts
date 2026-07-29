export interface DocumentPreviewResult {
  documentId: string;
  views: number;
}

export interface DocumentDownloadResult {
  documentId: string;
  downloadUrl: string;
  downloads: number;
  views: number;
}

export interface DocumentDownloadLog {
  id: string;
  documentId: string;
  documentTitle: string;
  documentJenis: string;
  documentBidang: string;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  downloadedAt: string;
}

export interface DocumentDownloadSummary {
  totalDownloads: number;
  uniqueEmails: number;
  downloadsToday: number;
}

export interface DocumentDownloadLogResponse {
  logs: DocumentDownloadLog[];
  summary: DocumentDownloadSummary;
}
