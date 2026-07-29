"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AccessibilityContextType {
  fontSizeScale: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  dyslexiaFont: boolean;
  toggleDyslexiaFont: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(
  undefined
);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-scale",
      fontSizeScale.toString()
    );
  }, [fontSizeScale]);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    if (dyslexiaFont) {
      document.body.classList.add("dyslexia-font");
    } else {
      document.body.classList.remove("dyslexia-font");
    }
  }, [dyslexiaFont]);

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

  const increaseFontSize = () => {
    setFontSizeScale((prev) => Math.min(prev + 0.15, 1.45));
  };

  const decreaseFontSize = () => {
    setFontSizeScale((prev) => Math.max(prev - 0.15, 0.85));
  };

  const resetFontSize = () => {
    setFontSizeScale(1);
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const toggleDyslexiaFont = () => {
    setDyslexiaFont((prev) => !prev);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSizeScale,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        highContrast,
        toggleHighContrast,
        dyslexiaFont,
        toggleDyslexiaFont,
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
