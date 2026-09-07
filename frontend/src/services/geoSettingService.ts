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
  default_buffer_radius_meter?: number;
  buffer_color?: string;
  buffer_opacity?: number;
  sector_pin_colors_json?: Record<string, string>;
  print_layout_config_json?: {
    map_title?: string;
    map_subtitle?: string;
    show_logo?: boolean;
    show_compass?: boolean;
    show_legend?: boolean;
    paper_size?: "A4" | "A3" | "A2";
    orientation?: "landscape" | "portrait";
    export_format?: "pdf" | "png";
  };
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

export interface SpatialLayerItem {
  id: number | string;
  name: string;
  type: "kabupaten" | "kecamatan" | "rtrw";
  legal_basis?: string | null;
  feature_count?: number;
  color: string;
  visible: boolean;
  file_name?: string | null;
  file_path?: string | null;
  geojson?: any;
  created_by?: string;
  created_at?: string;
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

  /**
   * Fetch all master secondary spatial layers (Kecamatan, Desa, RTRW)
   */
  async getSpatialLayers(): Promise<SpatialLayerItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/spatial-layers`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn("Failed to fetch spatial-layers from server:", error);
      return [];
    }
  },

  /**
   * Create a new secondary spatial layer
   */
  async createSpatialLayer(payload: {
    name: string;
    type: "kabupaten" | "kecamatan" | "rtrw";
    legal_basis?: string;
    feature_count?: number;
    color?: string;
    visible?: boolean;
    file_name?: string;
    geojson?: any;
  }): Promise<{ success: boolean; data: SpatialLayerItem; message: string }> {
    const response = await authenticatedFetch("/spatial-layers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || "Gagal membuat layer spasial baru");
    }

    return {
      success: true,
      data: json.data,
      message: json.message,
    };
  },

  /**
   * Toggle spatial layer visibility
   */
  async toggleSpatialLayer(id: number | string): Promise<{ success: boolean; data: SpatialLayerItem; message: string }> {
    const response = await authenticatedFetch(`/spatial-layers/${id}/toggle`, {
      method: "PATCH",
      headers: { Accept: "application/json" },
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || "Gagal mengubah visibilitas layer");
    }

    return {
      success: true,
      data: json.data,
      message: json.message,
    };
  },

  /**
   * Delete a spatial layer
   */
  async deleteSpatialLayer(id: number | string): Promise<{ success: boolean; message: string }> {
    const response = await authenticatedFetch(`/spatial-layers/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || "Gagal menghapus layer spasial");
    }

    return {
      success: true,
      message: json.message,
    };
  },
};

