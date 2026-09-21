"use client";

import React, { useState, useEffect, useRef } from "react";

export interface ProgressiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  fallbackSrc = "/images/bappeda/default-news-cover.jpg",
  className = "",
  containerClassName = "relative w-full h-full overflow-hidden bg-slate-100",
  priority = false,
  ...props
}) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state if src prop changes
  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setIsLoaded(false);
    setHasError(false);
  }, [src, fallbackSrc]);

  // Viewport Intersection Observer (Pre-fetch 350px before entering viewport)
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "350px 0px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Handle cached images that are already complete in memory
  useEffect(() => {
    if (isInView && imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [isInView, imgSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    } else {
      setIsLoaded(true);
    }
  };

  return (
    <div ref={containerRef} className={containerClassName}>
      {/* Modern Shimmer Skeleton Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 w-full h-full bg-slate-200/80 animate-pulse overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
      )}

      {/* Progressive Rendered Image */}
      {isInView && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={imgSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full ${
            className.includes("object-") ? "" : "object-cover"
          } transition-all duration-700 ease-out ${
            isLoaded
              ? "opacity-100 blur-0 scale-100"
              : "opacity-0 blur-xs scale-102"
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};

export default ProgressiveImage;
