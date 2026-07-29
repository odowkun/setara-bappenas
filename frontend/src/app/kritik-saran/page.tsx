"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Send,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { submitKritik, fetchSurveyConfig } from "@/services/surveyService";
import { toast } from "@/lib/swal";

const DEFAULT_SKPD_LIST = [
  "BAPPEDA Halmahera Utara (Kantor Utama)",
  "Bidang Perencanaan Pembangunan & Evaluasi",
  "Bidang Pembangunan Manusia & Masyarakat (PMM)",
  "Bidang Ekonomi & Sumber Daya Alam (SDA)",
  "Bidang Infrastruktur & Pengembangan Wilayah (IPW)",
  "Bidang Pengendalian, Evaluasi & Pelaporan (PEP)",
  "Sekretariat BAPPEDA",
];

export default function KritikSaranPublicPage() {
  const [skpdList, setSkpdList] = useState<string[]>(DEFAULT_SKPD_LIST);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [telepon, setTelepon] = useState("");
  const [skpdTujuan, setSkpdTujuan] = useState(DEFAULT_SKPD_LIST[0]);
  const [subjek, setSubjek] = useState("");
  const [pesan, setPesan] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const cfg = await fetchSurveyConfig();
    if (cfg.services && cfg.services.length > 0) {
      const names = cfg.services.map((s) => s.name);
      setSkpdList(names);
      setSkpdTujuan(names[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email || !subjek || !pesan) {
      toast.error("Silakan lengkapi Nama, Email, Subjek, dan Rincian Pesan!");
      return;
    }

    setSubmitting(true);
    const success = await submitKritik({
      nama,
      email,
      telepon: telepon || undefined,
      skpd_tujuan: skpdTujuan,
      subjek,
      pesan,
    });
    setSubmitting(false);

    if (success) {
      toast.success("Kritik & Saran berhasil dikirimkan!");
      setSubmitted(true);
    } else {
      toast.error("Gagal mengirimkan kritik & saran. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-10">
        {/* HERO TITLE BANNER & BREADCRUMB (SESUAI PEDOMAN HALAMAN BERITA & SURVEI KEPUASAN) */}
        <div className="py-2 space-y-4 text-center flex flex-col items-center justify-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">Layanan Publik</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-700 font-extrabold">Kritik &amp; Saran</span>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>MASUKAN &amp; KRITIK MASYARAKAT</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Kritik &amp; Saran Publik
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Sampaikan masukan, apresiasi, atau kritik terbuka untuk peningkatan tata kelola pembangunan di Kabupaten Halmahera Utara.
            </p>
          </div>
        </div>

        {/* SINGLE UNIFIED HIGHLIGHT CARD CONTAINER */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
          <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
            <MessageSquare className="w-48 h-48 text-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-blue-800/60 relative z-10">
            {/* Section 1 */}
            <div className="space-y-1.5 md:pr-6">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-300">
                <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                <span>SALURAN MASUKAN WARGA</span>
              </div>
              <div className="text-2xl font-black text-white">Respon Terbuka</div>
              <p className="text-[11px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/40">
                Kritik &amp; masukan warga diteruskan ke pimpinan BAPPEDA
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-1.5 pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>KERAHASIAAN DIJAMIN</span>
              </div>
              <div className="text-2xl font-black text-white">Aman &amp; Terverifikasi</div>
              <p className="text-[11px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/40">
                Identitas Anda terlindungi sesuai ketentuan informasi publik
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>TINDAK LANJUT CEPAT</span>
              </div>
              <div className="text-2xl font-black text-white">Responsif 24/7</div>
              <p className="text-[11px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/40">
                Diproses oleh tim Sekretariat &amp; Bidang Terkait
              </p>
            </div>
          </div>
        </div>

        {/* MAIN FORM OR SUCCESS STATE */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8 max-w-4xl mx-auto"
          >
            <div className="pb-4 border-b border-slate-100 space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600 shrink-0" />
                <span>Formulir Masukan &amp; Kritik Warga</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Isilah data diri serta pesan masukan Anda secara jelas dan konstruktif.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Dra. Maria S. Lesnussa"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Alamat Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Nomor HP / WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="0812xxxxxxx"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Bidang / Unit Tujuan *
                </label>
                <div className="relative">
                  <select
                    value={skpdTujuan}
                    onChange={(e) => setSkpdTujuan(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs cursor-pointer appearance-none"
                  >
                    {skpdList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                Subjek / Judul Masukan *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={subjek}
                  onChange={(e) => setSubjek(e.target.value)}
                  placeholder="Contoh: Saran Peningkatan Aksesibilitas Data GIS Peta"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                Rincian Pesan Kritik &amp; Saran *
              </label>
              <textarea
                rows={5}
                required
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Tuliskan masukan secara jelas dan konstruktif..."
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Mengirimkan..." : "Kirimkan Masukan"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Pesan Masukan Berhasil Dikirim!
              </h3>
              <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                Pesan Kritik &amp; Saran Anda telah diteruskan ke Sekretariat BAPPEDA Kabupaten Halmahera Utara untuk dipelajari dan ditindaklanjuti.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
              >
                Tulis Pesan Lain
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
