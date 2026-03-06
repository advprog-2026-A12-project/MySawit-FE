"use client";

import { useEffect, useState } from "react";

interface Plantation {
    id: number;
    name: string;
    location: string;
}

const API_BASE = process.env.NEXT_PUBLIC_SAWIT_API_URL ?? "http://localhost:8082";

export default function PlantationsPage() {
    const [plantations, setPlantations] = useState<Plantation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPlantations() {
            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch(`${API_BASE}/api/plantations`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!res.ok) {
                    setError("Gagal mengambil data perkebunan.");
                    return;
                }
                const data = await res.json();
                setPlantations(data);
            } catch {
                setError("Tidak dapat terhubung ke server.");
            } finally {
                setLoading(false);
            }
        }
        fetchPlantations();
    }, []);

    return (
        <main className="min-h-screen bg-green-50 px-6 py-12">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-green-900 tracking-tight">
                        🌴 MySawit
                    </h1>
                    <p className="text-green-700 mt-1 text-lg">Daftar Perkebunan</p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-10 text-center">
                        <p className="text-gray-500 text-lg">Memuat data...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
                        {error}
                    </div>
                )}

                {/* Content */}
                {!loading && !error && plantations.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-10 text-center">
                        <p className="text-gray-400 text-lg">Belum ada data perkebunan.</p>
                    </div>
                ) : !loading && !error ? (
                    <div className="grid gap-4">
                        {plantations.map((p) => (
                            <div
                                key={p.id}
                                className="bg-white rounded-2xl shadow-sm border border-green-100 px-6 py-5 flex items-center justify-between hover:shadow-md transition-shadow"
                            >
                                <div>
                                    <h2 className="text-xl font-semibold text-green-900">{p.name}</h2>
                                    <p className="text-green-600 mt-1 flex items-center gap-1">
                                        <span>📍</span>
                                        <span>{p.location}</span>
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                  ID: {p.id}
                </span>
                            </div>
                        ))}
                    </div>
                ) : null}
                <p className="text-center text-xs text-gray-400 mt-10">
                    MySawit · {new Date().toLocaleDateString("id-ID")}
                </p>
            </div>
        </main>
    );
}