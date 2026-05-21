"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-api';
import { getSupirTasks, Delivery, advanceDeliveryStatus } from '@/lib/delivery-api';
import { StatusBadge } from '@/app/components/delivery/StatusBadge';

export default function SupirDeliveryPage() {
    const router = useRouter();
    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'SUPIR_TRUK';

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Delivery[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchTasks = async () => {
        try {
            const data = await getSupirTasks();
            setTasks(data);
        } catch (err: any) {
            setErrorMsg(err.message || 'Gagal memuat tugas pengiriman');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authorized) {
            router.replace('/deliveries');
            return;
        }
        fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authorized, router]);

    const handleQuickAction = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent navigation to detail page
        try {
            setUpdatingId(id);
            await advanceDeliveryStatus(id);
            await fetchTasks();
        } catch (err: any) {
            alert(err.message || "Gagal mengupdate status");
        } finally {
            setUpdatingId(null);
        }
    };

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;
    if (loading) return <div className="p-8 text-center flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

    // Separate active tasks from completed
    const activeTasks = tasks.filter(t => t.status !== 'TIBA_DI_TUJUAN');
    const completedTasks = tasks.filter(t => t.status === 'TIBA_DI_TUJUAN');

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8 pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Tugas Saya</h1>
                    <p className="text-gray-500 mt-1">Daftar muatan yang harus Anda kirim.</p>
                </div>
                
                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                        {errorMsg}
                    </div>
                )}
                
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 px-1">Tugas Aktif ({activeTasks.length})</h2>
                
                <div className="space-y-4 mb-8">
                    {activeTasks.length > 0 ? activeTasks.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => router.push(`/deliveries/${t.id}`)}
                            className="bg-white p-5 rounded-2xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-mono mb-1">ID: {t.id.substring(0,8)}</p>
                                    <h3 className="text-lg font-bold text-gray-900">{t.payloadKg} Kg</h3>
                                </div>
                                <StatusBadge status={t.status} type="delivery" />
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(t.tanggal || t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                            </div>
                            
                            <button 
                                onClick={(e) => handleQuickAction(e, t.id)}
                                disabled={updatingId === t.id}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                {updatingId === t.id ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {t.status === 'MEMUAT' ? 'Mulai Mengirim' : 'Tandai Tiba di Tujuan'}
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    )) : (
                        <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                            Tidak ada tugas aktif saat ini.
                        </div>
                    )}
                </div>

                {completedTasks.length > 0 && (
                    <>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 px-1 mt-10">Selesai Dikirim</h2>
                        <div className="space-y-4 opacity-75">
                            {completedTasks.map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => router.push(`/deliveries/${t.id}`)}
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-xs text-gray-500 font-mono mb-1">ID: {t.id.substring(0,8)}</p>
                                        <p className="font-semibold text-gray-700">{t.payloadKg} Kg</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <StatusBadge status={t.status} type="delivery" />
                                        <StatusBadge status={t.approvalStatus} type="approval" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
