"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getHarvestDetail } from "@/lib/api";

interface HarvestDetail {
    id: string;
    kilogram: number;
    status: string;
    reportNote: string;
    photos: string[];
}

export default function HarvestDetailPage() {
    const { id } = useParams();
    const [data, setData] = useState<HarvestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError("");
            try {
                const res = await getHarvestDetail(id as string);
                setData(res);
            } catch (err) {
                if (err instanceof Error) setError(err.message);
                else setError("Terjadi kesalahan saat mengambil data");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading)
        return (
            <p className="text-center text-lg mt-10 text-gray-500">Loading...</p>
        );

    if (error)
        return (
            <p className="text-center text-lg mt-10 text-red-500">{error}</p>
        );

    if (!data)
        return (
            <p className="text-center text-lg mt-10 text-gray-500">
                Data tidak ditemukan
            </p>
        );

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center p-6">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md text-black">
                <h1 className="text-3xl font-bold mb-6 text-center">Detail Panen</h1>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between bg-gray-100 rounded-md p-3">
                        <span className="font-semibold">Jumlah (Kg):</span>
                        <span>{data.kilogram}</span>
                    </div>

                    <div className="flex justify-between bg-gray-100 rounded-md p-3">
                        <span className="font-semibold">Status:</span>
                        <span>{data.status}</span>
                    </div>

                    <div className="flex justify-between bg-gray-100 rounded-md p-3">
                        <span className="font-semibold">Catatan:</span>
                        <span>{data.reportNote || "-"}</span>
                    </div>
                </div>

                {data.photos && data.photos.length > 0 && (
                    <div>
                        <p className="font-semibold mb-2">Foto Panen:</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {data.photos.map((url, idx) => (
                                <img
                                    key={idx}
                                    src={`${BACKEND_URL}${url}`}
                                    alt={`Foto panen ${idx + 1}`}
                                    className="w-28 h-28 object-cover rounded-lg border border-gray-300 shadow-sm"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}