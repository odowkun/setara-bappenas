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

  if (isDashboardRoute) {
    return <main className="flex-1 min-h-screen bg-slate-50">{children}</main>;
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
