"use client";

import { useEffect, useState, useCallback } from "react";
import {
    getPanenBawahan,
    approvePanen,
    rejectPanen,
    getMandorBuruhs,
    getUser
} from "@/lib/api";
import { UserProfile } from "@/lib/auth-api";
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

type Buruh = {
    id: string;
    name: string;
};

// =========================
// PAGE
// =========================
export default function MandorPage() {
    const [data, setData] = useState<Harvest[]>([]);
    const [buruhList, setBuruhList] = useState<Buruh[]>([]);
    const [loading, setLoading] = useState(true);

    const [buruhId, setBuruhId] = useState("");
    const [tanggalPanen, setTanggalPanen] = useState("");

    const [rejectId, setRejectId] = useState<string | null>(null);
    const [alasan, setAlasan] = useState("");

    const [actionMsg, setActionMsg] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const router = useRouter();

    // =========================
    // FETCH DATA PANEN
    // =========================
    const fetchData = useCallback(async () => {
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
    }, [buruhId, tanggalPanen]);

    // =========================
    // FETCH DATA BURUH
    // =========================
    const fetchBuruhOptions = useCallback(async () => {
        const user = getUser() as UserProfile | null;
        if (!user?.id) return;

        try {
            const res = await getMandorBuruhs(user.id, { size: 100 });
            if (res?.data?.content) {
                setBuruhList(res.data.content);
            }
        } catch (err) {
            console.error("Failed to fetch buruh list:", err);
        }
    }, []);

    // =========================
    // INIT LOAD
    // =========================
    useEffect(() => {
        fetchBuruhOptions();
        fetchData();
    }, [fetchBuruhOptions, fetchData]);

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

    const renderStatusBadge = (status: string) => {
        if (status === "APPROVED") {
            return <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 border border-green-200">APPROVED</span>;
        }
        if (status === "REJECTED") {
            return <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 border border-red-200">REJECTED</span>;
        }
        return <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200">PENDING</span>;
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 text-black font-sans">
            <div className="mx-auto max-w-6xl">

                {/* HEADER */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900">Dashboard Mandor</h1>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="text-sm text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                    >
                        ← Kembali
                    </button>
                </div>

                {/* SUMMARY CARDS */}
                {!loading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow p-4 text-center">
                            <p className="text-sm font-semibold text-gray-500 uppercase">Total Buruh</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{buruhList.length}</p>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow p-4 text-center">
                            <p className="text-sm font-semibold text-gray-500 uppercase">Menunggu</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{data.filter(d => d.status === "PENDING").length}</p>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow p-4 text-center">
                            <p className="text-sm font-semibold text-gray-500 uppercase">Disetujui</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{data.filter(d => d.status === "APPROVED").length}</p>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow p-4 text-center">
                            <p className="text-sm font-semibold text-gray-500 uppercase">Ditolak</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{data.filter(d => d.status === "REJECTED").length}</p>
                        </div>
                    </div>
                )}

                {/* FILTER SECTION */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow mb-8">
                    <div className="border-b border-gray-200 bg-gray-50 p-4">
                        <h2 className="font-semibold text-gray-700">Filter Data Panen</h2>
                    </div>

                    <div className="p-4 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex flex-col w-full md:w-auto">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Buruh</label>
                            <select
                                value={buruhId}
                                onChange={(e) => setBuruhId(e.target.value)}
                                className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-64 bg-white"
                            >
                                <option value="">Semua Buruh</option>
                                {buruhList.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col w-full md:w-auto">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Tanggal Panen</label>
                            <input
                                type="date"
                                value={tanggalPanen}
                                onChange={(e) => setTanggalPanen(e.target.value)}
                                className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={fetchData}
                                className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800 transition-colors"
                            >
                                Terapkan
                            </button>
                            <button
                                onClick={() => {
                                    setBuruhId("");
                                    setTanggalPanen("");
                                }}
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* NOTIFICATIONS */}
                {actionMsg && (
                    <div className={`mb-8 p-4 rounded-lg border font-medium ${
                        actionMsg.startsWith("✅") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                        {actionMsg}
                    </div>
                )}

                {/* TABLE SECTION */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                    <div className="border-b border-gray-200 bg-gray-50 p-4">
                        <h2 className="font-semibold text-gray-700">Live Data Panen</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nama Buruh</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Berat (Kg)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Aksi</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center italic text-gray-500">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center italic text-gray-500">
                                        Belum ada data panen.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => {
                                    const buruhName = buruhList.find(b => b.id === item.buruhId)?.name || "User ID: " + item.buruhId.substring(0,8) + "...";

                                    return (
                                        <tr key={item.id} className="transition-colors hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {item.harvestDate}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {buruhName}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {item.kilogram}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {renderStatusBadge(item.status)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => router.push(`/harvest/${item.id}`)}
                                                        className="text-blue-600 hover:text-blue-900 font-bold"
                                                    >
                                                        Detail
                                                    </button>

                                                    {item.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(item.id)}
                                                                disabled={actionLoading}
                                                                className="text-green-600 hover:text-green-900 font-bold disabled:opacity-50"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectId(item.id)}
                                                                disabled={actionLoading}
                                                                className="text-red-600 hover:text-red-900 font-bold disabled:opacity-50"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL REJECT */}
                {rejectId && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl w-full max-w-md">
                            <div className="border-b border-gray-200 bg-gray-50 p-4">
                                <h2 className="font-semibold text-gray-700">Tolak Panen</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-500 mb-4">
                                    Alasan wajib diisi dan akan terlihat oleh buruh yang bersangkutan.
                                </p>
                                <textarea
                                    value={alasan}
                                    onChange={(e) => setAlasan(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-3 mb-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    rows={3}
                                    placeholder="Masukkan alasan penolakan..."
                                />
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setRejectId(null);
                                            setAlasan("");
                                        }}
                                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleRejectSubmit}
                                        disabled={actionLoading}
                                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading ? "Loading..." : "Tolak Panen"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}