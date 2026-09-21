"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Move,
  Check,
  Sparkles,
  Palette,
  Eye,
} from "lucide-react";

interface CircularImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
}

export default function CircularImageCropperModal({
  isOpen,
  imageSrc,
  fileName,
  onClose,
  onCropComplete,
}: CircularImageCropperModalProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Crop transformations
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [bgOption, setBgOption] = useState<"white" | "transparent">("white");
  const [initialScale, setInitialScale] = useState(1.0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Interaction tracking
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  const CANVAS_SIZE = 360;
  const CIRCLE_RADIUS = 145; // 290px diameter circle inside 360px viewport

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Reset states and load image when imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setImageLoaded(false);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setBgOption("white");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      // Calculate scale so image fits comfortably inside the circle (85% of circle diameter)
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
      const targetSize = CIRCLE_RADIUS * 2 * 0.88;
      const fit = targetSize / maxDim;
      setInitialScale(fit);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageLoaded(false);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Redraw canvas on state changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current || !imageLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Clear whole canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Draw background for the circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    if (bgOption === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } else {
      // Draw checkered transparency grid
      const checkSize = 12;
      for (let x = 0; x < CANVAS_SIZE; x += checkSize) {
        for (let y = 0; y < CANVAS_SIZE; y += checkSize) {
          ctx.fillStyle = ((x / checkSize + y / checkSize) % 2 === 0) ? "#f1f5f9" : "#ffffff";
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }
    }

    // 2. Draw transformed image inside circle
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2 + pan.x, CANVAS_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    const totalScale = zoom * initialScale;
    ctx.scale(totalScale, totalScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    ctx.restore(); // end circle clip

    // 3. Draw dark vignette mask for area outside the circle
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2, true);
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)"; // slate-900 75%
    ctx.fill();

    // 4. Circular border ring
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#3b82f6"; // blue-500 ring
    ctx.stroke();

    // Subtle dashed inner guide ring
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS - 1, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.stroke();

    // Subtle center crosshairs to help visual centering
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2 - 16, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE / 2 + 16, CANVAS_SIZE / 2);
    ctx.moveTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 16);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 16);
    ctx.stroke();

    ctx.restore();
  }, [bgOption, imageLoaded, initialScale, pan.x, pan.y, rotation, zoom]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0012;
    setZoom((prev) => Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  // Mobile touch handlers (drag & pinch zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.hypot(dx, dy);
      const ratio = newDistance / touchDistanceRef.current;
      touchDistanceRef.current = newDistance;
      setZoom((prev) => Math.min(3.5, Math.max(0.4, Number((prev * ratio).toFixed(2)))));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Quick alignment helpers
  const handleCenter = () => {
    setPan({ x: 0, y: 0 });
  };

  const handleFitCircle = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1.0);
  };

  const handleFillCircle = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const targetSize = CIRCLE_RADIUS * 2;
    const fillScale = targetSize / minDim;
    setZoom(fillScale / initialScale);
    setPan({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Export high-res circular cropped image
  const handleApplyCrop = () => {
    if (!imageRef.current || !imageLoaded) return;
    const img = imageRef.current;

    const EXPORT_SIZE = 512;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_SIZE;
    exportCanvas.height = EXPORT_SIZE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // 1. Clip export to circular boundary
    ctx.beginPath();
    ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // 2. Fill background
    if (bgOption === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    } else {
      ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    }

    // 3. Mapping from display circle to export circle (ratio = 256 / CIRCLE_RADIUS)
    const exportScaleRatio = (EXPORT_SIZE / 2) / CIRCLE_RADIUS;

    ctx.save();
    ctx.translate(
      EXPORT_SIZE / 2 + pan.x * exportScaleRatio,
      EXPORT_SIZE / 2 + pan.y * exportScaleRatio
    );
    ctx.rotate((rotation * Math.PI) / 180);
    const totalScale = zoom * initialScale * exportScaleRatio;
    ctx.scale(totalScale, totalScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // 4. Export as PNG file
    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const cleanName = (fileName || "logo_opd.png").replace(/\.[^/.]+$/, "") + ".png";
        const croppedFile = new File([blob], cleanName, { type: "image/png" });
        const localUrl = URL.createObjectURL(blob);
        onCropComplete(croppedFile, localUrl);
        onClose();
      },
      "image/png",
      0.95
    );
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans my-auto animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Sesuaikan Logo OPD
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                Posisikan logo agar presisi dan pas di dalam lingkaran profil
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Canvas Viewport */}
          <div className="flex flex-col items-center">
            <div
              className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner select-none touch-none cursor-grab active:cursor-grabbing"
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: "100%" }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full h-full block"
              />

              {/* Interaction Hint Badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white/90 border border-white/10 flex items-center gap-1.5 pointer-events-none">
                <Move className="w-3 h-3 text-blue-400" />
                <span>Geser logo • Scroll untuk zoom</span>
              </div>
            </div>
          </div>

          {/* Zoom Slider Control */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Skala Zoom</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-700 font-mono text-[11px] font-black">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition shrink-0 cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition shrink-0 cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Positioning & Styling Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleFitCircle}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Sesuaikan proporsional agar logo pas di dalam lingkaran"
            >
              <Minimize2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Paskan Lingkaran</span>
            </button>

            <button
              type="button"
              onClick={handleFillCircle}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Perbesar logo hingga mengisi penuh lingkaran"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Isi Penuh</span>
            </button>

            <button
              type="button"
              onClick={handleCenter}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Kembalikan posisi logo ke tengah"
            >
              <Move className="w-3.5 h-3.5 text-slate-600" />
              <span>Pusatkan</span>
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Putar logo 90 derajat searah jarum jam"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Putar 90°</span>
            </button>
          </div>

          {/* Background Option Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>Latar Belakang Lingkaran</span>
            </span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setBgOption("white")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  bgOption === "white"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Putih
              </button>
              <button
                type="button"
                onClick={() => setBgOption("transparent")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  bgOption === "transparent"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Transparan
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={!imageLoaded}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan &amp; Unggah Logo</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
