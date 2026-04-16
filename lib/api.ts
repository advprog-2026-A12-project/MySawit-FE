import {getUsers, UserProfile} from "@/lib/auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://mysawit-sawit.onrender.com/api";
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "https://mysawit-auth.onrender.com/api/v1";

// ── Token helpers ──────────────────────────────────────────────
export function getToken(): string | null {
    return localStorage.getItem("accessToken");
}
export function getUser(): UserProfile | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem("user");
    if (!raw) return null;

    try {
        return JSON.parse(raw) as UserProfile;
    } catch {
        return null;
    }
}

// ── Base fetcher ───────────────────────────────────────────────
async function fetcher(url: string, options?: RequestInit) {
    const token = getToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Something went wrong");
    }

    return response.json();
}

// Fetcher khusus multipart (tidak set Content-Type, biar browser set boundary)
async function fetcherMultipart(url: string, formData: FormData) {
    const token = getToken();

    const response = await fetch(url, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Terjadi kesalahan saat submit");
    }

    return response.json();
}

// ── Auth ───────────────────────────────────────────────────────
import { login as authLogin, persistAuthSession } from "@/lib/auth-api";

export async function login(email: string, password: string) {
    const res = await authLogin({ email, password });

    persistAuthSession(res.data); // simpan token + user
    return res;
}
// ── BURUH: Submit panen (dengan foto) ─────────────────────────
export async function submitHarvest(params: {
    kilogram: number;
    reportNote: string;
    photos?: File[];
}) {
    const formData = new FormData();
    formData.append("kilogram", params.kilogram.toString());
    formData.append("reportNote", params.reportNote);
    params.photos?.forEach((photo) => formData.append("photos", photo));

    return fetcherMultipart(`${API_BASE}/harvest`, formData);
}

// ── BURUH: Lihat panen sendiri ─────────────────────────────────
export async function getMyHarvest(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
}) {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== "" && v !== undefined)
    ) as Record<string, string>;

    const query = new URLSearchParams(cleanParams).toString();
    return fetcher(`${API_BASE}/harvest/my${query ? `?${query}` : ""}`);
}

// ── MANDOR: Lihat panen bawahan ────────────────────────────────
export async function getPanenBawahan(params?: {
    buruhId?: string;
    tanggalPanen?: string;
}) {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== "" && v !== undefined)
    ) as Record<string, string>;

    const query = new URLSearchParams(cleanParams).toString();
    return fetcher(`${API_BASE}/harvest/bawahan${query ? `?${query}` : ""}`);
}

// ── MANDOR: Approve ────────────────────────────────────────────
export async function approvePanen(id: string) {
    return fetcher(`${API_BASE}/harvest/${id}/approve`, {
        method: "PATCH",
    });
}

// ── MANDOR: Reject ─────────────────────────────────────────────
export async function rejectPanen(id: string, rejectionReason: string) {
    return fetcher(`${API_BASE}/harvest/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason }),
    });
}

// ── Detail & Delete ────────────────────────────────────────────
export async function getHarvestDetail(id: string) {
    return fetcher(`${API_BASE}/harvest/${id}`);
}

export async function deleteHarvest(id: string) {
    await fetcher(`${API_BASE}/harvest/${id}`, { method: "DELETE" });
    return true;
}
