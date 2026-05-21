import { ApiError, ApiResponse, PaginatedResponse, UserRole, getAccessToken } from "@/lib/auth-api";

export type PayrollStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type PayrollUserRole = Exclude<UserRole, "ADMIN">;
export type PayrollReferenceType = "HARVEST" | "DELIVERY";

export interface PayrollUser {
  id: string;
  role: PayrollUserRole;
  name?: string;
}

export interface PayrollApprover {
  id: string;
  name?: string;
}

export interface Payroll {
  id: string;
  user?: PayrollUser;
  amount: number;
  kilogram: number;
  ratePerKg: number;
  multiplier: number;
  status: PayrollStatus;
  referenceType: PayrollReferenceType;
  referenceId?: string;
  description: string;
  rejectionReason?: string | null;
  approvedBy?: PayrollApprover | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PayrollDisbursement {
  adminWallet: {
    balanceBefore: number;
    balanceAfter: number;
  };
  workerWallet: {
    balanceBefore: number;
    balanceAfter: number;
  };
}

export interface PayrollActionResult {
  id: string;
  user: PayrollUser;
  amount: number;
  status: PayrollStatus;
  rejectionReason?: string | null;
  approvedBy?: PayrollApprover | null;
  approvedAt?: string | null;
  disbursement?: PayrollDisbursement;
}

export interface PayrollListParams {
  page?: number;
  size?: number;
  sort?: string;
  userId?: string;
  status?: PayrollStatus;
  userRole?: PayrollUserRole;
  referenceType?: PayrollReferenceType;
  dateFrom?: string;
  dateTo?: string;
}

export interface MyPayrollListParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: PayrollStatus;
  dateFrom?: string;
  dateTo?: string;
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

function buildPayrollQuery(params?: PayrollListParams) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.userId) query.set("userId", params.userId);
  if (params?.status) query.set("status", params.status);
  if (params?.userRole) query.set("userRole", params.userRole);
  if (params?.referenceType) query.set("referenceType", params.referenceType);
  if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params?.dateTo) query.set("dateTo", params.dateTo);

  return query.toString();
}

function buildMyPayrollQuery(params?: MyPayrollListParams) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.status) query.set("status", params.status);
  if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params?.dateTo) query.set("dateTo", params.dateTo);

  return query.toString();
}

export async function getPayrolls(params?: PayrollListParams) {
  const query = buildPayrollQuery(params);

  return request<PaginatedResponse<Payroll>>(`/payrolls${query ? `?${query}` : ""}`);
}

export async function getMyPayrolls(params?: MyPayrollListParams) {
  const query = buildMyPayrollQuery(params);

  return request<PaginatedResponse<Payroll>>(`/payrolls/me${query ? `?${query}` : ""}`);
}

export async function getPayrollDetail(payrollId: string) {
  return request<Payroll>(`/payrolls/${payrollId}`);
}

export async function acceptPayroll(payrollId: string) {
  return request<PayrollActionResult>(`/payrolls/${payrollId}/accept`, {
    method: "PUT",
    body: JSON.stringify({}),
  });
}

export async function rejectPayroll(payrollId: string, rejectionReason: string) {
  return request<PayrollActionResult>(`/payrolls/${payrollId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectionReason }),
  });
}
