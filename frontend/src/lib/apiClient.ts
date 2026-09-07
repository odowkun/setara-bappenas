export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export const AUTH_TOKEN_KEY = "bappeda_sanctum_token";
export const AUTH_USER_KEY = "bappeda_auth_user";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function withAuthHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  result.set("Accept", "application/json");

  const token = getAuthToken();
  if (token) {
    result.set("Authorization", `Bearer ${token}`);
  }

  return result;
}

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Sesi dashboard tidak tersedia. Silakan login kembali.");
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: withAuthHeaders(options.headers),
  });
}
