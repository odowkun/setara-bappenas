"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  ExternalLink,
  Bell,
  Menu,
  HeartHandshake,
  FileText,
  Check,
  Trash2,
  Sparkles,
  UserCheck,
  User,
  Settings,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "ikm" | "kritik" | "dokumen" | "system";
  isRead: boolean;
  link: string;
}

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  
  // Notification Dropdown State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // User Profile Menu Dropdown State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "2",
      title: "Tanggapan Survei IKM Diterima",
      message: "Responden Publik memberikan Rating 5/5 untuk Layanan Informasi Dokumen",
      time: "25 menit yang lalu",
      type: "ikm",
      isRead: false,
      link: "/dashboard/survey-kepuasan",
    },
    {
      id: "3",
      title: "Kritik & Saran Warga",
      message: "Masukan publik baru mengenai pemutakhiran Peta Spasial GIS Halut",
      time: "1 jam yang lalu",
      type: "kritik",
      isRead: false,
      link: "/dashboard/kritik-saran",
    },
    {
      id: "4",
      title: "Dokumen RKPD 2026 Diperbarui",
      message: "Admin Bidang IPW mengunggah draf final dokumen perencanaan",
      time: "3 jam yang lalu",
      type: "dokumen",
      isRead: true,
      link: "/dashboard/dokumen",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Handle Close Dropdowns on Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuDropdownRef.current && !userMenuDropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setIsNotifOpen(false);
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "ikm":
        return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
      case "kritik":
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case "dokumen":
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleDisplayName = () => {
    if (!user) return "";
    switch (user.role) {
      case "superadmin":
        return "SuperAdmin";
      case "admin_umum":
        return "Admin Umum";
      case "admin_bidang":
        return `Admin Bidang (${(user.bidang || "").toUpperCase()})`;
      default:
        return user.role;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs font-sans">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Menu Mobile"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/bappeda/logo-halut.png"
            alt="BAPPEDA Halmahera Utara"
            className="h-9 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 border border-blue-200 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Lihat Web Utama</span>
        </Link>

        {/* NOTIFICATION BELL WITH DROPDOWN */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsUserMenuOpen(false);
            }}
            className={`p-2 rounded-xl transition relative cursor-pointer ${
              isNotifOpen ? "bg-slate-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Notifikasi Aktivitas Warga & Admin"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[8px] font-black text-white" />
              </>
            )}
          </button>

          {/* DROPDOWN NOTIFICATION POPOVER */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-slate-900">Notifikasi Aktivitas</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Tandai Dibaca</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Bersihkan Semua Notifikasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List Body */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold space-y-1">
                    <Bell className="w-6 h-6 mx-auto text-slate-300" />
                    <p>Tidak ada notifikasi aktivitas baru.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      onClick={() => handleNotificationClick(item.id)}
                      className={`p-3.5 flex items-start gap-3 transition hover:bg-slate-50 block ${
                        !item.isRead ? "bg-blue-50/40" : "bg-white"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-slate-900 truncate">{item.title}</h4>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold block pt-0.5">
                          {item.time}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* USER PROFILE TOGGLE MENU DROPDOWN */}
        <div className="relative" ref={userMenuDropdownRef}>
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-2xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-700 text-white font-black flex items-center justify-center text-xs shadow-sm">
              {user?.name.charAt(0) || "A"}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <p className="text-xs font-extrabold text-slate-900 line-clamp-1">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{getRoleDisplayName()}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180 text-blue-700" : ""}`} />
          </button>

          {/* USER POPOVER DROPDOWN PANEL */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 font-sans">
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-md ring-2 ring-blue-400/30">
                    {user?.name.charAt(0) || "A"}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-xs font-extrabold text-white truncate">{user?.name}</h3>
                    <p className="text-[10px] text-blue-200/80 font-medium truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>{getRoleDisplayName()}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 space-y-1 bg-white">
                <Link
                  href="/dashboard/pengaturan-profil"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition"
                >
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Pengaturan Profil &amp; Kata Sandi</span>
                </Link>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
