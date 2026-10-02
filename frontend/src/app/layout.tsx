import type { Metadata } from "next";
import "./globals.css";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper";
import { Toaster } from "react-hot-toast";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bappeda.halmaherautarakab.go.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BAPPEDA Halmahera Utara — Smart Digital Portal & Executive Dashboard",
    template: "%s | BAPPEDA Halmahera Utara",
  },
  description:
    "Portal resmi Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara. Informasi RKPD, RPJMD, Popeda, Esri GIS Map, & Executive Dashboard.",
  openGraph: {
    title: "BAPPEDA Halmahera Utara — Smart Digital Portal & Executive Dashboard",
    description:
      "Portal resmi Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara. Informasi RKPD, RPJMD, Popeda, Esri GIS Map, & Executive Dashboard.",
    url: siteUrl,
    siteName: "BAPPEDA Kabupaten Halmahera Utara",
    images: [
      {
        url: "/images/bappeda/default-news-cover.jpg",
        width: 1200,
        height: 630,
        alt: "BAPPEDA Kabupaten Halmahera Utara",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BAPPEDA Halmahera Utara — Smart Digital Portal & Executive Dashboard",
    description:
      "Portal resmi Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara. Informasi RKPD, RPJMD, Popeda, Esri GIS Map, & Executive Dashboard.",
    images: ["/images/bappeda/default-news-cover.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/bappeda/favicon-bappeda.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
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
