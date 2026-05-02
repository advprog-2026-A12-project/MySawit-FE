"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getHarvestDetail } from "@/lib/api";
import Image from "next/image";

interface HarvestDetail {
    id: string;
    kilogram: number;
    status: string;
    reportNote: string;
    rejectionReason?: string;
    bisaDiangkutTruk?: boolean;
    photos: string[];
    harvestDate?: string;
}

export default function HarvestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === "string" ? params.id : undefined;

    const [data, setData] = useState<HarvestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        async function fetchData() {
            setLoading(true);
            setError("");
            try {
                const res = await getHarvestDetail(id as string);
                setData(res);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil data");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const renderStatusBadge = (s: string) => {
        if (s === "APPROVED") return "bg-green-100 text-green-800 border-green-200";
        if (s === "REJECTED") return "bg-red-100 text-red-800 border-red-200";
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 animate-pulse font-medium">Memuat rincian...</p></div>;
    if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-500 font-medium">❌ {error}</p></div>;
    if (!data) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 font-medium">Data tidak ditemukan</p></div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8 text-black font-sans">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900">Rincian Laporan</h1>
                        <p className="text-sm text-gray-500 mt-1">ID: {data.id}</p>
                    </div>
                    <button onClick={() => router.back()} className="text-sm font-semibold text-gray-500 hover:text-blue-900 transition-colors">
                        ← Kembali
                    </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
                    <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center">
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Informasi Panen</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${renderStatusBadge(data.status)}`}>
                            {data.status}
                        </span>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-[10px] uppercase font-bold text-blue-400 leading-none mb-2">Berat Total</p>
                                <p className="text-2xl font-black text-blue-900">{data.kilogram} <span className="text-sm font-normal">Kg</span></p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-2">Logistik</p>
                                <p className="text-sm font-bold text-gray-700">
                                    {data.bisaDiangkutTruk ? "✅ Siap Angkut" : "⏳ Menunggu Verifikasi"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Catatan Laporan</p>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 italic text-gray-700 text-sm">
                                &quot;{data.reportNote || "Tidak ada catatan tambahan."}&quot;
                            </div>
                        </div>

                        {data.status === "REJECTED" && data.rejectionReason && (
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-red-400">Alasan Penolakan Mandor</p>
                                <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-800 text-sm font-medium">
                                    {data.rejectionReason}
                                </div>
                            </div>
                        )}

                        {data.photos && data.photos.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-3">Lampiran Foto Bukti</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {data.photos.map((url, idx) => (
                                        <div key={idx} className="group relative overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-hover hover:border-blue-300">
                                            <Image
                                                src={url}
                                                alt={`Bukti ${idx + 1}`}
                                                width={400}
                                                height={300}
                                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}