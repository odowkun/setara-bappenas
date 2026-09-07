"use client";

import React, { useEffect, useState } from "react";
import { useAccessibility } from "@/context/AccessibilityContext";
import { ZoomIn, ZoomOut, RotateCcw, VolumeX, X } from "lucide-react";
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
      if (panelEvent.detail !== "accessibility") {
        setIsOpen(false);
      }
    };

    window.addEventListener(
      "bappeda:floating-panel-open",
      closeWhenAnotherPanelOpens
    );
    return () => {
      window.removeEventListener(
        "bappeda:floating-panel-open",
        closeWhenAnotherPanelOpens
      );
    };
  }, []);

  const toggleVoiceReader = () => {
    if ("speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToRead = document.body.innerText.substring(0, 500);
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
        <div className="mb-3 flex min-w-[300px] max-w-[calc(100vw-2rem)] animate-in flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 text-slate-800 shadow-2xl shadow-blue-950/20 backdrop-blur-2xl fade-in slide-in-from-bottom-5 motion-reduce:animate-none">
          {/* Executive Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-2xs">
                <img
                  src="/images/3dicons/setting-dynamic-color.png"
                  alt=""
                  width={20}
                  height={20}
                  style={{ width: 20, height: 20, maxWidth: 20, maxHeight: 20 }}
                  className="object-contain drop-shadow-xs"
                />
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Aksesibilitas
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Kenyamanan visual &amp; audio
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Tutup panel aksesibilitas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Instant Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between w-full px-3 py-2.5 text-xs bg-slate-100/90 hover:bg-blue-50 hover:text-blue-900 text-slate-700 rounded-xl transition cursor-pointer font-bold border border-slate-200/60"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs border border-slate-200/60">
                <img
                  src="/images/3dicons/zoom-dynamic-color.png"
                  alt=""
                  width={18}
                  height={18}
                  style={{ width: 18, height: 18, maxWidth: 18, maxHeight: 18 }}
                  className="object-contain drop-shadow-2xs"
                />
              </span>
              Cari Cepat Dokumen
            </span>
            <kbd className="px-2 py-0.5 text-[10px] bg-white border border-slate-200/90 rounded-md text-slate-500 font-mono font-bold shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Font Scaling */}
          <div className="flex items-center justify-between py-1 px-1 bg-slate-50/80 rounded-xl border border-slate-100 p-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs border border-slate-200/60">
                <img
                  src="/images/3dicons/text-dynamic-color.png"
                  alt=""
                  width={16}
                  height={16}
                  style={{ width: 16, height: 16, maxWidth: 16, maxHeight: 16 }}
                  className="object-contain"
                />
              </span>
              Ukuran Teks
            </span>
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
              <button
                onClick={decreaseFontSize}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 rounded-lg text-xs font-black shadow-2xs transition cursor-pointer active:scale-95"
                title="Kecilkan Font"
                aria-label="Kecilkan Ukuran Font"
              >
                A-
              </button>
              <button
                onClick={resetFontSize}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-black shadow-2xs transition cursor-pointer active:scale-95"
                title="Reset Ukuran"
                aria-label="Reset Ukuran Font"
              >
                100%
              </button>
              <button
                onClick={increaseFontSize}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 rounded-lg text-xs font-black shadow-2xs transition cursor-pointer active:scale-95"
                title="Besarkan Font"
                aria-label="Besarkan Ukuran Font"
              >
                A+
              </button>
            </div>
          </div>

          {/* High Contrast */}
          <button
            onClick={toggleHighContrast}
            className={`flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition font-bold cursor-pointer border ${
              highContrast
                ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/25"
                : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                <img
                  src="/images/3dicons/sun-dynamic-color.png"
                  alt=""
                  width={18}
                  height={18}
                  style={{ width: 18, height: 18, maxWidth: 18, maxHeight: 18 }}
                  className="object-contain drop-shadow-2xs"
                />
              </span>
              Mode Kontras Tinggi
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                highContrast
                  ? "bg-white/30 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {highContrast ? "AKTIF" : "NONAKTIF"}
            </span>
          </button>

          {/* Dyslexia Font */}
          <button
            onClick={toggleDyslexiaFont}
            className={`flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition font-bold cursor-pointer border ${
              dyslexiaFont
                ? "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/25"
                : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                <img
                  src="/images/3dicons/notebook-dynamic-color.png"
                  alt=""
                  width={18}
                  height={18}
                  style={{ width: 18, height: 18, maxWidth: 18, maxHeight: 18 }}
                  className="object-contain drop-shadow-2xs"
                />
              </span>
              Font Ramah Disleksia
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                dyslexiaFont
                  ? "bg-white/30 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {dyslexiaFont ? "AKTIF" : "NONAKTIF"}
            </span>
          </button>

          {/* Voice Reader */}
          <button
            onClick={toggleVoiceReader}
            className={`flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition font-bold cursor-pointer border ${
              isPlayingAudio
                ? "bg-blue-600 text-white border-blue-700 animate-pulse shadow-md shadow-blue-600/25"
                : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                {isPlayingAudio ? (
                  <VolumeX className="w-4 h-4 text-blue-600" />
                ) : (
                  <img
                    src="/images/3dicons/headphone-dynamic-color.png"
                    alt=""
                    width={18}
                    height={18}
                    style={{ width: 18, height: 18, maxWidth: 18, maxHeight: 18 }}
                    className="object-contain drop-shadow-2xs"
                  />
                )}
              </span>
              Pembaca Suara (Voice Reader)
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isPlayingAudio
                  ? "bg-white/30 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
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
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200/70 transition-all duration-200 group-hover:scale-110 shadow-2xs">
          <img
            src="/images/3dicons/setting-dynamic-color.png"
            alt="Menu Aksesibilitas"
            width={20}
            height={20}
            style={{ width: 20, height: 20, maxWidth: 20, maxHeight: 20 }}
            className="h-5 w-5 object-contain drop-shadow-xs"
          />
        </span>
        <span className="hidden text-xs font-black tracking-tight text-slate-700 transition-colors group-hover:text-blue-950 sm:inline">
          Menu Aksesibilitas
        </span>
      </button>
    </div>
  );
};
