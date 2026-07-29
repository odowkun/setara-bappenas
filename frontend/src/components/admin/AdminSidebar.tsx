"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: ("superadmin" | "admin_umum" | "admin_bidang")[];
  permission?: string;
  subItems?: { title: string; href: string; icon: React.ElementType; roles?: ("superadmin" | "admin_umum" | "admin_bidang")[] }[];
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
  },
  {
    title: "Profil & Kelembagaan",
    href: "/dashboard/profil",
    icon: Building2,
    roles: ["superadmin"],
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
    subItems: [
      { title: "Berita & Artikel", href: "/dashboard/berita", icon: Newspaper },
      { title: "Pengumuman Resmi", href: "/dashboard/pengumuman", icon: Megaphone },
      { title: "Galeri Foto & Video", href: "/dashboard/galeri", icon: Image },
      { title: "Agenda Kerja & Kalender", href: "/dashboard/agenda", icon: Calendar },
    ],
  },
  {
    title: "Manajemen Dokumen & ESRI",
    href: "/dashboard/dokumen",
    icon: FileText,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
    subItems: [
      { title: "Manajemen Jenis Dokumen", href: "/dashboard/dokumen/jenis-dokumen", icon: FolderPlus, roles: ["superadmin"] },
      { title: "Upload Dokumen Induk", href: "/dashboard/dokumen", icon: FileText },
      { title: "Riwayat Pengunduh", href: "/dashboard/dokumen/riwayat-unduhan", icon: History },
      { title: "Geotagging Proyek", href: "/dashboard/geotagging-proyek", icon: MapPin },
      { title: "Update Progres Sektoral", href: "/dashboard/update-progres", icon: Activity },
      { title: "Lampiran Teknis ESRI", href: "/dashboard/lampiran-teknis", icon: Paperclip },
      { title: "Analisis Geoprocessing", href: "/dashboard/geoprocessing-analisis", icon: Compass },
    ],
  },
  {
    title: "Layanan & Partisipasi Warga",
    href: "/dashboard/survey-kepuasan",
    icon: HeartHandshake,
    roles: ["superadmin", "admin_umum"],
    subItems: [
      { title: "Survei Kepuasan (IKM)", href: "/dashboard/survey-kepuasan", icon: HeartHandshake },
      { title: "Kritik & Saran Warga", href: "/dashboard/kritik-saran", icon: HelpCircle },
    ],
  },
  {
    title: "Tautan OPD",
    href: "/dashboard/tautan-opd",
    icon: Link2,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
    permission: "manage_tautan_opd",
  },
  {
    title: "Audit Logs SPBE",
    href: "/dashboard/audit-logs",
    icon: ShieldCheck,
    roles: ["superadmin"],
  },
  {
    title: "Pengaturan Profil",
    href: "/dashboard/pengaturan-profil",
    icon: UserCheck,
    roles: ["superadmin", "admin_umum", "admin_bidang"],
  },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, hasRole, hasPermission } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between shrink-0 hidden md:flex h-screen sticky top-0 overflow-y-auto shadow-xs font-sans">
        <div>
          {/* PREMIUM EXECUTIVE USER PROFILE CARD */}
          <div className="p-3">
            <Link
              href="/dashboard/pengaturan-profil"
              className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-md border border-slate-800/80 space-y-3 relative overflow-hidden group hover:ring-2 hover:ring-blue-500/40 transition block cursor-pointer"
            >
              {/* Background Glow Overlay */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                {/* Avatar with Glow Ring */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-md ring-2 ring-blue-400/40 shrink-0">
                  {user?.name.charAt(0) || "A"}
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
              const isAllowed = hasRole(item.roles) && (!item.permission || hasPermission(item.permission));
              if (!isAllowed) return null;

              const isSubItemActive = item.subItems?.some(
                (sub) => pathname === sub.href
              );
              const isActive = pathname === item.href || isSubItemActive;
              const isOpen = openSubMenus[item.href] ?? isActive;
              const Icon = item.icon;

              if (item.subItems) {
                return (
                  <div key={item.href} className="space-y-1">
                    <div
                      onClick={() => toggleSubMenu(item.href)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-blue-700" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {isOpen && (
                      <div className="pl-4 space-y-1 border-l-2 border-slate-100 ml-4 py-1">
                        {item.subItems.map((sub) => {
                          if (sub.roles && !hasRole(sub.roles)) return null;

                          const isSubActive = pathname === sub.href;
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={`${sub.href}-${sub.title}`}
                              href={sub.href}
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? "bg-blue-700 text-white shadow-md shadow-blue-700/25"
                      : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{item.title}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
