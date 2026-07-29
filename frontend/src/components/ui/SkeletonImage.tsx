"use client";

import React, { useState, useEffect, useRef } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  src,
  alt,
  className = "",
  containerClassName = "absolute inset-0 w-full h-full",
  ...props
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer to Trigger Download 250px Before Scrolling into View
  useEffect(() => {
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
      {
        rootMargin: "250px 0px", // Pre-fetch 250px before entering viewport
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  // Check if image is already cached when in view
  useEffect(() => {
    if (isInView && imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [isInView, src]);

  const isAbsolute = containerClassName.includes("absolute");
  const basePosition = isAbsolute ? "" : "relative";

  return (
    <div
      ref={containerRef}
      className={`${basePosition} overflow-hidden bg-slate-100 ${containerClassName}`}
    >
      {/* Industry Standard react-loading-skeleton Wave Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 pointer-events-none w-full h-full">
          <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f8fafc">
            <Skeleton containerClassName="w-full h-full block" className="w-full h-full block leading-none" />
          </SkeletonTheme>
        </div>
      )}

      {/* Actual Image Element (Only loaded when scrolled near view) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 w-full h-full object-cover ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};
