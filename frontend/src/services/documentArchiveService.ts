import { authenticatedFetch } from "@/lib/apiClient";

export type DocumentClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";
export type DocumentGovernanceStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "pending_migration"
  | "archived";
export type DocumentStorageStatus =
  | "private"
  | "legacy_external"
  | "missing";
export type DocumentIntegrityStatus =
  | "pending"
  | "valid"
  | "mismatch"
  | "missing";
export type DocumentExtractionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "unavailable"
  | "not_applicable";
export type DocumentReviewDecision = "approved" | "rejected";

export interface ArchiveDocumentIdentity {
  id: string | number;
  title: string;
  jenis: string;
  bidang: string;
  tahun: string;
  summary?: string | null;
}

export interface DocumentArchiveVersion {
  id: string;
  version_number: number;
  version_label: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  checksum_sha256: string | null;
  integrity_status: DocumentIntegrityStatus;
  integrity_verified_at: string | null;
  extraction_status: DocumentExtractionStatus;
  extraction_method: string | null;
  extracted_at: string | null;
  searchable_characters: number;
  change_summary: string | null;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface DocumentApprovalActor {
  id: string;
  name: string;
  role: string;
}

export interface DocumentApprovalLog {
  id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  actor: DocumentApprovalActor | null;
  created_at: string;
}

export interface DocumentGovernanceData extends ArchiveDocumentIdentity {
  archive_code: string | null;
  document_number: string | null;
  ukuran: string;
  owner_opd: string | null;
  classification: DocumentClassification;
  governance_status: DocumentGovernanceStatus;
  storage_status: DocumentStorageStatus;
  keywords: string[];
  effective_at: string | null;
  expires_at: string | null;
  retention_policy:
    | "permanent"
    | "active_5_years"
    | "active_10_years"
    | "custom";
  retention_until: string | null;
  retention_status: string | null;
  legal_hold: boolean;
  review_note: string | null;
  is_public: boolean;
  published_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  downloads: number;
  views: number;
  unique_views: number;
  uploaded_by: string;
  preview_url: string | null;
  current_version: DocumentArchiveVersion | null;
  latest_version: DocumentArchiveVersion | null;
  versions: DocumentArchiveVersion[];
  approval_logs: DocumentApprovalLog[];
  created_at: string;
  updated_at: string;
}

export interface DocumentGovernanceUpdate {
  document_number: string | null;
  owner_opd: string | null;
  classification: DocumentClassification;
  keywords: string[];
  effective_at: string | null;
  expires_at: string | null;
  retention_policy:
    | "permanent"
    | "active_5_years"
    | "active_10_years"
    | "custom";
  retention_until: string | null;
  legal_hold: boolean;
  review_note: string | null;
}

export interface DocumentVersionInput {
  file_path: string;
  change_summary: string;
}

export interface DocumentWorkflowSubmitInput {
  notes: string;
}

export interface DocumentWorkflowReviewInput {
  decision: DocumentReviewDecision;
  notes: string;
}

interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

interface DocumentVersionCreatedData {
  version: DocumentArchiveVersion;
  document: DocumentGovernanceData;
}

async function archiveRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const response = await authenticatedFetch(endpoint, options);

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const validationMessage = errorBody.errors
      ? Object.values(errorBody.errors).flat()[0]
      : undefined;
    throw new Error(
      validationMessage ||
        errorBody.message ||
        `Server menolak permintaan arsip (${response.status}).`
    );
  }

  return response.json() as Promise<ApiEnvelope<T>>;
}

function jsonOptions(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const documentArchiveService = {
  async getGovernance(documentId: string): Promise<DocumentGovernanceData> {
    const response = await archiveRequest<DocumentGovernanceData>(
      `/admin/documents/${documentId}/governance`,
      { cache: "no-store" }
    );
    return response.data;
  },

  async updateGovernance(
    documentId: string,
    input: DocumentGovernanceUpdate
  ): Promise<DocumentGovernanceData> {
    const response = await archiveRequest<DocumentGovernanceData>(
      `/admin/documents/${documentId}/governance`,
      jsonOptions("PUT", input)
    );
    return response.data;
  },

  async createVersion(
    documentId: string,
    input: DocumentVersionInput
  ): Promise<DocumentVersionCreatedData> {
    const response = await archiveRequest<DocumentVersionCreatedData>(
      `/documents/${documentId}/versions`,
      jsonOptions("POST", input)
    );
    return response.data;
  },

  async submitWorkflow(
    documentId: string,
    input: DocumentWorkflowSubmitInput
  ): Promise<DocumentGovernanceData> {
    const response = await archiveRequest<DocumentGovernanceData>(
      `/documents/${documentId}/workflow/submit`,
      jsonOptions("PATCH", input)
    );
    return response.data;
  },

  async reviewWorkflow(
    documentId: string,
    input: DocumentWorkflowReviewInput
  ): Promise<DocumentGovernanceData> {
    const response = await archiveRequest<DocumentGovernanceData>(
      `/documents/${documentId}/workflow/review`,
      jsonOptions("PATCH", input)
    );
    return response.data;
  },

  async verifyIntegrity(
    documentId: string
  ): Promise<DocumentArchiveVersion> {
    const response = await archiveRequest<DocumentArchiveVersion>(
      `/documents/${documentId}/integrity`,
      { method: "POST" }
    );
    return response.data;
  },

  async extractVersion(
    documentId: string,
    versionId: string | number
  ): Promise<DocumentArchiveVersion> {
    const response = await archiveRequest<DocumentArchiveVersion>(
      `/documents/${documentId}/versions/${versionId}/extract`,
      { method: "POST" }
    );
    return response.data;
  },
};
