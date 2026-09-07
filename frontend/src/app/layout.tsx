import type { Metadata } from "next";
import "./globals.css";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "BAPPEDA Halmahera Utara — Smart Digital Portal & Executive Dashboard",
  description:
    "Portal resmi Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara. Informasi RKPD, RPJMD, Popeda, Esri GIS Map, & Executive Dashboard.",
  icons: {
    icon: "/images/bappeda/logo-halut.png",
    apple: "/images/bappeda/logo-halut.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AccessibilityProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#0f172a', color: '#fff', borderRadius: '16px', fontSize: '13px', padding: '12px 18px', fontWeight: 'bold' } }} />
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
