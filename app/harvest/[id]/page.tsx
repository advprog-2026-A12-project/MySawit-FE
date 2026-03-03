"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchHarvestDetail } from "@/lib/api";

export default function HarvestDetailPage() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchHarvestDetail(id as string).then(setData);
    }, [id]);

    if (!data) return <p>Loading...</p>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Detail Panen</h1>
            <p>Kg: {data.kilogram}</p>
            <p>Status: {data.status}</p>
            <p>Catatan: {data.reportNote}</p>
        </div>
    );
}