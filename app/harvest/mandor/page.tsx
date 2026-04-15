"use client";

import { useEffect, useState } from "react";
import { getPanenBawahan, approvePanen, rejectPanen } from "@/lib/api";

type Harvest = {
    id: string;
    buruhId: string;
    kilogram: number;
    status: string;
    harvestDate: string;
    rejectionReason?: string;
    bisaDiangkutTruk?: boolean;
};

export default function MandorPage() {
    const [data, setData] = useState<Harvest[]>([]);
    const [loading, setLoading] = useState(true);
    const [buruhId, setBuruhId] = useState("");
    const [tanggalPanen, setTanggalPanen] = useState("");
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [alasan, setAlasan] = useState("");
    const [actionMsg, setActionMsg] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getPanenBawahan({ buruhId, tanggalPanen });
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (id: string) => {
        if (!confirm("Setujui panen ini?")) return;
        try {
            await approvePanen(id);
            setActionMsg("✅ Panen disetujui!");
            fetchData();
        } catch (err) {
            setActionMsg("❌ Gagal approve");
        }
    };

    const handleReject = async () => {
        if (!alasan.trim()) {
            setActionMsg("❌ Alasan penolakan wajib diisi");
            return;
        }
        try {
            await rejectPanen(rejectId!, alasan);
            setActionMsg("✅ Panen ditolak");
            setRejectId(null);
            setAlasan("");
            fetchData();
        } catch (err) {
            setActionMsg("❌ Gagal reject");
        }
    };

    const statusColor = (status: string) => {
        if (status === "APPROVED") return "text-green-600 font-bold";
        if (status === "REJECTED") return "text-red-600 font-bold";
        return "text-yellow-600 font-bold";
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-black">
            <h1 className="text-3xl font-bold mb-6">Dashboard Mandor</h1>

            {/* Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-1">Buruh ID</label>
                    <input
                        type="text"
                        value={buruhId}
                        onChange={(e) => setBuruhId(e.target.value)}
                        placeholder="UUID buruh (opsional)"
                        className="border rounded p-2 bg-white"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-1">Tanggal Panen</label>
                    <input
                        type="date"
                        value={tanggalPanen}
                        onChange={(e) => setTanggalPanen(e.target.value)}
                        className="border rounded p-2 bg-white"
                    />
                </div>
                <button
                    onClick={fetchData}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                    Filter
                </button>
            </div>

            {actionMsg && (
                <p className="mb-4 font-medium text-center">{actionMsg}</p>
            )}

            {/* Modal Reject */}
            {rejectId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Alasan Penolakan</h2>
                        <textarea
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value)}
                            placeholder="Wajib diisi..."
                            className="w-full border rounded p-2 mb-4 bg-white"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleReject}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1"
                            >
                                Tolak Panen
                            </button>
                            <button
                                onClick={() => { setRejectId(null); setAlasan(""); }}
                                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 flex-1"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List Panen */}
            {loading ? (
                <p className="text-center mt-10">Loading...</p>
            ) : data.length === 0 ? (
                <p className="text-center mt-10">Belum ada data panen bawahan.</p>
            ) : (
                <div className="grid gap-4">
                    {data.map((item) => (
                        <div key={item.id} className="bg-white border shadow-sm p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p><span className="font-semibold">Buruh ID:</span> {item.buruhId}</p>
                                    <p><span className="font-semibold">Tanggal:</span> {item.harvestDate}</p>
                                    <p><span className="font-semibold">Kilogram:</span> {item.kilogram} kg</p>
                                    <p>
                                        <span className="font-semibold">Status: </span>
                                        <span className={statusColor(item.status)}>{item.status}</span>
                                    </p>
                                    {item.status === "REJECTED" && item.rejectionReason && (
                                        <p className="text-red-600 text-sm">Alasan: {item.rejectionReason}</p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        Bisa diangkut: {item.bisaDiangkutTruk ? "✅ Ya" : "❌ Tidak"}
                                    </p>
                                </div>

                                {/* Tombol approve/reject hanya muncul kalau PENDING */}
                                {item.status === "PENDING" && (
                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectId(item.id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
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