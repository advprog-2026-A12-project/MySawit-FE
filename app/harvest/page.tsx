"use client";

import { useEffect, useState } from "react";
import {
    getMyHarvest,
    deleteHarvest,
    getUser
} from "@/lib/api";

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
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setUser(getUser());
    }, []);

    const isMandor = user?.role === "MANDOR";

    // =========================
    // FETCH
    // =========================
    const fetchHarvests = async () => {
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
    };

    // =========================
    // INIT
    // =========================
    useEffect(() => {
        if (user === null) return; // wait hydration

        if (isMandor) {
            router.push("/harvest/mandor");
            return;
        }

        fetchHarvests();
    }, [user]);

    // =========================
    // DELETE
    // =========================
    const handleDelete = async (
        e: React.MouseEvent,
        id: string
    ) => {
        e.preventDefault();
        e.stopPropagation(); // 🔥 FIX IMPORTANT

        if (!confirm("Yakin ingin menghapus riwayat ini?"))
            return;

        try {
            await deleteHarvest(id);
            alert("Data berhasil dihapus!");
            fetchHarvests();
        } catch (error) {
            alert("Gagal menghapus data.");
        }
    };

    // =========================
    // UI
    // =========================
    const statusBadge = (s: string) => {
        if (s === "APPROVED")
            return "bg-green-100 text-green-700";
        if (s === "REJECTED")
            return "bg-red-100 text-red-700";
        return "bg-yellow-100 text-yellow-700";
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-black">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">
                    Riwayat Panen
                </h1>

                <button
                    onClick={() =>
                        router.push("/harvest/create")
                    }
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Tambah Hasil Panen
                </button>
            </div>

            {/* FILTER */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                        setStartDate(e.target.value)
                    }
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                        setEndDate(e.target.value)
                    }
                />

                <select
                    value={status}
                    onChange={(e) =>
                        setStatus(e.target.value)
                    }
                >
                    <option value="">Semua</option>
                    <option value="PENDING">
                        PENDING
                    </option>
                    <option value="APPROVED">
                        APPROVED
                    </option>
                    <option value="REJECTED">
                        REJECTED
                    </option>
                </select>

                <button
                    onClick={fetchHarvests}
                    className="bg-blue-500 text-white px-6 py-2 rounded"
                >
                    Filter
                </button>
            </div>

            {/* LIST */}
            {loading ? (
                <p className="text-center mt-10">
                    Loading...
                </p>
            ) : data.length === 0 ? (
                <p className="text-center mt-10">
                    Belum ada hasil panen.
                </p>
            ) : (
                <div className="grid gap-4">

                    {data.map((item) => (
                        <Link
                            key={item.id}
                            href={`/harvest/${item.id}`}
                        >
                            <div className="bg-white border p-4 rounded flex justify-between">

                                <div>

                                    <p>
                                        Kg: {item.kilogram}
                                    </p>

                                    <p>
                                        {item.harvestDate}
                                    </p>

                                    <span
                                        className={`text-xs px-2 py-1 rounded ${statusBadge(
                                            item.status
                                        )}`}
                                    >
                                        {item.status}
                                    </span>

                                    {item.status ===
                                        "REJECTED" &&
                                        item.rejectionReason && (
                                            <p className="text-red-600 text-sm">
                                                ❌{" "}
                                                {
                                                    item.rejectionReason
                                                }
                                            </p>
                                        )}
                                </div>

                                <button
                                    onClick={(e) =>
                                        handleDelete(
                                            e,
                                            item.id
                                        )
                                    }
                                    className="bg-red-500 text-white px-3 py-1 rounded"
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