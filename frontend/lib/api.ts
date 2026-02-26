import axios from "axios";
import {
  AnalyticsSummaryResponse,
  AuthUser,
  DashboardRecentActivityItem,
  DashboardSummaryResponse,
  GoogleAuthResponse,
  PaginatedSurveyResponses,
  SurveyResponsesQuery,
  SurveySubmitPayload,
  SurveySubmitResponse,
} from "@/types/survey";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const ACCESS_TOKEN_KEY = "surveycorp_access_token";
const REFRESH_TOKEN_KEY = "surveycorp_refresh_token";
const AUTH_USER_KEY = "surveycorp_auth_user";
export const AUTH_EXPIRED_EVENT = "surveycorp-auth-expired";

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const requestUrl = String(originalRequest?.url ?? "");
    const isRefreshRequest = requestUrl.includes("/auth/refresh/");

    if (typeof window !== "undefined" && error?.response?.status === 401 && originalRequest) {
      if (isRefreshRequest) {
        clearSessionTokens();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        clearSessionTokens();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newAccess = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api.request(originalRequest);
      } catch {
        clearSessionTokens();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearRefreshToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearSessionTokens(): void {
  clearAccessToken();
  clearRefreshToken();
  clearAuthUser();
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export async function refreshAccessToken(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Cannot refresh token outside browser context");
  }

  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  refreshPromise = api
    .post<{ access: string; refresh?: string }>("/auth/refresh/", {
      refresh: refreshToken,
    })
    .then((response) => {
      const nextAccess = response.data.access;
      setAccessToken(nextAccess);
      if (response.data.refresh) {
        setRefreshToken(response.data.refresh);
      }
      return nextAccess;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function ensureSession(): Promise<boolean> {
  const accessToken = getAccessToken();
  if (accessToken) return true;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    await refreshAccessToken();
    return true;
  } catch {
    clearSessionTokens();
    return false;
  }
}

export async function signInWithGoogle(
  idToken: string
): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>("/auth/google/", {
    id_token: idToken,
  });
  setAccessToken(response.data.access);
  setRefreshToken(response.data.refresh);
  setAuthUser(response.data.user);
  return response.data;
}

export async function submitSurveyResponse(
  payload: SurveySubmitPayload
): Promise<SurveySubmitResponse> {
  const response = await api.post<SurveySubmitResponse>("/responses/", payload);
  return response.data;
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await api.get<DashboardSummaryResponse>("/dashboard/summary/");
  return response.data;
}

export async function getDashboardRecentActivity(): Promise<DashboardRecentActivityItem[]> {
  const response = await api.get<DashboardRecentActivityItem[]>("/dashboard/recent/");
  return response.data;
}

function buildQueryParams(query: SurveyResponsesQuery): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getSurveyResponses(
  query: SurveyResponsesQuery = {}
): Promise<PaginatedSurveyResponses> {
  const queryString = buildQueryParams(query);
  const response = await api.get<PaginatedSurveyResponses>(`/responses/${queryString}`);
  return response.data;
}

export async function exportSurveyResponsesCsv(
  query: SurveyResponsesQuery = {}
): Promise<Blob> {
  const queryString = buildQueryParams(query);
  const response = await api.get(`/responses/export/csv/${queryString}`, {
    responseType: "blob",
  });
  return response.data as Blob;
}

export async function getAnalyticsSummary(query: {
  start_date?: string;
  end_date?: string;
  site_name?: string;
} = {}): Promise<AnalyticsSummaryResponse> {
  const params = new URLSearchParams();
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);
  if (query.site_name) params.set("site_name", query.site_name);

  const queryString = params.toString();
  const response = await api.get<AnalyticsSummaryResponse>(
    `/analytics/summary/${queryString ? `?${queryString}` : ""}`
  );
  return response.data;
}
