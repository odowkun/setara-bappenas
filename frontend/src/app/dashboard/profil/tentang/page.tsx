"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch, API_BASE_URL } from "@/lib/apiClient";
import { toast } from "@/lib/swal";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import SearchableSelect, { SearchableOption } from "@/components/ui/SearchableSelect";
import {
  Building2,
  Save,
  Lock,
  CheckCircle2,
  BookOpen,
  Target,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckSquare,
  Square,
} from "lucide-react";

export default function DashboardTentangEditorPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(["superadmin"]);

  const [activeTab, setActiveTab] = useState<"sejarah" | "visi_misi" | "informasi">("sejarah");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Profil & Sejarah State
  const [sejarahContent, setSejarahContent] = useState("");

  // 2. Visi & Misi State
  const [visiContent, setVisiContent] = useState("");
  const [misiList, setMisiList] = useState<string[]>([]);

  // 3. Informasi Instansi State
  const [tahunBerdiri, setTahunBerdiri] = useState("2003");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");
  const [email, setEmail] = useState("");

  // Jam Kerja Builder State
  const [seninJumatActive, setSeninJumatActive] = useState(true);
  const [seninJumatStart, setSeninJumatStart] = useState("08:00");
  const [seninJumatEnd, setSeninJumatEnd] = useState("16:00");

  const [sabtuActive, setSabtuActive] = useState(false);
  const [sabtuStart, setSabtuStart] = useState("09:00");
  const [sabtuEnd, setSabtuEnd] = useState("15:00");

  const [mingguActive, setMingguActive] = useState(false);
  const [mingguStart, setMingguStart] = useState("09:00");
  const [mingguEnd, setMingguEnd] = useState("12:00");

  const [jamKerjaManual, setJamKerjaManual] = useState("Senin - Jumat: 08:00 - 16:00 WIT");
  const isLoadedRef = useRef(false);

  // Time Options Generator (06:00 to 20:00)
  const timeOptions: SearchableOption[] = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00"
  ].map((t) => ({ value: t, label: t }));

  // Year options generator (1950 to 2026)
  const yearOptions: SearchableOption[] = Array.from({ length: 2026 - 1950 + 1 }, (_, i) => {
    const y = (2026 - i).toString();
    return { value: y, label: `Tahun ${y}` };
  });

  // Automatically update formatted Jam Kerja string whenever controls change AFTER initial load
  useEffect(() => {
    if (!isLoadedRef.current) return;

    const parts: string[] = [];
    if (seninJumatActive) {
      parts.push(`Senin - Jumat: ${seninJumatStart} - ${seninJumatEnd} WIT`);
    }
    if (sabtuActive) {
      parts.push(`Sabtu: ${sabtuStart} - ${sabtuEnd} WIT`);
    }
    if (mingguActive) {
      parts.push(`Minggu: ${mingguStart} - ${mingguEnd} WIT`);
    } else if (!seninJumatActive && !sabtuActive) {
      parts.push("Libur / Tutup");
    }

    if (parts.length > 0) {
      setJamKerjaManual(parts.join(", "));
    }
  }, [seninJumatActive, seninJumatStart, seninJumatEnd, sabtuActive, sabtuStart, sabtuEnd, mingguActive, mingguStart, mingguEnd]);

  // Load profile data from Laravel API
  const fetchTentangData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profil/tentang`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setSejarahContent(d.content || "");

          if (d.meta_json) {
            if (d.meta_json.tahun_berdiri) setTahunBerdiri(String(d.meta_json.tahun_berdiri));
            if (d.meta_json.alamat) setAlamat(d.meta_json.alamat);
            if (d.meta_json.telepon) setTelepon(d.meta_json.telepon);
            if (d.meta_json.email) setEmail(d.meta_json.email);
            if (d.meta_json.jam_kerja) {
              setJamKerjaManual(d.meta_json.jam_kerja);

              // Parse Senin - Jumat
              const sjMatch = d.meta_json.jam_kerja.match(/Senin\s*-\s*Jumat:\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/i);
              if (sjMatch) {
                setSeninJumatActive(true);
                setSeninJumatStart(sjMatch[1]);
                setSeninJumatEnd(sjMatch[2]);
              }

              // Parse Sabtu
              const sabtuMatch = d.meta_json.jam_kerja.match(/Sabtu:\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/i);
              if (sabtuMatch) {
                setSabtuActive(true);
                setSabtuStart(sabtuMatch[1]);
                setSabtuEnd(sabtuMatch[2]);
              }

              // Parse Minggu
              const mingguMatch = d.meta_json.jam_kerja.match(/Minggu:\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/i);
              if (mingguMatch) {
                setMingguActive(true);
                setMingguStart(mingguMatch[1]);
                setMingguEnd(mingguMatch[2]);
              }
            }
          }
        }
      }

      // Load Visi & Misi data
      const resVisi = await fetch(`${API_BASE_URL}/profil/visi_misi`, { cache: "no-store" });
      if (resVisi.ok) {
        const jsonVisi = await resVisi.json();
        if (jsonVisi.success && jsonVisi.data) {
          const v = jsonVisi.data;
          if (v.content) setVisiContent(v.content);
          if (v.meta_json && Array.isArray(v.meta_json.misi)) {
            setMisiList(v.meta_json.misi);
          }
        }
      }
    } catch (err) {
      console.error("Gagal memuat data profil tentang:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isLoadedRef.current = true;
      }, 100);
    }
  };

  useEffect(() => {
    fetchTentangData();
  }, []);

  // Save all 3 sections to Database
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Save Tentang & Informasi Instansi
      const resTentang = await authenticatedFetch("/profil/tentang", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          title: "Profil & Sejarah BAPPEDA",
          subtitle: "Sejarah Pembentukan dan Peran Strategis BAPPEDA Kabupaten Halmahera Utara",
          content: sejarahContent,
          meta_json: {
            tahun_berdiri: tahunBerdiri,
            alamat,
            telepon,
            email,
            jam_kerja: jamKerjaManual,
          },
        }),
      });

      // 2. Save Visi & Misi
      const resVisi = await authenticatedFetch("/profil/visi_misi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          title: "Visi & Misi Pemerintah Daerah",
          subtitle: "Arah dan Prioritas Pemerintah Daerah Kabupaten Halmahera Utara",
          content: visiContent,
          meta_json: {
            misi: misiList.filter((m) => m.trim() !== ""),
          },
        }),
      });

      if (resTentang.ok && resVisi.ok) {
        setSaved(true);
        toast.success("Profil, Sejarah, serta Visi & Misi Pemerintah Daerah berhasil disimpan!");
        setTimeout(() => setSaved(false), 3500);
      } else {
        toast.error("Gagal menyimpan data profil ke database!");
      }
    } catch (err) {
      console.error("Gagal menyimpan data profil ke database:", err);
      toast.error("Terjadi kesalahan koneksi saat menyimpan profil!");
    } finally {
      setSaving(false);
    }
  };

  // Misi list handlers
  const handleAddMisi = () => {
    setMisiList((prev) => [...prev, ""]);
  };

  const handleRemoveMisi = (index: number) => {
    setMisiList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMisiChange = (index: number, val: string) => {
    setMisiList((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas</h2>
        <p className="text-xs text-slate-600 font-medium">
          Pengeditan Tentang BAPPEDA hanya dapat dilakukan oleh role <strong>Administrator (SuperAdmin)</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Narasi &amp; Identitas Instansi
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-600 shrink-0" />
            <span>Kelola Tentang BAPPEDA (Sejarah, Visi Misi &amp; Info Instansi)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Kelola 3 sub-bagian profil instansi sekaligus yang akan tampil secara dinamis pada halaman publik.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Seluruh Sub-Bagian Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {/* Sub-Menu Cards Selector: 3 Sub-bagian */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("sejarah")}
          className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition ${
            activeTab === "sejarah"
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
              : "bg-white border-slate-200 hover:border-blue-300 text-slate-800"
          }`}
        >
          <Building2 className={`w-5 h-5 shrink-0 ${activeTab === "sejarah" ? "text-white" : "text-blue-600"}`} />
          <div>
            <h3 className="text-xs font-black">1. Profil & Sejarah</h3>
            <p className={`text-[10px] ${activeTab === "sejarah" ? "text-blue-100" : "text-slate-500"}`}>
              Narasi sejarah singkat
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("visi_misi")}
          className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition ${
            activeTab === "visi_misi"
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
              : "bg-white border-slate-200 hover:border-blue-300 text-slate-800"
          }`}
        >
          <Target className={`w-5 h-5 shrink-0 ${activeTab === "visi_misi" ? "text-white" : "text-blue-600"}`} />
          <div>
            <h3 className="text-xs font-black">2. Visi & Misi</h3>
            <p className={`text-[10px] ${activeTab === "visi_misi" ? "text-blue-100" : "text-slate-500"}`}>
              Visi & poin-poin misi
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("informasi")}
          className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition ${
            activeTab === "informasi"
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
              : "bg-white border-slate-200 hover:border-blue-300 text-slate-800"
          }`}
        >
          <MapPin className={`w-5 h-5 shrink-0 ${activeTab === "informasi" ? "text-white" : "text-blue-600"}`} />
          <div>
            <h3 className="text-xs font-black">3. Informasi Instansi</h3>
            <p className={`text-[10px] ${activeTab === "informasi" ? "text-blue-100" : "text-slate-500"}`}>
              Alamat, kontak & jam kerja
            </p>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold animate-pulse">
          Memuat data dari database...
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* TAB 1: Profil & Sejarah Singkat */}
          {activeTab === "sejarah" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>1. Editor Profil & Sejarah Singkat BAPPEDA</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Narasi Sejarah (WYSIWYG Rich Text Editor)</label>
                <RichTextEditor
                  value={sejarahContent}
                  onChange={setSejarahContent}
                  placeholder="Tuliskan narasi sejarah pembentukan BAPPEDA Halmahera Utara..."
                  minHeight="350px"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Visi & Misi */}
          {activeTab === "visi_misi" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Target className="w-4 h-4 text-blue-600" />
                <span>2. Editor Visi & Misi Pemerintah Daerah</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Visi Utama *</label>
                  <textarea
                    rows={3}
                    required
                    value={visiContent}
                    onChange={(e) => setVisiContent(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Poin-poin Misi Pembangunan ({misiList.length} Poin)</label>
                    <button
                      type="button"
                      onClick={handleAddMisi}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Poin Misi</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {misiList.map((misi, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={misi}
                          onChange={(e) => handleMisiChange(idx, e.target.value)}
                          placeholder={`Tuliskan poin misi ke-${idx + 1}...`}
                          className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {misiList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMisi(idx)}
                            className="p-2.5 rounded-xl hover:bg-rose-100 text-rose-600 transition shrink-0"
                            title="Hapus Misi Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Informasi Instansi */}
          {activeTab === "informasi" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>3. Editor Informasi Instansi, Jam Kerja & Kontak</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SELECT TAHUN BERDIRI DROPDOWN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Berdiri Instansi *</label>
                  <SearchableSelect
                    options={yearOptions}
                    value={tahunBerdiri}
                    onChange={(val) => setTahunBerdiri(String(val))}
                    placeholder="Pilih Tahun Berdiri..."
                    searchPlaceholder="Cari tahun..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon Kantor</label>
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi Instansi</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Kantor</label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* JAM KERJA SCHEDULE MANAGER WITH CHECKBOXES & SELECT TIMES */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black text-slate-900">Pengaturan Hari & Jam Kerja Kantor</h3>
                </div>

                <div className="space-y-3">
                  {/* Senin - Jumat */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-black text-slate-800">
                      <input
                        type="checkbox"
                        checked={seninJumatActive}
                        onChange={(e) => setSeninJumatActive(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Senin - Jumat</span>
                    </label>

                    {seninJumatActive && (
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-600">Buka:</span>
                        <div className="w-28">
                          <SearchableSelect
                            options={timeOptions}
                            value={seninJumatStart}
                            onChange={(val) => setSeninJumatStart(String(val))}
                            placeholder="08:00"
                            searchPlaceholder="Pukul..."
                          />
                        </div>
                        <span className="text-slate-600">- Tutup:</span>
                        <div className="w-28">
                          <SearchableSelect
                            options={timeOptions}
                            value={seninJumatEnd}
                            onChange={(val) => setSeninJumatEnd(String(val))}
                            placeholder="16:00"
                            searchPlaceholder="Pukul..."
                          />
                        </div>
                        <span className="text-slate-400 font-mono">WIT</span>
                      </div>
                    )}
                  </div>

                  {/* Sabtu */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-black text-slate-800">
                      <input
                        type="checkbox"
                        checked={sabtuActive}
                        onChange={(e) => setSabtuActive(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Sabtu</span>
                    </label>

                    {sabtuActive ? (
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-600">Buka:</span>
                        <div className="w-28">
                          <SearchableSelect
                            options={timeOptions}
                            value={sabtuStart}
                            onChange={(val) => setSabtuStart(String(val))}
                            placeholder="09:00"
                            searchPlaceholder="Pukul..."
                          />
                        </div>
                        <span className="text-slate-600">- Tutup:</span>
                        <div className="w-28">
                          <SearchableSelect
                            options={timeOptions}
                            value={sabtuEnd}
                            onChange={(val) => setSabtuEnd(String(val))}
                            placeholder="15:00"
                            searchPlaceholder="Pukul..."
                          />
                        </div>
                        <span className="text-slate-400 font-mono">WIT</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">Libur / Tutup</span>
                    )}
                  </div>

                  {/* Minggu */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-black text-slate-800">
                      <input
                        type="checkbox"
                        checked={mingguActive}
                        onChange={(e) => setMingguActive(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Minggu</span>
                    </label>

                    {mingguActive ? (
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-600">Buka:</span>
                        <div className="w-28">
                          <SearchableSelect
                            options={timeOptions}
                            value={mingguStart}
                            onChange={(val) => setMingguStart(String(val))}
                            placeholder="09:00"
                            searchPlaceholder="Pukul..."
                          />
                        </div>
                        <span className="text-slate-600">- Tutup:</span>
                        <div className="w-28">
                          <SearchableSelect
                            options={timeOptions}
                            value={mingguEnd}
                            onChange={(val) => setMingguEnd(String(val))}
                            placeholder="12:00"
                            searchPlaceholder="Pukul..."
                          />
                        </div>
                        <span className="text-slate-400 font-mono">WIT</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">Libur / Tutup</span>
                    )}
                  </div>
                </div>

                {/* Formatted Output String Preview */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Preview Format Jam Kerja Tampil di Publik:</label>
                  <input
                    type="text"
                    value={jamKerjaManual}
                    onChange={(e) => setJamKerjaManual(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Menyimpan Data..." : "Simpan Seluruh Perubahan Profil"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
