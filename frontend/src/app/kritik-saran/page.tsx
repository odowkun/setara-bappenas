"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import {
  submitKritik,
  fetchSurveyConfig,
  fetchPublicKritikList,
  PublicKritikItem,
} from "@/services/surveyService";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { toast } from "@/lib/swal";

export default function KritikSaranPublicPage() {
  const [skpdList, setSkpdList] = useState<string[]>([]);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [telepon, setTelepon] = useState("");
  const [skpdTujuan, setSkpdTujuan] = useState("");
  const [subjek, setSubjek] = useState("");
  const [pesan, setPesan] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Public List State
  const [publicList, setPublicList] = useState<PublicKritikItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Scroll container ref to stop Lenis smooth scroll collision
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Prevent wheel events inside this container from bubbling up to Lenis window listener
      e.stopPropagation();
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingList(true);
    const [cfg, list] = await Promise.all([
      fetchSurveyConfig(),
      fetchPublicKritikList(),
    ]);

    if (cfg.services && cfg.services.length > 0) {
      const names = cfg.services.map((s) => s.name);
      setSkpdList(names);
      setSkpdTujuan(names[0]);
    }
    const sortedList = Array.isArray(list)
      ? [...list].sort(
          (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
        )
      : [];
    setPublicList(sortedList);
    setLoadingList(false);
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
      // Reload public feed
      const updated = await fetchPublicKritikList();
      const sortedUpdated = Array.isArray(updated)
        ? [...updated].sort(
            (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
          )
        : [];
      setPublicList(sortedUpdated);
    } else {
      toast.error("Gagal mengirimkan kritik & saran. Silakan coba lagi.");
    }
  };

  const formatMaskedName = (name: string) => {
    if (!name) return "Warga (***)";
    if (name.includes("***")) return name;
    const parts = name.trim().split(/\s+/);
    return parts
      .map((p) => (p.length > 1 ? `${p[0]}***` : `${p}***`))
      .join(" ");
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const filteredItems = publicList.filter((item) => {
    const matchStatus =
      statusFilter === "Semua"
        ? true
        : statusFilter === "Sudah Ditanggapi"
        ? item.status === "Sudah Ditanggapi"
        : item.status === "Dalam Proses Tindak Lanjut" || item.status === "Dalam Proses";

    const matchSearch =
      searchQuery.trim() === "" ||
      item.subjek.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pesan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skpd_tujuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.catatan_balasan && item.catatan_balasan.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchSearch;
  });

  const totalDitanggapi = publicList.filter((k) => k.status === "Sudah Ditanggapi").length;
  const totalProses = publicList.filter(
    (k) => k.status === "Dalam Proses Tindak Lanjut" || k.status === "Dalam Proses"
  ).length;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-8 space-y-8 sm:space-y-12 w-full overflow-hidden">
        {/* HERO TITLE BANNER & BREADCRUMB */}
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

        {/* STATS & HIGHLIGHT CARD CONTAINER */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
          <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
            <MessageSquare className="w-48 h-48 text-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-blue-800/60 relative z-10">
            {/* Section 1 */}
            <div className="space-y-1.5 md:pr-6">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-300">
                <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                <span>TOTAL ASPIRASI WARGA</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {publicList.length} <span className="text-sm font-bold text-blue-300">Masukan</span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/40">
                Aspirasi publik transparan &amp; terpantau
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-1.5 pt-4 md:pt-0 md:px-6">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SUDAH DITANGGAPI RESMI</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {totalDitanggapi} <span className="text-sm font-bold text-emerald-300/80">Tindak Lanjut</span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/40">
                Identitas pelapor disensor terlindungi (***)
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>DALAM PROSES TINDAK LANJUT</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">
                {totalProses} <span className="text-sm font-bold text-amber-200/80">Diproses</span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/40">
                Koordinasi teknis oleh pimpinan &amp; bidang
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
                <SearchableSelect
                  options={skpdList.map((s) => ({ value: s, label: s }))}
                  value={skpdTujuan}
                  onChange={(val) => setSkpdTujuan(String(val))}
                  placeholder="-- Pilih Bidang / Unit Tujuan --"
                  searchPlaceholder="Cari bidang atau unit tujuan BAPPEDA..."
                />
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

        {/* PUBLIC LIST: TRANSPARANSI KRITIK, SARAN & TANGGAPAN RESMI BAPPEDA */}
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-black text-[11px] uppercase tracking-wider border border-blue-200/60">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>TRANSPARANSI KETERBUKAAN INFORMASI PUBLIK</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Aspirasi Warga &amp; Tanggapan BAPPEDA
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Daftar masukan warga beserta tanggapan tindak lanjut resmi. Identitas pelapor dilindungi dengan sensor nama (<code className="text-blue-700 font-black">***</code>).
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter("Semua")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  statusFilter === "Semua"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua ({publicList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Sudah Ditanggapi")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  statusFilter === "Sudah Ditanggapi"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sudah Ditanggapi ({totalDitanggapi})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Dalam Proses")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  statusFilter === "Dalam Proses"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dalam Proses ({totalProses})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan subjek, pesan, atau bidang..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          {/* Cards List */}
          {loadingList ? (
            <div className="p-12 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-3xl border border-slate-200">
              Memuat data aspirasi publik...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-3xl border border-slate-200 space-y-1">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <div>Belum ada data kritik &amp; saran pada kategori ini.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.length > 3 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-50/70 border border-blue-100/80 text-xs">
                  <span className="font-semibold text-slate-700">
                    Menampilkan <strong className="text-slate-900">{filteredItems.length}</strong> aspirasi warga (terbaru berada di atas)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 font-bold bg-white px-3 py-1 rounded-xl shadow-2xs border border-blue-200/60 w-fit">
                    <span>Gulir ke bawah untuk melihat masukan lainnya</span>
                    <span className="animate-bounce text-xs font-black">↓</span>
                  </span>
                </div>
              )}

              {/* Scrollable Container limited to max height ~3 cards (with data-lenis-prevent to prevent Lenis page scroll collision) */}
              <div
                ref={scrollContainerRef}
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                style={{ overscrollBehavior: "contain" }}
                className="max-h-[650px] sm:max-h-[720px] overflow-y-auto pr-1.5 sm:pr-2.5 space-y-4 overscroll-contain rounded-3xl"
              >
                {filteredItems.map((item) => {
                const isDitanggapi = item.status === "Sudah Ditanggapi";
                const isProses =
                  item.status === "Dalam Proses Tindak Lanjut" || item.status === "Dalam Proses";

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-200 transition space-y-4"
                  >
                    {/* Card Top Meta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Censored Name */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-black text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatMaskedName(item.nama)}</span>
                        </div>

                        {/* SKPD / Unit Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span>{item.skpd_tujuan}</span>
                        </div>

                        {/* Date */}
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isDitanggapi ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sudah Ditanggapi</span>
                          </span>
                        ) : isProses ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-black">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span>Dalam Proses Tindak Lanjut</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Menunggu Tanggapan</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subjek & Pesan Warga */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-slate-900 leading-snug">
                        {item.subjek}
                      </h3>
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed">
                        "{item.pesan}"
                      </div>
                    </div>

                    {/* OFFICIAL RESPONSE BOX */}
                    {item.catatan_balasan ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-blue-50/90 border border-blue-200/80 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                              Tanggapan Resmi BAPPEDA Kabupaten Halmahera Utara
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] shrink-0">
                            Resmi
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 italic leading-relaxed pt-1">
                          "{item.catatan_balasan}"
                        </p>
                      </div>
                    ) : isProses ? (
                      <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs font-semibold text-sky-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>
                          Aspirasi sedang dalam proses kajian teknis dan tindak lanjut oleh unit kerja BAPPEDA terkait.
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

