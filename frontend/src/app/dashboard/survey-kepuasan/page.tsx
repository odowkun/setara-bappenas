"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  SlidersHorizontal,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  FileQuestion,
  Building2,
  ListPlus,
  CheckCircle2,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  X,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";
import {
  fetchSurveysSummary,
  fetchSurveyConfig,
  addSurveyQuestion,
  deleteSurveyQuestion,
  reorderSurveyQuestions,
  addSurveyService,
  deleteSurveyService,
  SurveyResponseItem,
  SurveySummaryData,
  SurveyQuestionItem,
  SurveyServiceItem,
  QuestionType,
} from "@/services/surveyService";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { formatDateWIT } from "@/lib/dateUtils";

export default function DashboardSurveyPage() {
  const [activeTab, setActiveTab] = useState<"ikm" | "questions" | "services">("ikm");

  const [surveys, setSurveys] = useState<SurveyResponseItem[]>([]);
  const [summary, setSummary] = useState<SurveySummaryData>({
    total_responden: 0,
    ikm_score: 88.5,
    mutu_pelayanan: "A",
    kategori: "Sangat Baik",
    u1_avg: 4.8,
    u2_avg: 4.7,
    u3_avg: 4.6,
    u4_avg: 4.8,
    u5_avg: 4.9,
  });

  const [questions, setQuestions] = useState<SurveyQuestionItem[]>([]);
  const [services, setServices] = useState<SurveyServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SurveyResponseItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New Question Form State (Google Forms Style)
  const [newQTitle, setNewQTitle] = useState("");
  const [newQDesc, setNewQDesc] = useState("");
  const [newQServiceId, setNewQServiceId] = useState<number | null>(null);
  const [newQType, setNewQType] = useState<QuestionType>("rating");
  const [optionList, setOptionList] = useState<string[]>(["Opsi 1"]);
  const [newQIsRequired, setNewQIsRequired] = useState(false);

  // New Service Form State
  const [newSName, setNewSName] = useState("");

  // Pagination Math
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [dataSurveys, dataCfg] = await Promise.all([
      fetchSurveysSummary(),
      fetchSurveyConfig(),
    ]);

    setSurveys(dataSurveys.surveys);
    setSummary(dataSurveys.summary);
    setQuestions(dataCfg.questions);
    setServices(dataCfg.services);

    if (dataCfg.services.length > 0) {
      setSelectedServiceId((prev) => (prev ? prev : dataCfg.services[0].id));
    }
    setLoading(false);
  };

  const handleAddOptionRow = () => {
    setOptionList((prev) => [...prev, `Opsi ${prev.length + 1}`]);
  };

  const handleRemoveOptionRow = (index: number) => {
    if (optionList.length <= 1) {
      toast.error("Pertanyaan pilihan ganda/dropdown harus memiliki minimal 1 opsi!");
      return;
    }
    setOptionList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptionList((prev) => prev.map((opt, i) => (i === index ? val : opt)));
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQTitle.trim()) return;

    if (!selectedServiceId) {
      toast.error("Mohon pilih jenis layanan terlebih dahulu!");
      return;
    }

    let finalOptions: string | undefined = undefined;
    if (["radio", "checkbox", "dropdown"].includes(newQType)) {
      const validOptions = optionList.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length === 0) {
        toast.error("Mohon masukkan minimal satu opsi pilihan!");
        return;
      }
      finalOptions = validOptions.join(", ");
    }

    await addSurveyQuestion(
      newQTitle,
      newQDesc,
      selectedServiceId,
      newQType,
      finalOptions,
      newQIsRequired
    );
    setNewQTitle("");
    setNewQDesc("");
    setNewQType("rating");
    setOptionList(["Opsi 1"]);
    setNewQIsRequired(false);
    toast.success("Pertanyaan survei baru berhasil ditambahkan!");
    loadData();
  };

  const handleDeleteQuestion = async (id: number) => {
    const res = await showDeleteConfirm("pertanyaan survei");
    if (!res.isConfirmed) return;
    await deleteSurveyQuestion(id);
    toast.success("Pertanyaan survei berhasil dihapus!");
    loadData();
  };

  const handleMoveQuestion = async (filteredIdx: number, direction: "up" | "down") => {
    const currentFiltered = questions
      .filter((q) => q.service_id === selectedServiceId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    const targetIdx = direction === "up" ? filteredIdx - 1 : filteredIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentFiltered.length) return;

    const updatedFiltered = [...currentFiltered];
    const temp = updatedFiltered[filteredIdx];
    updatedFiltered[filteredIdx] = updatedFiltered[targetIdx];
    updatedFiltered[targetIdx] = temp;

    const orderedIds = updatedFiltered.map((q) => q.id);

    // Optimistic local state update
    setQuestions((prev) => {
      const others = prev.filter((q) => q.service_id !== selectedServiceId);
      return [...others, ...updatedFiltered];
    });

    await reorderSurveyQuestions(orderedIds);
    loadData();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSName.trim()) return;
    await addSurveyService(newSName);
    setNewSName("");
    toast.success("Jenis layanan baru berhasil ditambahkan!");
    loadData();
  };

  const handleDeleteService = async (id: number) => {
    const res = await showDeleteConfirm("jenis layanan");
    if (!res.isConfirmed) return;
    await deleteSurveyService(id);
    toast.success("Jenis layanan berhasil dihapus!");
    loadData();
  };

  // Filter Data
  const filteredSurveys = surveys.filter(
    (s) =>
      s.nama_responden.toLowerCase().includes(search.toLowerCase()) ||
      s.jenis_layanan.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* TITLE & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest">
            <HeartHandshake className="w-4 h-4" />
            <span>IKM &amp; DYNAMIC FORM BUILDER</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Survei Kepuasan Masyarakat &amp; Pengaturan Formulir
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola tanggapan survei warga, pertanyaan dinamis per jenis layanan, dan opsi SKPD BAPPEDA.
          </p>
        </div>
      </div>

      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-xl space-y-1 relative overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
            NILAI IKM DATABASE
          </span>
          <div className="text-3xl font-black">{summary.ikm_score}</div>
          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 inline-block">
            Mutu {summary.mutu_pelayanan} ({summary.kategori})
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            TOTAL RESPONDEN VERIFIKASI
          </span>
          <div className="text-3xl font-black text-slate-900">
            {summary.total_responden} <span className="text-xs text-slate-400 font-bold">Warga</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-100">
            Tersimpan di database
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            PERTANYAAN SURVEI AKTIF
          </span>
          <div className="text-3xl font-black text-blue-600">
            {questions.length} <span className="text-xs text-slate-400 font-bold">Pertanyaan</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-100">
            Tersedia di formulir publik
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            OPSI JENIS LAYANAN
          </span>
          <div className="text-3xl font-black text-emerald-600">
            {services.length} <span className="text-xs text-slate-400 font-bold">Layanan</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-100">
            Pilihan dropdown warga
          </p>
        </div>
      </div>

      {/* SEPARATED MAIN TAB NAVIGATION */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("ikm");
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                activeTab === "ikm"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              Survei Kepuasan Masyarakat ({filteredSurveys.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "questions"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Kelola Pertanyaan Survei ({questions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("services")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "services"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Kelola Opsi Jenis Layanan ({services.length})</span>
            </button>
          </div>

          {activeTab === "ikm" && (
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari responden / layanan..."
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {/* TAB 1: HASIL SURVEI RESPONDEN */}
        {activeTab === "ikm" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Responden</th>
                  <th className="py-4 px-6">Jenis Layanan BAPPEDA</th>
                  <th className="py-4 px-6">Nilai & Mutu IKM</th>
                  <th className="py-4 px-6">Tanggal Submit</th>
                  <th className="py-4 px-6 text-right">Aksi Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredSurveys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                      Belum ada data responden survei kepuasan.
                    </td>
                  </tr>
                ) : (
                  filteredSurveys
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                              {item.nama_responden.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-slate-900">{item.nama_responden}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{item.email || "Tanpa Email"}</div>
                              <div className="text-[10px] text-blue-600 font-semibold">{item.pekerjaan || "Masyarakat Umum"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">
                          {item.jenis_layanan}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-200">
                              {item.ikm_score} / 100
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Sangat Baik (A)
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-medium text-xs">
                          {formatDateWIT(item.created_at)}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedDetail(item)}
                            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Lihat Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: KELOLA PERTANYAAN SURVEI (DILENGKAPI PILIHAN PER LAYANAN & REORDER) */}
        {activeTab === "questions" && (
          <div className="space-y-8">
            {/* HERO INFO */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider">
                  <FileQuestion className="w-4 h-4 text-blue-600" />
                  <span>Editor Pertanyaan Terpisah Per Layanan BAPPEDA</span>
                </div>
                <p className="text-[11px] text-blue-700/80 font-medium">
                  Kelola dan atur urutan pertanyaan survei khusus untuk setiap unit/bidang layanan BAPPEDA.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold shrink-0">
                {questions.length} Total Pertanyaan
              </span>
            </div>

            {/* SELECTOR DROPDOWN LAYANAN BAPPEDA (SEARCHABLE) */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Pilih Jenis Layanan BAPPEDA Untuk Mengedit Pertanyaan:</span>
              </label>
              <SearchableSelect
                options={services.map((svc) => ({
                  value: svc.id,
                  label: svc.name,
                  sublabel: `${questions.filter((q) => q.service_id === svc.id).length} Pertanyaan Aktif`,
                }))}
                value={selectedServiceId}
                onChange={(val) => setSelectedServiceId(Number(val))}
                placeholder="-- Pilih Layanan BAPPEDA --"
                searchPlaceholder="Ketik untuk mencari layanan..."
              />
            </div>

            {/* FORM BUILDER EDITOR CARD */}
            <form onSubmit={handleCreateQuestion} className="p-6 sm:p-8 rounded-3xl bg-slate-50/90 border border-slate-200 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-black text-slate-900">
                    Form Builder: Buat Pertanyaan Baru
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800 text-xs font-extrabold border border-blue-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Khusus: {services.find((s) => s.id === selectedServiceId)?.name || "-"}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* TIPE INPUT PERTANYAAN */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                    Tipe Input Pertanyaan (Google Forms Style) *
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "rating", label: "⭐️ Skala Rating (1 - 5 Bintang)" },
                      { value: "text", label: "📝 Jawaban Singkat" },
                      { value: "paragraph", label: "📄 Paragraf (Teks Panjang)" },
                      { value: "radio", label: "🔘 Pilihan Ganda (Radio Button)" },
                      { value: "checkbox", label: "☑️ Kotak Centang (Checkboxes)" },
                      { value: "dropdown", label: "🔽 Dropdown" },
                      { value: "date", label: "📅 Tanggal" },
                    ]}
                    value={newQType}
                    onChange={(val) => setNewQType(val as QuestionType)}
                    placeholder="-- Pilih Tipe Pertanyaan --"
                    searchPlaceholder="Cari tipe input..."
                  />
                </div>

                {/* JUDUL PERTANYAAN */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                    Judul Pertanyaan / Aspek Penilaian *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQTitle}
                    onChange={(e) => setNewQTitle(e.target.value)}
                    placeholder="Contoh: Kejelasan Persyaratan & Kemudahan Prosedur Layanan"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* DESKRIPSI PERTANYAAN */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Deskripsi / Petunjuk Penilaian (Opsional)
                </label>
                <input
                  type="text"
                  value={newQDesc}
                  onChange={(e) => setNewQDesc(e.target.value)}
                  placeholder="Contoh: Berikan penilaian mengenai keselarasan dokumen persyaratan dengan standar SOP."
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />
              </div>

              {/* GOOGLE FORMS STYLE DYNAMIC OPTION BUILDER (FOR RADIO / CHECKBOX / DROPDOWN) */}
              {["radio", "checkbox", "dropdown"].includes(newQType) && (
                <div className="p-5 rounded-2xl bg-white border border-blue-200/80 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-blue-900 flex items-center gap-1.5">
                        <ListPlus className="w-4 h-4 text-blue-600" />
                        <span>Opsi Pilihan (Google Forms Editor)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Kelola baris opsi pilihan jawaban seperti pada Google Forms.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {optionList.map((optVal, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {/* CUSTOM GOOGLE FORMS PREFIX ICON BY TYPE */}
                        {newQType === "radio" && (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                        {newQType === "checkbox" && (
                          <div className="w-5 h-5 rounded-md border-2 border-slate-300 shrink-0" />
                        )}
                        {newQType === "dropdown" && (
                          <span className="w-5 text-xs font-bold text-slate-500 text-right shrink-0">
                            {idx + 1}.
                          </span>
                        )}

                        <input
                          type="text"
                          required
                          value={optVal}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Opsi ${idx + 1}`}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionRow(idx)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer shrink-0"
                          title="Hapus Opsi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* PROMPT ACTION ROW (EXACT GOOGLE FORMS STYLE) */}
                    <div className="flex items-center gap-2 pt-2 text-xs font-medium text-slate-500 pl-1">
                      {newQType === "radio" && (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0 opacity-60" />
                      )}
                      {newQType === "checkbox" && (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 shrink-0 opacity-60" />
                      )}
                      {newQType === "dropdown" && (
                        <span className="w-5 text-xs font-bold text-slate-400 text-right shrink-0">
                          {optionList.length + 1}.
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleAddOptionRow}
                        className="text-slate-500 hover:text-blue-600 font-semibold cursor-pointer transition"
                      >
                        Tambahkan opsi
                      </button>

                      {["radio", "checkbox"].includes(newQType) && (
                        <>
                          <span>atau</span>
                          <button
                            type="button"
                            onClick={() => setOptionList((prev) => [...prev, "Lainnya..."])}
                            className="text-blue-600 hover:underline font-bold cursor-pointer transition"
                          >
                            tambahkan "Lainnya"
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS & GOOGLE FORMS STYLE "WAJIB DIISI" TOGGLE SWITCH (DEFAULT: OFF / FALSE) */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-700">Wajib diisi</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newQIsRequired}
                      onChange={(e) => setNewQIsRequired(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">
                    {newQIsRequired ? "(Wajib)" : "(Opsional / Default)"}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Pertanyaan Layanan Ini</span>
                </button>
              </div>
            </form>

            {/* LIST DAFTAR PERTANYAAN AKTIF UNTUK LAYANAN TERPILIH */}
            {(() => {
              const filteredQuestions = questions
                .filter((q) => q.service_id === selectedServiceId)
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                      <span>Daftar Pertanyaan: {services.find((s) => s.id === selectedServiceId)?.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                        {filteredQuestions.length}
                      </span>
                    </h3>
                  </div>

                  {filteredQuestions.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs font-medium">
                      Belum ada pertanyaan khusus untuk jenis layanan ini. Gunakan Form Builder di atas untuk menambahkan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start justify-between gap-4 hover:border-blue-200 transition"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-slate-900">
                                {idx + 1}. {q.title}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase">
                                {q.question_type === "rating" && "⭐️ Rating 1-5 Bintang"}
                                {q.question_type === "text" && "📝 Jawaban Singkat"}
                                {q.question_type === "paragraph" && "📄 Paragraf"}
                                {q.question_type === "radio" && "🔘 Pilihan Ganda"}
                                {q.question_type === "checkbox" && "☑️ Kotak Centang"}
                                {q.question_type === "dropdown" && "🔽 Dropdown"}
                                {q.question_type === "date" && "📅 Tanggal"}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  q.is_required
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                }`}
                              >
                                {q.is_required ? "* Wajib Diisi" : "Opsional"}
                              </span>
                            </div>
                            {q.description && (
                              <p className="text-xs text-slate-500 font-medium">
                                {q.description}
                              </p>
                            )}
                            {q.options && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Pilihan Opsi:</span>
                                {q.options.split(",").map((opt, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700">
                                    {opt.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* REORDER UP/DOWN & DELETE ACTION BUTTONS */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveQuestion(idx, "up")}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200"
                              title="Pindahkan Ke Atas"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === filteredQuestions.length - 1}
                              onClick={() => handleMoveQuestion(idx, "down")}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200"
                              title="Pindahkan Ke Bawah"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer shrink-0 border border-red-200"
                              title="Hapus Pertanyaan Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: KELOLA JENIS LAYANAN BAPPEDA */}
        {activeTab === "services" && (
          <div className="space-y-8">
            {/* HERO INFO */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Editor Opsi Jenis Layanan BAPPEDA</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 font-medium">
                  Tambah atau hapus daftar unit/bidang layanan BAPPEDA yang muncul pada dropdown pilihan warga.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold shrink-0">
                {services.length} Opsi Layanan
              </span>
            </div>

            {/* FORM TAMBAH LAYANAN BARU */}
            <form onSubmit={handleAddService} className="p-6 sm:p-8 rounded-3xl bg-slate-50/90 border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  Tambah Jenis Layanan BAPPEDA Baru
                </h3>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Nama Layanan / Unit BAPPEDA Baru *
                </label>
                <input
                  type="text"
                  required
                  value={newSName}
                  onChange={(e) => setNewSName(e.target.value)}
                  placeholder="Contoh: Layanan Konsultasi Tata Spasial Daerah & GIS"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 transition shadow-2xs"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Opsi Layanan Baru</span>
              </button>
            </form>

            {/* LIST DAFTAR OPSI LAYANAN AKTIF */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-800">
                Daftar Opsi Jenis Layanan Aktif ({services.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4 hover:border-emerald-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                        {s.id}
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">{s.name}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer shrink-0"
                      title="Hapus Layanan Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL HASIL SURVEI RESPONDEN */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    Detail Hasil Survei Responden
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Data Penilaian Kepuasan Masyarakat BAPPEDA Halmahera Utara
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin">
              {/* RESPONDEN SUMMARY CARD */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Nama Responden</span>
                  <div className="text-xs font-extrabold text-slate-900">{selectedDetail.nama_responden}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{selectedDetail.email || "Tanpa Email"}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Pekerjaan / Instansi</span>
                  <div className="text-xs font-bold text-blue-600">{selectedDetail.pekerjaan || "Masyarakat Umum"}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Jenis Layanan BAPPEDA</span>
                  <div className="text-xs font-bold text-slate-800">{selectedDetail.jenis_layanan}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Tanggal Pengisian (WIT)</span>
                  <div className="text-xs font-bold text-slate-700">{formatDateWIT(selectedDetail.created_at)}</div>
                </div>
              </div>

              {/* NILAI IKM SCORE BADGE */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-emerald-900">Total Skor IKM Responden</span>
                  <p className="text-[11px] text-emerald-700 font-medium">Mutu Pelayanan: Sangat Baik (A)</p>
                </div>
                <div className="text-xl font-black text-emerald-900 bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-300">
                  {selectedDetail.ikm_score} <span className="text-xs font-bold text-emerald-700">/ 100</span>
                </div>
              </div>

              {/* DETAIL SKOR PER ASPEK PENILAIAN */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Detail Skor per Aspek Penilaian:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">U1 - Persyaratan Service</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-extrabold text-xs border border-amber-200">
                      {selectedDetail.u1_persyaratan} Bintang ★
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">U2 - Prosedur Pelayanan</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-extrabold text-xs border border-amber-200">
                      {selectedDetail.u2_prosedur} Bintang ★
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">U3 - Kecepatan Pelayanan</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-extrabold text-xs border border-amber-200">
                      {selectedDetail.u3_kecepatan} Bintang ★
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">U4 - Produk & Kepastian</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-extrabold text-xs border border-amber-200">
                      {selectedDetail.u4_produk} Bintang ★
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between sm:col-span-2">
                    <span className="text-xs font-bold text-slate-700">U5 - Competency & Sikap Petugas</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-extrabold text-xs border border-amber-200">
                      {selectedDetail.u5_sikap} Bintang ★
                    </span>
                  </div>
                </div>
              </div>

              {/* SARAN & MASUKAN */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Saran & Masukan Responden:</span>
                </h4>
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs font-medium text-slate-800 italic leading-relaxed">
                  {selectedDetail.saran_masukan ? `"${selectedDetail.saran_masukan}"` : "Tidak ada saran masukan khusus."}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
