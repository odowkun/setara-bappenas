"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Star,
  Send,
  CheckCircle2,
  Award,
  Users,
  FileCheck2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  fetchSurveysSummary,
  fetchSurveyConfig,
  submitSurvey,
  SurveySummaryData,
  SurveyQuestionItem,
  SurveyServiceItem,
} from "@/services/surveyService";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { toast } from "@/lib/swal";

const RATING_OPTIONS = [
  {
    val: 1,
    label: "Sangat Tidak Baik",
    stars: 1,
    color: "border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/40 font-black",
  },
  {
    val: 2,
    label: "Tidak Baik",
    stars: 2,
    color: "border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-500/40 font-black",
  },
  {
    val: 3,
    label: "Cukup Baik",
    stars: 3,
    color: "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/40 font-black",
  },
  {
    val: 4,
    label: "Baik",
    stars: 4,
    color: "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/40 font-black",
  },
  {
    val: 5,
    label: "Sangat Baik",
    stars: 5,
    color: "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/40 font-black",
  },
];

export default function SurveyKepuasanPublicPage() {
  const [questions, setQuestions] = useState<SurveyQuestionItem[]>([]);
  const [services, setServices] = useState<SurveyServiceItem[]>([]);

  const [summary, setSummary] = useState<SurveySummaryData>({
    total_responden: 0,
    ikm_score: 0,
    mutu_pelayanan: "-",
    kategori: "Memuat Data...",
    u1_avg: 0,
    u2_avg: 0,
    u3_avg: 0,
    u4_avg: 0,
    u5_avg: 0,
  });

  const [namaResponden, setNamaResponden] = useState("");
  const [email, setEmail] = useState("");
  const [pekerjaan, setPekerjaan] = useState("Wiraswasta / Masyarakat");
  const [jenisLayanan, setJenisLayanan] = useState("");

  // Dynamic Scores state (key: question_id or string, val: any)
  const [scores, setScores] = useState<{ [key: string]: any }>({});

  const [saran, setSaran] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // 1. Fetch Dynamic Questions & Services from Database
    const cfg = await fetchSurveyConfig();
    setQuestions(cfg.questions);
    setServices(cfg.services);
    if (cfg.services.length > 0) {
      setJenisLayanan(cfg.services[0].name);
    }

    // Initialize scores map with null (unselected)
    const initialScores: { [key: string]: any } = {};
    cfg.questions.forEach((q, idx) => {
      const key = `u${idx + 1}_question_${q.id}`;
      initialScores[key] = null;
    });
    setScores(initialScores);

    // 2. Fetch IKM Summary from Database API
    const res = await fetchSurveysSummary();
    if (res.summary) {
      setSummary(res.summary);
    }
  };

  const handleScoreChange = (key: string, val: any) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const currentLiveIKM = () => {
    const vals = Object.values(scores).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return ((avg / 5) * 100).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if required dynamic questions are answered
    const activeQuestions = questions.filter((q) => {
      if (!q.service_id) return true;
      const matchedSvc = services.find((s) => s.id === q.service_id);
      return matchedSvc && matchedSvc.name === jenisLayanan;
    });

    const uncompletedRequired = activeQuestions.filter((q, idx) => {
      if (!q.is_required) return false;
      const key = `u${idx + 1}_question_${q.id}`;
      const val = scores[key];
      return val === null || val === undefined || val === "";
    });

    if (uncompletedRequired.length > 0) {
      toast.error(`Mohon lengkapi pertanyaan wajib: "${uncompletedRequired[0].title}"`);
      return;
    }

    setSubmitting(true);

    const valArray = Object.values(scores) as number[];
    const payload = {
      nama_responden: namaResponden.trim() || "Masyarakat Umum",
      email: email.trim() || undefined,
      pekerjaan,
      jenis_layanan: jenisLayanan,
      u1_persyaratan: valArray[0] || 5,
      u2_prosedur: valArray[1] || 5,
      u3_kecepatan: valArray[2] || 5,
      u4_produk: valArray[3] || 5,
      u5_sikap: valArray[4] || 5,
      saran_masukan: saran.trim() || undefined,
    };

    const success = await submitSurvey(payload);
    setSubmitting(false);

    if (success) {
      toast.success("Survei kepuasan berhasil dikirimkan!");
      setSubmitted(true);
      const res = await fetchSurveysSummary();
      if (res.summary) setSummary(res.summary);
    } else {
      toast.error("Gagal mengirimkan survey. Silakan coba lagi.");
    }
  };

  const liveScoreDisplay = currentLiveIKM();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 pt-28 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-10">
        {/* HERO TITLE BANNER & BREADCRUMB (SESUAI PEDOMAN HALAMAN BERITA & PROFIL) */}
        <div className="py-2 space-y-4 text-center flex flex-col items-center justify-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1">
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">Layanan Publik</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-700 font-extrabold">Survei Kepuasan</span>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
              <span>INDEKS KEPUASAN MASYARAKAT (IKM) BAPPEDA</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Survei Kepuasan Masyarakat
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Berikan masukan dan penilaian Anda terhadap kualitas pelayanan publik BAPPEDA Kabupaten Halmahera Utara berdasarkan standar Keputusan PermenPAN-RB.
            </p>
          </div>
        </div>

        {/* SUMMARY STATS GRID FROM DATABASE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-xl space-y-2 relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-10">
              <Award className="w-28 h-28 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-300">
              NILAI INDEKS KEPUASAN (IKM)
            </span>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">
                {summary.total_responden > 0 ? summary.ikm_score : "-"}
              </span>
              {summary.total_responden > 0 ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                  Mutu {summary.mutu_pelayanan} ({summary.kategori})
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                  {summary.kategori}
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/60">
              {summary.total_responden > 0
                ? "Hasil kalkulasi dari database responden publik"
                : "Belum ada survei terverifikasi di database"}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
              <Users className="w-4 h-4 text-blue-600" />
              <span>TOTAL RESPONDEN VERIFIKASI</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {summary.total_responden} <span className="text-sm text-slate-400 font-bold">Warga</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
              Survei warga terverifikasi langsung dari database
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>TANGGAPAN KERAMAHAN PETUGAS</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600">
              {summary.total_responden > 0 ? `${summary.u5_avg} / ` : "- "}
              <span className="text-sm text-slate-400 font-bold">5.0 Skor</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
              Penilaian rata-rata pada keramahan &amp; kecakapan petugas
            </p>
          </div>
        </div>

        {/* MAIN FORM */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8"
          >
            <div className="pb-4 border-b border-slate-100 space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileCheck2 className="w-6 h-6 text-blue-600 shrink-0" />
                <span>Formulir Penilaian Kepuasan Masyarakat</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pilihlah tingkat kepuasan Anda (1 - 5 Bintang) pada masing-masing unsur pelayanan di bawah ini.
              </p>
            </div>

            {/* RESPONDENT DATA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Nama Lengkap (Opsional)
                </label>
                <input
                  type="text"
                  value={namaResponden}
                  onChange={(e) => setNamaResponden(e.target.value)}
                  placeholder="Contoh: Dra. Maria S. Lesnussa"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Email / Kontak (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Jenis Layanan BAPPEDA Yang Diterima *
                </label>
                <SearchableSelect
                  options={services.map((svc) => ({
                    value: svc.name,
                    label: svc.name,
                  }))}
                  value={jenisLayanan}
                  onChange={(val) => setJenisLayanan(String(val))}
                  placeholder="-- Pilih Layanan BAPPEDA --"
                  searchPlaceholder="Ketik nama bidang / layanan BAPPEDA..."
                />
              </div>
            </div>

            {/* DYNAMIC ASPEK PENILAIAN QUESTIONS PER JENIS LAYANAN */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Pertanyaan &amp; Penilaian Aspek Pelayanan *
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Formulir disesuaikan secara dinamis untuk jenis layanan: <strong>{jenisLayanan || "Umum"}</strong>
                  </p>
                </div>
                {liveScoreDisplay ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 text-xs font-black border border-emerald-200 shrink-0 self-start sm:self-auto">
                    Kalkulasi IKM: {liveScoreDisplay}%
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 shrink-0 self-start sm:self-auto">
                    Isilah Penilaian
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {questions
                  .filter((unsur) => {
                    if (!unsur.service_id) return true;
                    const matchedSvc = services.find((s) => s.id === unsur.service_id);
                    return matchedSvc && matchedSvc.name === jenisLayanan;
                  })
                  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                  .map((unsur, idx) => {
                    const key = `u${idx + 1}_question_${unsur.id}`;
                    const currentVal = scores[key];
                    const qType = unsur.question_type || "rating";
                    const isUnselected = currentVal === null || currentVal === undefined || currentVal === "";

                    const optionsList = unsur.options
                      ? unsur.options.split(",").map((o) => o.trim()).filter(Boolean)
                      : [];

                    return (
                      <div
                        key={unsur.id}
                        className={`p-5 rounded-2xl border transition ${
                          isUnselected
                            ? "bg-slate-50/80 border-slate-200"
                            : "bg-white border-blue-200 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">
                              {idx + 1}. {unsur.title} {unsur.is_required && <span className="text-rose-500 font-black">*</span>}
                            </h4>
                            {unsur.description && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {unsur.description}
                              </p>
                            )}
                          </div>
                          {unsur.is_required ? (
                            isUnselected ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                                * Wajib Diisi
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                Terisi
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                              Opsional
                            </span>
                          )}
                        </div>

                        {/* RENDER DYNAMIC INPUT CONTROLS (GOOGLE FORM STYLE) */}

                        {/* 1. RATING 5 BINTANG */}
                        {qType === "rating" && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                            {RATING_OPTIONS.map((opt) => {
                              const active = currentVal === opt.val;
                              return (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => handleScoreChange(key, opt.val)}
                                  className={`p-3 rounded-2xl border text-xs font-bold transition text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                                    active
                                      ? opt.color
                                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: opt.stars }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          active
                                            ? "fill-current text-current"
                                            : "fill-amber-400 text-amber-400"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[11px] leading-tight">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 2. JAWABAN SINGKAT */}
                        {qType === "text" && (
                          <input
                            type="text"
                            value={(currentVal as string) || ""}
                            onChange={(e) => handleScoreChange(key, e.target.value)}
                            placeholder="Tuliskan jawaban singkat Anda di sini..."
                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                          />
                        )}

                        {/* 3. PARAGRAF */}
                        {qType === "paragraph" && (
                          <textarea
                            rows={3}
                            value={(currentVal as string) || ""}
                            onChange={(e) => handleScoreChange(key, e.target.value)}
                            placeholder="Tuliskan masukan / rincian lengkap Anda di sini..."
                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                          />
                        )}

                        {/* 4. PILIHAN GANDA (RADIO) */}
                        {qType === "radio" && (
                          <div className="space-y-2 pt-1">
                            {optionsList.map((opt, i) => (
                              <label
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition cursor-pointer text-xs font-bold text-slate-800"
                              >
                                <input
                                  type="radio"
                                  name={`radio_${unsur.id}`}
                                  value={opt}
                                  checked={currentVal === opt}
                                  onChange={() => handleScoreChange(key, opt)}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* 5. KOTAK CENTANG (CHECKBOX) */}
                        {qType === "checkbox" && (
                          <div className="space-y-2 pt-1">
                            {optionsList.map((opt, i) => {
                              const selectedArr: string[] = Array.isArray(currentVal) ? currentVal : [];
                              const isChecked = selectedArr.includes(opt);

                              return (
                                <label
                                  key={i}
                                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition cursor-pointer text-xs font-bold text-slate-800"
                                >
                                  <input
                                    type="checkbox"
                                    value={opt}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...selectedArr, opt]
                                        : selectedArr.filter((o) => o !== opt);
                                      handleScoreChange(key, next.length > 0 ? next : null);
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* 6. DROPDOWN */}
                        {qType === "dropdown" && (
                          <SearchableSelect
                            options={optionsList.map((opt) => ({ value: opt, label: opt }))}
                            value={(currentVal as string) || ""}
                            onChange={(val) => handleScoreChange(key, String(val))}
                            placeholder="-- Pilihlah Salah Satu Opsi --"
                            searchPlaceholder="Cari opsi..."
                          />
                        )}

                        {/* 7. TANGGAL */}
                        {qType === "date" && (
                          <div className="w-full sm:w-64">
                            <CustomDatePicker
                              value={(currentVal as string) || ""}
                              onChange={(val) => handleScoreChange(key, val)}
                              minYear={2020}
                              maxYear={2035}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* SARAN MASUKAN */}
            <div className="pt-2">
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                Saran &amp; Masukan Konstruktif (Opsional)
              </label>
              <textarea
                rows={3}
                value={saran}
                onChange={(e) => setSaran(e.target.value)}
                placeholder="Tuliskan saran perbaikan untuk pelayanan BAPPEDA Halmahera Utara..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Mengirimkan Survey..." : "Kirimkan Hasil Survei Kepuasan"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Survei Kepuasan Berhasil Terkirim!
              </h3>
              <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                Terima kasih atas masukan dan partisipasi Anda. Setiap masukan yang Anda berikan sangat berharga bagi peningkatan mutu layanan publik BAPPEDA Kabupaten Halmahera Utara.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  loadData();
                }}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition"
              >
                Isi Survei Lagi
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
