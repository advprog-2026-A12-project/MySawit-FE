"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getAccessToken } from '@/lib/auth-api';

interface Delivery {
    id: string;
    mandorName: string;
    payloadKg: number;
    status: string;
    createdAt: string;
}

export default function SupirDeliveryPage() {
    const router = useRouter();

    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'SUPIR_TRUK';

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Delivery[]>([]);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://mysawit-sawit.onrender.com';
            const res = await fetch(`${baseUrl}/api/deliveries/supir-tasks`, {
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'X-User-Id': user?.id || '',
                    'X-User-Role': user?.role || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            } else {
                throw new Error("Gagal mengambil data tugas");
            }
        } catch (error: unknown) {
            setMsg({ text: error instanceof Error ? error.message : "Gagal terhubung ke backend", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        if (!authorized) {
            router.replace('/deliveries');
            return;
        }
        fetchTasks();
    }, [authorized, router, fetchTasks]);

    const handleUpdateStatus = async (id: string, currentStatus: string) => {
        if (isUpdating) return;
        setMsg({ text: "", type: "" });
        
        const isMulai = currentStatus === "MEMUAT";
        const promptMsg = isMulai ? "Mulai perjalanan pengiriman sekarang?" : "Konfirmasi Anda telah tiba di tujuan?";
        if (!window.confirm(promptMsg)) return;

        setIsUpdating(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://mysawit-sawit.onrender.com';
            const res = await fetch(`${baseUrl}/api/deliveries/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'X-User-Id': user?.id || '',
                    'X-User-Role': user?.role || ''
                }
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Gagal mengubah status");
            }

            setMsg({ text: "Status berhasil diupdate!", type: "success" });
            fetchTasks();
        } catch (error: unknown) {
            setMsg({ text: error instanceof Error ? error.message : "Terjadi kesalahan", type: "error" });
        } finally {
            setIsUpdating(false);
        }
    };

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-800">Dashboard Supir: Tugas Pengiriman</h1>
                    <p className="text-gray-600 mt-2">Selamat bekerja, {user?.name}. Periksa dan perbarui status keberangkatan logistik Anda di sini.</p>
                </header>

                {msg.text && (
                    <div className={`px-4 py-3 rounded mb-6 border ${msg.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
                        {msg.text}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10 bg-white shadow rounded border border-gray-200">Loading tugas...</div>
                ) : (
                    <div className="grid gap-6">
                        {tasks.length > 0 ? tasks.map(task => (
                            <div key={task.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">Tugas dari: {task.mandorName}</h3>
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${task.status === 'MEMUAT' ? 'bg-yellow-100 text-yellow-800' :
                                              task.status === 'MENGIRIM' ? 'bg-blue-100 text-blue-800' :
                                                  'bg-green-100 text-green-800'}`}>
                                            Status: {task.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">ID Pengiriman: {task.id}</p>
                                    <p className="text-sm font-medium text-gray-700 mt-2">
                                        Total Muatan: <span className="text-blue-600">{task.payloadKg} Kg</span>
                                    </p>
                                </div>

                                <div>
                                    {task.status === 'MEMUAT' && (
                                        <button 
                                            disabled={isUpdating}
                                            onClick={() => handleUpdateStatus(task.id, 'MEMUAT')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 shadow-sm"
                                        >
                                            Berangkat Mengirim
                                        </button>
                                    )}
                                    {task.status === 'MENGIRIM' && (
                                        <button 
                                            disabled={isUpdating}
                                            onClick={() => handleUpdateStatus(task.id, 'MENGIRIM')}
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 shadow-sm"
                                        >
                                            Tiba di Tujuan
                                        </button>
                                    )}
                                    {task.status === 'TIBA_DI_TUJUAN' && (
                                        <div className="text-green-600 font-semibold bg-green-50 px-4 py-2 rounded border border-green-100">
                                            ✔ Selesai
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white p-10 rounded-lg shadow border border-gray-200 text-center text-gray-500 flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M8 16l-4-4 4-4"></path></svg>
                                <p className="text-lg font-medium text-gray-600">Hore! Belum ada tugas saat ini.</p>
                                <p className="text-sm">Bila Anda ditugaskan oleh Mandor, tugas akan muncul di sini.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
