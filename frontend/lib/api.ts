import axios from "axios";
import { SurveySubmitPayload, SurveySubmitResponse } from "@/types/survey";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function submitSurveyResponse(
  payload: SurveySubmitPayload
): Promise<SurveySubmitResponse> {
  const response = await api.post<SurveySubmitResponse>("/responses/", payload);
  return response.data;
}
