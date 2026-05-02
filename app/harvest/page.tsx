"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyHarvest, deleteHarvest, getUser } from "@/lib/api";
import { UserProfile } from "@/lib/auth-api"; // Import tipe profil
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
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        setUser(getUser());
    }, []);

    const isMandor = user?.role === "MANDOR";

    // Dibungkus useCallback agar aman dimasukkan ke dependency useEffect
    const fetchHarvests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyHarvest({
                startDate,
                endDate,
                status,
            });
            const result = Array.isArray(res) ? res : res?.data;
            setData(result || []);
        } catch (error) {
            console.error("Gagal mengambil data panen:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, status]);

    useEffect(() => {
        if (user === null) return;

        if (isMandor) {
            router.push("/harvest/mandor");
            return;
        }

        fetchHarvests();
    }, [user, isMandor, router, fetchHarvests]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Yakin ingin menghapus riwayat laporan ini?")) return;

        try {
            await deleteHarvest(id);
            alert("Laporan berhasil dihapus!");
            fetchHarvests();
        } catch {
            alert("Gagal menghapus data.");
        }
    };

    const renderStatusBadge = (s: string) => {
        if (s === "APPROVED") {
            return <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 border border-green-200">APPROVED</span>;
        }
        if (s === "REJECTED") {
            return <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 border border-red-200">REJECTED</span>;
        }
        return <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200">PENDING</span>;
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 text-black font-sans">
            <div className="mx-auto max-w-6xl">

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900">Riwayat Panen</h1>
                        <p className="text-gray-500 mt-1">Daftar seluruh laporan hasil panen Anda</p>
                    </div>

                    <button
                        onClick={() => router.push("/harvest/create")}
                        className="bg-blue-900 text-white px-6 py-2.5 rounded-lg hover:bg-blue-800 transition-all font-bold text-sm shadow-md active:scale-95"
                    >
                        + Tambah Hasil Panen
                    </button>
                </div>

                {/* FILTER SECTION */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow mb-8">
                    <div className="border-b border-gray-200 bg-gray-50 p-4">
                        <h2 className="font-semibold text-gray-700">Filter Riwayat</h2>
                    </div>

                    <div className="p-4 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex flex-col w-full md:w-auto">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Mulai Tanggal</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-col w-full md:w-auto">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-col w-full md:w-auto">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none md:w-40"
                            >
                                <option value="">Semua Status</option>
                                <option value="PENDING">PENDING</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="REJECTED">REJECTED</option>
                            </select>
                        </div>

                        <button
                            onClick={fetchHarvests}
                            className="bg-blue-900 text-white px-5 py-2 rounded text-sm hover:bg-blue-800 transition-colors font-semibold"
                        >
                            Terapkan Filter
                        </button>
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                    <div className="border-b border-gray-200 bg-gray-50 p-4">
                        <h2 className="font-semibold text-gray-700">Data Panen Lapangan</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Berat (Kg)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Catatan Mandor</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center italic text-gray-500">Memuat data riwayat...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center italic text-gray-500">Belum ada hasil panen yang dilaporkan.</td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-gray-50 cursor-pointer"
                                        onClick={() => router.push(`/harvest/${item.id}`)}
                                    >
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                            {item.harvestDate}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                                            {item.kilogram} Kg
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {renderStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                                            {item.status === "REJECTED" ? (item.rejectionReason || "-") : "-"}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex justify-end gap-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/harvest/${item.id}`);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 font-bold"
                                                >
                                                    Detail
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, item.id)}
                                                    className="text-red-600 hover:text-red-900 font-bold"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400">MySawit Reporting System v1.0</p>
            </div>
        </main>
    );
}