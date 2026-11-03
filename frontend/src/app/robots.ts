import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://bappeda.halmaherautarakab.go.id"
  ).replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/images/", "/favicon.ico", "/icon.png", "/apple-icon.png"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

