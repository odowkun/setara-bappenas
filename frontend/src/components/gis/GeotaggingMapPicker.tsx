"use client";

import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "@/lib/swal";
import { KECAMATAN_HALUT_DATA } from "@/services/halutRegionService";
import { calculatePolygonAreaHa, calculateLineLengthKm } from "@/lib/gis/kmzParser";

import { ChevronDown } from "lucide-react";
import halutOfficialBpsBoundary from "@/data/halut-boundary.json";
import { geoSettingService, GeoSettingData } from "@/services/geoSettingService";

// Fix Leaflet Default Icon asset paths in Next.js bundle
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface DelineationData {
  geojson: any;
  tipeGeometri: "point" | "polygon" | "polyline";
  luasAreaHa: number;
  panjangKm: number;
}

interface GeotaggingMapPickerProps {
  selectedLat: number;
  selectedLng: number;
  zoomLevel?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  existingProjects?: Array<{
    id: string | number;
    nama_proyek: string;
    latitude: number;
    longitude: number;
    persentase_progres: number;
    status_progres: string;
    esri_objectid?: number;
  }>;
  bufferGeoJson?: any;
  bufferColor?: string;
  bufferFillOpacity?: number;
  customKmzGeoJson?: any;
  kmzColor?: string;
  delineationGeoJson?: any;
  showBoundary?: boolean;
  boundaryColor?: string;
  boundaryDashStyle?: "dashed" | "solid" | "dotted";
  showDistrictBoundary?: boolean;
  showRtrwZones?: boolean;
  readOnly?: boolean;
  activeDelineationTool?: "polygon" | "polyline" | "point" | null;
  onToolChange?: (tool: "polygon" | "polyline" | "point" | null) => void;
  onDelineationCreated?: (data: DelineationData) => void;
  onCancelDelineation?: () => void;
}

export default function GeotaggingMapPicker({
  selectedLat,
  selectedLng,
  zoomLevel,
  onLocationSelect,
  existingProjects = [],
  bufferGeoJson,
  bufferColor = "#7c3aed",
  bufferFillOpacity = 0.35,
  customKmzGeoJson,
  kmzColor = "#7c3aed",
  delineationGeoJson,
  showBoundary = true,
  boundaryColor = "#ef4444",
  boundaryDashStyle = "dashed",
  showDistrictBoundary = false,
  showRtrwZones = false,
  readOnly = false,
  activeDelineationTool = null,
  onToolChange,
  onDelineationCreated,
  onCancelDelineation,
}: GeotaggingMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const bufferLayerRef = useRef<L.GeoJSON | null>(null);
  const kmzLayerRef = useRef<L.GeoJSON | null>(null);
  const delineationLayerRef = useRef<L.GeoJSON | null>(null);
  const officialBoundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const districtBoundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const rtrwZonesLayerRef = useRef<L.GeoJSON | null>(null);
  const projectsLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);

  // GeoSettings state from DB
  const [geoSettings, setGeoSettings] = useState<GeoSettingData | null>(null);

  // Drawing state: Array of [lat, lng]
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);

  // Search box, mode dropdown & basemap dropdown state
  const [mapSearchText, setMapSearchText] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isToolDropdownOpen, setIsToolDropdownOpen] = useState(false);
  const [basemapType, setBasemapType] = useState<"carto" | "googleSatellite" | "googleStreet" | "esriSatellite">("carto");
  const [isBasemapDropdownOpen, setIsBasemapDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load saved WebGIS geo settings on mount
  useEffect(() => {
    geoSettingService.getSettings().then((data) => {
      if (data) {
        setGeoSettings(data);
        if (data.default_basemap) {
          setBasemapType(data.default_basemap as any);
        }
      }
    });
  }, []);

  // Reset drawing points when active tool changes to null or changes tool
  useEffect(() => {
    setDrawingPoints([]);
  }, [activeDelineationTool]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultLat = geoSettings?.default_latitude || 1.7289;
    const defaultLng = geoSettings?.default_longitude || 128.0054;
    const defaultZoom = geoSettings?.default_zoom_level || 12;

    const centerLat = selectedLat !== 0 ? selectedLat : defaultLat;
    const centerLng = selectedLng !== 0 ? selectedLng : defaultLng;
    const initialZoom = zoomLevel ?? (selectedLat !== 0 ? 14 : defaultZoom);

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: initialZoom,
        zoomControl: true,
      });

      projectsLayerRef.current = L.layerGroup().addTo(map);
      drawingLayerRef.current = L.layerGroup().addTo(map);

      mapRef.current = map;
    } else {
      mapRef.current.setView([centerLat, centerLng], initialZoom);
    }

    // Force map to recalculate tile bounds so grey gaps never occur
    const t1 = setTimeout(() => mapRef.current?.invalidateSize(), 150);
    const t2 = setTimeout(() => mapRef.current?.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [geoSettings]);

  // Dynamically update map center & zoom level in real-time when props or saved settings change
  useEffect(() => {
    if (!mapRef.current) return;

    const defaultLat = geoSettings?.default_latitude || 1.7289;
    const defaultLng = geoSettings?.default_longitude || 128.0054;
    const defaultZoom = geoSettings?.default_zoom_level || 12;

    const centerLat = selectedLat !== 0 ? selectedLat : defaultLat;
    const centerLng = selectedLng !== 0 ? selectedLng : defaultLng;
    const targetZoom = zoomLevel ?? (selectedLat !== 0 ? 14 : defaultZoom);

    mapRef.current.setView([centerLat, centerLng], targetZoom, { animate: true });
  }, [selectedLat, selectedLng, zoomLevel, geoSettings]);

  // Dynamically update basemap tile layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    let subdomains: string | string[] = "abcd";
    let attr = "&copy; OpenStreetMap &copy; CARTO";

    if (basemapType === "googleSatellite") {
      url = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
      subdomains = "abc";
      attr = "&copy; Google Maps";
    } else if (basemapType === "googleStreet") {
      url = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
      subdomains = "abc";
      attr = "&copy; Google Maps";
    } else if (basemapType === "esriSatellite") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      subdomains = "abc";
      attr = "&copy; Esri World Imagery";
    }

    const newTileLayer = L.tileLayer(url, {
      attribution: attr,
      subdomains,
      maxZoom: 19,
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [basemapType]);

  // Handle map clicks dynamically depending on activeDelineationTool
  useEffect(() => {
    if (!mapRef.current || readOnly) return;
    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const cleanLat = parseFloat(lat.toFixed(6));
      const cleanLng = parseFloat(lng.toFixed(6));

      if (activeDelineationTool === "polygon" || activeDelineationTool === "polyline") {
        setDrawingPoints((prev) => [...prev, [cleanLat, cleanLng]]);
        if (onLocationSelect && drawingPoints.length === 0) {
          onLocationSelect(cleanLat, cleanLng);
        }
      } else if (activeDelineationTool === "point") {
        if (onLocationSelect) onLocationSelect(cleanLat, cleanLng);
        const geojson = {
          type: "Feature",
          geometry: { type: "Point", coordinates: [cleanLng, cleanLat] },
          properties: {},
        };
        if (onDelineationCreated) {
          onDelineationCreated({
            geojson,
            tipeGeometri: "point",
            luasAreaHa: 0,
            panjangKm: 0,
          });
        }
      } else {
        if (onLocationSelect) onLocationSelect(cleanLat, cleanLng);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [activeDelineationTool, readOnly, onLocationSelect, onDelineationCreated, drawingPoints.length]);

  // Render live drawing layer preview with distinct styles for Polygon vs Polyline
  useEffect(() => {
    if (!mapRef.current || !drawingLayerRef.current) return;
    const drawingLayer = drawingLayerRef.current;
    drawingLayer.clearLayers();

    if (drawingPoints.length === 0) return;

    const isPolylineMode = activeDelineationTool === "polyline";

    // Draw vertex circle markers
    drawingPoints.forEach(([lat, lng], idx) => {
      const isStart = idx === 0;
      const isEnd = idx === drawingPoints.length - 1;

      const circle = L.circleMarker([lat, lng], {
        radius: isPolylineMode ? (isStart || isEnd ? 8 : 5) : 6,
        color: isPolylineMode ? "#d97706" : "#2563eb",
        fillColor: isPolylineMode ? (isStart ? "#16a34a" : isEnd ? "#dc2626" : "#f59e0b") : "#ffffff",
        fillOpacity: 1,
        weight: 3,
      });
      const label = isPolylineMode
        ? isStart
          ? "🟢 Awal Koridor"
          : isEnd
          ? "🏁 Ujung Koridor"
          : `Simpul #${idx + 1}`
        : `Titik #${idx + 1}`;
      circle.bindTooltip(label, { permanent: isPolylineMode && (isStart || isEnd) });
      drawingLayer.addLayer(circle);
    });

    if (activeDelineationTool === "polygon" && drawingPoints.length >= 2) {
      const poly = L.polygon(drawingPoints, {
        color: "#2563eb",
        weight: 3,
        fillColor: "#3b82f6",
        fillOpacity: 0.35,
        dashArray: "4, 4",
      });
      drawingLayer.addLayer(poly);
    } else if (activeDelineationTool === "polyline" && drawingPoints.length >= 2) {
      // Crisp open highway corridor line (proportional at all zoom levels)
      const line = L.polyline(drawingPoints, {
        color: "#d97706",
        weight: 4,
        opacity: 0.9,
        dashArray: "6, 4",
      });
      drawingLayer.addLayer(line);
    }
  }, [drawingPoints, activeDelineationTool]);

  // Update selected pin marker
  useEffect(() => {
    if (!mapRef.current) return;

    const isAreaOrLineDelineation = delineationGeoJson && delineationGeoJson.geometry?.type !== "Point";

    // If active tool is polygon or polyline, OR if delineation is a Polygon/LineString, hide the single red pin marker
    if (activeDelineationTool === "polygon" || activeDelineationTool === "polyline" || isAreaOrLineDelineation) {
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    if (selectedLat !== 0 && selectedLng !== 0) {
      const icon = L.divIcon({
        className: "custom-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs animate-bounce">
              📍
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-rose-600 rotate-45"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([selectedLat, selectedLng]);
      } else {
        markerRef.current = L.marker([selectedLat, selectedLng], { icon }).addTo(mapRef.current);
      }

      if (!activeDelineationTool) {
        mapRef.current.flyTo([selectedLat, selectedLng], 14, {
          animate: true,
          duration: 1.2,
        });
      }
    }
  }, [selectedLat, selectedLng, activeDelineationTool]);

  // Render existing project markers
  useEffect(() => {
    if (!mapRef.current || !projectsLayerRef.current) return;

    projectsLayerRef.current.clearLayers();

    existingProjects.forEach((prj) => {
      let statusColor = "bg-blue-600";
      if (prj.status_progres === "selesai") statusColor = "bg-emerald-600";
      if (prj.status_progres === "terkendala") statusColor = "bg-rose-600";
      if (prj.status_progres === "dalam_proses") statusColor = "bg-amber-500";

      const projIcon = L.divIcon({
        className: "project-marker",
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-7 h-7 rounded-full ${statusColor} text-white border-2 border-white shadow-md flex items-center justify-center font-black text-[10px]">
              ${prj.persentase_progres}%
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const mkr = L.marker([prj.latitude, prj.longitude], { icon: projIcon });
      mkr.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-extrabold text-slate-900">${prj.nama_proyek}</div>
          <div class="text-[10px] text-slate-500">OBJECTID: #${prj.esri_objectid || "Pending"}</div>
          <div class="text-[11px] font-bold text-blue-600 mt-1">Progres: ${prj.persentase_progres}%</div>
        </div>
      `);
      projectsLayerRef.current?.addLayer(mkr);
    });
  }, [existingProjects]);

  // Render custom KMZ GeoJSON layer if available
  useEffect(() => {
    if (!mapRef.current) return;

    if (kmzLayerRef.current) {
      mapRef.current.removeLayer(kmzLayerRef.current);
      kmzLayerRef.current = null;
    }

    if (customKmzGeoJson) {
      try {
        const layer = L.geoJSON(customKmzGeoJson, {
          style: {
            color: kmzColor,
            weight: 3,
            fillColor: kmzColor,
            fillOpacity: 0.35,
          },
        }).addTo(mapRef.current);

        kmzLayerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (e) {
        console.error("Gagal menayangkan GeoJSON KMZ:", e);
      }
    }
  }, [customKmzGeoJson, kmzColor]);

  // Render Buffer GeoJSON layer if available
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (bufferLayerRef.current) {
      map.removeLayer(bufferLayerRef.current);
      bufferLayerRef.current = null;
    }

    if (bufferGeoJson) {
      try {
        const layer = L.geoJSON(bufferGeoJson, {
          style: {
            color: bufferColor || "#7c3aed",
            weight: 3,
            fillColor: bufferColor || "#7c3aed",
            fillOpacity: bufferFillOpacity ?? 0.35,
          },
        }).addTo(map);

        bufferLayerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (e) {
        console.error("Gagal menayangkan GeoJSON Buffer:", e);
      }
    }
  }, [bufferGeoJson, bufferColor, bufferFillOpacity]);

  // Dynamically update official BPS boundary layer style & visibility
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (officialBoundaryLayerRef.current) {
      map.removeLayer(officialBoundaryLayerRef.current);
      officialBoundaryLayerRef.current = null;
    }

    if (showBoundary) {
      const dash =
        boundaryDashStyle === "dashed"
          ? "6, 6"
          : boundaryDashStyle === "dotted"
          ? "2, 5"
          : undefined;

      const layer = L.geoJSON(halutOfficialBpsBoundary as any, {
        style: {
          color: boundaryColor || "#ef4444",
          weight: 3,
          opacity: 0.9,
          dashArray: dash,
          fillColor: boundaryColor || "#ef4444",
          fillOpacity: 0.05,
        },
      }).addTo(map);

      officialBoundaryLayerRef.current = layer;
    }
  }, [showBoundary, boundaryColor, boundaryDashStyle]);

  // Dynamically render Sub-District Boundaries (Kecamatan & Desa)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (districtBoundaryLayerRef.current) {
      map.removeLayer(districtBoundaryLayerRef.current);
      districtBoundaryLayerRef.current = null;
    }

    if (showDistrictBoundary) {
      const sampleDistrictsGeoJson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [127.80, 1.70],
                [127.95, 1.70],
                [128.05, 1.70],
              ],
            },
            properties: { name: "Batas Kec. Tobelo & Tobelo Selatan" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [127.80, 1.78],
                [127.95, 1.78],
                [128.05, 1.78],
              ],
            },
            properties: { name: "Batas Kec. Tobelo & Tobelo Utara" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [127.92, 1.60],
                [127.92, 1.88],
              ],
            },
            properties: { name: "Batas Kec. Tobelo & Galela" },
          },
        ],
      };

      const layer = L.geoJSON(sampleDistrictsGeoJson as any, {
        style: {
          color: "#0284c7",
          weight: 2,
          opacity: 0.85,
          dashArray: "4, 4",
        },
      }).addTo(map);

      districtBoundaryLayerRef.current = layer;
    }
  }, [showDistrictBoundary]);

  // Dynamically render RTRW Zoning Overlay (Kawasan Hutan, Pemukiman, Industri, Pariwisata)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (rtrwZonesLayerRef.current) {
      map.removeLayer(rtrwZonesLayerRef.current);
      rtrwZonesLayerRef.current = null;
    }

    if (showRtrwZones) {
      const sampleRtrwGeoJson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [127.78, 1.62],
                  [127.90, 1.62],
                  [127.90, 1.84],
                  [127.78, 1.84],
                  [127.78, 1.62],
                ],
              ],
            },
            properties: { name: "Kawasan Hutan Lindung & Konservasi", color: "#059669" },
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [127.92, 1.70],
                  [128.00, 1.70],
                  [128.00, 1.76],
                  [127.92, 1.76],
                  [127.92, 1.70],
                ],
              ],
            },
            properties: { name: "Kawasan Pemukiman Perkotaan Tobelo", color: "#d97706" },
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [127.94, 1.76],
                  [128.02, 1.76],
                  [128.02, 1.82],
                  [127.94, 1.82],
                  [127.94, 1.76],
                ],
              ],
            },
            properties: { name: "Kawasan Pelabuhan & Industri", color: "#2563eb" },
          },
        ],
      };

      const layer = L.geoJSON(sampleRtrwGeoJson as any, {
        style: (feature: any) => ({
          color: feature.properties.color || "#059669",
          weight: 2,
          fillColor: feature.properties.color || "#059669",
          fillOpacity: 0.28,
        }),
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(feature.properties.name, {
            permanent: false,
            direction: "center",
            className: "text-[10px] font-bold text-slate-800 bg-white/90 border border-slate-300 px-2 py-1 rounded-md shadow-xs",
          });
        },
      }).addTo(map);

      rtrwZonesLayerRef.current = layer;
    }
  }, [showRtrwZones]);

  // Render saved Delineation GeoJSON layer if available
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (delineationLayerRef.current) {
      map.removeLayer(delineationLayerRef.current);
      delineationLayerRef.current = null;
    }

    // Hide saved delineation layer ONLY while actively placing drawing points
    if (drawingPoints.length > 0) {
      return;
    }

    // Do NOT render Point delineations as a separate layer because markerRef already renders the single location pin!
    if (delineationGeoJson && delineationGeoJson.geometry?.type !== "Point") {
      try {
        const isPolyline = delineationGeoJson.geometry?.type === "LineString";
        const layer = L.geoJSON(delineationGeoJson, {
          style: {
            color: isPolyline ? "#d97706" : "#2563eb",
            weight: isPolyline ? 4 : 3,
            fillColor: "#3b82f6",
            fillOpacity: isPolyline ? 0 : 0.35,
            dashArray: isPolyline ? "6, 4" : undefined,
          },
        }).addTo(map);

        delineationLayerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (e) {
        console.error("Gagal menayangkan GeoJSON Delineasi:", e);
      }
    }
  }, [delineationGeoJson, drawingPoints.length]);

  // Drawing Handlers
  const handleUndoLastPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    if (onCancelDelineation) onCancelDelineation();
  };

  const handleFinishPolygon = () => {
    if (drawingPoints.length < 3) {
      toast.error("Poligon membutuhkan minimal 3 titik koordinat.");
      return;
    }

    const geojsonCoords: [number, number][] = drawingPoints.map(([lat, lng]): [number, number] => [lng, lat]);
    const closedCoords: [number, number][] = [...geojsonCoords, geojsonCoords[0]];
    const areaHa = calculatePolygonAreaHa(closedCoords);

    const geojson = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [closedCoords],
      },
      properties: { luasAreaHa: areaHa },
    };

    if (onDelineationCreated) {
      onDelineationCreated({
        geojson,
        tipeGeometri: "polygon",
        luasAreaHa: areaHa,
        panjangKm: 0,
      });
    }

    toast.success(`Delineasi Poligon Lahan terbentuk! Luas: ${areaHa} Ha`);
    setDrawingPoints([]);
  };

  const handleFinishPolyline = () => {
    if (drawingPoints.length < 2) {
      toast.error("Koridor Line membutuhkan minimal 2 titik koordinat.");
      return;
    }

    const geojsonCoords: [number, number][] = drawingPoints.map(([lat, lng]): [number, number] => [lng, lat]);
    const lengthKm = calculateLineLengthKm(geojsonCoords);

    const geojson = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: geojsonCoords,
      },
      properties: { panjangKm: lengthKm },
    };

    if (onDelineationCreated) {
      onDelineationCreated({
        geojson,
        tipeGeometri: "polyline",
        luasAreaHa: 0,
        panjangKm: lengthKm,
      });
    }

    toast.success(`Delineasi Koridor Line terbentuk! Panjang: ${lengthKm} Km`);
    setDrawingPoints([]);
  };

  // Filter search suggestions from Kecamatan Halut Data
  const searchSuggestions = KECAMATAN_HALUT_DATA.flatMap((kec) => {
    const list: Array<{ name: string; subtitle: string; lat: number; lng: number }> = [];
    if (kec.name.toLowerCase().includes(mapSearchText.toLowerCase())) {
      list.push({
        name: `Kec. ${kec.name}`,
        subtitle: `Pusat Kecamatan ${kec.name}`,
        lat: kec.lat,
        lng: kec.lng,
      });
    }
    kec.desas.forEach((d) => {
      if (d.name.toLowerCase().includes(mapSearchText.toLowerCase())) {
        list.push({
          name: `Desa ${d.name}`,
          subtitle: `Kecamatan ${kec.name}`,
          lat: d.lat,
          lng: d.lng,
        });
      }
    });
    return list;
  }).slice(0, 6);

  const handleSelectSuggestion = (item: { name: string; subtitle: string; lat: number; lng: number }) => {
    setMapSearchText(item.name);
    setIsSearchOpen(false);
    if (onLocationSelect) onLocationSelect(item.lat, item.lng);
    if (mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 16, { animate: true });
    toast.success(`Terpilih: ${item.name}`);
  };

  const handleMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchText.trim()) return;

    if (searchSuggestions.length > 0) {
      handleSelectSuggestion(searchSuggestions[0]);
      return;
    }

    toast.error(`"${mapSearchText}" tidak ditemukan di database desa/kecamatan Halut.`);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung Geolocation GPS.");
      return;
    }

    toast.loading("Mendeteksi koordinat GPS...", { id: "gps" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss("gps");
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        if (onLocationSelect) onLocationSelect(lat, lng);
        if (mapRef.current) mapRef.current.flyTo([lat, lng], 16, { animate: true });
        toast.success(`GPS Ditemukan: ${lat}, ${lng}`);
      },
      (err) => {
        toast.dismiss("gps");
        toast.error(`Gagal mendapatkan lokasi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] z-10 cursor-crosshair" />

      {/* Floating Active Drawing Controller overlay - ONLY while actively placing drawing points for Polygon/Polyline */}
      {(activeDelineationTool === "polygon" || activeDelineationTool === "polyline") && drawingPoints.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[1200] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-blue-200 shadow-2xl flex flex-wrap items-center justify-between gap-2 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <span className="text-xs font-extrabold text-slate-900">
              Mode Gambar: {activeDelineationTool === "polygon" ? "Poligon Lahan" : activeDelineationTool === "polyline" ? "Koridor Line" : "Titik Pin"} ({drawingPoints.length} Titik)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {drawingPoints.length > 0 && (
              <button
                type="button"
                onClick={handleUndoLastPoint}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                ↩ Undo Titik
              </button>
            )}

            {activeDelineationTool === "polygon" && (
              <button
                type="button"
                disabled={drawingPoints.length < 3}
                onClick={handleFinishPolygon}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1 ${
                  drawingPoints.length >= 3
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>
                  ✓ Selesaikan Poligon (
                  {drawingPoints.length >= 3
                    ? calculatePolygonAreaHa([
                        ...drawingPoints.map(([lat, lng]): [number, number] => [lng, lat]),
                        [drawingPoints[0][1], drawingPoints[0][0]] as [number, number],
                      ])
                    : 0}{" "}
                  Ha)
                </span>
              </button>
            )}

            {activeDelineationTool === "polyline" && (
              <button
                type="button"
                disabled={drawingPoints.length < 2}
                onClick={handleFinishPolyline}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1 ${
                  drawingPoints.length >= 2
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>
                  ✓ Selesaikan Koridor (
                  {drawingPoints.length >= 2
                    ? calculateLineLengthKm(
                        drawingPoints.map(([lat, lng]): [number, number] => [lng, lat])
                      )
                    : 0}{" "}
                  Km)
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCancelDrawing}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer"
            >
              ✖ Batal
            </button>
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="absolute top-3 left-14 right-3 z-[1000] flex flex-wrap items-center justify-end gap-2 pointer-events-none">
          {/* Search Box */}
          <div ref={searchContainerRef} className="relative pointer-events-auto shrink min-w-0">
            <form
              onSubmit={handleMapSearch}
              className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md p-1"
            >
              <input
                type="text"
                value={mapSearchText}
                onChange={(e) => {
                  setMapSearchText(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Cari desa/tempat..."
                className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-transparent focus:outline-none w-28 sm:w-36 min-w-0"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
              >
                Cari
              </button>
            </form>

            {/* Dropdown Options */}
            {isSearchOpen && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-[1100]">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Pilih Lokasi Desa/Kec</span>
                  <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{searchSuggestions.length} Opsi</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {searchSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {item.subtitle}
                        </div>
                      </div>
                      <span className="text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition">Pilih 📍</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Basemap Switcher Dropdown Overlay */}
          <div className="relative pointer-events-auto shrink-0 z-[1150]">
            <button
              type="button"
              onClick={() => {
                setIsBasemapDropdownOpen((prev) => !prev);
                setIsToolDropdownOpen(false);
              }}
              className="px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs font-bold text-slate-800 flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer active:scale-95"
              title="Pilih Jenis Peta Dasar (Basemap)"
            >
              <span>
                {basemapType === "googleSatellite"
                  ? "🛰️ Google Satelit"
                  : basemapType === "googleStreet"
                  ? "🗺️ Google Street"
                  : basemapType === "esriSatellite"
                  ? "🏔️ Esri Satelit"
                  : "🌐 Carto Vektor"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isBasemapDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isBasemapDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-[1200] animate-in fade-in slide-in-from-top-1">
                <button
                  type="button"
                  onClick={() => {
                    setBasemapType("carto");
                    setIsBasemapDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    basemapType === "carto" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  <span>🌐</span>
                  <span>Carto Vektor</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBasemapType("googleSatellite");
                    setIsBasemapDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    basemapType === "googleSatellite" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  <span>🛰️</span>
                  <span>Google Satelit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBasemapType("googleStreet");
                    setIsBasemapDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    basemapType === "googleStreet" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  <span>🗺️</span>
                  <span>Google Street</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBasemapType("esriSatellite");
                    setIsBasemapDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    basemapType === "esriSatellite" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  <span>🏔️</span>
                  <span>Esri Satelit</span>
                </button>
              </div>
            )}
          </div>

          {/* Single Mode Dropdown Switch Overlay directly on Map */}
          {onToolChange && (
            <div className="relative pointer-events-auto shrink-0 z-[1150]">
              <button
                type="button"
                onClick={() => {
                  setIsToolDropdownOpen((prev) => !prev);
                  setIsBasemapDropdownOpen(false);
                }}
                className={`px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  activeDelineationTool === "polygon"
                    ? "text-blue-700 bg-blue-50/90"
                    : activeDelineationTool === "polyline"
                    ? "text-amber-800 bg-amber-50/90"
                    : "text-slate-800"
                }`}
                title="Pilih Mode Delineasi Spasial"
              >
                <span>
                  {activeDelineationTool === "polygon"
                    ? "🔲 Poligon Lahan"
                    : activeDelineationTool === "polyline"
                    ? "📈 Koridor Line"
                    : "📍 Titik Pin"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isToolDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isToolDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-[1200] animate-in fade-in slide-in-from-top-1">
                  <button
                    type="button"
                    onClick={() => {
                      onToolChange("polygon");
                      setIsToolDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeDelineationTool === "polygon" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"
                    }`}
                  >
                    <span>🔲</span>
                    <span>Poligon Lahan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToolChange("polyline");
                      setIsToolDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeDelineationTool === "polyline" ? "bg-amber-600 text-white" : "text-slate-700 hover:bg-amber-50"
                    }`}
                  >
                    <span>📈</span>
                    <span>Koridor Line</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToolChange("point");
                      setIsToolDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeDelineationTool === "point" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"
                    }`}
                  >
                    <span>📍</span>
                    <span>Titik Pin</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="px-2.5 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
              title="Deteksi Lokasi GPS Perangkat Saat Ini"
            >
              <span className="text-xs">🎯</span>
              <span>Lokasi GPS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
