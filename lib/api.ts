import { login as authLogin, persistAuthSession, UserProfile } from "@/lib/auth-api";

// =========================
// BASE CONFIG
// =========================
const isLocal =
    typeof window !== "undefined" &&
    window.location.hostname === "localhost";

const API_BASE = isLocal
    ? "http://localhost:8082/api"
    : "https://mysawit-sawit.onrender.com/api";

const AUTH_BASE =
    process.env.NEXT_PUBLIC_AUTH_URL ||
    "https://mysawit-auth.onrender.com/api/v1";

// =========================
// TOKEN HELPERS
// =========================
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

// =========================
// BASE FETCHER (JSON)
// =========================
async function fetcher(url: string, options?: RequestInit) {
    const token = getToken();

    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
    }

    return res.json();
}

// =========================
// MULTIPART FETCHER
// =========================
async function fetcherMultipart(url: string, formData: FormData) {
    const token = getToken();

    const res = await fetch(url, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Upload gagal");
    }

    return res.json();
}

// =========================
// AUTH LOGIN
// =========================
export async function login(email: string, password: string) {
    const res = await authLogin({ email, password });

    persistAuthSession(res.data);
    return res;
}

// =========================
// BURUH: SUBMIT HARVEST
// =========================
export async function submitHarvest(params: {
    kilogram: number;
    reportNote: string;
    photos?: File[];
}) {
    const formData = new FormData();

    formData.append("kilogram", params.kilogram.toString());
    formData.append("reportNote", params.reportNote);

    params.photos?.forEach((p) => {
        formData.append("photos", p);
    });

    return fetcherMultipart(`${API_BASE}/harvest`, formData);
}

// =========================
// BURUH: MY HARVEST
// =========================
export async function getMyHarvest(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
}) {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(
            ([_, v]) => v !== "" && v !== undefined
        )
    ) as Record<string, string>;

    const query = new URLSearchParams(cleanParams).toString();

    return fetcher(
        `${API_BASE}/harvest/my${query ? `?${query}` : ""}`
    );
}

// =========================
// MANDOR: GET BAWAHAN
// =========================
export async function getPanenBawahan(params?: {
    buruhId?: string;
    tanggalPanen?: string;
}) {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(
            ([_, v]) => v !== "" && v !== undefined
        )
    ) as Record<string, string>;

    const query = new URLSearchParams(cleanParams).toString();

    return fetcher(
        `${API_BASE}/harvest/bawahan${query ? `?${query}` : ""}`
    );
}

// =========================
// MANDOR: GET BURUH LIST
// =========================
export async function getMandorBuruhs(
    mandorId: string,
    params?: { page?: number; size?: number; name?: string }
) {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(
            ([_, v]) => v !== "" && v !== undefined
        )
    ) as Record<string, string>;

    const query = new URLSearchParams(cleanParams).toString();

    return fetcher(
        `${AUTH_BASE}/mandors/${mandorId}/buruhs${query ? `?${query}` : ""}`
    );
}

// =========================
// MANDOR: APPROVE
// =========================
export async function approvePanen(id: string) {
    return fetcher(`${API_BASE}/harvest/${id}/approve`, {
        method: "PATCH",
    });
}

// =========================
// MANDOR: REJECT
// =========================
export async function rejectPanen(
    id: string,
    rejectionReason: string
) {
    return fetcher(`${API_BASE}/harvest/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason }),
    });
}

// =========================
// DETAIL HARVEST
// =========================
export async function getHarvestDetail(id: string) {
    return fetcher(`${API_BASE}/harvest/${id}`);
}

// =========================
// DELETE HARVEST
// =========================
export async function deleteHarvest(id: string) {
    await fetcher(`${API_BASE}/harvest/${id}`, {
        method: "DELETE",
    });

    return true;
}