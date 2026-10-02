import type { Metadata } from "next";
import { NewsDetailClient } from "./NewsDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const backendUrls = [
    process.env.INTERNAL_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    "http://127.0.0.1:8100/api/v1",
    "http://127.0.0.1:8000/api/v1",
    "http://localhost:8000/api/v1",
    "https://bappeda.halmaherautarakab.go.id/api/v1",
  ].filter(Boolean) as string[];

  for (const rawBase of backendUrls) {
    try {
      const base = rawBase.replace(/\/+$/, "");
      const cleanBase = base.endsWith("/api") ? `${base}/v1` : base;
      const url = `${cleanBase}/news/${slug}`;
      const res = await fetch(url, {
        next: { revalidate: 60 },
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Try next endpoint fallback
    }
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://bappeda.halmaherautarakab.go.id"
  ).replace(/\/+$/, "");

  if (!article) {
    return {
      title: "Berita Daerah — BAPPEDA Halmahera Utara",
      description: "Portal Berita & Publikasi Resmi BAPPEDA Kabupaten Halmahera Utara",
    };
  }

  // Extract clean plain text for social media snippet (max 170 chars)
  let description = article.summary || "";
  if (!description && article.content) {
    description = article.content
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (description.length > 170) {
    description = description.substring(0, 167) + "...";
  }

  // Generate fully qualified absolute URL for WhatsApp / social crawlers
  let imageUrl = article.image || "";
  if (!imageUrl) {
    imageUrl = `${siteUrl}/images/bappeda/default-news-cover.jpg`;
  } else if (imageUrl.startsWith("/")) {
    imageUrl = `${siteUrl}${imageUrl}`;
  } else if (!imageUrl.startsWith("http")) {
    imageUrl = `${siteUrl}/${imageUrl}`;
  }

  const pageUrl = `${siteUrl}/berita/${slug}`;

  return {
    title: `${article.title} — BAPPEDA Halmahera Utara`,
    description: description || "Portal Berita & Publikasi Resmi BAPPEDA Kabupaten Halmahera Utara",
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: article.title,
      description: description || "Portal Berita & Publikasi Resmi BAPPEDA Kabupaten Halmahera Utara",
      url: pageUrl,
      siteName: "BAPPEDA Kabupaten Halmahera Utara",
      locale: "id_ID",
      type: "article",
      publishedTime: article.date || article.created_at,
      authors: [article.author || "BAPPEDA Halmahera Utara"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: description || "Portal Berita & Publikasi Resmi BAPPEDA Kabupaten Halmahera Utara",
      images: [imageUrl],
    },
  };
}

export default async function PublicNewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  return <NewsDetailClient initialArticle={article} slug={slug} />;
}
