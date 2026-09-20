import { User, AdminNews, AdminDocument, AuditLog, JenisDokumenItem } from "@/types/auth";
import { API_BASE_URL, STORAGE_BASE_URL, withAuthHeaders } from "@/lib/apiClient";

export function normalizeMediaUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return "/images/bappeda/logo-halut.png";
  }
  const clean = url.trim().replace(/^https?:\/\/[^\/]+(:8100|:8000)?\//, "/");
  if (clean.startsWith("/storage/")) {
    return `${STORAGE_BASE_URL}${clean}`;
  }
  return clean;
}

interface UserMutationInput extends Partial<User> {
  name: string;
  email: string;
  role: User["role"];
  password?: string;
  passwordConfirmation?: string;
}

function mapDocument(d: any): AdminDocument {
  const mapVersion = (version: any) =>
    version
      ? {
          id: String(version.id),
          versionLabel: version.version_label,
          status: version.status,
          integrityStatus: version.integrity_status,
          extractionStatus: version.extraction_status,
        }
      : null;

  return {
    id: String(d.id),
    archiveCode: d.archive_code ?? "",
    documentNumber: d.document_number ?? "",
    title: d.title,
    summary: d.summary ?? "",
    jenis: d.jenis,
    bidang: d.bidang ?? "",
    tahun: String(d.tahun),
    tanggalMulai: d.tanggal_mulai ?? undefined,
    tanggalSelesai: d.tanggal_selesai ?? undefined,
    ukuran: d.ukuran ?? "",
    downloads: d.downloads ?? 0,
    views: d.views ?? 0,
    uniqueViews: d.unique_views ?? 0,
    fileUrl: d.preview_url ?? "",
    isPublic: Boolean(d.is_public),
    ownerOpd: d.owner_opd ?? "",
    keywords: Array.isArray(d.keywords) ? d.keywords : [],
    classification: d.classification,
    governanceStatus: d.governance_status,
    storageStatus: d.storage_status,
    retentionPolicy: d.retention_policy,
    retentionUntil: d.retention_until ?? undefined,
    retentionStatus: d.retention_status,
    legalHold: Boolean(d.legal_hold),
    currentVersion: mapVersion(d.current_version),
    latestVersion: mapVersion(d.latest_version),
    uploadedBy: d.uploaded_by ?? "",
    createdAt: d.created_at ?? "",
  };
}

export const adminService = {
  // Helper to fetch API with Bearer token
  async apiFetch(endpoint: string, options: RequestInit = {}) {
    const headers = withAuthHeaders(options.headers);
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[adminService] Backend API tidak dapat dijangkau pada ${endpoint}.`, err);
      return null;
    }
  },

  // JENIS DOKUMEN MASTER (LANGSUNG DARI DATABASE REST API)
  fetchJenisDokumen: async (): Promise<{ code: string; label: string }[]> => {
    try {
      const res = await adminService.apiFetch("/jenis-dokumen");
      if (res && res.data && Array.isArray(res.data)) {
        return [
          { code: "ALL", label: "Semua Jenis Dokumen" },
          ...res.data.map((item: any) => ({
            code: item.code.toUpperCase(),
            label: item.name,
          })),
        ];
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch jenis-dokumen from Database API:", e);
    }
    return [{ code: "ALL", label: "Semua Jenis Dokumen" }];
  },

  fetchJenisDokumenItems: async (role?: string): Promise<JenisDokumenItem[]> => {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    const res = await adminService.apiFetch(`/jenis-dokumen${query}`);
    if (!res?.data || !Array.isArray(res.data)) {
      throw new Error("Jenis dokumen gagal dimuat dari database.");
    }
    return res.data;
  },

  createJenisDokumen: async (data: {
    name: string;
    code: string;
    scope_role: "admin_umum" | "admin_bidang" | "semua";
  }): Promise<JenisDokumenItem> => {
    const res = await adminService.apiFetch("/jenis-dokumen", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res?.data) throw new Error("Jenis dokumen gagal disimpan ke database.");
    return res.data;
  },

  // USERS
  fetchUsers: async (): Promise<User[]> => {
    try {
      const res = await adminService.apiFetch("/users");
      if (res && res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch users from API:", e);
    }
    return [];
  },

  getUsers: (): User[] => [],

  addUser: async (user: UserMutationInput): Promise<User> => {
    const res = await adminService.apiFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        ...user,
        password_confirmation: user.passwordConfirmation,
        allowed_document_permissions: user.allowedDocumentPermissions,
      }),
    });

    if (!res?.data) {
      throw new Error("Server menolak atau gagal menyimpan pengguna.");
    }

    return res.data as User;
  },

  updateUser: async (
    id: string,
    updatedData: Partial<UserMutationInput>
  ): Promise<User> => {
    const res = await adminService.apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...updatedData,
        password_confirmation: updatedData.passwordConfirmation,
        allowed_document_permissions: updatedData.allowedDocumentPermissions,
      }),
    });

    if (!res?.data) {
      throw new Error("Server menolak atau gagal memperbarui pengguna.");
    }

    return res.data as User;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const res = await adminService.apiFetch(`/users/${id}`, { method: "DELETE" });
    return Boolean(res);
  },

  // DOCUMENTS
  fetchDocuments: async (bidangFilter?: string, userRole?: string): Promise<AdminDocument[]> => {
    try {
      let endpoint = userRole ? "/admin/documents" : "/documents";
      if (userRole === "admin_bidang" && bidangFilter) {
        endpoint += `?bidang=${bidangFilter}`;
      } else if (bidangFilter && bidangFilter !== "semua") {
        endpoint += `?bidang=${bidangFilter}`;
      }
      const res = await adminService.apiFetch(endpoint);
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: AdminDocument[] = res.data.map(mapDocument);
        // Apply strict role-based filter (Case-Insensitive for SuperAdmin / Admin Bidang)
        const normalizedRole = (userRole || "").toLowerCase();
        if (normalizedRole === "superadmin") {
          return mapped;
        }
        if (normalizedRole === "admin_bidang" && bidangFilter) {
          return mapped.filter((d) => (d.bidang || "").toLowerCase() === bidangFilter.toLowerCase());
        }
        return mapped;
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch documents from API:", e);
    }
    return [];
  },

  addDocument: async (doc: Omit<AdminDocument, "id" | "downloads" | "views" | "createdAt">): Promise<AdminDocument> => {
    try {
      const res = await adminService.apiFetch("/documents", {
        method: "POST",
        body: JSON.stringify({
          title: doc.title,
          summary: doc.summary,
          jenis: doc.jenis,
          bidang: doc.bidang,
          tahun: doc.tahun,
          ukuran: doc.ukuran,
          file_path: doc.fileUrl,
          document_number: doc.documentNumber || null,
          owner_opd: doc.ownerOpd || null,
          keywords: doc.keywords || [],
          classification: doc.classification || "internal",
          retention_policy: doc.retentionPolicy || "permanent",
          tanggal_mulai: doc.tanggalMulai || null,
          tanggal_selesai: doc.tanggalSelesai || null,
          submit_for_review: doc.isPublic,
        }),
      });

      if (!res?.data) {
        throw new Error("Server tidak memverifikasi dokumen ber-watermark.");
      }

      return mapDocument(res.data);
    } catch (err) {
      console.warn("[adminService] Failed to post watermarked document to API:", err);
      throw err;
    }

  },

  updateDocumentPublication: async (
    id: string,
    isPublished: boolean
  ): Promise<AdminDocument> => {
    const res = await adminService.apiFetch(`/documents/${id}/publication`, {
      method: "PATCH",
      body: JSON.stringify({ is_published: isPublished }),
    });
    if (!res?.data) throw new Error("Status publikasi dokumen gagal diperbarui.");

    return mapDocument(res.data);
  },

  incrementDownload: (id: string): number => {
    console.warn(
      `[adminService] incrementDownload(${id}) dinonaktifkan: unduhan publik wajib melalui verifikasi email.`
    );
    return 0;
  },

  deleteDocument: async (id: string): Promise<boolean> => {
    const response = await adminService.apiFetch(`/documents/${id}`, { method: "DELETE" });
    if (!response) return false;

    return true;
  },

  // NEWS (LANGSUNG DARI DATABASE REST API)
  fetchNews: async (): Promise<any[]> => {
    try {
      const res = await adminService.apiFetch("/admin/news");
      if (res && res.data && Array.isArray(res.data)) {
        return res.data.map((item: any) => ({
          id: String(item.id),
          slug: item.slug,
          title: item.title,
          category: item.category || "",
          author: item.author || "",
          date: item.date || item.created_at?.split("T")[0] || "",
          views: item.views || 0,
          isPublished: Boolean(item.is_published),
          featuredImage: normalizeMediaUrl(item.image || item.image_url),
          summary: item.summary || (item.content ? item.content.replace(/<[^>]*>?/gm, "").substring(0, 160) + "..." : ""),
          readTime: "3 mnt baca",
          content: item.content,
        }));
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch news from API:", e);
    }
    return [];
  },

  fetchNewsById: async (id: string): Promise<any> => {
    const res = await adminService.apiFetch(`/admin/news/${id}`);
    if (!res?.data) throw new Error("Berita tidak ditemukan di database.");
    if (res.data.image) {
      res.data.image = normalizeMediaUrl(res.data.image);
    }
    return res.data;
  },

  addNews: async (data: {
    title: string;
    category: string;
    content: string;
    summary?: string;
    image?: string;
    is_published?: boolean;
  }) => {
    const res = await adminService.apiFetch("/news", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res?.data) throw new Error("Berita gagal disimpan ke database.");
    return res.data;
  },

  updateNews: async (id: string, data: Record<string, unknown>) => {
    const res = await adminService.apiFetch(`/news/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res?.data) throw new Error("Berita gagal diperbarui di database.");
    return res.data;
  },

  updateNewsPublication: async (id: string, isPublished: boolean) => {
    const res = await adminService.apiFetch(`/news/${id}/publication`, {
      method: "PATCH",
      body: JSON.stringify({ is_published: isPublished }),
    });
    if (!res?.data) throw new Error("Status publikasi berita gagal diperbarui.");
    return res.data;
  },

  deleteNews: async (id: string): Promise<void> => {
    const res = await adminService.apiFetch(`/news/${id}`, { method: "DELETE" });
    if (!res) throw new Error("Berita gagal dihapus dari database.");
  },

  // AUDIT LOGS
  fetchLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await adminService.apiFetch("/audit-logs");
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: AuditLog[] = res.data.map((l: any) => ({
          id: String(l.id),
          userName: l.user_name || "Tidak tersedia",
          userRole: l.user_role || "Tidak tersedia",
          action: l.action,
          details: l.details,
          ipAddress: l.ip_address || "Tidak tersedia",
          timestamp: l.created_at || "",
        }));
        return mapped;
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch audit logs from API:", e);
    }
    return [];
  },

  getLogs: (): AuditLog[] => [],

  addLog: () => undefined,
};
