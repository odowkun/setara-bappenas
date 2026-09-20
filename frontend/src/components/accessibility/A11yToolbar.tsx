"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibility } from "@/context/AccessibilityContext";

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
  const { colorMode, readingGuide } = useAccessibility();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Portal Reading Guide Ruler */}
      {mounted && readingGuide && createPortal(<ReadingGuideRuler />, document.body)}

      {/* Portal Color Filter Overlays */}
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
    </>
  );
};
