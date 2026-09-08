"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

function PageTransitionContainer({
  children,
  isNavigating,
  progress,
}: {
  children: React.ReactNode;
  isNavigating: boolean;
  progress: number;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-full flex-1 flex flex-col">
      {/* Top Animated Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
          <div
            className="h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 shadow-md shadow-blue-500/50 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Solid Inner Body Loading Screen — Perfectly Scoped to Main Body & Dead Center */}
      {isNavigating && (
        <div className="fixed top-16 left-0 md:left-64 right-0 bottom-0 z-[2000] bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl flex flex-col items-center justify-center gap-3.5 max-w-sm w-full text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Smooth 0-100% Percentage Counter Box */}
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs shrink-0">
              <span className="text-sm font-black font-mono tracking-tight text-blue-700">
                {Math.min(100, Math.max(0, Math.round(progress)))}%
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">Sedang Memuat Data...</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Menyinkronkan halaman & dataset terbaru.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Smooth Fade-In Page Shell */}
      <div key={pathname} className="animate-in fade-in duration-300 ease-in-out flex-1">
        {children}
      </div>
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Instant navigation feedback states
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset navigation states on pathname change
  useEffect(() => {
    setPendingPath(null);
    setIsNavigating(true);
    setProgress(15);

    const t1 = setTimeout(() => setProgress(45), 60);
    const t2 = setTimeout(() => setProgress(78), 140);
    const t3 = setTimeout(() => setProgress(96), 240);
    const t4 = setTimeout(() => setProgress(100), 320);
    const t5 = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [pathname]);

  // Intercept anchor link clicks for instant 0ms sidebar highlight & loader overlay
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        const targetPath = new URL(anchor.href).pathname;
        if (targetPath !== window.location.pathname) {
          setPendingPath(targetPath);
          setIsNavigating(true);
          setProgress(25);
        }
      }
    };

    window.addEventListener("click", handleAnchorClick);
    return () => window.removeEventListener("click", handleAnchorClick);
  }, []);

  const handleSidebarNavigate = (href: string) => {
    if (href !== pathname) {
      setPendingPath(href);
      setIsNavigating(true);
      setProgress(25);
    }
  };

  // If on login page, render clean full screen Light Mode page without sidebar/header
  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  // Guard: Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      router.push("/dashboard/login");
    }
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-700">Mengarahkan ke Login Dashboard SPBE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans overflow-hidden">
      <AdminSidebar
        pendingPath={pendingPath}
        onNavigate={handleSidebarNavigate}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area — Strict Inner Scroll on Center Body */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto relative">
          <PageTransitionContainer isNavigating={isNavigating} progress={progress}>
            {children}
          </PageTransitionContainer>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
