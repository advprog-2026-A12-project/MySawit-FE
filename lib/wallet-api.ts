import { ApiError, ApiResponse, PaginatedResponse, getAccessToken } from "@/lib/auth-api";
import { PAYMENT_BACKEND_BASE_URL } from "@/lib/backend-env";

export type WalletTransactionType = "CREDIT" | "DEBIT";
export type WalletReferenceType = "PAYROLL_DISBURSEMENT" | "PAYROLL_DEDUCTION" | "TOPUP" | string;

export interface Wallet {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  transactionType: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: WalletReferenceType;
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface WalletTransactionParams {
  page?: number;
  size?: number;
  sort?: string;
  transactionType?: WalletTransactionType;
  dateFrom?: string;
  dateTo?: string;
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

async function request<T>(path: string): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      body?.message || "Terjadi kesalahan saat mengambil data wallet",
      response.status,
      body?.field,
      body?.errors
    );
  }

  if (!body) {
    throw new ApiError("Response wallet tidak valid", response.status);
  }

  return body;
}

function buildQuery(params?: WalletTransactionParams) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.transactionType) query.set("transactionType", params.transactionType);
  if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params?.dateTo) query.set("dateTo", params.dateTo);

  return query.toString();
}

export async function getMyWallet() {
  return request<Wallet>("/wallets/me");
}

export async function getWalletByUserId(userId: string) {
  return request<Wallet>(`/wallets/${userId}`);
}

export async function getMyWalletTransactions(params?: WalletTransactionParams) {
  const query = buildQuery(params);

  return request<PaginatedResponse<WalletTransaction>>(
    `/wallets/me/transactions${query ? `?${query}` : ""}`
  );
}
