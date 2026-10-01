"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

interface DashboardLoadingScreenProps {
  title?: string;
  subtitle?: string;
  statusText?: string;
}

export default function DashboardLoadingScreen({
  title = "Memuat Sesi Dashboard",
  subtitle = "",
  statusText = "Memverifikasi sesi kredensial akun...",
}: DashboardLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("Memulai inisialisasi sesi...");

  useEffect(() => {
    // Stage 1: Quick start 0% -> 18%
    const t0 = setTimeout(() => {
      setProgress(18);
      setCurrentStatus("Menghubungkan ke server portal BAPPEDA...");
    }, 40);

    // Stage 2: Credential check 18% -> 38%
    const t1 = setTimeout(() => {
      setProgress(38);
      setCurrentStatus("Memverifikasi kredensial & otentikasi...");
    }, 220);

    // Stage 3: Verification stage 38% -> 68%
    const t2 = setTimeout(() => {
      setProgress(68);
      setCurrentStatus(statusText || "Memverifikasi hak akses portal...");
    }, 520);

    // Stage 4: Workspace preparation 68% -> 90%
    const t3 = setTimeout(() => {
      setProgress(90);
      setCurrentStatus("Menyiapkan ruang kerja & modul digital...");
    }, 820);

    // Stage 5: Reaching 100% completion
    const t4 = setTimeout(() => {
      setProgress(100);
      setCurrentStatus("Sesi terverifikasi! Membuka antarmuka...");
    }, 1100);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [statusText]);

  return (
    <div className="fixed inset-0 z-[99999] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans select-none overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Main Glassmorphic Card */}
      <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-blue-900/10 rounded-3xl p-7 sm:p-9 max-w-md w-full flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Emblem with Double Ring Pulse */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="absolute w-20 h-20 rounded-full bg-blue-500/15 animate-ping duration-1000" />
          <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center p-2.5">
            <Image
              src="/images/bappeda/logo-halut.png"
              alt="Logo BAPPEDA Halmahera Utara"
              width={56}
              height={56}
              className="w-full h-full object-contain drop-shadow-xs"
              priority
            />
          </div>
        </div>

        {/* Agency Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-800 text-[10px] sm:text-[11px] font-black tracking-wide uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>BAPPEDA KAB. HALMAHERA UTARA</span>
        </div>

        {/* Headings */}
        <div className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Real Animated Progress Bar with Percentage Counter */}
        <div className="w-full space-y-2.5 pt-1">
          {/* Progress Header: Current Step Status & Percentage */}
          <div className="flex items-center justify-between text-[11px] font-bold px-0.5">
            <span className="truncate max-w-[270px] text-left text-slate-600">
              {currentStatus}
            </span>
            <span
              className={`font-mono font-black shrink-0 transition-colors ${
                progress === 100 ? "text-emerald-600" : "text-blue-700"
              }`}
            >
              {progress}%
            </span>
          </div>

          {/* Bar track */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                progress === 100
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 shadow-xs shadow-emerald-500/40"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Micro Status Indicator */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold pt-0.5">
            {progress === 100 ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Sesi Terverifikasi</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-slate-500">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Memproses sinkronisasi data...</span>
              </span>
            )}
          </div>
        </div>

        {/* Security Footer Pill */}
        <div className="pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-[10px] text-slate-400 font-semibold">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Koneksi Terenkripsi</span>
          <span>•</span>
          <span>Smart Digital Portal</span>
        </div>
      </div>
    </div>
  );
}
