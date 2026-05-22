import { ApiError, ApiResponse, PaginatedResponse, getAccessToken } from "@/lib/auth-api";
import { PAYMENT_BACKEND_BASE_URL } from "@/lib/backend-env";

export interface WageConfigUser {
  id: string;
}

export interface PreviousWageConfig {
  id: string;
  upahBuruhPerKg: number;
  upahSupirPerKg: number;
  upahMandorPerKg: number;
  deactivatedAt: string;
}

export interface WageConfig {
  id: string;
  upahBuruhPerKg: number;
  upahSupirPerKg: number;
  upahMandorPerKg: number;
  currency: string;
  isActive: boolean;
  previousConfig?: PreviousWageConfig | null;
  updatedBy: WageConfigUser;
  effectiveFrom: string;
  createdAt?: string;
}

export interface WageConfigPayload {
  upahBuruhPerKg: number;
  upahSupirPerKg: number;
  upahMandorPerKg: number;
}

export interface WageConfigHistoryParams {
  page?: number;
  size?: number;
}

function normalizeApiBase(url: string) {
  const raw = url.replace(/\/$/, "");

  if (raw.endsWith("/api/v1")) {
    return raw;
  }

  if (raw.endsWith("/api")) {
    return `${raw}/v1`;
  }

  return `${raw}/api/v1`;
}

const API_BASE = normalizeApiBase(PAYMENT_BACKEND_BASE_URL);

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  let body: ApiResponse<T> | null = null;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(
      body?.message || "Terjadi kesalahan saat menghubungi payment service",
      response.status,
      body?.field,
      body?.errors
    );
  }

  if (!body) {
    throw new ApiError("Response payment service tidak valid", response.status);
  }

  return body;
}

export async function getActiveWageConfig() {
  return request<WageConfig>("/wage-configs/active");
}

export async function updateWageConfig(payload: WageConfigPayload) {
  return request<WageConfig>("/wage-configs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getWageConfigHistory(params?: WageConfigHistoryParams) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));

  return request<PaginatedResponse<WageConfig>>(
    `/wage-configs/history${query.toString() ? `?${query}` : ""}`
  );
}
