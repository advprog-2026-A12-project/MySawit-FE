"use client";

import { useEffect, useState } from "react";
import {
    getPanenBawahan,
    approvePanen,
    rejectPanen
} from "@/lib/api";

import { useRouter } from "next/navigation";

// =========================
// TYPE
// =========================
type Harvest = {
    id: string;
    buruhId: string;
    kilogram: number;
    status: string;
    harvestDate: string;
    rejectionReason?: string;
    bisaDiangkutTruk?: boolean;
};

// =========================
// PAGE
// =========================
export default function MandorPage() {
    const [data, setData] = useState<Harvest[]>([]);
    const [loading, setLoading] = useState(true);

    const [buruhId, setBuruhId] = useState("");
    const [tanggalPanen, setTanggalPanen] = useState("");

    const [rejectId, setRejectId] = useState<string | null>(null);
    const [alasan, setAlasan] = useState("");

    const [actionMsg, setActionMsg] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const router = useRouter();

    // =========================
    // FETCH DATA
    // =========================
    const fetchData = async () => {
        setLoading(true);
        setActionMsg("");

        try {
            const res = await getPanenBawahan({
                buruhId: buruhId || undefined,
                tanggalPanen: tanggalPanen || undefined,
            });

            const result = Array.isArray(res) ? res : res?.data;

            setData(result || []);
        } catch (err) {
            console.error("Fetch error:", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // INIT LOAD
    // =========================
    useEffect(() => {
        fetchData();
    }, []);

    // =========================
    // APPROVE
    // =========================
    const handleApprove = async (id: string) => {
        if (!confirm("Setujui panen ini?")) return;

        setActionLoading(true);
        setActionMsg("");

        try {
            await approvePanen(id);
            setActionMsg("✅ Panen berhasil disetujui!");
            await fetchData();
        } catch (err) {
            setActionMsg(
                "❌ Gagal approve: " +
                (err instanceof Error ? err.message : "")
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // REJECT
    // =========================
    const handleRejectSubmit = async () => {
        if (!alasan.trim()) {
            setActionMsg("❌ Alasan penolakan wajib diisi");
            return;
        }

        if (!rejectId) return;

        setActionLoading(true);
        setActionMsg("");

        try {
            await rejectPanen(rejectId, alasan.trim());

            setActionMsg("✅ Panen berhasil ditolak");
            setRejectId(null);
            setAlasan("");

            await fetchData();
        } catch (err) {
            setActionMsg(
                "❌ Gagal reject: " +
                (err instanceof Error ? err.message : "")
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // STATUS STYLE
    // =========================
    const statusBadge = (s: string) => {
        if (s === "APPROVED") return "bg-green-100 text-green-700";
        if (s === "REJECTED") return "bg-red-100 text-red-700";
        return "bg-yellow-100 text-yellow-700";
    };

    // =========================
    // UI
    // =========================
    return (
        <div className="p-6 bg-gray-50 min-h-screen text-black">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Dashboard Mandor</h1>

                <button
                    onClick={() => router.push("/")}
                    className="text-sm text-gray-500 hover:underline"
                >
                    ← Kembali
                </button>
            </div>

            {/* FILTER */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">

                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">
                        Filter Buruh ID
                    </label>

                    <input
                        type="text"
                        value={buruhId}
                        onChange={(e) => setBuruhId(e.target.value)}
                        placeholder="UUID buruh (opsional)"
                        className="border rounded p-2 bg-white w-72"
                    />
                </div>

                <div className="flex flex-col w-full md:w-auto">
                    <label className="text-sm font-semibold mb-1">
                        Tanggal Panen
                    </label>

                    <input
                        type="date"
                        value={tanggalPanen}
                        onChange={(e) => setTanggalPanen(e.target.value)}
                        className="border rounded p-2 bg-white"
                    />
                </div>

                <button
                    onClick={fetchData}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 w-full md:w-auto"
                >
                    Terapkan Filter
                </button>

                <button
                    onClick={() => {
                        setBuruhId("");
                        setTanggalPanen("");
                        setTimeout(fetchData, 0);
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 w-full md:w-auto"
                >
                    Reset
                </button>
            </div>

            {/* MESSAGE */}
            {actionMsg && (
                <div
                    className={`mb-4 p-3 rounded text-center font-medium ${
                        actionMsg.startsWith("✅")
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {actionMsg}
                </div>
            )}

            {/* MODAL REJECT */}
            {rejectId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">

                        <h2 className="text-xl font-bold mb-2">
                            Tolak Panen
                        </h2>

                        <p className="text-sm text-gray-500 mb-4">
                            Alasan wajib diisi dan akan terlihat oleh buruh
                        </p>

                        <textarea
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value)}
                            className="w-full border rounded p-3 mb-4 bg-white"
                            rows={3}
                        />

                        <div className="flex gap-3">

                            <button
                                onClick={handleRejectSubmit}
                                disabled={actionLoading}
                                className="bg-red-500 text-white px-4 py-2 rounded flex-1 disabled:opacity-50"
                            >
                                {actionLoading ? "Loading..." : "Tolak"}
                            </button>

                            <button
                                onClick={() => {
                                    setRejectId(null);
                                    setAlasan("");
                                }}
                                className="bg-gray-200 px-4 py-2 rounded flex-1"
                            >
                                Batal
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* SUMMARY */}
            {!loading && data.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">

                    <div className="bg-yellow-50 p-3 rounded text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                            {data.filter(d => d.status === "PENDING").length}
                        </p>
                        <p>Menunggu</p>
                    </div>

                    <div className="bg-green-50 p-3 rounded text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {data.filter(d => d.status === "APPROVED").length}
                        </p>
                        <p>Disetujui</p>
                    </div>

                    <div className="bg-red-50 p-3 rounded text-center">
                        <p className="text-2xl font-bold text-red-600">
                            {data.filter(d => d.status === "REJECTED").length}
                        </p>
                        <p>Ditolak</p>
                    </div>

                </div>
            )}

            {/* LIST */}
            {loading ? (
                <p className="text-center mt-10">Loading...</p>
            ) : data.length === 0 ? (
                <p className="text-center mt-10 text-gray-500">
                    Belum ada data
                </p>
            ) : (
                <div className="grid gap-4">

                    {data.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white border shadow-sm p-4 rounded-lg"
                        >
                            <div className="flex justify-between">

                                <div className="flex-1">

                                    <span
                                        className={`text-xs px-2 py-1 rounded ${statusBadge(
                                            item.status
                                        )}`}
                                    >
                                        {item.status}
                                    </span>

                                    <p>Buruh: {item.buruhId}</p>
                                    <p>Tanggal: {item.harvestDate}</p>
                                    <p>Kg: {item.kilogram}</p>

                                    {item.rejectionReason && (
                                        <p className="text-red-600 text-sm">
                                            {item.rejectionReason}
                                        </p>
                                    )}

                                </div>

                                {item.status === "PENDING" && (
                                    <div className="flex flex-col gap-2">

                                        <button
                                            onClick={() =>
                                                handleApprove(item.id)
                                            }
                                            disabled={actionLoading}
                                            className="bg-green-500 text-white px-3 py-1 rounded"
                                        >
                                            Approve
                                        </button>

                                        <button
                                            onClick={() =>
                                                setRejectId(item.id)
                                            }
                                            disabled={actionLoading}
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                        >
                                            Reject
                                        </button>

                                    </div>
                                )}

                            </div>
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
}