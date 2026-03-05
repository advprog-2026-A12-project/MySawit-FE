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


// GET MY HARVEST LIST
export async function getMyHarvest(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
}) {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(
            ([_, value]) => value !== "" && value !== undefined
        )
    ) as Record<string, string>;

    const query = new URLSearchParams(cleanParams).toString();
    const queryString = query ? `?${query}` : "";

    return fetcher(`${API_BASE}/harvest/my${queryString}`);
}


// GET HARVEST DETAIL
export async function getHarvestDetail(id: string) {
    return fetcher(`${API_BASE}/harvest/${id}`);
}


// DELETE HARVEST
export async function deleteHarvest(id: string) {
    await fetcher(`${API_BASE}/harvest/${id}`, {
        method: "DELETE",
    });

    return true;
}