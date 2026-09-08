"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibility, ColorMode } from "@/context/AccessibilityContext";
import { RotateCcw, VolumeX, X, Volume2, Sparkles } from "lucide-react";
import { toast } from "@/lib/swal";

// Reading Guide Line Component that follows the mouse cursor
const ReadingGuideRuler = () => {
  const [mouseY, setMouseY] = useState(-100);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (mouseY < 0) return null;

  return (
    <div
      style={{ top: `${mouseY - 20}px` }}
      className="fixed left-0 right-0 h-10 pointer-events-none z-[99998] transition-transform duration-75 ease-out"
    >
      <div className="w-full h-full bg-blue-500/15 border-y-2 border-blue-600/70 shadow-[0_0_24px_rgba(37,99,235,0.3)] backdrop-blur-[0.5px]" />
    </div>
  );
};

export const A11yToolbar: React.FC = () => {
  const {
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    colorMode,
    setColorMode,
    dyslexiaFont,
    toggleDyslexiaFont,
    textSpacing,
    toggleTextSpacing,
    bigCursor,
    toggleBigCursor,
    readingGuide,
    toggleReadingGuide,
    highlightLinks,
    toggleHighlightLinks,
    pauseMotion,
    togglePauseMotion,
    resetAll,
    setIsSearchOpen,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        toast.success("Pembaca suara dihentikan.");
      } else {
        const selection = window.getSelection()?.toString().trim();
        let textToRead = selection;
        if (!textToRead || textToRead.length < 5) {
          const mainElement = document.querySelector("main") || document.body;
          textToRead = mainElement.innerText.substring(0, 500);
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = "id-ID";
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
        toast.success(
          selection ? "Membacakan teks terpilih..." : "Membacakan ringkasan halaman..."
        );
      }
    } else {
      toast.error("Browser Anda belum mendukung fitur Voice Reader.");
    }
  };

  const handleReset = () => {
    if (isPlayingAudio && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    resetAll();
    toast.success("Setelan aksesibilitas dikembalikan ke normal.");
  };

  const colorModes: { id: ColorMode; label: string; bg: string; text: string }[] = [
    { id: "normal", label: "Normal", bg: "bg-slate-100", text: "text-slate-700" },
    { id: "high-contrast", label: "Kontras", bg: "bg-yellow-400", text: "text-black" },
    { id: "grayscale", label: "Monokrom", bg: "bg-slate-300", text: "text-slate-800" },
    { id: "invert", label: "Invert", bg: "bg-indigo-900", text: "text-white" },
    { id: "sepia", label: "Sepia", bg: "bg-amber-100", text: "text-amber-900" },
  ];

  return (
    <>
      {/* Portal Reading Guide Ruler */}
      {mounted && readingGuide && createPortal(<ReadingGuideRuler />, document.body)}

      {/* Portal Color Filter Overlays (Zero impact on fixed containing blocks) */}
      {mounted && colorMode === "invert" && createPortal(
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[55]"
          style={{
            backdropFilter: "invert(100%) hue-rotate(180deg)",
            WebkitBackdropFilter: "invert(100%) hue-rotate(180deg)",
          }}
        />,
        document.body
      )}

      {mounted && colorMode === "grayscale" && createPortal(
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[55]"
          style={{
            backdropFilter: "grayscale(100%)",
            WebkitBackdropFilter: "grayscale(100%)",
          }}
        />,
        document.body
      )}

      {mounted && colorMode === "sepia" && createPortal(
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[55]"
          style={{
            backdropFilter: "sepia(70%) contrast(92%)",
            WebkitBackdropFilter: "sepia(70%) contrast(92%)",
            backgroundColor: "rgba(251, 240, 217, 0.15)",
          }}
        />,
        document.body
      )}

      <div className="a11y-toolbar-root fixed bottom-6 left-6 z-[60] flex flex-col items-start sm:bottom-8 sm:left-8">
        {isOpen && (
          <div className="mb-3 flex w-[330px] sm:w-[370px] max-w-[calc(100vw-2rem)] max-h-[82vh] overflow-y-auto animate-in flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white/95 p-4 text-slate-800 shadow-2xl shadow-blue-950/20 backdrop-blur-2xl fade-in slide-in-from-bottom-5 motion-reduce:animate-none font-sans">
            {/* Header */}
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                      Aksesibilitas Pro
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 uppercase">
                      WCAG
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Kenyamanan visual, motorik &amp; audio
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-full text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                  title="Reset Semua Setelan"
                  aria-label="Reset Semua Setelan"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Tutup panel aksesibilitas"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Search Shortcut */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs bg-slate-100/90 hover:bg-blue-50 hover:text-blue-900 text-slate-700 rounded-xl transition cursor-pointer font-bold border border-slate-200/60"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs border border-slate-200/60">
                  <img
                    src="/images/3dicons/zoom-dynamic-color.png"
                    alt=""
                    width={16}
                    height={16}
                    style={{ width: 16, height: 16 }}
                    className="object-contain"
                  />
                </span>
                Cari Cepat Dokumen
              </span>
              <kbd className="px-2 py-0.5 text-[10px] bg-white border border-slate-200/90 rounded-md text-slate-500 font-mono font-bold shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Section: Ukuran & Jarak Teks */}
            <div className="space-y-2 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Penyesuaian Teks
              </span>

              {/* Ukuran Teks Scale */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs border border-slate-200/60">
                    <img
                      src="/images/3dicons/text-dynamic-color.png"
                      alt=""
                      width={14}
                      height={14}
                      style={{ width: 14, height: 14 }}
                      className="object-contain"
                    />
                  </span>
                  Ukuran Teks
                </span>
                <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={decreaseFontSize}
                    className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 rounded-lg text-xs font-black shadow-2xs transition cursor-pointer active:scale-95"
                    title="Kecilkan Font"
                    aria-label="Kecilkan Ukuran Font"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={resetFontSize}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-black shadow-2xs transition cursor-pointer active:scale-95 min-w-[42px] text-center"
                    title="Reset Ukuran"
                    aria-label="Reset Ukuran Font"
                  >
                    {Math.round(fontSizeScale * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={increaseFontSize}
                    className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 rounded-lg text-xs font-black shadow-2xs transition cursor-pointer active:scale-95"
                    title="Besarkan Font"
                    aria-label="Besarkan Ukuran Font"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Jarak Spasi Teks */}
              <button
                type="button"
                onClick={toggleTextSpacing}
                className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-xl transition font-bold cursor-pointer border ${
                  textSpacing
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200/70"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200/60">
                    <img
                      src="/images/3dicons/file-text-dynamic-color.png"
                      alt=""
                      width={14}
                      height={14}
                      style={{ width: 14, height: 14 }}
                      className="object-contain"
                    />
                  </span>
                  Spasi &amp; Jarak Baris
                </span>
                <span className="text-[10px] font-black uppercase">
                  {textSpacing ? "Renggang" : "Normal"}
                </span>
              </button>
            </div>

            {/* Section: Palet Warna & Kontras */}
            <div className="space-y-2 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Warna &amp; Kontras</span>
                <span className="text-slate-500 font-bold">{colorMode.toUpperCase()}</span>
              </span>

              <div className="grid grid-cols-5 gap-1.5">
                {colorModes.map((m) => {
                  const isActive = colorMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setColorMode(m.id)}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-black transition border text-center flex flex-col items-center gap-1 cursor-pointer ${
                        isActive
                          ? "border-blue-600 ring-2 ring-blue-500/30 bg-white shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white/70"
                      }`}
                      title={`Mode ${m.label}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs ${m.bg}`} />
                      <span className="text-slate-700 truncate w-full">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: Alat Bantu Visual & Motorik */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-1 block">
                Alat Bantu Fokus &amp; Navigasi
              </span>

              {/* Garis Pandu Baca */}
              <button
                type="button"
                onClick={toggleReadingGuide}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer border ${
                  readingGuide
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                    <img
                      src="/images/3dicons/glass-dynamic-color.png"
                      alt=""
                      width={15}
                      height={15}
                      style={{ width: 15, height: 15 }}
                      className="object-contain"
                    />
                  </span>
                  Garis Pandu Baca (Ruler)
                </span>
                <span className="text-[10px] font-black uppercase">
                  {readingGuide ? "AKTIF" : "OFF"}
                </span>
              </button>

              {/* Kursor Besar */}
              <button
                type="button"
                onClick={toggleBigCursor}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer border ${
                  bigCursor
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                    <img
                      src="/images/3dicons/target-dynamic-color.png"
                      alt=""
                      width={15}
                      height={15}
                      style={{ width: 15, height: 15 }}
                      className="object-contain"
                    />
                  </span>
                  Kursor Ekstra Besar
                </span>
                <span className="text-[10px] font-black uppercase">
                  {bigCursor ? "AKTIF" : "OFF"}
                </span>
              </button>

              {/* Sorot Tautan */}
              <button
                type="button"
                onClick={toggleHighlightLinks}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer border ${
                  highlightLinks
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                    <img
                      src="/images/3dicons/bulb-dynamic-color.png"
                      alt=""
                      width={15}
                      height={15}
                      style={{ width: 15, height: 15 }}
                      className="object-contain"
                    />
                  </span>
                  Sorot Semua Tautan Link
                </span>
                <span className="text-[10px] font-black uppercase">
                  {highlightLinks ? "AKTIF" : "OFF"}
                </span>
              </button>

              {/* Font Ramah Disleksia */}
              <button
                type="button"
                onClick={toggleDyslexiaFont}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer border ${
                  dyslexiaFont
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                    <img
                      src="/images/3dicons/notebook-dynamic-color.png"
                      alt=""
                      width={15}
                      height={15}
                      style={{ width: 15, height: 15 }}
                      className="object-contain"
                    />
                  </span>
                  Font Ramah Disleksia
                </span>
                <span className="text-[10px] font-black uppercase">
                  {dyslexiaFont ? "AKTIF" : "OFF"}
                </span>
              </button>

              {/* Hentikan Animasi */}
              <button
                type="button"
                onClick={togglePauseMotion}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition font-bold cursor-pointer border ${
                  pauseMotion
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200/60"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs border border-slate-200/60">
                    <img
                      src="/images/3dicons/flash-dynamic-color.png"
                      alt=""
                      width={15}
                      height={15}
                      style={{ width: 15, height: 15 }}
                      className="object-contain"
                    />
                  </span>
                  Hentikan Animasi / Gerakan
                </span>
                <span className="text-[10px] font-black uppercase">
                  {pauseMotion ? "AKTIF" : "OFF"}
                </span>
              </button>
            </div>

            {/* Section: Pembaca Suara */}
            <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Bantuan Audio Narasi
              </span>
              <button
                type="button"
                onClick={toggleVoiceReader}
                className={`flex items-center justify-between w-full px-3 py-2.5 text-xs rounded-xl transition font-bold cursor-pointer border ${
                  isPlayingAudio
                    ? "bg-blue-600 text-white border-blue-700 animate-pulse shadow-md shadow-blue-600/25"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200/60"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shadow-2xs border border-blue-100">
                    {isPlayingAudio ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
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
              <p className="text-[10px] text-slate-400 font-medium px-1">
                Tip: Sorot/blok teks tertentu pada halaman untuk mendengarkan bagian tersebut.
              </p>
            </div>

            {/* Footer Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-dashed border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke Setelan Normal</span>
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
    </>
  );
};
