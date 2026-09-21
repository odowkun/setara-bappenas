"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, ShieldCheck, HeartHandshake, FileText, Newspaper, Camera, Map } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiClient";

export const Footer: React.FC = () => {
  const [contact, setContact] = useState<{
    alamat: string;
    telepon: string;
    email: string;
  }>({
    alamat: "Jl. Ir. Hein Namotemo M.SP 2 Tobelo, Halmahera Utara, Maluku Utara",
    telepon: "+62 821 4810 7771",
    email: "info@bappeda.halmaherautarakab.go.id",
  });

  const [socialMedia, setSocialMedia] = useState<{
    youtube: string;
    instagram: string;
    facebook: string;
    tiktok: string;
  }>({
    youtube: "https://www.youtube.com/@bappedahalut",
    instagram: "https://www.instagram.com/bappedahalut",
    facebook: "https://www.facebook.com/bappedahalut",
    tiktok: "https://www.tiktok.com/@bappedahalut",
  });

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/profil/tentang`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted || !json?.data?.meta_json) return;
        const meta = json.data.meta_json;
        setContact({
          alamat: meta.alamat || "Jl. Ir. Hein Namotemo M.SP 2 Tobelo, Halmahera Utara, Maluku Utara",
          telepon: meta.telepon || "+62 821 4810 7771",
          email: meta.email || "info@bappeda.halmaherautarakab.go.id",
        });
        setSocialMedia({
          youtube: meta.youtube || "https://www.youtube.com/@bappedahalut",
          instagram: meta.instagram || "https://www.instagram.com/bappedahalut",
          facebook: meta.facebook || "https://www.facebook.com/bappedahalut",
          tiktok: meta.tiktok || "https://www.tiktok.com/@bappedahalut",
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <footer className="pt-10 sm:pt-16 pb-24 sm:pb-28 px-3.5 sm:px-6 bg-white font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto rounded-3xl sm:rounded-[32px] bg-slate-50 text-slate-700 p-5 sm:p-12 border border-slate-200/80 shadow-xs space-y-8 sm:space-y-10 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Col 1: Brand & Official Logo (Same as Navbar logo-halut.png) */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/bappeda/logo-halut.png"
                alt="BAPPEDA Halmahera Utara"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara. Pusat integrasi data spasial, evaluasi kinerja pembangunan, &amp; transparansi informasi publik.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>SPBE BSSN Verified Portal</span>
            </div>

            {/* Media Sosial Resmi BAPPEDA */}
            <div className="pt-2 space-y-2">
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                Media Sosial Resmi
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {/* YouTube */}
                {socialMedia.youtube && (
                  <a
                    href={socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube BAPPEDA Halmahera Utara"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-red-600 hover:border-red-600 shadow-2xs flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                    title="YouTube Channel"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}

                {/* Instagram */}
                {socialMedia.instagram && (
                  <a
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram BAPPEDA Halmahera Utara"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-600 hover:to-purple-600 hover:border-transparent shadow-2xs flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                    title="Instagram Profile"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  </a>
                )}

                {/* Facebook */}
                {socialMedia.facebook && (
                  <a
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook BAPPEDA Halmahera Utara"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-blue-600 hover:border-blue-600 shadow-2xs flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                    title="Facebook Fanpage"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}

                {/* TikTok */}
                {socialMedia.tiktok && (
                  <a
                    href={socialMedia.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok BAPPEDA Halmahera Utara"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-black hover:border-black shadow-2xs flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
                    title="TikTok Account"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Navigasi Utama
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              <li>
                <Link href="/" className="hover:text-blue-700 transition flex items-center gap-1.5">
                  <span>Beranda Utama</span>
                </Link>
              </li>
              <li>
                <Link href="/profil/tentang" className="hover:text-blue-700 transition flex items-center gap-1.5">
                  <span>Profil &amp; Visi Misi Bappeda</span>
                </Link>
              </li>
              <li>
                <Link href="/dokumen" className="hover:text-blue-700 transition flex items-center gap-1.5">
                  <span>Dokumen RKPD &amp; RPJMD</span>
                </Link>
              </li>
              <li>
                <Link href="/berita" className="hover:text-blue-700 transition flex items-center gap-1.5">
                  <span>Berita &amp; Informasi</span>
                </Link>
              </li>
              <li>
                <Link href="/galeri" className="hover:text-blue-700 transition flex items-center gap-1.5">
                  <span>Galeri Dokumentasi</span>
                </Link>
              </li>
              <li>
                <Link href="/gis-peta" className="hover:text-blue-700 transition flex items-center gap-1.5">
                  <span>Peta Spasial (Esri GIS)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Public Services */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Layanan Publik
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              <li>
                <Link href="/survey-kepuasan" className="hover:text-blue-700 transition">
                  Survei Kepuasan Masyarakat (IKM)
                </Link>
              </li>
              <li>
                <Link href="/kritik-saran" className="hover:text-blue-700 transition">
                  Kritik &amp; Saran Layanan
                </Link>
              </li>
              <li>
                <a
                  href="https://halmaherautarakab.go.id"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-700 transition flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Portal Pemkab Halut</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Contact */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Kontak Resmi BAPPEDA
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{contact.alamat}</span>
              </li>
              {contact.telepon && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <a
                    href={`tel:${contact.telepon.replace(/\s+/g, "")}`}
                    className="hover:text-blue-700 transition font-bold"
                  >
                    {contact.telepon}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-blue-700 transition font-bold truncate block max-w-[220px]"
                    title={contact.email}
                  >
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Bottom Line */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium text-center sm:text-left">
          <p>© {new Date().getFullYear()} BAPPEDA Kabupaten Halmahera Utara. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/profil/dasar-hukum" className="hover:text-blue-700 transition">Dasar Hukum</Link>
            <span>•</span>
            <Link href="/dashboard/login" className="hover:text-blue-700 transition">Portal Pengelola Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
