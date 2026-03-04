const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8082/api";

async function fetcher(url: string, options?: RequestInit) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Something went wrong");
    }

    return response.json();
}

// Get my harvest list
export async function getMyHarvest(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
}) {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, value]) => value !== "")
    );

    const query = new URLSearchParams(cleanParams as any).toString();
    const queryString = query ? `?${query}` : "";

    return fetcher(`${API_BASE}/harvest/my${queryString}`, {
        headers: {
            "X-USER-ID": "123e4567-e89b-12d3-a456-426614174000",
            "X-ROLE": "BURUH",
        },
    });
}
// Get harvest detail
export async function getHarvestDetail(id: string) {
    return fetcher(`${API_BASE}/harvest/${id}`);
}