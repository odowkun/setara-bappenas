"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Target,
  Network,
  FileText,
  Scale,
  ChevronRight,
  Lock,
} from "lucide-react";

export default function ProfilHubPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Modul Pengeditan Profil Lembaga BAPPEDA hanya dapat diubah oleh role **Administrator (SuperAdmin)**.
        </p>
      </div>
    );
  }

  const subMenus = [
    {
      title: "1. Sejarah Lembaga BAPPEDA",
      description: "Kelola narasi latar belakang sejarah pembentukan dan perjalanan BAPPEDA Halmahera Utara.",
      href: "/dashboard/profil/sejarah",
      icon: Building2,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "2. Visi & Misi Pemerintah Daerah",
      description: "Kelola Visi dan Misi strategis Pemerintah Daerah Kabupaten Halmahera Utara.",
      href: "/dashboard/profil/visi-misi",
      icon: Target,
      color: "bg-amber-50 text-amber-900 border-amber-200",
    },
    {
      title: "3. Bagan Struktur Organisasi & Pejabat",
      description: "Kelola gambar bagan hirarki organisasi serta susunan daftar pejabat struktural resmi.",
      href: "/dashboard/profil/struktur",
      icon: Network,
      color: "bg-emerald-50 text-emerald-900 border-emerald-200",
    },
    {
      title: "4. Tugas Pokok & Fungsi (Tupoksi)",
      description: "Kelola uraian rinci tugas pokok dan fungsi teknis kelembagaan BAPPEDA Halut.",
      href: "/dashboard/profil/tugas-fungsi",
      icon: FileText,
      color: "bg-purple-50 text-purple-900 border-purple-200",
    },
    {
      title: "5. Dasar Hukum & Landasan Kerja",
      description: "Kelola daftar peraturan perundang-undangan dan regulasi daerah landasan kerja BAPPEDA.",
      href: "/dashboard/profil/dasar-hukum",
      icon: Scale,
      color: "bg-blue-50 text-blue-900 border-blue-200",
    },
  ];

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Pengelolaan Profil &amp; Kelembagaan BAPPEDA</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Pilih salah satu sub-menu khusus di bawah ini untuk mengedit narasi profil resmi lembaga.
          </p>
        </div>
      </div>

      {/* Sub-Menu Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subMenus.map((menu) => {
          const Icon = menu.icon;
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition space-y-4 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border ${menu.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition">
                    {menu.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    {menu.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-700 flex items-center gap-1">
                <span>Buka Editor Sub-Menu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
