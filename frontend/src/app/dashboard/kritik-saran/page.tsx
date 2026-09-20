"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  HelpCircle,
  Eye,
  X,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Mail,
  User,
  Plus,
  Trash2,
  Settings,
  ListFilter,
} from "lucide-react";
import { showDeleteConfirm, toast } from "@/lib/swal";
import {
  fetchKritikList,
  fetchSurveyConfig,
  KritikSaranItem,
  SurveyServiceItem,
} from "@/services/surveyService";
import { authenticatedFetch, API_BASE_URL } from "@/lib/apiClient";
import SearchableSelect from "@/components/ui/SearchableSelect";

const API_BASE = API_BASE_URL;

export default function DashboardKritikSaranPage() {
  const [activeTab, setActiveTab] = useState<"pesan" | "unit_tujuan">("pesan");

  const [kritikList, setKritikList] = useState<KritikSaranItem[]>([]);
  const [services, setServices] = useState<SurveyServiceItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New Service Input Form State
  const [newSName, setNewSName] = useState("");
  const [addingService, setAddingService] = useState(false);

  // Reply Modal State
  const [activeKritikModal, setActiveKritikModal] = useState<KritikSaranItem | null>(null);
  const [catatanBalasan, setCatatanBalasan] = useState("");
  const [statusBalasan, setStatusBalasan] = useState("Sudah Ditanggapi");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [dataKritik, cfg] = await Promise.all([
      fetchKritikList(),
      fetchSurveyConfig(),
    ]);
    setKritikList(dataKritik);
    if (cfg.services) {
      setServices(cfg.services);
    }
    setLoading(false);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSName.trim()) return;

    setAddingService(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/surveys/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSName.trim() }),
      });
      if (res.ok) {
        toast.success("Opsi Bidang / Unit Tujuan baru berhasil disimpan!");
        setNewSName("");
        loadData();
      } else {
        toast.error("Gagal menyimpan ke database.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setAddingService(false);
    }
  };

  const handleDeleteService = async (id: number, name: string) => {
    const resConfirm = await showDeleteConfirm(name);
    if (!resConfirm.isConfirmed) return;

    try {
      const res = await authenticatedFetch(`${API_BASE}/surveys/services/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Opsi berhasil dihapus dari database.");
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus opsi.");
    }
  };

  const handleSaveTanggapan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKritikModal) return;

    try {
      const response = await authenticatedFetch(`${API_BASE}/kritik/${activeKritikModal.id}/tanggapan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusBalasan,
          catatan_balasan: catatanBalasan,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (e) {
      console.warn("Backend API update tanggapan gagal:", e);
      toast.error("Tanggapan gagal disimpan ke database.");
      return;
    }

    toast.success("Tanggapan kritik & saran publik berhasil disimpan!");
    setActiveKritikModal(null);
    loadData();
  };

  const filteredKritik = kritikList.filter(
    (k) =>
      k.nama.toLowerCase().includes(search.toLowerCase()) ||
      k.subjek.toLowerCase().includes(search.toLowerCase()) ||
      k.pesan.toLowerCase().includes(search.toLowerCase()) ||
      k.skpd_tujuan.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredKritik.length / itemsPerPage) || 1;
  const paginatedItems = filteredKritik.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPending = kritikList.filter((k) => k.status !== "Sudah Ditanggapi").length;
  const totalResponded = kritikList.filter((k) => k.status === "Sudah Ditanggapi").length;

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>MANAJEMEN MASUKAN &amp; OPSI BIDANG TUJUAN PUBLIK</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kritik &amp; Saran Masukan Warga
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
            Kelola data kritik &amp; saran publik serta kelola daftar dinamis opsi Bidang / Unit Tujuan BAPPEDA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/kritik-saran"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-extrabold transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>Lihat Form Publik</span>
          </Link>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("pesan")}
          className={`px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === "pesan"
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Daftar Masukan Warga ({kritikList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unit_tujuan")}
          className={`px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === "unit_tujuan"
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Input / Kelola Opsi Bidang Tujuan ({services.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: DAFTAR MASUKAN WARGA */}
      {activeTab === "pesan" && (
        <div className="space-y-6">
          {/* SUMMARY STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-lg space-y-1 relative overflow-hidden">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                TOTAL KRITIK &amp; SARAN MASUK
              </span>
              <div className="text-3xl font-black pt-1">
                {kritikList.length} <span className="text-xs font-bold text-blue-200">Pesan Warga</span>
              </div>
              <p className="text-[10px] text-blue-200/80 font-medium pt-2 border-t border-blue-800/60">
                Terverifikasi dari formulir online publik
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 font-bold">
                MENUNGGU TANGGAPAN
              </span>
              <div className="text-3xl font-black text-amber-600">
                {totalPending} <span className="text-xs text-slate-400 font-bold">Pesan</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-100">
                Perlu direspons dan ditindaklanjuti oleh SKPD
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 font-bold">
                SUDAH DITANGGAPI
              </span>
              <div className="text-3xl font-black text-emerald-600">
                {totalResponded} <span className="text-xs text-slate-400 font-bold">Pesan</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-100">
                Tanggapan resmi telah disampaikan
              </p>
            </div>
          </div>

          {/* TABLE LIST & SEARCH */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Daftar Pesan Masukan Publik ({filteredKritik.length})
                </h3>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari pengirim / subjek / isi pesan..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Pengirim</th>
                    <th className="py-4 px-6">Unit SKPD Tujuan</th>
                    <th className="py-4 px-6">Subjek &amp; Pesan</th>
                    <th className="py-4 px-6">Status Tanggapan</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                        Belum ada pesan kritik &amp; saran dari publik.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                          <div>{item.nama}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{item.email}</div>
                          {item.telepon && (
                            <div className="text-[10px] text-slate-400 font-normal">{item.telepon}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">
                          {item.skpd_tujuan}
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <div className="font-extrabold text-slate-900 truncate">{item.subjek}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.pesan}</div>
                          {item.catatan_balasan && (
                            <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 font-medium">
                              <strong>Balasan Admin:</strong> {item.catatan_balasan}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                              item.status === "Sudah Ditanggapi"
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                : item.status === "Dalam Proses Tindak Lanjut" || item.status === "Dalam Proses"
                                ? "bg-sky-100 text-sky-900 border-sky-300"
                                : "bg-amber-100 text-amber-900 border-amber-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveKritikModal(item);
                              setCatatanBalasan(item.catatan_balasan || "");
                              setStatusBalasan(
                                item.status === "Dalam Proses Tindak Lanjut" || item.status === "Dalam Proses"
                                  ? "Dalam Proses Tindak Lanjut"
                                  : "Sudah Ditanggapi"
                              );
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition cursor-pointer"
                          >
                            Tanggapi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: INPUT / KELOLA OPSI BIDANG TUJUAN */}
      {activeTab === "unit_tujuan" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              MANAJEMEN OPSI UNIT TUJUAN
            </span>
            <h2 className="text-xl font-black text-slate-900">
              Tambah &amp; Kelola Opsi Bidang / Unit Tujuan *
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Opsi yang Anda tambahkan di bawah ini akan **secara otomatis tersedia di pilihan dropdown publik** pada formulir Kritik &amp; Saran.
            </p>
          </div>

          {/* FORM INPUT BARU */}
          <form onSubmit={handleAddService} className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
            <label className="block text-xs font-black uppercase text-blue-900">
              Tambah Opsi Bidang / Layanan / SKPD Baru
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={newSName}
                onChange={(e) => setNewSName(e.target.value)}
                placeholder="Contoh: Bidang Infrastruktur & Perumahan Rakyat"
                className="flex-1 w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
              />
              <button
                type="submit"
                disabled={addingService || !newSName.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{addingService ? "Menyimpan..." : "Simpan Opsi Baru"}</span>
              </button>
            </div>
          </form>

          {/* TABEL DAFTAR OPSI */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">ID System</th>
                  <th className="py-3.5 px-6">Nama Bidang / Unit / Jenis Layanan</th>
                  <th className="py-3.5 px-6">Status Aktif</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                      Belum ada opsi unit/bidang layanan.
                    </td>
                  </tr>
                ) : (
                  services.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-6 font-bold text-slate-400">#{item.id}</td>
                      <td className="py-3.5 px-6 font-black text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                          Aktif Publik
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteService(item.id, item.name)}
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          title="Hapus opsi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL RESPOND KRITIK */}
      {activeKritikModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 relative">
            <button
              type="button"
              onClick={() => setActiveKritikModal(null)}
              className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                Tanggapan Resmi BAPPEDA
              </span>
              <h2 className="text-lg font-black text-slate-900 leading-snug">
                {activeKritikModal.subjek}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900">
                Dari: {activeKritikModal.nama} ({activeKritikModal.email})
              </div>
              <p className="text-slate-700 italic">"{activeKritikModal.pesan}"</p>
            </div>

            <form onSubmit={handleSaveTanggapan} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Status Tanggapan *
                </label>
                <SearchableSelect
                  value={statusBalasan}
                  onChange={(val) => setStatusBalasan(String(val))}
                  options={[
                    { value: "Sudah Ditanggapi", label: "Sudah Ditanggapi" },
                    { value: "Dalam Proses Tindak Lanjut", label: "Dalam Proses Tindak Lanjut" },
                  ]}
                  placeholder="-- Pilih Status Tanggapan --"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  Catatan Balasan BAPPEDA
                </label>
                <textarea
                  rows={4}
                  value={catatanBalasan}
                  onChange={(e) => setCatatanBalasan(e.target.value)}
                  placeholder="Tuliskan catatan tindak lanjut atau tanggapan..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveKritikModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md shadow-blue-600/20"
                >
                  Simpan Tanggapan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
