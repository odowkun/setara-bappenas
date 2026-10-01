"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { A11yToolbar } from "@/components/accessibility/A11yToolbar";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";

export const ClientLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  // Otomatis refresh jika terjadi ChunkLoadError saat transisi navigasi pasca-deployment
  React.useEffect(() => {
    const handleChunkError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const errorMsg =
        "message" in e
          ? e.message
          : e.reason?.message || (typeof e.reason === "string" ? e.reason : "");

      if (
        typeof errorMsg === "string" &&
        (errorMsg.includes("Loading chunk") ||
          errorMsg.includes("Failed to fetch dynamically imported module") ||
          errorMsg.includes("ChunkLoadError"))
      ) {
        const storageKey = `auto_chunk_reload_${window.location.pathname}`;
        const lastReload = sessionStorage.getItem(storageKey);
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(storageKey, String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleChunkError);
    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
    };
  }, []);

  if (isDashboardRoute) {
    return <div className="flex-1 min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <SmoothScrollProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <A11yToolbar />
      <GlobalSearchModal />
    </SmoothScrollProvider>
  );
};
