import { User, AdminNews, AdminDocument, AuditLog } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const USERS_KEY = "bappeda_users";
const DOCS_KEY = "bappeda_admin_docs";
const AUDIT_KEY = "bappeda_audit_logs";
const TOKEN_KEY = "bappeda_sanctum_token";

export const adminService = {
  // Helper to fetch API with Bearer token
  async apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[adminService] Backend API offline/unreachable at ${endpoint}. Using LocalStorage fallback.`, err);
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

  // USERS
  fetchUsers: async (): Promise<User[]> => {
    try {
      const res = await adminService.apiFetch("/users");
      if (res && res.data && Array.isArray(res.data)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(USERS_KEY, JSON.stringify(res.data));
        }
        return res.data;
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch users from API:", e);
    }
    return adminService.getUsers();
  },

  getUsers: (): User[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  addUser: (user: Omit<User, "id" | "createdAt">): User => {
    const users = adminService.getUsers();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newUser, ...users];
    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    }

    adminService.apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });

    adminService.addLog(user.name || "System", user.role, "ADD_USER", `Menambah user baru: ${user.name} (${user.role})`);
    return newUser;
  },

  updateUser: (id: string, updatedData: Partial<User>): User | null => {
    const users = adminService.getUsers();
    const index = users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return null;
    const updatedUser = { ...users[index], ...updatedData };
    users[index] = updatedUser;
    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    adminService.apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updatedData),
    });

    adminService.addLog(updatedUser.name || "System", updatedUser.role, "UPDATE_USER", `Memperbarui user: ${updatedUser.name}`);
    return updatedUser;
  },

  deleteUser: (id: string): boolean => {
    const users = adminService.getUsers();
    const filtered = users.filter((u) => String(u.id) !== String(id));
    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    }

    adminService.apiFetch(`/users/${id}`, { method: "DELETE" });
    adminService.addLog("Admin", "superadmin", "DELETE_USER", `Menghapus user ID: ${id}`);
    return true;
  },

  // DOCUMENTS
  fetchDocuments: async (bidangFilter?: string, userRole?: string): Promise<AdminDocument[]> => {
    try {
      let endpoint = "/documents";
      if (userRole === "admin_bidang" && bidangFilter) {
        endpoint += `?bidang=${bidangFilter}`;
      } else if (bidangFilter && bidangFilter !== "semua") {
        endpoint += `?bidang=${bidangFilter}`;
      }
      const res = await adminService.apiFetch(endpoint);
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: AdminDocument[] = res.data.map((d: any) => ({
          id: String(d.id),
          title: d.title,
          jenis: d.jenis,
          bidang: d.bidang || "semua",
          tahun: String(d.tahun),
          ukuran: d.ukuran || "2.5 MB",
          downloads: d.downloads || 0,
          views: d.views || 0,
          fileUrl: d.file_path || "/documents/dokumen-bappeda-halut.pdf",
          isPublic: Boolean(d.is_public),
          uploadedBy: d.uploaded_by || "Admin Bappeda",
          createdAt: d.created_at || new Date().toISOString(),
        }));
        if (typeof window !== "undefined") {
          localStorage.setItem(DOCS_KEY, JSON.stringify(mapped));
        }

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
    return adminService.getDocuments(bidangFilter, userRole);
  },

  getDocuments: (bidangFilter?: string, userRole?: string): AdminDocument[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(DOCS_KEY);
    const docs: AdminDocument[] = stored ? JSON.parse(stored) : [];

    const normalizedRole = (userRole || "").toLowerCase();

    // SuperAdmin accesses ALL documents!
    if (normalizedRole === "superadmin") {
      return docs;
    }

    // Admin Bidang accesses ONLY documents belonging to their exact bidang!
    if (normalizedRole === "admin_bidang" && bidangFilter) {
      return docs.filter((d) => (d.bidang || "").toLowerCase() === bidangFilter.toLowerCase());
    }

    if (bidangFilter && bidangFilter !== "semua") {
      return docs.filter((d) => (d.bidang || "").toLowerCase() === bidangFilter.toLowerCase());
    }
    return docs;
  },

  addDocument: async (doc: Omit<AdminDocument, "id" | "downloads" | "views" | "createdAt">): Promise<AdminDocument> => {
    const docs = adminService.getDocuments();
    let newDoc: AdminDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      downloads: 0,
      views: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await adminService.apiFetch("/documents", {
        method: "POST",
        body: JSON.stringify({
          title: doc.title,
          jenis: doc.jenis,
          bidang: doc.bidang,
          tahun: doc.tahun,
          ukuran: doc.ukuran,
          file_path: doc.fileUrl,
          uploaded_by: doc.uploadedBy,
        }),
      });

      if (!res?.data) {
        throw new Error("Server tidak memverifikasi dokumen ber-watermark.");
      }

      if (res && res.data) {
        newDoc = {
          id: String(res.data.id),
          title: res.data.title,
          jenis: res.data.jenis,
          bidang: res.data.bidang || "semua",
          tahun: String(res.data.tahun),
          ukuran: res.data.ukuran || "2.5 MB",
          downloads: res.data.downloads || 0,
          views: res.data.views || 0,
          fileUrl: res.data.file_path || "/documents/dokumen-bappeda-halut.pdf",
          isPublic: Boolean(res.data.is_public),
          uploadedBy: res.data.uploaded_by || doc.uploadedBy,
          createdAt: res.data.created_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("[adminService] Failed to post watermarked document to API:", err);
      throw err;
    }

    const updated = [newDoc, ...docs.filter((d) => String(d.id) !== String(newDoc.id))];
    if (typeof window !== "undefined") {
      localStorage.setItem(DOCS_KEY, JSON.stringify(updated));
    }

    adminService.addLog(doc.uploadedBy, "admin", "UPLOAD_DOCUMENT", `Unggah dokumen: ${doc.title}`);
    return newDoc;
  },

  incrementDownload: (id: string): number => {
    const docs = adminService.getDocuments();
    const idx = docs.findIndex((d) => String(d.id) === String(id));
    if (idx !== -1) {
      docs[idx].downloads = (docs[idx].downloads || 0) + 1;
      if (typeof window !== "undefined") {
        localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
      }
      adminService.apiFetch(`/documents/${id}/download`, { method: "POST" });
      return docs[idx].downloads;
    }
    return 0;
  },

  deleteDocument: async (id: string, userName: string): Promise<boolean> => {
    const docs = adminService.getDocuments();
    const filtered = docs.filter((d) => String(d.id) !== String(id));
    if (typeof window !== "undefined") {
      localStorage.setItem(DOCS_KEY, JSON.stringify(filtered));
    }

    try {
      await adminService.apiFetch(`/documents/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("[adminService] Failed to delete document from API:", err);
    }
    adminService.addLog(userName, "admin", "DELETE_DOCUMENT", `Hapus dokumen ID: ${id}`);
    return true;
  },

  // NEWS (LANGSUNG DARI DATABASE REST API)
  fetchNews: async (): Promise<any[]> => {
    try {
      const res = await adminService.apiFetch("/news");
      if (res && res.data && Array.isArray(res.data)) {
        return res.data.map((item: any) => ({
          id: String(item.id),
          slug: item.slug,
          title: item.title,
          category: item.category || "Berita Utama",
          author: item.author || "bappeda",
          date: item.date || item.created_at?.split("T")[0] || "2026-07-21",
          views: item.views || 0,
          featuredImage: item.image || item.image_url || "https://bappeda.halmaherautarakab.go.id/template/assets/img/halut.png",
          summary: item.content ? item.content.replace(/<[^>]*>?/gm, "").substring(0, 160) + "..." : "",
          readTime: "3 mnt baca",
          content: item.content,
        }));
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch news from API:", e);
    }
    return [];
  },

  // AUDIT LOGS
  fetchLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await adminService.apiFetch("/audit-logs");
      if (res && res.data && Array.isArray(res.data)) {
        const mapped: AuditLog[] = res.data.map((l: any) => ({
          id: String(l.id),
          userName: l.user_name || "System",
          userRole: l.user_role || "admin",
          action: l.action,
          details: l.details,
          ipAddress: l.ip_address || "127.0.0.1",
          timestamp: l.created_at || new Date().toISOString(),
        }));
        if (typeof window !== "undefined") {
          localStorage.setItem(AUDIT_KEY, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (e) {
      console.warn("[adminService] Failed to fetch audit logs from API:", e);
    }
    return adminService.getLogs();
  },

  getLogs: (): AuditLog[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(AUDIT_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  addLog: (userName: string, userRole: string, action: string, details: string) => {
    const logs = adminService.getLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userName,
      userRole,
      action,
      details,
      ipAddress: "127.0.0.1",
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs.slice(0, 49)];
    if (typeof window !== "undefined") {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
    }
  },
};
