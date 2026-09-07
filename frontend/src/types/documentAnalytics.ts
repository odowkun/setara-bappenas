export interface DocumentPreviewResult {
  documentId: string;
  versionId: string;
  version: string;
  previewUrl: string;
  expiresAt: string;
  views: number;
  uniqueViews: number;
}

export interface DocumentDownloadResult {
  documentId: string;
  versionId: string;
  version: string;
  downloadUrl: string;
  expiresAt: string;
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
