import type { ApplicationContent, JobResult, ResearchResponse, SearchValues } from "@/lib/types";

/** Public backend origin. Never place API keys in frontend code. */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured && configured.length > 0
    ? configured.replace(/\/$/, "")
    : "http://localhost:8000";
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "string" && detail.trim()) return detail;
    }
  } catch {
    /* Response was not JSON. */
  }
  if (response.status === 404) {
    return "The research service is not available yet.";
  }
  return "MIRAI PATH could not complete that request.";
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/health`, { cache: "no-store" });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return (
      !!body &&
      typeof body === "object" &&
      "service" in body &&
      (body as { service: unknown }).service === "mirai-path"
    );
  } catch {
    return false;
  }
}

export async function researchJobs(
  values: SearchValues,
  sessionId: string,
): Promise<ResearchResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Session-Id": sessionId,
    },
    body: JSON.stringify(values),
  });
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("jobs" in body) || !Array.isArray(body.jobs)) {
    throw new ApiError(response.status, "The research service returned an unexpected response.");
  }
  return body as ResearchResponse;
}

export async function uploadResume(file: File, sessionId: string): Promise<void> {
  const data = new FormData();
  data.set("file", file);
  const response = await fetch(`${getApiBaseUrl()}/api/upload-resume`, {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
    body: data,
  });
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
}

export async function removeResume(sessionId: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/upload-resume`, {
    method: "DELETE",
    headers: { "X-Session-Id": sessionId },
  });
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
}

export async function generateApplication(
  job: JobResult,
  sessionId: string,
): Promise<ApplicationContent> {
  const response = await fetch(`${getApiBaseUrl()}/api/generate-application`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Session-Id": sessionId,
    },
    body: JSON.stringify({ jobId: job.id }),
  });
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  return (await response.json()) as ApplicationContent;
}

export async function clearMemory(sessionId: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/memory/clear`, {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
  });
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
}

export function sessionId(): string {
  const key = "mirai-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = window.crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}
