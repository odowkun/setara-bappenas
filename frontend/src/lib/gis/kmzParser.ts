import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";

export interface ParsedKmzFeatureItem {
  id: string | number;
  name: string;
  geometryType: string;
  areaHa?: number;
  lengthKm?: number;
  coordinatesCount?: number;
  properties: Record<string, any>;
  description?: string;
}

export interface ParsedKmzResult {
  fileName: string;
  fileSize?: number;
  fileType: "kmz" | "kml" | "geojson" | "json";
  geojson: any; // GeoJSON FeatureCollection
  summary: {
    totalFeatures: number;
    pointsCount: number;
    polygonsCount: number;
    polylinesCount: number;
    bounds: [[number, number], [number, number]] | null; // [[south, west], [north, east]]
    center?: [number, number]; // [latitude, longitude]
    totalAreaHa: number;
    totalLengthKm: number;
  };
  features: ParsedKmzFeatureItem[];
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

/**
 * Extract structured key-value pairs from HTML tables commonly found in KML placemark descriptions
 */
function extractAttributesFromHtml(html: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!html || typeof html !== "string") return attrs;

  // Use DOMParser if available in browser
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const rows = doc.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td, th");
        if (cells.length >= 2) {
          const key = cells[0].textContent?.trim();
          const val = cells[1].textContent?.trim();
          if (key && val && key !== val && !attrs[key]) {
            attrs[key] = val;
          }
        }
      });
      if (Object.keys(attrs).length > 0) return attrs;
    } catch {
      // fallback
    }
  }

  // Regex fallback: <tr><td>Key</td><td>Value</td></tr>
  const rowRegex = /<tr[^>]*>\s*<t[dh][^>]*>(.*?)<\/t[dh]>\s*<t[dh][^>]*>(.*?)<\/t[dh]>\s*<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const key = match[1].replace(/<[^>]+>/g, "").trim();
    const val = match[2].replace(/<[^>]+>/g, "").trim();
    if (key && val && key !== val && !attrs[key]) {
      attrs[key] = val;
    }
  }

  return attrs;
}

/**
 * Strip raw HTML tags for clean plain text description
 */
function stripHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Clean & determine best feature label
 */
function extractFeatureName(props: any, index: number): string {
  if (!props) return `Fitur #${index + 1}`;
  return (
    props.name ||
    props.Name ||
    props.nama ||
    props.NAMOBJ ||
    props.WADMKC ||
    props.WADMKK ||
    props.KECAMATAN ||
    props.DESA ||
    props.title ||
    props.Title ||
    props.REMARK ||
    props.label ||
    props.Label ||
    `Objek Spasial ${index + 1}`
  );
}

export async function parseKmzOrKmlFile(file: File): Promise<ParsedKmzResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const rawExt = fileName.split(".").pop()?.toLowerCase();
  const extension: "kmz" | "kml" | "geojson" | "json" =
    rawExt === "kmz" || rawExt === "kml" || rawExt === "geojson" || rawExt === "json"
      ? (rawExt as any)
      : "kmz";

  let geojson: any;

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

    const kmlXmlString = await kmlFile.async("string");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlXmlString, "text/xml");
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      throw new Error("Gagal membaca struktur XML dokumen KML. File mungkin rusak.");
    }

    geojson = kml(xmlDoc);
  } else if (extension === "kml") {
    const kmlXmlString = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlXmlString, "text/xml");
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      throw new Error("Gagal membaca struktur XML dokumen KML. File mungkin rusak.");
    }

    geojson = kml(xmlDoc);
  } else if (extension === "geojson" || extension === "json") {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.type === "FeatureCollection") {
        geojson = parsed;
      } else if (parsed.type === "Feature") {
        geojson = { type: "FeatureCollection", features: [parsed] };
      } else if (parsed.type && parsed.coordinates) {
        geojson = {
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: parsed, properties: {} }],
        };
      } else {
        throw new Error("Struktur JSON tidak mengandung objek GeoJSON valid (FeatureCollection).");
      }
    } catch (jsonErr: any) {
      throw new Error(`Format GeoJSON/JSON tidak valid: ${jsonErr.message}`);
    }
  } else {
    throw new Error("Format file tidak didukung. Harap unggah file .kmz, .kml, atau .geojson.");
  }

  // Compute summary stats & detailed features list
  let pointsCount = 0;
  let polygonsCount = 0;
  let polylinesCount = 0;
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  let totalAreaHa = 0;
  let totalLengthKm = 0;

  const rawFeatures = geojson.features || [];
  const parsedFeatures: ParsedKmzFeatureItem[] = [];

  rawFeatures.forEach((feature: any, idx: number) => {
    const geom = feature.geometry;
    if (!geom) return;

    let featureAreaHa = 0;
    let featureLengthKm = 0;
    let coordsCount = 0;

    if (geom.type === "Point") {
      pointsCount++;
      coordsCount = 1;
      const [lng, lat] = geom.coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    } else if (geom.type === "MultiPoint") {
      pointsCount += geom.coordinates.length;
      coordsCount = geom.coordinates.length;
      geom.coordinates.forEach(([lng, lat]: [number, number]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    } else if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
      polygonsCount++;
      const coordsList = geom.type === "Polygon" ? [geom.coordinates[0]] : geom.coordinates.map((poly: any) => poly[0]);
      coordsList.forEach((outerRing: [number, number][]) => {
        const polyArea = calculatePolygonAreaHa(outerRing);
        featureAreaHa += polyArea;
        totalAreaHa += polyArea;
        coordsCount += outerRing.length;
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
        const lineLen = calculateLineLengthKm(line);
        featureLengthKm += lineLen;
        totalLengthKm += lineLen;
        coordsCount += line.length;
        line.forEach(([lng, lat]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      });
    }

    // Clean properties & parse HTML table description if any
    const rawProps = feature.properties || {};
    const htmlAttrs = rawProps.description ? extractAttributesFromHtml(rawProps.description) : {};

    // Combine properties excluding internal style metadata
    const cleanProps: Record<string, any> = {};
    Object.keys(rawProps).forEach((k) => {
      if (!["styleUrl", "styleHash", "styleMapHash", "stroke", "fill"].includes(k)) {
        if (typeof rawProps[k] === "string" || typeof rawProps[k] === "number" || typeof rawProps[k] === "boolean") {
          cleanProps[k] = rawProps[k];
        }
      }
    });

    Object.assign(cleanProps, htmlAttrs);

    const featureName = extractFeatureName(cleanProps, idx);
    const plainDesc = rawProps.description ? stripHtml(rawProps.description) : "";

    parsedFeatures.push({
      id: feature.id || `feat-${idx + 1}`,
      name: featureName,
      geometryType: geom.type,
      areaHa: featureAreaHa > 0 ? Number(featureAreaHa.toFixed(4)) : undefined,
      lengthKm: featureLengthKm > 0 ? Number(featureLengthKm.toFixed(4)) : undefined,
      coordinatesCount: coordsCount,
      properties: cleanProps,
      description: plainDesc && plainDesc !== featureName ? plainDesc : undefined,
    });
  });

  const hasValidBounds = minLat <= maxLat && minLng <= maxLng;
  const bounds = hasValidBounds
    ? ([[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]])
    : null;

  const center: [number, number] | undefined = hasValidBounds
    ? [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
    : undefined;

  return {
    fileName,
    fileSize,
    fileType: extension,
    geojson,
    summary: {
      totalFeatures: rawFeatures.length,
      pointsCount,
      polygonsCount,
      polylinesCount,
      bounds,
      center,
      totalAreaHa: Number(totalAreaHa.toFixed(4)),
      totalLengthKm: Number(totalLengthKm.toFixed(4)),
    },
    features: parsedFeatures,
  };
}

export const parseSpatialFile = parseKmzOrKmlFile;

