import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://bappeda.halmaherautarakab.go.id"
  ).replace(/\/+$/, "");

  const currentDate = new Date().toISOString();

  // Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/profil/tentang`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/profil/visi-misi`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/profil/tugas-fungsi`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/profil/struktur`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/profil/dasar-hukum`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/profil/sejarah`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/dokumen`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/berita`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/pengumuman`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/agenda`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/infografis`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/galeri`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/gis-peta`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/kritik-saran`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/survey-kepuasan`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamically fetch published news articles to include in sitemap
  let dynamicNewsRoutes: MetadataRoute.Sitemap = [];
  try {
    const backendUrls = [
      process.env.INTERNAL_API_URL,
      process.env.NEXT_PUBLIC_API_BASE_URL,
      "http://127.0.0.1:8100/api/v1",
      "http://127.0.0.1:8000/api/v1",
      "https://bappeda.halmaherautarakab.go.id/api/v1",
    ].filter(Boolean) as string[];

    for (const rawBase of backendUrls) {
      try {
        const base = rawBase.replace(/\/+$/, "");
        const cleanBase = base.endsWith("/api") ? `${base}/v1` : base;
        const res = await fetch(`${cleanBase}/news?per_page=100`, {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json.data) ? json.data : json.data?.data || [];
          if (items.length > 0) {
            dynamicNewsRoutes = items.map((item: { slug?: string; id?: number | string; updated_at?: string; created_at?: string }) => ({
              url: `${siteUrl}/berita/${item.slug || item.id}`,
              lastModified: item.updated_at || item.created_at || currentDate,
              changeFrequency: "weekly" as const,
              priority: 0.7,
            }));
            break;
          }
        }
      } catch {
        // Fallback to next backend URL
      }
    }
  } catch {
    // Graceful fallback to static routes
  }

  return [...staticRoutes, ...dynamicNewsRoutes];
}
