"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccessibility } from "@/context/AccessibilityContext";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  UserCheck,
  Newspaper,
  Megaphone,
  Shield,
  HelpCircle,
  FolderKanban,
  Users,
  Briefcase,
  Trees,
  BarChart3,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Calendar,
  HeartHandshake,
  Target,
  GraduationCap,
  Database,
  FileCheck,
  BookOpen,
  Award,
  Layers,
  Compass,
  Clock,
  FilePlus,
  Scale,
  CheckCircle2,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
  const { setIsSearchOpen } = useAccessibility();
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open (iOS-proof position:fixed technique)
  useEffect(() => {
    if (mobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [mobileMenuOpen]);

  const handleMouseEnter = (name: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleMobileSubmenu = (key: string) => {
    setMobileExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1360px,calc(100%-24px))] transition-all duration-300">
      <header
        className={`relative w-full px-5 sm:px-6 py-2.5 rounded-full flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-white border border-slate-200 shadow-xl shadow-slate-900/10"
            : "bg-white/95 backdrop-blur-xl border border-white shadow-lg shadow-slate-900/10"
        }`}
      >
        {/* Real Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0 pl-1 z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/bappeda/logo-halut.png"
            alt="BAPPEDA Halmahera Utara"
            className="h-9 sm:h-10 w-auto object-contain transition transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation Links (DEAD CENTERED IN HEADER CAPSULE - SINGLE ROW) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-bold text-slate-800 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 whitespace-nowrap">
          {/* Beranda */}
          <Link
            href="/"
            className="px-3.5 py-2 rounded-full hover:bg-blue-50 hover:text-blue-700 transition"
          >
            Beranda
          </Link>

          {/* 1. PROFIL DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("profil")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "profil" ? null : "profil")
              }
              className={`px-3.5 py-2 rounded-full flex items-center gap-1.5 transition ${
                activeDropdown === "profil"
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              Profil
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "profil" ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {activeDropdown === "profil" && (
              <div className="absolute top-full left-0 mt-6 w-64 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-950/20 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-1">
                <Link
                  href="/profil/tentang"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <UserCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Tentang Bappeda</div>
                    <div className="text-[10px] text-slate-500 font-normal">Gambaran Umum Instansi</div>
                  </div>
                </Link>
                <Link
                  href="/profil/tugas-fungsi"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <Briefcase className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Tugas & Fungsi</div>
                    <div className="text-[10px] text-slate-500 font-normal">Peran Strategis Perencanaan</div>
                  </div>
                </Link>
                <Link
                  href="/profil/dasar-hukum"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <Shield className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Dasar Hukum</div>
                    <div className="text-[10px] text-slate-500 font-normal">Regulasi & Landasan Kerja</div>
                  </div>
                </Link>
                <Link
                  href="/profil/struktur"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Struktur Organisasi</div>
                    <div className="text-[10px] text-slate-500 font-normal">Bagan Hirarki Kepemimpinan</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 2. DOKUMEN DIRECT LINK */}
          <Link
            href="/dokumen"
            className="px-3.5 py-2 rounded-full hover:bg-blue-50 hover:text-blue-700 transition"
          >
            Dokumen
          </Link>

          {/* 3. BERITA & AGENDA DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("informasi")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "informasi" ? null : "informasi")
              }
              className={`px-3.5 py-2 rounded-full flex items-center gap-1.5 transition ${
                activeDropdown === "informasi"
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              Berita & Agenda
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "informasi" ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {activeDropdown === "informasi" && (
              <div className="absolute top-full left-0 mt-6 w-60 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-950/20 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-1">
                <Link
                  href="/berita"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <Newspaper className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Berita & Artikel</div>
                    <div className="text-[10px] text-slate-500 font-normal">Kabar & Liputan Terkini</div>
                  </div>
                </Link>
                <Link
                  href="/pengumuman"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <Megaphone className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Pengumuman Resmi</div>
                    <div className="text-[10px] text-slate-500 font-normal">Surat Edaran & Informasi</div>
                  </div>
                </Link>
                <Link
                  href="/galeri"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <FolderKanban className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Galeri Foto & Video</div>
                    <div className="text-[10px] text-slate-500 font-normal">Album Dokumentasi Kegiatan</div>
                  </div>
                </Link>
                <Link
                  href="/agenda"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <Calendar className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Agenda Kerja & Kalender</div>
                    <div className="text-[10px] text-slate-500 font-normal">Jadwal & Agenda Pembangunan</div>
                  </div>
                </Link>
                <Link
                  href="/infografis"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <BarChart3 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Infografis Pembangunan</div>
                    <div className="text-[10px] text-slate-500 font-normal">Data Visual & Capaian Halut</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 4. POPEDA DIRECT LINK */}
          <a
            href="https://sites.google.com/view/popeda"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-full hover:bg-blue-50 hover:text-blue-700 transition flex items-center gap-1"
          >
            POPEDA
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* 5. LAYANAN PUBLIK DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("lainnya")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "lainnya" ? null : "lainnya")
              }
              className={`px-3.5 py-2 rounded-full flex items-center gap-1.5 transition ${
                activeDropdown === "lainnya"
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              Layanan Publik
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "lainnya" ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {activeDropdown === "lainnya" && (
              <div className="absolute top-full right-0 mt-6 w-60 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-950/20 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-1">
                <a
                  href="https://www.lapor.go.id"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1">
                      LAPOR! <ExternalLink className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Layanan Pengaduan Nasional</div>
                  </div>
                </a>
                <Link
                  href="/kritik-saran"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <HelpCircle className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Kritik & Saran</div>
                    <div className="text-[10px] text-slate-500 font-normal">Masukan Masyarakat</div>
                  </div>
                </Link>
                <Link
                  href="/survey-kepuasan"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-800 transition group"
                >
                  <HeartHandshake className="w-4 h-4 text-blue-600 group-hover:scale-110 transition shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Survey Kepuasan</div>
                    <div className="text-[10px] text-slate-500 font-normal">Indeks Kepuasan Publik</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action: Search Pill */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-sm transition group"
            title="Cari Cepat (Cmd+K)"
          >
            <Search className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
            <span className="text-slate-500 pr-1 font-medium">Pencarian</span>
            <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded border border-slate-200">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden p-2 text-slate-800 hover:text-blue-700 rounded-full bg-white/70 border border-slate-200"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>
      </div>

      {/* MOBILE NAVIGATION MENU MODAL */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md pt-20 sm:pt-24 pb-6 px-4 animate-in fade-in duration-200 flex flex-col items-center justify-start overflow-hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md mx-auto w-full max-h-[80dvh] overflow-y-auto rounded-[32px] bg-white p-5 border border-slate-200 shadow-2xl space-y-2 text-xs font-bold text-slate-800 animate-in fade-in zoom-in-95 duration-200"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="p-3 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition"
          >
            Beranda
          </Link>

          {/* Mobile Profil Submenu */}
          <div className="border-t border-slate-100 pt-1">
            <button
              onClick={() => toggleMobileSubmenu("profil")}
              className="w-full p-3 rounded-2xl flex items-center justify-between hover:bg-blue-50 transition"
            >
              <span>Profil</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  mobileExpanded["profil"] ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>
            {mobileExpanded["profil"] && (
              <div className="pl-4 pr-2 py-1 space-y-1 font-medium text-slate-600">
                <Link
                  href="/profil/tentang"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Tentang Bappeda
                </Link>
                <Link
                  href="/profil/tugas-fungsi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Tugas & Fungsi
                </Link>
                <Link
                  href="/profil/dasar-hukum"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Dasar Hukum
                </Link>
                <Link
                  href="/profil/struktur"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Struktur Organisasi
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Dokumen Link */}
          <Link
            href="/dokumen"
            onClick={() => setMobileMenuOpen(false)}
            className="p-3 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition block border-t border-slate-100"
          >
            Dokumen Perencanaan
          </Link>

          {/* Mobile Berita & Agenda Submenu */}
          <div className="border-t border-slate-100 pt-1">
            <button
              onClick={() => toggleMobileSubmenu("informasi")}
              className="w-full p-3 rounded-2xl flex items-center justify-between hover:bg-blue-50 transition"
            >
              <span>Berita & Agenda</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  mobileExpanded["informasi"] ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>
            {mobileExpanded["informasi"] && (
              <div className="pl-4 pr-2 py-1 space-y-1 font-medium text-slate-600">
                <Link
                  href="/berita"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Berita & Artikel
                </Link>
                <Link
                  href="/pengumuman"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Pengumuman Resmi
                </Link>
                <Link
                  href="/galeri"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Galeri Foto & Video
                </Link>
                <Link
                  href="/agenda"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Agenda Kerja & Kalender
                </Link>
                <Link
                  href="/infografis"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Infografis Pembangunan
                </Link>
              </div>
            )}
          </div>

          {/* Mobile POPEDA Link */}
          <a
            href="https://sites.google.com/view/popeda"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="p-3 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition border-t border-slate-100 flex items-center justify-between"
          >
            <span>POPEDA</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* Mobile Layanan Publik Submenu */}
          <div className="border-t border-slate-100 pt-1">
            <button
              onClick={() => toggleMobileSubmenu("lainnya")}
              className="w-full p-3 rounded-2xl flex items-center justify-between hover:bg-blue-50 transition"
            >
              <span>Layanan Publik</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  mobileExpanded["lainnya"] ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>
            {mobileExpanded["lainnya"] && (
              <div className="pl-4 pr-2 py-1 space-y-1 font-medium text-slate-600">
                <a
                  href="https://www.lapor.go.id"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                >
                  <span>LAPOR!</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <Link
                  href="/kritik-saran"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Kritik & Saran
                </Link>
                <Link
                  href="/survey-kepuasan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-xl hover:bg-blue-50 hover:text-blue-700"
                >
                  Survey Kepuasan
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);
};
