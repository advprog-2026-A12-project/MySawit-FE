"use client";

import { useEffect, useState } from "react";
import { getMyHarvest } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Harvest = {
    id: string;
    kilogram: number;
    status: string;
    harvestDate: string;
};

export default function HarvestPage() {
    const [data, setData] = useState<Harvest[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getMyHarvest()
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <p className="text-center text-lg mt-10 text-black">Loading...</p>
        );

    if (data.length === 0)
        return (
            <div className="text-center text-lg mt-10 text-black">
                <p>Belum ada hasil panen</p>
            </div>
        );

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-black">Riwayat Panen</h1>
                <button
                    onClick={() => router.push("/harvest/create")}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                    Tambah Hasil Panen
                </button>
            </div>

            <div className="grid gap-4">
                {data.map((item) => (
                    <Link key={item.id} href={`/harvest/${item.id}`}>
                        <div className="bg-white border shadow-sm p-4 rounded-lg hover:shadow-md transition-all cursor-pointer">
                            <p className="text-black font-medium">Kg: {item.kilogram}</p>
                            <p className="text-black">Status: {item.status}</p>
                            <p className="text-black">Tanggal: {item.harvestDate}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}