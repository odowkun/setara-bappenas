"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "@/lib/gis/leafletPatch";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, Map, Globe, Compass, Layers } from "lucide-react";

interface KmzMiniMapPreviewProps {
  geojson: any;
  color?: string;
  bounds?: [[number, number], [number, number]] | null;
  height?: string;
  className?: string;
  allowFullscreen?: boolean;
}

export default function KmzMiniMapPreview({
  geojson,
  color = "#0284c7",
  bounds,
  height = "260px",
  className = "",
  allowFullscreen = true,
}: KmzMiniMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite");

  // Tile layer URLs
  const basemapUrls = {
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    streets: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  };

  const basemapAttributions = {
    satellite: "Esri World Imagery",
    streets: "CartoDB Voyager",
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center Halmahera Utara [1.6178, 127.8584]
    const initialCenter: [number, number] = [1.6178, 127.8584];
    const initialZoom = 9;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Add minimal zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Initial tile layer (Esri Satellite)
    const tile = L.tileLayer(basemapUrls[basemap], {
      maxZoom: 19,
      attribution: basemapAttributions[basemap],
    }).addTo(map);
    tileLayerRef.current = tile;

    mapRef.current = map;

    // Invalidate size shortly after mount for perfect rendering in tabs/modals
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Switch Basemap
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const newTile = L.tileLayer(basemapUrls[basemap], {
      maxZoom: 19,
      attribution: basemapAttributions[basemap],
    }).addTo(mapRef.current);
    tileLayerRef.current = newTile;
  }, [basemap]);

  // 3. Render / Update GeoJSON Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    try {
      const layer = L.geoJSON(geojson, {
        style: (feature) => ({
          color: color,
          weight: 2.5,
          opacity: 0.95,
          fillColor: color,
          fillOpacity: 0.35,
          dashArray: feature?.geometry?.type?.includes("Line") ? "4, 6" : undefined,
        }),
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 7,
            fillColor: color,
            color: "#ffffff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          });
        },
        onEachFeature: (feature, fLayer) => {
          const props = feature.properties || {};
          const name =
            props.name ||
            props.Name ||
            props.nama ||
            props.NAMOBJ ||
            props.WADMKC ||
            props.KECAMATAN ||
            props.DESA ||
            "Objek Spasial";

          // Simple tooltip on hover
          fLayer.bindTooltip(name, {
            permanent: false,
            direction: "top",
            className: "text-xs font-bold px-2 py-1 bg-slate-900 text-white rounded shadow-md border-0",
          });

          // Rich popup on click
          let detailsHtml = `
            <div style="font-family: inherit; font-size: 11px; min-width: 170px;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
                ${name}
              </div>
              <div style="color: #64748b; margin-bottom: 3px;">
                Tipe: <strong style="color: #334155;">${feature.geometry?.type || "Geometri"}</strong>
              </div>
          `;

          // Add properties (first 4)
          const keys = Object.keys(props).filter(
            (k) => !["name", "Name", "nama", "styleUrl", "styleHash", "description"].includes(k)
          );
          if (keys.length > 0) {
            detailsHtml += `<div style="margin-top: 4px; border-top: 1px dashed #cbd5e1; padding-top: 3px;">`;
            keys.slice(0, 4).forEach((k) => {
              if (typeof props[k] === "string" || typeof props[k] === "number") {
                detailsHtml += `
                  <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 1px;">
                    <span style="color: #64748b;">${k}:</span>
                    <strong style="color: #0f172a;">${props[k]}</strong>
                  </div>`;
              }
            });
            detailsHtml += `</div>`;
          }

          detailsHtml += `</div>`;
          fLayer.bindPopup(detailsHtml);
        },
      });

      layer.addTo(map);
      geojsonLayerRef.current = layer;

      // Fit map bounds
      if (bounds) {
        map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
      } else {
        const layerBounds = layer.getBounds();
        if (layerBounds.isValid()) {
          map.fitBounds(layerBounds, { padding: [25, 25], maxZoom: 15 });
        }
      }
    } catch (e) {
      console.error("Gagal merender GeoJSON pada MiniMapPreview:", e);
    }
  }, [geojson, color, bounds]);

  // Fit bounds helper
  const handleResetBounds = () => {
    if (!mapRef.current) return;
    if (bounds) {
      mapRef.current.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
    } else if (geojsonLayerRef.current) {
      const layerBounds = geojsonLayerRef.current.getBounds();
      if (layerBounds.isValid()) {
        mapRef.current.fitBounds(layerBounds, { padding: [25, 25], maxZoom: 15 });
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        handleResetBounds();
      }
    }, 200);
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner font-sans transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl h-[calc(100vh-2rem)]" : ""
      } ${className}`}
      style={{ height: isFullscreen ? "calc(100vh - 2rem)" : height }}
    >
      {/* Map Leaflet Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 text-white shadow-md">
        <div
          className="w-3 h-3 rounded-full border border-white shadow-xs shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-bold tracking-wide">Preview Geometri</span>
      </div>

      {/* Basemap Switcher & Actions in Bottom Left */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md">
        <button
          type="button"
          onClick={() => setBasemap("satellite")}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
            basemap === "satellite"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Tampilan Citra Satelit"
        >
          <Globe className="w-3 h-3" />
          <span>Satelit</span>
        </button>
        <button
          type="button"
          onClick={() => setBasemap("streets")}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
            basemap === "streets"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Tampilan Peta Jalan & Kontur"
        >
          <Map className="w-3 h-3" />
          <span>Peta</span>
        </button>
        <button
          type="button"
          onClick={handleResetBounds}
          className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          title="Pusatkan Batas Wilayah"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fullscreen Toggle Top Right */}
      {allowFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute bottom-2.5 right-2.5 z-10 p-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white shadow-md transition cursor-pointer"
          title={isFullscreen ? "Perkecil Tampilan" : "Perbesar Peta Layar Penuh"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
