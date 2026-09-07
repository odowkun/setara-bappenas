"use client";

import React, { useEffect, useState } from "react";
import { useAccessibility } from "@/context/AccessibilityContext";
import {
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Type,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  Accessibility,
} from "lucide-react";
import { toast } from "@/lib/swal";

export const A11yToolbar: React.FC = () => {
  const {
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    highContrast,
    toggleHighContrast,
    dyslexiaFont,
    toggleDyslexiaFont,
    setIsSearchOpen,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const closeWhenAnotherPanelOpens = (event: Event) => {
      const panelEvent = event as CustomEvent<string>;
      if (panelEvent.detail !== "accessibility") setIsOpen(false);
    };

    window.addEventListener(
      "bappeda:floating-panel-open",
      closeWhenAnotherPanelOpens
    );
    return () =>
      window.removeEventListener(
        "bappeda:floating-panel-open",
        closeWhenAnotherPanelOpens
      );
  }, []);

  const toggleVoiceReader = () => {
    if ("speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToRead = document.body.innerText.slice(0, 500);
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = "id-ID";
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      toast.error("Browser Anda belum mendukung fitur Voice Reader.");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start sm:bottom-8 sm:left-8">
      {isOpen && (
        <div className="mb-3 flex min-w-[280px] max-w-[calc(100vw-2rem)] animate-in flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 text-slate-800 shadow-2xl shadow-blue-950/20 backdrop-blur-2xl fade-in slide-in-from-bottom-5 motion-reduce:animate-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Pengaturan Aksesibilitas
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Tutup panel aksesibilitas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Instant Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 rounded-xl transition cursor-pointer font-bold"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-blue-600" /> Cari Cepat Dokumen
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-500 font-mono font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Font Scaling */}
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs font-bold text-slate-700">Ukuran Teks:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={decreaseFontSize}
                className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded-lg transition cursor-pointer"
                title="Kecilkan Font"
                aria-label="Kecilkan Ukuran Font"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetFontSize}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                title="Reset Ukuran"
                aria-label="Reset Ukuran Font"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={increaseFontSize}
                className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded-lg transition cursor-pointer"
                title="Besarkan Font"
                aria-label="Besarkan Ukuran Font"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* High Contrast */}
          <button
            onClick={toggleHighContrast}
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer ${
              highContrast
                ? "bg-amber-400 text-blue-950"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-amber-600" /> Kontras Tinggi
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/60">
              {highContrast ? "AKTIF" : "NONAKTIF"}
            </span>
          </button>

          {/* Dyslexia Font */}
          <button
            onClick={toggleDyslexiaFont}
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer ${
              dyslexiaFont
                ? "bg-blue-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-blue-600" /> Font Ramah Disleksia
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/30">
              {dyslexiaFont ? "AKTIF" : "NONAKTIF"}
            </span>
          </button>

          {/* Voice Reader */}
          <button
            onClick={toggleVoiceReader}
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer ${
              isPlayingAudio
                ? "bg-blue-600 text-white animate-pulse"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {isPlayingAudio ? (
                <VolumeX className="w-3.5 h-3.5 text-white" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              )}
              Pembaca Suara (Voice Reader)
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/30">
              {isPlayingAudio ? "STOP" : "PLAY"}
            </span>
          </button>
        </div>
      )}

      {/* Floating Toggle Button (Luminous White Frosted Glass Pill) */}
      <button
        onClick={() => {
          const willOpen = !isOpen;
          setIsOpen(willOpen);
          if (willOpen) {
            window.dispatchEvent(
              new CustomEvent("bappeda:floating-panel-open", {
                detail: "accessibility",
              })
            );
          }
        }}
        className="group flex h-12 cursor-pointer items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/95 px-3.5 sm:px-4.5 text-slate-800 shadow-xl shadow-blue-950/10 backdrop-blur-2xl transition-all duration-200 hover:bg-white hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-900/15 active:scale-95"
        aria-label={
          isOpen ? "Tutup Menu Aksesibilitas" : "Buka Menu Aksesibilitas"
        }
        aria-expanded={isOpen}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200/70 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
          <Accessibility className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="hidden text-xs font-black tracking-tight text-slate-700 transition-colors group-hover:text-blue-950 sm:inline">
          Menu Aksesibilitas
        </span>
      </button>
    </div>
  );
};
