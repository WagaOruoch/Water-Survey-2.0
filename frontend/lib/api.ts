import axios from "axios";
import {
  DashboardRecentActivityItem,
  DashboardSummaryResponse,
  GoogleAuthResponse,
  PaginatedSurveyResponses,
  SurveyResponseDetail,
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
export const AUTH_EXPIRED_EVENT = "surveycorp-auth-expired";

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
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
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

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function signInWithGoogle(
  idToken: string
): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>("/auth/google/", {
    id_token: idToken,
  });
  setAccessToken(response.data.access);
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
