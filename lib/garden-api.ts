// Garden API module - dedicated API functions for Manajemen kebun.

// TYPES
export type SupirDetail = {
	id: string;
	name: string | null;
	email: string | null;
	assignedAt: string;
};

export type KebunSummary = {
	id: string;
	nama: string;
	kode: string;
	luasHektare: number;
	mandorId: string | null;
	mandorName: string | null;
	totalSupir: number;
	isActive: boolean;
	createdAt: string;
};

export type KebunDetail = {
	id: string;
	nama: string;
	kode: string;
	luasHektare: number;
	coord1Lat: number;
	coord1Lng: number;
	coord2Lat: number;
	coord2Lng: number;
	coord3Lat: number;
	coord3Lng: number;
	coord4Lat: number;
	coord4Lng: number;
	mandorId: string | null;
	mandorName: string | null;
	mandorEmail: string | null;
	supirList: SupirDetail[];
	totalSupir: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ApiResponse<T> = {
	status: "success" | "error";
	message: string;
	data: T;
	timestamp: string;
	errors?: Array<{ field: string; message: string }>;
};

export type KebunCreatePayload = {
	nama: string;
	kode: string;
	luasHektare: number;
	coord1Lat: number;
	coord1Lng: number;
	coord2Lat: number;
	coord2Lng: number;
	coord3Lat: number;
	coord3Lng: number;
	coord4Lat: number;
	coord4Lng: number;
};

export type KebunUpdatePayload = Omit<KebunCreatePayload, "kode">;

// BASE CONFIG
const isLocal =
	typeof window !== "undefined" &&
	(window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1" ||
		window.location.hostname.startsWith("192.168."));

const API_BASE = isLocal
	? `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8082/api/kebun`
	: "https://mysawit-sawit.onrender.com/api/kebun";

// TOKEN HELPER
function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem("accessToken");
}

// BASE FETCHER
async function gardenFetcher<T>(
	url: string,
	options?: RequestInit
): Promise<ApiResponse<T>> {
	const token = getToken();

	const res = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options?.headers,
		},
	});

	const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

	if (!res.ok) {
		const errorMessage =
			body?.message ||
			(body?.errors?.map((e) => `${e.field}: ${e.message}`).join(" | ")) ||
			`Request failed (${res.status})`;
		throw new Error(errorMessage);
	}

	if (!body) {
		throw new Error("Server response tidak valid");
	}

	return body;
}

// KEBUN CRUD
export async function getKebunList(params?: {
	nama?: string;
	kode?: string;
}): Promise<ApiResponse<KebunSummary[]>> {
	const query = new URLSearchParams();
	if (params?.nama?.trim()) query.set("nama", params.nama.trim());
	if (params?.kode?.trim()) query.set("kode", params.kode.trim());
	const suffix = query.toString() ? `?${query}` : "";

	return gardenFetcher<KebunSummary[]>(`${API_BASE}${suffix}`);
}

export async function getKebunDetail(
	id: string
): Promise<ApiResponse<KebunDetail>> {
	return gardenFetcher<KebunDetail>(`${API_BASE}/${id}`);
}

export async function createKebun(
	payload: KebunCreatePayload
): Promise<ApiResponse<KebunDetail>> {
	return gardenFetcher<KebunDetail>(API_BASE, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function updateKebun(
	id: string,
	payload: KebunUpdatePayload
): Promise<ApiResponse<KebunDetail>> {
	return gardenFetcher<KebunDetail>(`${API_BASE}/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteKebun(
	id: string
): Promise<ApiResponse<null>> {
	return gardenFetcher<null>(`${API_BASE}/${id}`, {
		method: "DELETE",
	});
}

// MANDOR ASSIGNMENT
export async function assignMandor(
	kebunId: string,
	mandorId: string
): Promise<ApiResponse<KebunDetail>> {
	return gardenFetcher<KebunDetail>(`${API_BASE}/${kebunId}/assign-mandor`, {
		method: "POST",
		body: JSON.stringify({ mandorId }),
	});
}

export async function unassignMandor(
	kebunId: string
): Promise<ApiResponse<KebunDetail>> {
	return gardenFetcher<KebunDetail>(`${API_BASE}/${kebunId}/mandor`, {
		method: "DELETE",
	});
}

// SUPIR ASSIGNMENT
export async function assignSupir(
	kebunId: string,
	supirId: string
): Promise<ApiResponse<unknown>> {
	return gardenFetcher<unknown>(`${API_BASE}/${kebunId}/assign-supir`, {
		method: "POST",
		body: JSON.stringify({ supirId }),
	});
}

export async function unassignSupir(
	kebunId: string,
	supirId: string
): Promise<ApiResponse<null>> {
	return gardenFetcher<null>(`${API_BASE}/${kebunId}/supir/${supirId}`, {
		method: "DELETE",
	});
}
