"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      <AdminSidebar />

      {/* Main Content Area — Strict Inner Scroll on Center Body */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-y-auto">
          {children}
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
