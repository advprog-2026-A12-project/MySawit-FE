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

    // 1. Tambahkan state untuk filter
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("");

    // 2. Buat fungsi fetch terpisah agar bisa dipanggil ulang saat tombol filter ditekan
    const fetchHarvests = async () => {
        setLoading(true);
        try {
            const res = await getMyHarvest({
                startDate: startDate,
                endDate: endDate,
                status: status
            });

            setData(res);
        } catch (error) {
            console.error("Gagal mengambil data panen:", error);
        } finally {
            setLoading(false);
        }
    };

    // Panggil fetch pertama kali saat halaman dimuat
    useEffect(() => {
        fetchHarvests();
    }, []);

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

            {/* 3. Tambahkan UI Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">Dari Tanggal</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded p-2 text-black bg-white"
                    />
                </div>
                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">Sampai Tanggal</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded p-2 text-black bg-white"
                    />
                </div>
                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border rounded p-2 text-black bg-white"
                    >
                        <option value="">Semua Status</option>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                    </select>
                </div>
                <button
                    onClick={fetchHarvests}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors w-full md:w-auto"
                >
                    Terapkan Filter
                </button>
            </div>

            {/* Bagian List Data */}
            {loading ? (
                <p className="text-center text-lg mt-10 text-black">Loading...</p>
            ) : data.length === 0 ? (
                <div className="text-center text-lg mt-10 text-black">
                    <p>Belum ada hasil panen yang sesuai.</p>
                </div>
            ) : (
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
            )}
        </div>
    );
}