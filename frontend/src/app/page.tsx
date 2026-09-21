import { HeroSection } from "@/components/home/HeroSection";
import { GeospatialSection } from "@/components/home/GeospatialSection";
import { LatestNewsCarousel } from "@/components/home/LatestNewsCarousel";
import { GalleryGrid } from "@/components/home/GalleryGrid";
import { OpdLinksGrid } from "@/components/home/OpdLinksGrid";
import { SatisfactionSurvey } from "@/components/home/SatisfactionSurvey";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function Home() {
  return (
    <div className="space-y-0 overflow-x-hidden w-full max-w-full">
      {/* 1. Hero Opening Presentation */}
      <HeroSection />

      {/* 2. Geospatial + Map Section */}
      <ScrollReveal direction="up" delay={0.1}>
        <GeospatialSection />
      </ScrollReveal>

      {/* 3. Tautan OPD & Aplikasi Terkait */}
      <ScrollReveal direction="up" delay={0.1}>
        <OpdLinksGrid />
      </ScrollReveal>

      {/* 4. Latest News Carousel */}
      <ScrollReveal direction="up" delay={0.1}>
        <LatestNewsCarousel />
      </ScrollReveal>

      {/* 5. Gallery Grid */}
      <ScrollReveal direction="up" delay={0.1}>
        <GalleryGrid />
      </ScrollReveal>

      {/* 6. Indeks Kepuasan Masyarakat */}
      <ScrollReveal direction="up" delay={0.1}>
        <SatisfactionSurvey />
      </ScrollReveal>
    </div>
  );
}
