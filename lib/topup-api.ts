import { ApiError, ApiResponse, PaginatedResponse, getAccessToken } from "@/lib/auth-api";

export type TopupStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

export interface TopupAdmin {
  id: string;
  name: string;
}

export interface TopupTransaction {
  id: string;
  admin?: TopupAdmin;
  amountSawitDollar: number;
  amountIdr: number;
  exchangeRate?: string;
  paymentGateway: string;
  gatewayReferenceId?: string;
  status: TopupStatus;
  paymentUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InitiateTopupPayload {
  amountSawitDollar: number;
}

export interface TopupHistoryParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: TopupStatus;
}

function normalizeApiBase(url: string | undefined) {
  const fallback =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8002"
      : "https://mysawit-payment-2df96a73ee96.herokuapp.com";

  const raw = (url || fallback).replace(/\/$/, "");

  if (raw.endsWith("/api/v1")) {
    return raw;
  }

  if (raw.endsWith("/api")) {
    return `${raw}/v1`;
  }

  return `${raw}/api/v1`;
}

const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_PAYMENT_API_URL);

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
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

function buildTopupQuery(params?: TopupHistoryParams) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.status) query.set("status", params.status);

  return query.toString();
}

export async function initiateTopup(payload: InitiateTopupPayload) {
  return request<TopupTransaction>("/topup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTopupHistory(params?: TopupHistoryParams) {
  const query = buildTopupQuery(params);

  return request<PaginatedResponse<TopupTransaction>>(`/topup${query ? `?${query}` : ""}`);
}

export async function getTopupDetail(topupId: string) {
  return request<TopupTransaction>(`/topup/${topupId}`);
}
