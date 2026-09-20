"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/apiClient";
import { fetchPublicKritikList } from "@/services/surveyService";
import {
  LayoutDashboard,
  Users,
  Building2,
  Newspaper,
  FileText,
  MapPin,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Megaphone,
  Image,
  Calendar,
  HeartHandshake,
  HelpCircle,
  Map,
  Compass,
  Lightbulb,
  Activity,
  Paperclip,
  FolderPlus,
  UserCheck,
  Link2,
  History,
  Globe,
  Layers,
  Server,
  Palette,
  Shield,
  Target,
  Printer,
  ScrollText,
} from "lucide-react";

interface SubMenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: ("superadmin" | "admin_umum" | "admin_bidang")[];
  permissions?: string[];
  subItems?: SubMenuItem[];
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: ("superadmin" | "admin_umum" | "admin_bidang")[];
  permissions?: string[];
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "Ikhtisar Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
  },
  {
    title: "Manajemen Pengguna",
    href: "/dashboard/users",
    icon: Users,
    roles: ["superadmin"],
    permissions: ["manage_users"],
  },
  {
    title: "Profil & Kelembagaan",
    href: "/dashboard/profil",
    icon: Building2,
    roles: ["superadmin"],
    permissions: ["manage_profil"],
    subItems: [
      { title: "Tentang Bappeda", href: "/dashboard/profil/tentang", icon: Building2 },
      { title: "Tugas & Fungsi", href: "/dashboard/profil/tugas-fungsi", icon: FileText },
      { title: "Dasar Hukum", href: "/dashboard/profil/dasar-hukum", icon: ShieldCheck },
      { title: "Struktur Organisasi", href: "/dashboard/profil/struktur", icon: Building2 },
    ],
  },
  {
    title: "Media, Pengumuman & Agenda",
    href: "/dashboard/berita",
    icon: Newspaper,
    roles: ["superadmin", "admin_umum"],
    permissions: ["manage_berita", "manage_pengumuman", "manage_galeri"],
    subItems: [
      { title: "Berita & Artikel", href: "/dashboard/berita", icon: Newspaper, permissions: ["manage_berita"] },
      { title: "Pengumuman Resmi", href: "/dashboard/pengumuman", icon: Megaphone, permissions: ["manage_pengumuman"] },
      { title: "Galeri Foto & Video", href: "/dashboard/galeri", icon: Image, permissions: ["manage_galeri"] },
      { title: "Agenda Kerja & Kalender", href: "/dashboard/agenda", icon: Calendar, permissions: ["manage_pengumuman"] },
      { title: "Teks Berjalan (Running Text)", href: "/dashboard/running-text", icon: ScrollText, permissions: ["manage_pengumuman"] },
    ],
  },
  {
    title: "Manajemen Dokumen & ESRI",
    href: "/dashboard/dokumen",
    icon: FileText,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
    permissions: ["manage_dokumen", "manage_gis"],
    subItems: [
      { title: "Manajemen Jenis Dokumen", href: "/dashboard/dokumen/jenis-dokumen", icon: FolderPlus, roles: ["superadmin"], permissions: ["manage_document_types"] },
      { title: "Upload Dokumen Induk", href: "/dashboard/dokumen", icon: FileText, permissions: ["manage_dokumen"] },
      {
        title: "Geotagging Proyek",
        href: "/dashboard/geotagging-proyek",
        icon: MapPin,
        permissions: ["manage_gis"],
        subItems: [
          { title: "Update Progres Sektoral", href: "/dashboard/update-progres", icon: Activity, permissions: ["manage_gis"] },
          { title: "Lampiran Teknis ESRI", href: "/dashboard/lampiran-teknis", icon: Paperclip, permissions: ["manage_gis"] },
          { title: "Analisis Geoprocessing", href: "/dashboard/geoprocessing-analisis", icon: Compass, permissions: ["manage_gis"] },
        ],
      },
      { title: "Riwayat Pengunduh", href: "/dashboard/dokumen/riwayat-unduhan", icon: History, roles: ["superadmin", "admin_umum"], permissions: ["view_download_logs"] },
    ],
  },
  {
    title: "Pengaturan Spasial & WebGIS",
    href: "/dashboard/pengaturan-spasial",
    icon: Compass,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
    permissions: ["manage_gis", "manage_dashboard"],
    subItems: [
      { title: "Viewport & Peta Awal", href: "/dashboard/pengaturan-spasial/viewport", icon: Globe, permissions: ["manage_gis", "manage_dashboard"] },
      { title: "Pilihan Basemap Utama", href: "/dashboard/pengaturan-spasial/basemap", icon: Layers, permissions: ["manage_gis", "manage_dashboard"] },
      { title: "Integrasi ESRI ArcGIS", href: "/dashboard/pengaturan-spasial/esri", icon: Server, permissions: ["manage_gis", "manage_dashboard"] },
      { title: "Visual Layer & Satuan", href: "/dashboard/pengaturan-spasial/visual", icon: Palette, permissions: ["manage_gis", "manage_dashboard"] },
      { title: "Batas Administrasi & RTRW", href: "/dashboard/pengaturan-spasial/rtrw-batas", icon: Shield, permissions: ["manage_gis", "manage_dashboard"] },
      { title: "Kategori Pin & Ikon OPD", href: "/dashboard/pengaturan-spasial/pin-kategori", icon: MapPin, permissions: ["manage_gis", "manage_dashboard"] },
      { title: "Radius Penyangga (Buffer)", href: "/dashboard/pengaturan-spasial/buffer-radius", icon: Target, permissions: ["manage_gis", "manage_dashboard"] },
      { title: "Cetak & Layout Executive", href: "/dashboard/pengaturan-spasial/cetak-layout", icon: Printer, permissions: ["manage_gis", "manage_dashboard"] },
    ],
  },
  {
    title: "Layanan & Partisipasi Warga",
    href: "/dashboard/survey-kepuasan",
    icon: HeartHandshake,
    roles: ["superadmin", "admin_umum"],
    permissions: ["manage_survey", "manage_kritik"],
    subItems: [
      { title: "Survei Kepuasan (IKM)", href: "/dashboard/survey-kepuasan", icon: HeartHandshake, permissions: ["manage_survey"] },
      { title: "Kritik & Saran Warga", href: "/dashboard/kritik-saran", icon: HelpCircle, permissions: ["manage_kritik"] },
    ],
  },
  {
    title: "Tautan OPD",
    href: "/dashboard/tautan-opd",
    icon: Link2,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
    permissions: ["manage_tautan_opd"],
  },
  {
    title: "Audit Logs SPBE",
    href: "/dashboard/audit-logs",
    icon: ShieldCheck,
    roles: ["superadmin"],
    permissions: ["view_audit_logs"],
  },
  {
    title: "Pengaturan Profil",
    href: "/dashboard/pengaturan-profil",
    icon: UserCheck,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
  },
];

export interface AdminSidebarProps {
  pendingPath?: string | null;
  onNavigate?: (href: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingPath,
  onNavigate,
  mobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const currentPath = pendingPath || pathname;
  const { user, logout, hasRole, hasPermission } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [pendingKritikCount, setPendingKritikCount] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    fetchPublicKritikList()
      .then((list) => {
        if (Array.isArray(list)) {
          const pending = list.filter((k) => k.status !== "Sudah Ditanggapi" && k.status !== "Ditutup").length;
          setPendingKritikCount(pending);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    "/dashboard/profil": false,
    "/dashboard/berita": false,
    "/dashboard/dokumen": true,
  });

  const toggleSubMenu = (href: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const getRoleLabel = () => {
    if (!user) return "";
    switch (user.role) {
      case "superadmin":
        return "Administrator (SuperAdmin)";
      case "admin_umum":
        return "Admin Umum & Humas";
      case "admin_bidang":
        return `Admin Bidang (${user.bidang?.toUpperCase() || ""})`;
      default:
        return user.role;
    }
  };

  const renderContent = (isMobile = false) => {
    const handleLinkClick = (href: string) => {
      onNavigate?.(href);
      if (isMobile) {
        onMobileClose?.();
      }
    };

    return (
      <div>
        {/* PREMIUM EXECUTIVE USER PROFILE CARD */}
        <div className="p-3">
          <Link
            href="/dashboard/pengaturan-profil"
            onClick={() => handleLinkClick("/dashboard/pengaturan-profil")}
            className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-md border border-slate-800/80 space-y-3 relative overflow-hidden group hover:ring-2 hover:ring-blue-500/40 transition block cursor-pointer"
          >
            {/* Background Glow Overlay */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              {/* Avatar with Glow Ring */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-md ring-2 ring-blue-400/40 shrink-0">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden space-y-0.5">
                <h2 className="text-xs font-extrabold text-white truncate leading-snug tracking-tight group-hover:text-blue-300 transition">
                  {user?.name}
                </h2>
                <p className="text-[10px] text-blue-200/80 font-medium truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Polished Role Badge Pill */}
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 whitespace-nowrap shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                <span>{getRoleLabel()}</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Dynamic Navigation Menu */}
        <nav className="px-3 pb-6 space-y-1">
          <p className="px-3 py-2 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
            Menu Utama SPBE
          </p>
          {menuItems.map((item) => {
            const isAllowed =
              hasRole(item.roles) &&
              (!item.permissions || item.permissions.some(hasPermission));
            if (!isAllowed) return null;

            const isSubItemActive = item.subItems?.some(
              (sub) => currentPath === sub.href || sub.subItems?.some((child) => currentPath === child.href)
            );
            const isActive = currentPath === item.href || isSubItemActive;
            const isOpen = isSubItemActive || !!openSubMenus[item.href];
            const Icon = item.icon;

            if (item.subItems) {
              return (
                <div key={item.href} className="space-y-1">
                  <div
                    onClick={() => toggleSubMenu(item.href)}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? "text-blue-700"
                            : "text-slate-500 group-hover:text-blue-700"
                        }`}
                      />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-blue-600"
                      } ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isOpen && (
                    <div className="pl-4 space-y-1 border-l-2 border-slate-100 ml-4 py-1">
                      {item.subItems.map((sub) => {
                        if (sub.roles && !hasRole(sub.roles)) return null;
                        if (sub.permissions && !sub.permissions.some(hasPermission)) return null;

                        const SubIcon = sub.icon;
                        const isSubChildActive = sub.subItems?.some((child) => currentPath === child.href);
                        const isSubActive = currentPath === sub.href;
                        const isParentOrSubActive = isSubActive || isSubChildActive;
                        const isSubOpen = isParentOrSubActive || !!openSubMenus[sub.href];

                        if (sub.subItems) {
                          return (
                            <div key={`${sub.href}-${sub.title}`} className="space-y-1">
                              <div className="flex items-center justify-between group">
                                <Link
                                  href={sub.href}
                                  onClick={() => handleLinkClick(sub.href)}
                                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition ${
                                    isSubActive
                                      ? "bg-blue-700 text-white shadow-sm"
                                      : isSubChildActive
                                      ? "bg-blue-50 text-blue-700 font-extrabold"
                                      : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/80"
                                  }`}
                                >
                                  <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-white" : isSubChildActive ? "text-blue-700" : "text-slate-400"}`} />
                                  <span className="truncate">{sub.title}</span>
                                  {sub.href === "/dashboard/survey-kepuasan" && pendingKritikCount > 0 && (
                                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse shrink-0">
                                      {pendingKritikCount}
                                    </span>
                                  )}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => toggleSubMenu(sub.href)}
                                  className="px-2 py-2 text-slate-400 hover:text-blue-700 transition cursor-pointer"
                                  title={`Toggle ${sub.title}`}
                                >
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isSubOpen ? "rotate-180 text-blue-600" : ""
                                    }`}
                                  />
                                </button>
                              </div>

                              {isSubOpen && (
                                <div className="pl-3 space-y-1 border-l-2 border-blue-200 ml-4 py-0.5">
                                  {sub.subItems.map((child) => {
                                    if (child.roles && !hasRole(child.roles)) return null;
                                    if (child.permissions && !child.permissions.some(hasPermission)) return null;

                                    const isChildActive = currentPath === child.href;
                                    const ChildIcon = child.icon;
                                    return (
                                      <Link
                                        key={`${child.href}-${child.title}`}
                                        href={child.href}
                                        onClick={() => handleLinkClick(child.href)}
                                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition ${
                                          isChildActive
                                            ? "bg-blue-700 text-white shadow-2xs"
                                            : "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <ChildIcon className={`w-3 h-3 shrink-0 ${isChildActive ? "text-white" : "text-slate-400"}`} />
                                          <span className="truncate">{child.title}</span>
                                        </div>
                                        {child.href === "/dashboard/kritik-saran" && pendingKritikCount > 0 && (
                                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                                            isChildActive ? "bg-white text-rose-600" : "bg-rose-500 text-white"
                                          }`}>
                                            {pendingKritikCount}
                                          </span>
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={`${sub.href}-${sub.title}`}
                            href={sub.href}
                            onClick={() => handleLinkClick(sub.href)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition ${
                              isSubActive
                                ? "bg-blue-700 text-white shadow-sm"
                                : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/80"
                            }`}
                          >
                            <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-white" : "text-slate-400"}`} />
                            <span>{sub.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleLinkClick(item.href)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                  isActive
                    ? "bg-blue-700 text-white shadow-md shadow-blue-700/25"
                    : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-blue-700"
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between shrink-0 hidden md:flex h-screen sticky top-0 overflow-y-auto shadow-xs font-sans">
        {renderContent(false)}
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white text-slate-700 flex flex-col justify-between h-full overflow-y-auto shadow-2xl font-sans z-10 animate-in slide-in-from-left duration-250">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
