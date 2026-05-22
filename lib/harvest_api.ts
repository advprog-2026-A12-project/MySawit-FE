import {
    login as authLogin,
    persistAuthSession,
    UserProfile,
    getAccessToken,
} from "@/lib/auth-api";

// =========================
// BASE CONFIG
// =========================
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL;

if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

if (!AUTH_BASE) {
    throw new Error("NEXT_PUBLIC_AUTH_API_URL is not defined");
}

// =========================
// HELPER
// =========================
function cleanObject(
    params?: Record<string, string | number | undefined>
) {
    return Object.fromEntries(
        Object.entries(params || {}).filter(
            ([, v]) => v !== "" && v !== undefined
        )
    ) as Record<string, string>;
}

// =========================
// TOKEN HELPERS
// =========================
export function getToken(): string | null {
    return getAccessToken();
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
        const errText = await res.text();
        throw new Error(errText || "Upload gagal");
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

    params.photos?.forEach((photo) => {
        formData.append("photos", photo);
    });

    // REVISI: Tambahkan /api
    return fetcherMultipart(`${API_BASE}/api/harvest`, formData);
}

// =========================
// BURUH: MY HARVEST
// =========================
export async function getMyHarvest(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
}) {
    const query = new URLSearchParams(cleanObject(params)).toString();

    // REVISI: Tambahkan /api
    return fetcher(`${API_BASE}/api/harvest/my${query ? `?${query}` : ""}`);
}

// =========================
// MANDOR: GET BAWAHAN
// =========================
export async function getPanenBawahan(params?: {
    buruhId?: string;
    tanggalPanen?: string;
}) {
    const query = new URLSearchParams(cleanObject(params)).toString();

    // REVISI: Tambahkan /api
    return fetcher(`${API_BASE}/api/harvest/bawahan${query ? `?${query}` : ""}`);
}

// =========================
// MANDOR: GET BURUH LIST
// =========================
export async function getMandorBuruhs(
    mandorId: string,
    params?: {
        page?: number;
        size?: number;
        name?: string;
    }
) {
    const query = new URLSearchParams(
        cleanObject(params as Record<string, string | number | undefined>)
    ).toString();

    return fetcher(
        `${AUTH_BASE}/api/v1/mandors/${mandorId}/buruhs${query ? `?${query}` : ""}`
    );
}

// =========================
// MANDOR: APPROVE
// =========================
export async function approvePanen(id: string) {
    // REVISI: Tambahkan /api
    return fetcher(`${API_BASE}/api/harvest/${id}/approve`, {
        method: "PATCH",
    });
}

// =========================
// MANDOR: REJECT
// =========================
export async function rejectPanen(id: string, rejectionReason: string) {
    // REVISI: Tambahkan /api
    return fetcher(`${API_BASE}/api/harvest/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason }),
    });
}

// =========================
// DETAIL HARVEST
// =========================
export async function getHarvestDetail(id: string) {
    // REVISI: Tambahkan /api
    return fetcher(`${API_BASE}/api/harvest/${id}`);
}

// =========================
// DELETE HARVEST
// =========================
export async function deleteHarvest(id: string) {
    // REVISI: Tambahkan /api
    await fetcher(`${API_BASE}/api/harvest/${id}`, {
        method: "DELETE",
    });

    return true;
}