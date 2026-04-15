"use client";

import { useEffect, useState } from "react";
import { getMyHarvest, deleteHarvest, getUser } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Harvest = {
    id: string;
    kilogram: number;
    status: string;
    harvestDate: string;
    rejectionReason?: string;
};

export default function HarvestPage() {
    const [data, setData] = useState<Harvest[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("");
    const router = useRouter();

    const user = getUser(); // ambil dari localStorage
    const isMandor = user?.role === "MANDOR";

    const fetchHarvests = async () => {
        setLoading(true);
        try {
            const res = await getMyHarvest({ startDate, endDate, status });
            setData(res);
        } catch (error) {
            console.error("Gagal mengambil data panen:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Kalau Mandor, langsung redirect ke halaman mandor
        if (isMandor) {
            router.push("/harvest/mandor");
            return;
        }
        fetchHarvests();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (!confirm("Yakin ingin menghapus riwayat ini?")) return;
        try {
            await deleteHarvest(id);
            alert("Data berhasil dihapus!");
            fetchHarvests();
        } catch (error) {
            alert("Gagal menghapus data.");
        }
    };

    const statusBadge = (s: string) => {
        if (s === "APPROVED") return "bg-green-100 text-green-700";
        if (s === "REJECTED") return "bg-red-100 text-red-700";
        return "bg-yellow-100 text-yellow-700";
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Riwayat Panen</h1>
                <button
                    onClick={() => router.push("/harvest/create")}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Tambah Hasil Panen
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">Dari Tanggal</label>
                    <input type="date" value={startDate}
                           onChange={(e) => setStartDate(e.target.value)}
                           className="border rounded p-2 bg-white" />
                </div>
                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">Sampai Tanggal</label>
                    <input type="date" value={endDate}
                           onChange={(e) => setEndDate(e.target.value)}
                           className="border rounded p-2 bg-white" />
                </div>
                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                            className="border rounded p-2 bg-white">
                        <option value="">Semua Status</option>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                    </select>
                </div>
                <button onClick={fetchHarvests}
                        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 w-full md:w-auto">
                    Terapkan Filter
                </button>
            </div>

            {/* List */}
            {loading ? (
                <p className="text-center mt-10">Loading...</p>
            ) : data.length === 0 ? (
                <p className="text-center mt-10">Belum ada hasil panen.</p>
            ) : (
                <div className="grid gap-4">
                    {data.map((item) => (
                        <Link key={item.id} href={`/harvest/${item.id}`}>
                            <div className="bg-white border shadow-sm p-4 rounded-lg hover:shadow-md transition-all cursor-pointer flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="font-medium">Kg: {item.kilogram}</p>
                                    <p>Tanggal: {item.harvestDate}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(item.status)}`}>
                                        {item.status}
                                    </span>
                                    {/* ← Tampilkan alasan kalau REJECTED */}
                                    {item.status === "REJECTED" && item.rejectionReason && (
                                        <p className="text-red-600 text-sm mt-1">
                                            ❌ Ditolak: {item.rejectionReason}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                                >
                                    Hapus
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}