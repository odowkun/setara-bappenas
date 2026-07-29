"use client";

import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "@/lib/swal";
import { KECAMATAN_HALUT_DATA } from "@/services/halutRegionService";

import halutOfficialBpsBoundary from "@/data/halut-boundary.json";

interface GeotaggingMapPickerProps {
  selectedLat: number;
  selectedLng: number;
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
  bufferGeoJson?: any; // Fitur 5: Buffer GeoJSON Polygon
  bufferColor?: string;
  readOnly?: boolean;
}

export default function GeotaggingMapPicker({
  selectedLat,
  selectedLng,
  onLocationSelect,
  existingProjects = [],
  bufferGeoJson,
  bufferColor = "#7c3aed",
  readOnly = false,
}: GeotaggingMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const bufferLayerRef = useRef<L.GeoJSON | null>(null);
  const projectsLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default to Tobelo, Halmahera Utara center if 0
    const centerLat = selectedLat !== 0 ? selectedLat : 1.7289;
    const centerLng = selectedLng !== 0 ? selectedLng : 128.0054;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: selectedLat !== 0 ? 14 : 12,
        zoomControl: true,
      });

      // Esri World Imagery & Street Tile Layer
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Esri ArcGIS REST API Bappeda Halut",
        maxZoom: 19,
      }).addTo(map);

      // Render official Halmahera Utara GeoJSON boundary layer
      L.geoJSON(halutOfficialBpsBoundary as any, {
        style: {
          color: "#ef4444",
          weight: 2,
          opacity: 0.9,
          dashArray: "4, 4",
          fillColor: "#ef4444",
          fillOpacity: 0.03,
        },
      }).addTo(map);

      projectsLayerRef.current = L.layerGroup().addTo(map);

      // Handle map click for pin placement
      if (!readOnly && onLocationSelect) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          onLocationSelect(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
        });
      }

      mapRef.current = map;
    } else {
      mapRef.current.setView([centerLat, centerLng]);
    }

    return () => {
      // Map cleanup on unmount
    };
  }, []);

  // Update selected pin marker
  useEffect(() => {
    if (!mapRef.current) return;

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

      mapRef.current.flyTo([selectedLat, selectedLng], 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedLat, selectedLng]);

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

      const m = L.marker([prj.latitude, prj.longitude], { icon: projIcon });
      m.bindPopup(`
        <div class="p-2 space-y-1 font-sans">
          <div class="text-[10px] font-bold text-blue-800 uppercase tracking-wider">ESRI OBJECTID: #${prj.esri_objectid || 'N/A'}</div>
          <div class="font-bold text-xs text-slate-900">${prj.nama_proyek}</div>
          <div class="text-[11px] text-slate-600">Progres: <strong>${prj.persentase_progres}%</strong> (${prj.status_progres})</div>
        </div>
      `);
      projectsLayerRef.current?.addLayer(m);
    });
  }, [existingProjects]);

  // Fitur 5: Render Buffer GeoJSON Overlay Layer
  useEffect(() => {
    if (!mapRef.current) return;

    if (bufferLayerRef.current) {
      mapRef.current.removeLayer(bufferLayerRef.current);
      bufferLayerRef.current = null;
    }

    if (bufferGeoJson) {
      const geoLayer = L.geoJSON(bufferGeoJson, {
        style: {
          color: bufferColor,
          weight: 2.5,
          opacity: 0.9,
          fillColor: bufferColor,
          fillOpacity: 0.35,
        },
      }).addTo(mapRef.current);

      bufferLayerRef.current = geoLayer;
      mapRef.current.fitBounds(geoLayer.getBounds(), { padding: [30, 30] });
    }
  }, [bufferGeoJson, bufferColor]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Fitur Geolocation tidak didukung di browser ini.");
      return;
    }

    toast.loading("Mendeteksi lokasi GPS Anda...", { id: "gps_loading" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        toast.dismiss("gps_loading");
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
        }
        toast.success("Berhasil mendapatkan lokasi GPS Anda!");
      },
      (err) => {
        toast.dismiss("gps_loading");
        toast.error("Gagal mendapatkan lokasi GPS. Pastikan izin akses lokasi aktif di browser.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [mapSearchText, setMapSearchText] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Compute live search suggestions (Desa & Kecamatan in Halut)
  const searchSuggestions = React.useMemo(() => {
    if (!mapSearchText.trim() || mapSearchText.trim().length < 2) return [];
    const query = mapSearchText.toLowerCase().trim();
    const results: Array<{ type: "desa" | "kecamatan"; name: string; subtitle: string; lat: number; lng: number }> = [];

    for (const kec of KECAMATAN_HALUT_DATA) {
      if (kec.name.toLowerCase().includes(query)) {
        results.push({
          type: "kecamatan",
          name: `Kec. ${kec.name}`,
          subtitle: "Pusat Kecamatan",
          lat: kec.lat,
          lng: kec.lng,
        });
      }
      for (const desa of kec.desas) {
        if (desa.name.toLowerCase().includes(query)) {
          results.push({
            type: "desa",
            name: `Desa ${desa.name}`,
            subtitle: `Kecamatan ${kec.name}`,
            lat: desa.lat,
            lng: desa.lng,
          });
        }
      }
    }
    return results.slice(0, 7);
  }, [mapSearchText]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item: { name: string; lat: number; lng: number }) => {
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

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] z-10" />
      
      {!readOnly && (
        <div className="absolute top-3 left-14 right-3 z-[1000] flex items-center justify-between gap-1.5 pointer-events-none">
          {/* 1. Search Box with Live Dropdown Suggestions */}
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

            {/* Dropdown Options Menu */}
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

          {/* 2 & 3. Right Action Buttons Inline */}
          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
            {/* 2. Shortened GPS Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="px-2.5 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
              title="Deteksi Lokasi GPS Perangkat Saat Ini"
            >
              <span className="text-xs">🎯</span>
              <span>Lokasi GPS</span>
            </button>

            {/* 3. Shortened Drop-Pin Badge */}
            <div className="px-2.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Klik Peta</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
