"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ColorMode = "normal" | "high-contrast" | "grayscale" | "invert" | "sepia";

interface AccessibilityContextType {
  fontSizeScale: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  dyslexiaFont: boolean;
  toggleDyslexiaFont: () => void;
  textSpacing: boolean;
  toggleTextSpacing: () => void;
  bigCursor: boolean;
  toggleBigCursor: () => void;
  readingGuide: boolean;
  toggleReadingGuide: () => void;
  highlightLinks: boolean;
  toggleHighlightLinks: () => void;
  pauseMotion: boolean;
  togglePauseMotion: () => void;
  resetAll: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(
  undefined
);

const STORAGE_KEY = "bappeda_a11y_settings";

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>("normal");
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [textSpacing, setTextSpacing] = useState(false);
  const [bigCursor, setBigCursor] = useState(false);
  const [readingGuide, setReadingGuide] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [pauseMotion, setPauseMotion] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.fontSizeScale === "number") setFontSizeScale(parsed.fontSizeScale);
        if (parsed.colorMode) setColorMode(parsed.colorMode);
        if (typeof parsed.dyslexiaFont === "boolean") setDyslexiaFont(parsed.dyslexiaFont);
        if (typeof parsed.textSpacing === "boolean") setTextSpacing(parsed.textSpacing);
        if (typeof parsed.bigCursor === "boolean") setBigCursor(parsed.bigCursor);
        if (typeof parsed.readingGuide === "boolean") setReadingGuide(parsed.readingGuide);
        if (typeof parsed.highlightLinks === "boolean") setHighlightLinks(parsed.highlightLinks);
        if (typeof parsed.pauseMotion === "boolean") setPauseMotion(parsed.pauseMotion);
      }
    } catch (e) {
      console.warn("Gagal memuat preferensi aksesibilitas:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Save preferences to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fontSizeScale,
          colorMode,
          dyslexiaFont,
          textSpacing,
          bigCursor,
          readingGuide,
          highlightLinks,
          pauseMotion,
        })
      );
    } catch (e) {
      console.warn("Gagal menyimpan preferensi aksesibilitas:", e);
    }
  }, [
    isLoaded,
    fontSizeScale,
    colorMode,
    dyslexiaFont,
    textSpacing,
    bigCursor,
    readingGuide,
    highlightLinks,
    pauseMotion,
  ]);

  // 3. Apply DOM Effects
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-scale",
      fontSizeScale.toString()
    );
  }, [fontSizeScale]);

  useEffect(() => {
    const classList = document.body.classList;
    classList.remove("high-contrast", "a11y-grayscale", "a11y-invert", "a11y-sepia");

    if (colorMode === "high-contrast") {
      classList.add("high-contrast");
    } else if (colorMode === "grayscale") {
      classList.add("a11y-grayscale");
    } else if (colorMode === "invert") {
      classList.add("a11y-invert");
    } else if (colorMode === "sepia") {
      classList.add("a11y-sepia");
    }
  }, [colorMode]);

  useEffect(() => {
    document.body.classList.toggle("dyslexia-font", dyslexiaFont);
  }, [dyslexiaFont]);

  useEffect(() => {
    document.body.classList.toggle("a11y-text-spacing", textSpacing);
  }, [textSpacing]);

  useEffect(() => {
    document.body.classList.toggle("a11y-big-cursor", bigCursor);
  }, [bigCursor]);

  useEffect(() => {
    document.body.classList.toggle("a11y-highlight-links", highlightLinks);
  }, [highlightLinks]);

  useEffect(() => {
    document.body.classList.toggle("a11y-pause-motion", pauseMotion);
  }, [pauseMotion]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handlers
  const increaseFontSize = () => {
    setFontSizeScale((prev) => Math.min(Math.round((prev + 0.15) * 100) / 100, 1.45));
  };

  const decreaseFontSize = () => {
    setFontSizeScale((prev) => Math.max(Math.round((prev - 0.15) * 100) / 100, 0.85));
  };

  const resetFontSize = () => {
    setFontSizeScale(1);
  };

  const highContrast = colorMode === "high-contrast";
  const toggleHighContrast = () => {
    setColorMode((prev) => (prev === "high-contrast" ? "normal" : "high-contrast"));
  };

  const toggleDyslexiaFont = () => setDyslexiaFont((prev) => !prev);
  const toggleTextSpacing = () => setTextSpacing((prev) => !prev);
  const toggleBigCursor = () => setBigCursor((prev) => !prev);
  const toggleReadingGuide = () => setReadingGuide((prev) => !prev);
  const toggleHighlightLinks = () => setHighlightLinks((prev) => !prev);
  const togglePauseMotion = () => setPauseMotion((prev) => !prev);

  const resetAll = () => {
    setFontSizeScale(1);
    setColorMode("normal");
    setDyslexiaFont(false);
    setTextSpacing(false);
    setBigCursor(false);
    setReadingGuide(false);
    setHighlightLinks(false);
    setPauseMotion(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSizeScale,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        colorMode,
        setColorMode,
        highContrast,
        toggleHighContrast,
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
        isSearchOpen,
        setIsSearchOpen,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
};
