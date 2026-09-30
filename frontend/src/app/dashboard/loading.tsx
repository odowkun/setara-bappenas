import React from "react";
import DashboardLoadingScreen from "@/components/ui/DashboardLoadingScreen";

export default function DashboardLoading() {
  return (
    <DashboardLoadingScreen
      title="Menyiapkan Dashboard BAPPEDA"
      subtitle="Memuat dataset, navigasi, dan konfigurasi modul kerja kedinasan."
      statusText="Menyinkronkan data halaman..."
    />
  );
}
