"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CheckCircle,
  Shield,
  Layers,
  Plus,
  Minus,
  Globe,
  Check,
} from "lucide-react";
import halutOfficialBpsBoundary from "@/data/halut-boundary.json";
import { proyekService } from "@/services/proyekService";
import { STORAGE_BASE_URL } from "@/lib/apiClient";

// Fix Leaflet Default Icon asset paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface ProjectLocation {
  id: number;
  name: string;
  kecamatan: string;
  category: string;
  desc: string;
  peran: string;
  koordinat: string;
  lat: number;
  lng: number;
  status: string;
  image?: string;
  images?: any[];
  documents?: any[];
  attachments?: any[];
  budget?: string;
  progress?: number;
  contractor?: string;
  [key: string]: any;
}

interface EsriLeafletMapProps {
  locations: ProjectLocation[];
  selectedId: number | null;
  onSelectLocation: (id: number | null) => void;
  onOpenAlbum?: (loc: ProjectLocation, index?: number) => void;
  customGeoJsonLayer?: any;
  customLayerColor?: string;
  customBoundaryGeoJson?: any;
}

export const EsriLeafletMap: React.FC<EsriLeafletMapProps> = ({
  locations,
  selectedId,
  onSelectLocation,
  onOpenAlbum,
  customGeoJsonLayer,
  customLayerColor = "#7c3aed",
  customBoundaryGeoJson,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const customKmzLayerRef = useRef<L.GeoJSON | null>(null);

  const [mapType, setMapType] = useState<"esriSatellite" | "esriTopo" | "googleHybrid" | "googleStreet">("esriSatellite");
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(8);
  const [minZoomLevel, setMinZoomLevel] = useState<number>(8);

  useEffect(() => {
    proyekService.getBufferAnalyses().then(setSavedAnalyses);
  }, []);

  // Tile Layer Providers (Esri ArcGIS Engine & Google Maps Endpoints)
  const tileProviders = {
    esriSatellite: {
      name: "Esri Satelit HD",
      desc: "Citra Satelit High Definition Esri",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
    esriTopo: {
      name: "Esri Topografi",
      desc: "Kontur & Ketinggian Wilayah Esri",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), swisstopo, MapmyIndia, &copy; OpenStreetMap contributors",
    },
    googleHybrid: {
      name: "Google Satelit + Batas",
      desc: "Citra Satelit & Batas Resmi Google Maps",
      url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps",
    },
    googleStreet: {
      name: "Google Maps Jalan",
      desc: "Peta Vektor & Transportasi Google",
      url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps",
    },
  };

  // Helper to create sleek, compact, non-cluttering Leaflet Marker Icons
  const createCompactMarkerIcon = (index: number, isSelected: boolean, zoomLevel: number) => {
    const isZoomedOut = zoomLevel <= 9.5;
    
    // Size logic: tiny when zoomed out, highlighted when selected
    const size = isSelected ? 28 : isZoomedOut ? 16 : 20;
    const pinBg = isSelected ? "#1d4ed8" : "#2563eb";
    const borderColor = isSelected ? "#fbbf24" : "#ffffff";
    const shadowStyle = isSelected
      ? "box-shadow: 0 0 16px rgba(251, 191, 36, 0.95), 0 6px 14px rgba(0,0,0,0.4);"
      : "box-shadow: 0 2px 6px rgba(0,0,0,0.3);";

    return L.divIcon({
      className: `custom-marker-icon-${index}`,
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          transition: all 0.2s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 9999px;
            background-color: ${pinBg};
            border: ${isSelected ? "2.5px" : "1.5px"} solid ${borderColor};
            ${shadowStyle}
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? "14" : isZoomedOut ? "9" : "10"}" height="${isSelected ? "14" : isZoomedOut ? "9" : "10"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Function to Zoom Out & Fit Full Official Halmahera Utara Boundary Region
  const fitHalutBounds = () => {
    if (!mapInstanceRef.current || !boundaryLayerRef.current) return;
    try {
      const bounds = boundaryLayerRef.current.getBounds();
      if (bounds.isValid()) {
        const targetMinZoom = mapInstanceRef.current.getBoundsZoom(bounds, false, L.point(35, 35));
        mapInstanceRef.current.setMinZoom(targetMinZoom);
        setMinZoomLevel(targetMinZoom);
        mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35] });
      } else {
        mapInstanceRef.current.setMinZoom(8);
        setMinZoomLevel(8);
        mapInstanceRef.current.setView([1.6178, 127.8584], 8);
      }
    } catch {
      mapInstanceRef.current.setMinZoom(8);
      setMinZoomLevel(8);
      mapInstanceRef.current.setView([1.6178, 127.8584], 8);
    }
  };

  // Helper to render GeoJSON Layer with Red Dashed Official Style
  const renderBoundaryLayer = (map: L.Map, geojsonData: any) => {
    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
    }

    const layer = L.geoJSON(geojsonData, {
      style: {
        color: "#ef4444", // Red-Orange boundary line matching BPS & Kemendagri official boundary
        weight: 2,
        opacity: 0.9,
        dashArray: "3, 3",
        fillColor: "#ef4444",
        fillOpacity: 0.04,
      },
      onEachFeature: (feature, l) => {
        l.bindPopup(`
          <div style="font-family: var(--font-sans), sans-serif; padding: 4px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 99px;">Batas Resmi BPS / Permendagri No. 137</span>
            <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 6px; margin-bottom: 2px;">Kabupaten Halmahera Utara</h4>
            <p style="font-size: 11px; color: #475569; margin: 0;">Ibu Kota: Tobelo • Luas: 3.891,62 km²</p>
          </div>
        `);
      },
    }).addTo(map);

    layer.bringToFront();
    boundaryLayerRef.current = layer;

    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        const targetMinZoom = map.getBoundsZoom(bounds, false, L.point(35, 35));
        map.setMinZoom(targetMinZoom);
        setMinZoomLevel(targetMinZoom);
        map.setMaxBounds(bounds.pad(0.6));
      }
    } catch {}

    setTimeout(() => {
      fitHalutBounds();
    }, 200);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [1.6178, 127.8584],
      zoom: 8,
      minZoom: 8,
      maxZoom: 19,
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    const currentProvider = tileProviders[mapType];
    const initialTileLayer = L.tileLayer(currentProvider.url, {
      minZoom: 8,
      maxZoom: 19,
      attribution: currentProvider.attribution,
    }).addTo(map);

    tileLayerRef.current = initialTileLayer;
    mapInstanceRef.current = map;

    // Render Exact Official BPS / Kemendagri Boundary Layer (or Custom uploaded boundary)
    renderBoundaryLayer(map, customBoundaryGeoJson || halutOfficialBpsBoundary);

    const invalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        if (boundaryLayerRef.current) {
          try {
            const bounds = boundaryLayerRef.current.getBounds();
            if (bounds.isValid()) {
              const targetMinZoom = mapInstanceRef.current.getBoundsZoom(bounds, false, L.point(35, 35));
              mapInstanceRef.current.setMinZoom(targetMinZoom);
              setMinZoomLevel(targetMinZoom);
            }
          } catch {}
        }
      }
    };

    invalidate();
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => invalidate());
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Re-render boundary if custom boundary changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    renderBoundaryLayer(mapInstanceRef.current, customBoundaryGeoJson || halutOfficialBpsBoundary);
  }, [customBoundaryGeoJson]);

  const bufferLayerRef = useRef<L.LayerGroup | null>(null);

  // Render custom KMZ/GeoJSON Layer when provided
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (customKmzLayerRef.current) {
      customKmzLayerRef.current.remove();
      customKmzLayerRef.current = null;
    }

    if (customGeoJsonLayer) {
      try {
        const geoJsonLayer = L.geoJSON(customGeoJsonLayer, {
          style: (feature) => ({
            color: customLayerColor,
            fillColor: customLayerColor,
            fillOpacity: 0.35,
            weight: 3,
          }),
          onEachFeature: (feature, layer) => {
            if (feature.properties && (feature.properties.name || feature.properties.description)) {
              layer.bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
                  <strong style="color: ${customLayerColor};">${feature.properties.name || "Objek Spasial"}</strong>
                  ${feature.properties.description ? `<p style="margin-top: 4px; color: #475569;">${feature.properties.description}</p>` : ""}
                </div>
              `);
            }
          },
        }).addTo(map);

        customKmzLayerRef.current = geoJsonLayer;

        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (err) {
        console.error("Error rendering custom GeoJSON layer:", err);
      }
    }
  }, [customGeoJsonLayer, customLayerColor]);

  // Render & Update Markers + Geoprocessing Buffer Circle Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Remove old buffer layers
    if (bufferLayerRef.current) {
      bufferLayerRef.current.clearLayers();
    } else {
      bufferLayerRef.current = L.layerGroup().addTo(map);
    }

    const DEFAULT_BAPPEDA_PROYEK_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="50%" stop-color="#172554"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="800" height="400" rx="32" fill="url(#bg)"/><g transform="translate(400, 140)" text-anchor="middle"><circle cx="0" cy="0" r="42" fill="none" stroke="#f59e0b" stroke-width="6"/><ellipse cx="0" cy="0" rx="20" ry="42" fill="none" stroke="#f59e0b" stroke-width="5"/><line x1="-42" y1="0" x2="42" y2="0" stroke="#f59e0b" stroke-width="5"/><line x1="-36" y1="-20" x2="36" y2="-20" stroke="#f59e0b" stroke-width="4"/><line x1="-36" y1="20" x2="36" y2="20" stroke="#f59e0b" stroke-width="4"/><text x="0" y="105" font-family="sans-serif" font-size="32" font-weight="900" fill="#ffffff" letter-spacing="-0.5">Kabupaten Halmahera Utara</text><text x="0" y="145" font-family="sans-serif" font-size="20" font-weight="700" fill="#fbbf24">Ibu Kota: Tobelo • 4.951,61 km²</text></g></svg>`
    )}`;

    // Coordinate counter for overlapping jitter offset
    const coordCounts: Record<string, number> = {};

    locations.forEach((loc, index) => {
      const isSelected = loc.id === selectedId;
      const coordKey = `${loc.lat.toFixed(4)}_${loc.lng.toFixed(4)}`;
      const count = coordCounts[coordKey] || 0;
      coordCounts[coordKey] = count + 1;

      // Small spiral offset for duplicate coordinates (approx 20-30 meters) so all points are distinct
      let lat = loc.lat;
      let lng = loc.lng;
      if (count > 0) {
        const angle = count * ((2 * Math.PI) / 5);
        const radius = 0.00035 * Math.ceil(count / 5);
        lat = loc.lat + radius * Math.cos(angle);
        lng = loc.lng + radius * Math.sin(angle);
      }

      const initialZoom = map.getZoom();
      const markerIcon = createCompactMarkerIcon(index, isSelected, initialZoom);
      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

      // Check if there is a Geoprocessing Buffer Analysis saved for this project
      const geoAnalysis = savedAnalyses.find((g: any) => {
        if (!g) return false;
        return String(g.proyek_detail_id) === String((loc as any).realId || loc.id);
      });

      // Draw Buffer Circle Overlay on Map if available
      if (geoAnalysis && bufferLayerRef.current) {
        const radMeters = Number(geoAnalysis.radius_meters) || 1500;
        const strokeColor = geoAnalysis.color || "#7c3aed";

        // Always render a crisp Leaflet Circle Overlay on the map
        L.circle([loc.lat, loc.lng], {
          radius: radMeters,
          color: strokeColor,
          fillColor: strokeColor,
          fillOpacity: isSelected ? 0.28 : 0.18,
          weight: isSelected ? 3.5 : 2,
          dashArray: "6, 6",
        }).addTo(bufferLayerRef.current);
      }

      const rawImgUrl = loc.image && loc.image.trim() !== "" ? loc.image : DEFAULT_BAPPEDA_PROYEK_SVG;
      const imgUrl = rawImgUrl.startsWith("/storage/") ? `${STORAGE_BASE_URL}${rawImgUrl}` : rawImgUrl;
      const mediaCount = loc.images?.length || (loc.image ? 1 : 0);

      const photoHtml = `<div class="popup-photo-trigger" style="position: relative; width: 100%; height: 115px; border-radius: 12px; overflow: hidden; margin-top: 8px; margin-bottom: 8px; background: #0f172a; cursor: pointer;">
            <img src="${imgUrl}" alt="${loc.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='${DEFAULT_BAPPEDA_PROYEK_SVG}';" />
            <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(15, 23, 42, 0.9); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.5); padding: 3px 8px; border-radius: 8px; font-size: 9.5px; font-weight: 800; display: flex; align-items: center; gap: 4px;">📸 Lihat Album (${mediaCount})</span>
           </div>`;

      const bufferInfoHtml = geoAnalysis
        ? `<div style="margin-top: 6px; padding: 6px 8px; background: #f3e8ff; border: 1px solid #d8b4fe; border-radius: 8px; font-size: 10px; font-weight: 800; color: #6b21a8; display: flex; align-items: center; justify-content: space-between;">
            <span>⭕ Analisis Geoprocessing:</span>
            <span style="background: #7c3aed; color: #ffffff; padding: 1px 6px; border-radius: 99px;">${
              geoAnalysis.radius_meters >= 1000 ? `${(geoAnalysis.radius_meters / 1000).toFixed(1)} km` : `${geoAnalysis.radius_meters} m`
            }</span>
           </div>`
        : "";

      const sharedCoordHtml = count > 0
        ? `<div style="margin-top: 4px; font-size: 9px; font-weight: 800; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 6px; text-align: center;">
            📍 Titik Bersama (Proyek Spasial Ke-${count + 1})
           </div>`
        : "";

      const progressHtml = loc.progress !== undefined
        ? `<div style="margin-top: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 2px;">
              <span>Progres Fisik</span>
              <span style="color: #1d4ed8; font-weight: 800;">${loc.progress}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
              <div style="width: ${loc.progress}%; height: 100%; background: #2563eb; border-radius: 99px;"></div>
            </div>
           </div>`
        : "";

      marker.bindPopup(`
        <div style="font-family: var(--font-sans), sans-serif; padding: 2px; width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 99px;">${loc.category} • ${loc.kecamatan}</span>
          </div>
          ${sharedCoordHtml}
          <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 4px; margin-bottom: 2px; line-height: 1.3;">${loc.name}</h4>
          ${photoHtml}
          <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.35;">${loc.desc}</p>
          ${bufferInfoHtml}
          ${progressHtml}
          ${loc.budget ? `<div style="font-size: 10px; font-weight: 800; color: #1e40af; margin-top: 6px; padding-top: 4px; border-top: 1px solid #f1f5f9;">Pagu Anggaran: ${loc.budget}</div>` : ""}
        </div>
      `);

      marker.on("popupopen", () => {
        const popup = marker.getPopup();
        if (popup) {
          const el = popup.getElement();
          if (el) {
            const trigger = el.querySelector(".popup-photo-trigger");
            if (trigger && onOpenAlbum) {
              trigger.addEventListener("click", () => {
                onOpenAlbum(loc);
              });
            }
          }
        }
      });

      marker.on("click", () => {
        onSelectLocation(loc.id);
      });

      markersRef.current[loc.id] = marker;
    });

    // Handle Zoom End to Dynamically Update Marker Scale & Zoom Tracker
    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      locations.forEach((loc, index) => {
        const marker = markersRef.current[loc.id];
        if (marker) {
          const isSelected = loc.id === selectedId;
          marker.setIcon(createCompactMarkerIcon(index, isSelected, zoom));
        }
      });
    };

    map.on("zoomend", handleZoomEnd);

    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [locations, selectedId, savedAnalyses]);

  // Update Basemap Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const currentProvider = tileProviders[mapType];
    const newLayer = L.tileLayer(currentProvider.url, {
      minZoom: minZoomLevel,
      maxZoom: 19,
      attribution: currentProvider.attribution,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;

    if (boundaryLayerRef.current && showBoundary) {
      boundaryLayerRef.current.bringToFront();
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  }, [mapType]);

  // Toggle Boundary Layer Visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !boundaryLayerRef.current) return;
    if (showBoundary) {
      boundaryLayerRef.current.addTo(mapInstanceRef.current);
      boundaryLayerRef.current.bringToFront();
    } else {
      boundaryLayerRef.current.remove();
    }
  }, [showBoundary]);

  // Pan / Fly to selected location & update marker sizes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const currentZoom = mapInstanceRef.current.getZoom();

    locations.forEach((loc, index) => {
      const marker = markersRef.current[loc.id];
      if (marker) {
        const isSelected = loc.id === selectedId;
        marker.setIcon(createCompactMarkerIcon(index, isSelected, currentZoom));
        if (isSelected) {
          marker.setZIndexOffset(1000);
        } else {
          marker.setZIndexOffset(0);
        }
      }
    });

    if (selectedId === null) {
      fitHalutBounds();
      return;
    }

    const targetLoc = locations.find((l) => l.id === selectedId);
    if (targetLoc) {
      mapInstanceRef.current.flyTo([targetLoc.lat, targetLoc.lng], 13, {
        duration: 1.2,
      });

      const marker = markersRef.current[selectedId];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedId, locations]);

  // Manual Zoom Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current && currentZoom < 19) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current && currentZoom > minZoomLevel) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-[24px] overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      {/* Container for Leaflet Map */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full min-h-[480px] z-10" />

      {/* TOP LEFT FLOATING BAR: Reset Zoom Action Button */}
      <div className="absolute top-4 left-4 z-[400]">
        <button
          onClick={() => {
            onSelectLocation(null);
            fitHalutBounds();
          }}
          className="px-3.5 py-2 rounded-full bg-blue-950/90 hover:bg-blue-900 text-white font-extrabold text-xs shadow-xl backdrop-blur-md transition flex items-center gap-1.5 border border-amber-400/40 cursor-pointer"
          title="Zoom Out ke Seluruh Wilayah Halmahera Utara"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" /> Lihat Seluruh Halut
        </button>
      </div>

      {/* TOP RIGHT FLOATING TOOLBAR: Combined Basemap Popover & Boundary Icon Toggle */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
        
        {/* Sleek Basemap Popover Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="p-2.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 hover:text-blue-700 border border-slate-200 shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            title="Pilih Jenis Peta / Basemap"
          >
            <Layers className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold px-1 hidden sm:inline">{tileProviders[mapType].name}</span>
          </button>

          {/* Floating Popover Menu */}
          {showLayerMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl p-2 shadow-2xl border border-slate-200 z-[500] space-y-1 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Pilih Tampilan Basemap
              </div>
              {(["esriSatellite", "esriTopo", "googleHybrid", "googleStreet"] as const).map((key) => {
                const isSelected = mapType === key;
                const item = tileProviders[key];

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setMapType(key);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border border-blue-200 text-blue-900 font-extrabold"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <div>
                      <div className="text-xs">{item.name}</div>
                      <div className="text-[9px] text-slate-400">{item.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Boundary Icon Button Only */}
        <button
          onClick={() => setShowBoundary(!showBoundary)}
          className={`p-2.5 rounded-full shadow-lg transition border flex items-center justify-center cursor-pointer ${
            showBoundary
              ? "bg-amber-400 text-blue-950 border-amber-300 ring-2 ring-amber-300/50 shadow-amber-200"
              : "bg-white/95 backdrop-blur-md text-slate-600 border-slate-200 hover:text-slate-900"
          }`}
          title={showBoundary ? "Batas Wilayah Halut Aktif (Klik untuk Sembunyikan)" : "Tampilkan Batas Wilayah Halut"}
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>

      {/* RIGHT SIDE FLOATING BUTTONS: Clean Custom Zoom Controls */}
      <div className="absolute top-20 right-4 z-[400] flex flex-col items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-1 shadow-lg">
        <button
          onClick={handleZoomIn}
          disabled={currentZoom >= 19}
          className={`p-2 rounded-xl transition ${
            currentZoom >= 19
              ? "opacity-30 cursor-not-allowed text-slate-400"
              : "hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer"
          }`}
          title={currentZoom >= 19 ? "Batas pembesaran maksimal" : "Perbesar Peta (+)"}
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-4 h-px bg-slate-200" />
        <button
          onClick={handleZoomOut}
          disabled={currentZoom <= minZoomLevel}
          className={`p-2 rounded-xl transition ${
            currentZoom <= minZoomLevel
              ? "opacity-30 cursor-not-allowed text-slate-400"
              : "hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer"
          }`}
          title={
            currentZoom <= minZoomLevel
              ? "Tampilan terjauh (Terkunci pada batas seluruh Halut)"
              : "Perkecil Peta (-)"
          }
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* BOTTOM LEFT: ArcGIS Status Overlay */}
      <div className="absolute bottom-4 left-4 z-[400]">
        <div className="px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-400/40 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
          <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>ArcGIS Location Platform Connected</span>
        </div>
      </div>
    </div>
  );
};

export default EsriLeafletMap;
