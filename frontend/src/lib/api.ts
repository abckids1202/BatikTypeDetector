import type { Analysis, Motif } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API_URL + path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(body.detail ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

export async function analyzeImage(file: File): Promise<Analysis> {
  const form = new FormData();
  form.append("file", file);
  return request<Analysis>("/analyses", { method: "POST", body: form });
}

export async function getMotifs(): Promise<Motif[]> {
  return request<Motif[]>("/motifs");
}

