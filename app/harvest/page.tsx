"use client";

import { useEffect, useState } from "react";
import { getMyHarvest } from "@/lib/api";
import Link from "next/link";

type Harvest = {
    id: string;
    kilogram: number;
    status: string;
    harvestDate: string;
};

export default function HarvestPage() {
    const [data, setData] = useState<Harvest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyHarvest().then((res) => {
            setData(res);
            setLoading(false);
        });
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Riwayat Panen</h1>

            {data.map((item) => (
                <Link key={item.id} href={`/harvest/${item.id}`}>
                    <div className="border p-4 mb-2 rounded hover:bg-gray-100">
                        <p>Kg: {item.kilogram}</p>
                        <p>Status: {item.status}</p>
                        <p>Tanggal: {item.harvestDate}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}