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
  keywords: [
    "BAPPEDA Halmahera Utara",
    "Bappeda Halut",
    "Kabupaten Halmahera Utara",
    "Pemerintah Daerah Halmahera Utara",
    "Tobelo",
    "RKPD Halut",
    "RPJMD Halmahera Utara",
    "Perencanaan Pembangunan Halut",
    "GIS Halmahera Utara",
    "POPEDA Halut",
    "Satu Data Halmahera Utara",
    "Dokumen Perencanaan Daerah",
  ],
  authors: [{ name: "BAPPEDA Kabupaten Halmahera Utara", url: siteUrl }],
  creator: "BAPPEDA Kabupaten Halmahera Utara",
  publisher: "Pemerintah Kabupaten Halmahera Utara",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "GovernmentOrganization",
      "@id": `${siteUrl}/#organization`,
      name: "BAPPEDA Kabupaten Halmahera Utara",
      alternateName: "Badan Perencanaan Pembangunan Daerah Halut",
      url: siteUrl,
      logo: `${siteUrl}/images/bappeda/logo-halut.png`,
      image: `${siteUrl}/images/bappeda/default-news-cover.jpg`,
      description:
        "Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara - Mengawal Perencanaan, Membangun Masa Depan Halmahera Utara.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Jl. Kawasan Pemerintahan, Gamsungi",
        addressLocality: "Tobelo",
        addressRegion: "Maluku Utara",
        addressCountry: "ID",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Portal Resmi BAPPEDA Halmahera Utara",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/berita?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AccessibilityProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#0f172a', color: '#fff', borderRadius: '16px', fontSize: '13px', padding: '12px 18px', fontWeight: 'bold' } }} />
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
