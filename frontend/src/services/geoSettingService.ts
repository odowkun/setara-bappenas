import { API_BASE_URL, authenticatedFetch } from "@/lib/apiClient";

export interface GeoSettingData {
  id: number;
  default_latitude: number;
  default_longitude: number;
  default_zoom_level: number;
  default_basemap: "esriSatellite" | "esriTopo" | "googleHybrid" | "googleStreet";
  esri_feature_service_url?: string;
  esri_geoprocessing_url?: string;
  auto_sync_esri: boolean;
  default_layer_color: string;
  default_fill_opacity: number;
  max_kmz_file_mb: number;
  spatial_reference_srid: string;
  unit_luas: "ha" | "m2";
  unit_panjang: "km" | "m";
  custom_boundary_name?: string | null;
  custom_boundary_path?: string | null;
  custom_boundary_geojson?: any | null;
  custom_boundary_features_count?: number | null;
  custom_boundary_area_ha?: number | null;
  custom_boundary_length_km?: number | null;
  custom_boundary_color?: string | null;
  custom_boundary_uploaded_at?: string | null;
  has_custom_boundary?: boolean;
  updated_by?: string;
  updated_at?: string;
}

export const geoSettingService = {
  /**
   * Fetch active spatial & GIS settings
   */
  async getSettings(): Promise<GeoSettingData> {
    try {
      const response = await fetch(`${API_BASE_URL}/geo-settings`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = await response.json();
      return json.data;
    } catch (error) {
      console.warn("Failed to fetch geo-settings, using fallback defaults:", error);
      return {
        id: 1,
        default_latitude: 1.7289,
        default_longitude: 128.0054,
        default_zoom_level: 12,
        default_basemap: "esriSatellite",
        esri_feature_service_url: "https://services.arcgis.com/dummy/arcgis/rest/services/BappedaHalut/FeatureServer/0",
        esri_geoprocessing_url: "https://geoprocessing.arcgis.com/dummy/arcgis/rest/services/Buffer/GPServer",
        auto_sync_esri: true,
        default_layer_color: "#7c3aed",
        default_fill_opacity: 0.35,
        max_kmz_file_mb: 15,
        spatial_reference_srid: "EPSG:4326",
        unit_luas: "ha",
        unit_panjang: "km",
        has_custom_boundary: false,
      };
    }
  },

  /**
   * Update active spatial & GIS settings
   */
  async updateSettings(payload: Partial<GeoSettingData>): Promise<{ success: boolean; data?: GeoSettingData; message?: string }> {
    const response = await authenticatedFetch("/geo-settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || "Gagal mengupdate konfigurasi spasial");
    }

    return {
      success: true,
      data: json.data,
      message: json.message,
    };
  },

  /**
   * Upload and persist custom boundary GeoJSON (parsed from KMZ/KML/GeoJSON)
   */
  async uploadCustomBoundary(payload: {
    file_name: string;
    geojson: any;
    features_count?: number;
    area_ha?: number;
    length_km?: number;
    color?: string;
  }): Promise<{ success: boolean; data?: GeoSettingData; message?: string }> {
    const response = await authenticatedFetch("/geo-settings/boundary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || "Gagal menyimpan batas spasial kustom");
    }

    return {
      success: true,
      data: json.data,
      message: json.message,
    };
  },

  /**
   * Reset custom boundary back to default official BPS boundary
   */
  async resetCustomBoundary(): Promise<{ success: boolean; data?: GeoSettingData; message?: string }> {
    const response = await authenticatedFetch("/geo-settings/boundary", {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || "Gagal mereset batas wilayah ke default");
    }

    return {
      success: true,
      data: json.data,
      message: json.message,
    };
  },
};

