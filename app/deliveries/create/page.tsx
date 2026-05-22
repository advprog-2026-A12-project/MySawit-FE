"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, UserListItem } from '@/lib/auth-api';
import { getPanenBawahan } from '@/lib/api';
import { createDelivery, getSupirList } from '@/lib/delivery-api';
import { HarvestMultiSelectTable, type HarvestRow } from '@/app/components/delivery/HarvestMultiSelectTable';
import { PayloadSummaryCard } from '@/app/components/delivery/PayloadSummaryCard';
import { getErrorMessage } from '@/lib/utils';

export default function CreateDeliveryPage() {
    const router = useRouter();
    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'MANDOR';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [harvests, setHarvests] = useState<HarvestRow[]>([]);
    const [selectedHarvestIds, setSelectedHarvestIds] = useState<string[]>([]);
    
    const [supirList, setSupirList] = useState<UserListItem[]>([]);
    const [selectedSupirId, setSelectedSupirId] = useState("");
    
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => {
        if (!authorized) {
            router.replace('/deliveries');
            return;
        }

        const loadInitialData = async () => {
            try {
                // Fetch supir list
                const supirData = await getSupirList();
                const supirContent = Array.isArray(supirData) ? supirData : supirData?.data?.content;
                if (Array.isArray(supirContent)) setSupirList(supirContent);

                // Fetch harvests (Only APPROVED ones)
                const harvestData = (await getPanenBawahan()) as HarvestRow[];
                if (Array.isArray(harvestData)) {
                    setHarvests(harvestData.filter((h) => h.status === 'APPROVED'));
                }
            } catch (err: unknown) {
                console.error(err);
                setMsg({ text: getErrorMessage(err, "Gagal memuat data awal."), type: "error" });
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [authorized, router]);

    const totalPayload = useMemo(() => {
        return harvests
            .filter(h => selectedHarvestIds.includes(h.id))
            .reduce((sum, h) => sum + (h.kilogram ?? 0), 0);
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
        } catch (error: unknown) {
            setMsg({ text: getErrorMessage(error, "Gagal menghubungi server"), type: "error" });
            setSubmitting(false);
        }
    };

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;
    if (loading) return <div className="p-8 text-center">Loading Data...</div>;

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
                        <HarvestMultiSelectTable 
                            harvests={harvests} 
                            selectedIds={selectedHarvestIds} 
                            onSelectionChange={setSelectedHarvestIds} 
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                        <PayloadSummaryCard totalPayload={totalPayload} />

                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Tugaskan Supir</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Supir Truk</label>
                                    {supirList.length > 0 ? (
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
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Masukkan UUID Supir Manual"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={selectedSupirId}
                                            onChange={(e) => setSelectedSupirId(e.target.value)}
                                        />
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
