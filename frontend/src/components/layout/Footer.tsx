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
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <footer className="pt-12 sm:pt-16 pb-24 sm:pb-28 px-4 sm:px-6 bg-white font-sans">
      <div className="max-w-7xl mx-auto rounded-[32px] bg-slate-50 text-slate-700 p-8 sm:p-12 border border-slate-200/80 shadow-xs space-y-10">
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
