import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";

export interface ParsedKmzResult {
  fileName: string;
  geojson: any; // GeoJSON FeatureCollection
  summary: {
    totalFeatures: number;
    pointsCount: number;
    polygonsCount: number;
    polylinesCount: number;
    bounds: [[number, number], [number, number]] | null; // [[south, west], [north, east]]
    totalAreaHa: number;
    totalLengthKm: number;
  };
}

// Calculate approximate area of a polygon in Hectares (WGS84 ellipsoidal estimation)
export function calculatePolygonAreaHa(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  let area = 0;
  const radius = 6378137; // Earth radius in meters

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * radius * radius) / 2;
  return Number((area / 10000).toFixed(4)); // Convert m^2 to Ha
}

// Calculate approximate length of a line string in Km (Haversine formula)
export function calculateLineLengthKm(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 2) return 0;
  let totalMeters = 0;
  const R = 6371; // Earth radius in km

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalMeters += R * c;
  }

  return Number(totalMeters.toFixed(4));
}

export async function parseKmzOrKmlFile(file: File): Promise<ParsedKmzResult> {
  const fileName = file.name;
  const extension = fileName.split(".").pop()?.toLowerCase();
  let kmlXmlString = "";

  if (extension === "kmz") {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    // Find .kml file inside zip
    const kmlFile = Object.values(zipContent.files).find((f) =>
      f.name.toLowerCase().endsWith(".kml")
    );

    if (!kmlFile) {
      throw new Error("File .kmz tidak valid atau tidak berisi dokumen .kml di dalamnya.");
    }

    kmlXmlString = await kmlFile.async("string");
  } else if (extension === "kml") {
    kmlXmlString = await file.text();
  } else {
    throw new Error("Format file tidak didukung. Harap unggah file .kmz atau .kml.");
  }

  // Parse KML XML string using DOMParser
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlXmlString, "text/xml");

  const parserError = xmlDoc.getElementsByTagName("parsererror");
  if (parserError.length > 0) {
    throw new Error("Gagal membaca struktur XML dokumen KML. File mungkin rusak.");
  }

  // Convert KML DOM to GeoJSON FeatureCollection
  const geojson = kml(xmlDoc);

  // Compute summary stats
  let pointsCount = 0;
  let polygonsCount = 0;
  let polylinesCount = 0;
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  let totalAreaHa = 0;
  let totalLengthKm = 0;

  const features = geojson.features || [];

  features.forEach((feature: any) => {
    const geom = feature.geometry;
    if (!geom) return;

    if (geom.type === "Point") {
      pointsCount++;
      const [lng, lat] = geom.coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    } else if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
      polygonsCount++;
      const coordsList = geom.type === "Polygon" ? [geom.coordinates[0]] : geom.coordinates.map((poly: any) => poly[0]);
      coordsList.forEach((outerRing: [number, number][]) => {
        totalAreaHa += calculatePolygonAreaHa(outerRing);
        outerRing.forEach(([lng, lat]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      });
    } else if (geom.type === "LineString" || geom.type === "MultiLineString") {
      polylinesCount++;
      const lineList = geom.type === "LineString" ? [geom.coordinates] : geom.coordinates;
      lineList.forEach((line: [number, number][]) => {
        totalLengthKm += calculateLineLengthKm(line);
        line.forEach(([lng, lat]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      });
    }
  });

  const hasValidBounds = minLat <= maxLat && minLng <= maxLng;
  const bounds = hasValidBounds
    ? ([[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]])
    : null;

  return {
    fileName,
    geojson,
    summary: {
      totalFeatures: features.length,
      pointsCount,
      polygonsCount,
      polylinesCount,
      bounds,
      totalAreaHa: Number(totalAreaHa.toFixed(4)),
      totalLengthKm: Number(totalLengthKm.toFixed(4)),
    },
  };
}
