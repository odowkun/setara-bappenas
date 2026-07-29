export type Role = "superadmin" | "admin_umum" | "admin_bidang";

export type BidangType =
  | "semua"
  | "infrastruktur"
  | "perekonomian"
  | "sosbud"
  | "renval";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  bidang?: BidangType; // Spesifik untuk admin_bidang
  nip?: string;
  jabatan?: string;
  avatar?: string;
  permissions?: string[]; // Spatie Granular Permissions
  allowedDocumentPermissions?: string[]; // Checkbox izin upload jenis dokumen (e.g. ["rpjpd", "renstra", "renja"])
  createdAt: string;
}

export interface JenisDokumenItem {
  id: number | string;
  name: string;
  code: string;
  scope_role: 'admin_umum' | 'admin_bidang' | 'semua';
  is_default: boolean;
  created_by?: string;
}

export interface AdminNews {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  date: string;
  views: number;
  desc: string;
  content?: string;
  image: string;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminDocument {
  id: string;
  title: string;
  jenis: string; // rpjpd, rpjmd, rkpd, lkpj, renstra, renja, dik_sektoral, data_sektoral
  bidang: BidangType;
  tahun: string;
  tanggalMulai?: string; // Tanggal Mulai Perencanaan (YYYY-MM-DD)
  tanggalSelesai?: string; // Tanggal Selesai Perencanaan (YYYY-MM-DD)
  ukuran: string;
  downloads: number;
  views: number;
  fileUrl: string;
  isPublic: boolean;
  uploadedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface ProfileData {
  sejarah: string;
  visi: string;
  misi: string[];
  tugasFungsi: string[];
  dasarHukum: string[];
  strukturGambar: string;
}
