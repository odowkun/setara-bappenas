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
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col items-start sm:bottom-6 sm:left-6">
      {isOpen && (
        <div className="mb-3 flex min-w-[250px] max-w-[calc(100vw-2rem)] animate-in flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4 text-slate-800 shadow-2xl backdrop-blur-xl fade-in slide-in-from-bottom-5 motion-reduce:animate-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Menu Aksesibilitas
            </span>
          </div>

          {/* Instant Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 rounded-xl transition"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Search className="w-3.5 h-3.5 text-blue-600" /> Cari Cepat
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-500 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Font Scaling */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Ukuran Teks:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={decreaseFontSize}
                className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded-lg transition"
                title="Kecilkan Font"
                aria-label="Kecilkan Ukuran Font"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetFontSize}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                title="Reset Ukuran"
                aria-label="Reset Ukuran Font"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={increaseFontSize}
                className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded-lg transition"
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
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition font-semibold ${
              highContrast
                ? "bg-amber-400 text-blue-950 font-bold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Kontras Tinggi
            </span>
            <span>{highContrast ? "ON" : "OFF"}</span>
          </button>

          {/* Dyslexia Font */}
          <button
            onClick={toggleDyslexiaFont}
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition font-semibold ${
              dyslexiaFont
                ? "bg-blue-700 text-white font-bold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Font Disleksia
            </span>
            <span>{dyslexiaFont ? "ON" : "OFF"}</span>
          </button>

          {/* Voice Reader */}
          <button
            onClick={toggleVoiceReader}
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition font-semibold ${
              isPlayingAudio
                ? "bg-blue-700 text-white animate-pulse font-bold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {isPlayingAudio ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              )}
              Voice Reader
            </span>
            <span>{isPlayingAudio ? "Stop" : "Play"}</span>
          </button>
        </div>
      )}

      {/* Floating Toggle Button */}
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
        className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full border border-blue-600/50 bg-blue-700 px-4 text-amber-300 shadow-xl shadow-blue-900/30 outline-none transition-colors hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-amber-300 sm:h-16 sm:px-5"
        aria-label={
          isOpen ? "Tutup Menu Aksesibilitas" : "Buka Menu Aksesibilitas"
        }
        aria-expanded={isOpen}
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
        <span className="hidden text-sm font-black text-white sm:inline">
          Menu Aksesibilitas
        </span>
      </button>
    </div>
  );
};
