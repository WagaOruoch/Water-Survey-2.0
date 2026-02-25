import axios from "axios";
import {
  GoogleAuthResponse,
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
