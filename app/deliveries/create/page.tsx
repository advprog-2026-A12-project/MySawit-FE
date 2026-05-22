"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, UserListItem } from '@/lib/auth-api';
import { createDelivery, getSupirListPaged, getHarvestOptions } from '@/lib/delivery-api';
import { HarvestMultiSelectTable } from '@/app/components/delivery/HarvestMultiSelectTable';
import { PayloadSummaryCard } from '@/app/components/delivery/PayloadSummaryCard';

export default function CreateDeliveryPage() {
    const router = useRouter();
    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'MANDOR';

    const [submitting, setSubmitting] = useState(false);
    
    const [harvests, setHarvests] = useState<any[]>([]);
    const [selectedHarvestIds, setSelectedHarvestIds] = useState<string[]>([]);
    const [harvestPage, setHarvestPage] = useState(0);
    const [harvestLoading, setHarvestLoading] = useState(true);
    const [harvestLoadingMore, setHarvestLoadingMore] = useState(false);
    const [harvestHasMore, setHarvestHasMore] = useState(true);
    const [harvestSearch, setHarvestSearch] = useState("");
    const harvestSearchRef = useRef<number | null>(null);
    const [harvestError, setHarvestError] = useState("");

    const [supirList, setSupirList] = useState<UserListItem[]>([]);
    const [selectedSupirId, setSelectedSupirId] = useState("");
    const [supirLoading, setSupirLoading] = useState(true);
    const [supirError, setSupirError] = useState("");
    
    const [msg, setMsg] = useState({ text: "", type: "" });

    const loadHarvestPage = useCallback(async (pageIndex = 0, reset = false) => {
        if (reset) {
            setHarvestLoading(true);
            setHarvestError("");
        }

        try {
            const res = await getHarvestOptions({
                search: harvestSearch || undefined,
                page: pageIndex,
                size: 50,
            });

            if (Array.isArray(res)) {
                setHarvests(prev => reset ? res : [...prev, ...res]);
                setHarvestPage(pageIndex);
                setHarvestHasMore(res.length === 50);
            } else {
                setHarvests(prev => reset ? [] : prev);
                setHarvestHasMore(false);
            }
        } catch (err) {
            console.error(err);
            setHarvestError("Gagal memuat daftar panen. Silahkan coba lagi.");
        } finally {
            setHarvestLoading(false);
            setHarvestLoadingMore(false);
        }
    }, [harvestSearch]);

    useEffect(() => {
        if (!authorized) {
            router.replace('/deliveries');
            return;
        }

        const loadSupirData = async () => {
            setSupirLoading(true);
            setSupirError("");
            try {
                const supirData = await getSupirListPaged(undefined, 0, 50);
                if (supirData?.data?.content) setSupirList(supirData.data.content);
                else if (Array.isArray(supirData)) setSupirList(supirData);
            } catch (err) {
                console.error(err);
                setSupirError("Gagal memuat daftar supir. Silahkan coba lagi.");
            } finally {
                setSupirLoading(false);
            }
        };

        loadSupirData();
        loadHarvestPage(0, true);
    }, [authorized, router, loadHarvestPage]);

    const totalPayload = useMemo(() => {
        return harvests
            .filter(h => selectedHarvestIds.includes(h.id))
            .reduce((sum, h) => sum + (h.kilogram || 0), 0);
    }, [harvests, selectedHarvestIds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ text: "", type: "" });
        
        if (selectedHarvestIds.length === 0) {
            setMsg({ text: "Pilih setidaknya satu panen untuk dikirim.", type: "error" });
            return;
        }

        if (totalPayload < 1 || totalPayload > 400) {
            setMsg({ text: "Total payload harus antara 1 dan 400 Kg.", type: "error" });
            return;
        }

        if (!selectedSupirId) {
            setMsg({ text: "Silahkan pilih supir truk.", type: "error" });
            return;
        }

        const selectedSupir = supirList.find(s => s.id === selectedSupirId);

        try {
            setSubmitting(true);
            await createDelivery({
                supirId: selectedSupirId,
                supirName: selectedSupir ? selectedSupir.name : "Supir Truk (Manual)",
                harvestIds: selectedHarvestIds,
                payloadKg: totalPayload
            });

            setMsg({ text: "Berhasil membuat pengiriman!", type: "success" });
            setTimeout(() => {
                router.push('/deliveries/mandor');
            }, 1500);
        } catch (error: any) {
            setMsg({ text: error.message || "Gagal menghubungi server", type: "error" });
            setSubmitting(false);
        }
    };

    const loadMoreHarvests = useCallback(async () => {
        if (!harvestHasMore || harvestLoadingMore) return;
        setHarvestLoadingMore(true);
        await loadHarvestPage(harvestPage + 1, false);
    }, [harvestHasMore, harvestLoadingMore, harvestPage, loadHarvestPage]);

    useEffect(() => {
        if (harvestSearchRef.current) window.clearTimeout(harvestSearchRef.current);
        harvestSearchRef.current = window.setTimeout(() => {
            loadHarvestPage(0, true);
        }, 300);
        return () => { if (harvestSearchRef.current) window.clearTimeout(harvestSearchRef.current); };
    }, [harvestSearch, loadHarvestPage]);

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Buat Pengiriman Baru</h1>
                        <p className="text-gray-500 text-sm mt-1">Tugaskan supir untuk mengirim hasil panen yang sudah disetujui.</p>
                    </div>
                    <button onClick={() => router.push('/deliveries/mandor')} className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali
                    </button>
                </div>
                
                {msg.text && (
                    <div className={`px-4 py-3 rounded-2xl mb-6 border ${msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {msg.text}
                    </div>
                )}
                
                <div className="grid gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Pilih Hasil Panen</h2>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Cari panen berdasarkan ID atau catatan..."
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={harvestSearch}
                                onChange={(e) => setHarvestSearch(e.target.value)}
                            />
                        </div>
                        {harvestLoading ? (
                            <div className="p-8 text-center border rounded-xl bg-gray-50 text-gray-500">
                                Memuat daftar panen...
                            </div>
                        ) : harvestError ? (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                                {harvestError}
                            </div>
                        ) : (
                            <HarvestMultiSelectTable 
                                harvests={harvests} 
                                selectedIds={selectedHarvestIds} 
                                onSelectionChange={setSelectedHarvestIds} 
                            />
                        )}
                        {harvestHasMore && !harvestLoading && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={loadMoreHarvests}
                                    disabled={harvestLoadingMore}
                                    className="inline-flex items-center px-4 py-2 rounded-lg border bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {harvestLoadingMore ? 'Memuat...' : 'Muat Lagi'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                        <PayloadSummaryCard totalPayload={totalPayload} />

                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Tugaskan Supir</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Supir Truk</label>
                                    {supirLoading ? (
                                        <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            Memuat daftar supir...
                                        </div>
                                    ) : supirError ? (
                                        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                                            {supirError}
                                        </div>
                                    ) : supirList.length > 0 ? (
                                        <select
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={selectedSupirId}
                                            onChange={(e) => setSelectedSupirId(e.target.value)}
                                        >
                                            <option value="" disabled>-- Pilih Supir --</option>
                                            {supirList.map(supir => (
                                                <option key={supir.id} value={supir.id}>{supir.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                            Tidak ada supir yang dapat dipilih saat ini.
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={submitting || totalPayload < 1 || totalPayload > 400 || selectedHarvestIds.length === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all mt-4"
                                >
                                    {submitting ? 'Memproses...' : 'Buat Pengiriman'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
