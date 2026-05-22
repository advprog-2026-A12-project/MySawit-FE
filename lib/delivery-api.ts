import { getToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://mysawit-sawit.onrender.com/api";

export async function deliveryFetcher(url: string, options?: RequestInit) {
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
        let errorMessage = "Something went wrong";
        const errText = await response.text(); 
        
        try {
            const errData = JSON.parse(errText);
            errorMessage = errData.message || errData.error || errorMessage;
        } catch {
            errorMessage = errText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export interface CreateDeliveryData {
    supirId: string;
    supirName: string;
    harvestIds: string[];
    payloadKg: number;
}

export interface Delivery {
    id: string;
    supirId: string;
    supirName: string;
    mandorId: string;
    mandorName: string;
    harvestIds: string[];
    payloadKg: number;
    approvedPayloadKg?: number;
    status: string;
    approvalStatus: string;
    rejectionReason?: string;
    sentAt?: string;
    arrivedAt?: string;
    createdAt: string;
    tanggal: string;
    updatedAt: string;
}

export async function createDelivery(data: CreateDeliveryData): Promise<Delivery> {
    return deliveryFetcher(`${API_BASE}/deliveries`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getDeliveries(params?: { supirName?: string; mandorId?: string; date?: string }): Promise<Delivery[]> {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([, v]) => v !== "" && v !== undefined)
    ) as Record<string, string>;

    const query = new URLSearchParams(cleanParams).toString();
    return deliveryFetcher(`${API_BASE}/deliveries${query ? `?${query}` : ""}`);
}

export async function getSupirTasks(): Promise<Delivery[]> {
    return deliveryFetcher(`${API_BASE}/deliveries/supir-tasks`);
}

export async function advanceDeliveryStatus(id: string): Promise<Delivery> {
    return deliveryFetcher(`${API_BASE}/deliveries/${id}/status`, {
        method: "PATCH",
    });
}

export async function mandorApproveDelivery(id: string, isApproved: boolean, rejectionReason?: string): Promise<Delivery> {
    const query = new URLSearchParams({
        isApproved: isApproved.toString(),
        ...(rejectionReason ? { rejectionReason } : {}),
    }).toString();
    return deliveryFetcher(`${API_BASE}/deliveries/${id}/mandor-approval?${query}`, {
        method: "PATCH",
    });
}

export async function adminApproveDelivery(id: string, isApproved: boolean, approvedPayloadKg?: number, rejectionReason?: string): Promise<Delivery> {
    const query = new URLSearchParams({
        isApproved: isApproved.toString(),
        ...(approvedPayloadKg ? { approvedPayloadKg: approvedPayloadKg.toString() } : {}),
        ...(rejectionReason ? { rejectionReason } : {}),
    }).toString();
    return deliveryFetcher(`${API_BASE}/deliveries/${id}/admin-approval?${query}`, {
        method: "PATCH",
    });
}

export async function getSupirList(name?: string) {
    const query = new URLSearchParams(name ? { name } : {}).toString();
    return deliveryFetcher(`${API_BASE}/supir-list${query ? `?${query}` : ""}`);
}
