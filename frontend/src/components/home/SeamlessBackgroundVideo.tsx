"use client";

import React, { useRef, useState, useEffect } from "react";

interface SeamlessBackgroundVideoProps {
  srcWebm: string;
  srcMp4?: string;
  className?: string;
  crossfadeDurationSec?: number; // default 1.5s
}

export const SeamlessBackgroundVideo: React.FC<SeamlessBackgroundVideoProps> = ({
  srcWebm,
  srcMp4,
  className = "w-full h-full object-cover scale-105",
  crossfadeDurationSec = 1.5,
}) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  // activeVideo: 1 or 2
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Start Video 1 on mount
    if (video1Ref.current) {
      video1Ref.current.currentTime = 0;
      video1Ref.current.play().catch(() => {});
    }
  }, []);

  const handleTimeUpdate = (videoNum: 1 | 2) => {
    const currentVideo = videoNum === 1 ? video1Ref.current : video2Ref.current;
    const nextVideo = videoNum === 1 ? video2Ref.current : video1Ref.current;

    if (!currentVideo || !nextVideo) return;

    const remainingTime = currentVideo.duration - currentVideo.currentTime;

    // Trigger crossfade when remaining time is less than crossfadeDurationSec
    if (remainingTime <= crossfadeDurationSec && activeVideo === videoNum && !isTransitioning) {
      setIsTransitioning(true);
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => {});
      setActiveVideo(videoNum === 1 ? 2 : 1);
    }
  };

  const handleEnded = (videoNum: 1 | 2) => {
    const endedVideo = videoNum === 1 ? video1Ref.current : video2Ref.current;
    if (endedVideo) {
      endedVideo.pause();
      endedVideo.currentTime = 0;
    }
    setIsTransitioning(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Video Layer 1 */}
      <video
        ref={video1Ref}
        muted
        playsInline
        onTimeUpdate={() => handleTimeUpdate(1)}
        onEnded={() => handleEnded(1)}
        className={`absolute inset-0 ${className} transition-opacity duration-1000 ease-in-out ${
          activeVideo === 1 ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
      >
        <source src={srcWebm} type="video/webm" />
        {srcMp4 && <source src={srcMp4} type="video/mp4" />}
      </video>

      {/* Video Layer 2 */}
      <video
        ref={video2Ref}
        muted
        playsInline
        onTimeUpdate={() => handleTimeUpdate(2)}
        onEnded={() => handleEnded(2)}
        className={`absolute inset-0 ${className} transition-opacity duration-1000 ease-in-out ${
          activeVideo === 2 ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
      >
        <source src={srcWebm} type="video/webm" />
        {srcMp4 && <source src={srcMp4} type="video/mp4" />}
      </video>
    </div>
  );
};
