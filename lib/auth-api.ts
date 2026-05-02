export type UserRole = "ADMIN" | "BURUH" | "MANDOR" | "SUPIR_TRUK";

export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
  timestamp: string;
  field?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface GoogleAuthPayload {
  authorizationCode: string;
  redirectUri?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  active?: boolean;
  oauthProvider?: string | null;
  mandorCertificationNumber?: string | null;
  roleSpecificData?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface UserListItem {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  mandorCertificationNumber?: string;
  createdAt: string;
}

export interface AssignmentItem {
  id: string;
  buruh: { id: string; name: string; email: string };
  mandor: { id: string; name: string; email: string };
  assignedAt: string;
}

export class ApiError extends Error {
  status: number;
  field?: string;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, field?: string, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
    this.errors = errors;
  }
}

const AUTH_EVENT_NAME = "mysawit-auth-change";

function normalizeApiBase(url: string | undefined) {
  const raw = (url || "http://localhost:8001").replace(/\/$/, "");
  if (raw.endsWith("/api/v1")) {
    return raw;
  }
  return `${raw}/api/v1`;
}

const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_AUTH_API_URL);

export function toAuthUrl(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME));
}

export function subscribeAuthChange(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT_NAME, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT_NAME, callback);
  };
}

export function persistAuthSession(tokens: LoginResponseData, profile?: UserProfile | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

  if (profile) {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }

  emitAuthChange();
}

export function persistUserProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
  emitAuthChange();
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emitAuthChange();
}

async function request<T>(
  path: string,
  options?: RequestInit & { withAuth?: boolean; skipContentType?: boolean }
): Promise<ApiResponse<T>> {
  const headers = new Headers(options?.headers || {});

  if (!options?.skipContentType && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options?.withAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let body: ApiResponse<T> | null = null;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(
      body?.message || "Terjadi kesalahan saat menghubungi server",
      response.status,
      body?.field,
      body?.errors
    );
  }

  if (!body) {
    throw new ApiError("Response server tidak valid", response.status);
  }

  return body;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "ADMIN">;
  mandorCertificationNumber?: string | null;
}) {
  return request<UserProfile>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string }) {
  return request<LoginResponseData>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginWithGoogle(payload: GoogleAuthPayload) {
  return request<LoginResponseData>("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      authorizationCode: payload.authorizationCode,
      redirectUri: payload.redirectUri ?? "postmessage",
    }),
  });
}

export async function refreshToken(refreshTokenValue: string) {
  return request<LoginResponseData>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

export async function logout(refreshTokenValue: string) {
  return request<null>("/auth/logout", {
    method: "POST",
    withAuth: true,
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

export async function getMe() {
  return request<UserProfile>("/users/me", {
    method: "GET",
    withAuth: true,
  });
}

export async function updateMe(payload: { name?: string; password?: string }) {
  return request<UserProfile>("/users/me", {
    method: "PUT",
    withAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function getUsers(params?: {
  page?: number;
  size?: number;
  sort?: string;
  name?: string;
  email?: string;
  role?: UserRole;
}) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.name) query.set("name", params.name);
  if (params?.email) query.set("email", params.email);
  if (params?.role) query.set("role", params.role);

  const suffix = query.toString() ? `?${query}` : "";

  return request<PaginatedResponse<UserListItem>>(`/users${suffix}`, {
    method: "GET",
    withAuth: true,
  });
}

export async function getUserDetail(userId: string) {
  return request<UserProfile>(`/users/${userId}`, {
    method: "GET",
    withAuth: true,
  });
}

export async function deleteUser(userId: string) {
  return request<{ id: string; email: string; name: string; deletedAt: string }>(`/users/${userId}`, {
    method: "DELETE",
    withAuth: true,
  });
}

export async function getAssignments(params?: {
  page?: number;
  size?: number;
  mandorId?: string;
  buruhName?: string;
  mandorName?: string;
}) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));
  if (params?.mandorId) query.set("mandorId", params.mandorId);
  if (params?.buruhName) query.set("buruhName", params.buruhName);
  if (params?.mandorName) query.set("mandorName", params.mandorName);

  const suffix = query.toString() ? `?${query}` : "";

  return request<PaginatedResponse<AssignmentItem>>(`/assignments/buruh-mandor${suffix}`, {
    method: "GET",
    withAuth: true,
  });
}

export async function assignBuruhToMandor(payload: { buruhId: string; mandorId: string }) {
  return request<AssignmentItem>("/assignments/buruh-mandor", {
    method: "POST",
    withAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function reassignBuruhMandor(payload: { buruhId: string; newMandorId: string }) {
  return request<AssignmentItem>(`/assignments/buruh-mandor/${payload.buruhId}`, {
    method: "PUT",
    withAuth: true,
    body: JSON.stringify({ newMandorId: payload.newMandorId }),
  });
}

export async function unassignBuruhMandor(buruhId: string) {
  return request<AssignmentItem>(`/assignments/buruh-mandor/${buruhId}`, {
    method: "DELETE",
    withAuth: true,
  });
}

export async function getMandorBuruhs(mandorId: string, params?: { page?: number; size?: number; name?: string }) {
  const query = new URLSearchParams();

  if (typeof params?.page === "number") query.set("page", String(params.page));
  if (typeof params?.size === "number") query.set("size", String(params.size));
  if (params?.name) query.set("name", params.name);

  const suffix = query.toString() ? `?${query}` : "";

  return request<PaginatedResponse<{ id: string; name: string; email: string; assignedAt: string }>>(
    `/mandors/${mandorId}/buruhs${suffix}`,
    {
      method: "GET",
      withAuth: true,
    }
  );
}

export const roleOptions: UserRole[] = ["ADMIN", "BURUH", "MANDOR", "SUPIR_TRUK"];
