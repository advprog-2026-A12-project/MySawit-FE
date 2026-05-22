"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-api';
import { getDeliveries, Delivery } from '@/lib/delivery-api';
import { StatusBadge } from '@/app/components/delivery/StatusBadge';
import { getErrorMessage } from '@/lib/utils';

export default function MandorDeliveryPage() {
    const router = useRouter();

    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'MANDOR';

    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!authorized) {
            router.replace('/deliveries');
            return;
        }

        const fetchDeliveries = async () => {
            try {
                const data = await getDeliveries({ mandorId: user?.id });
                setDeliveries(data);
            } catch (err: unknown) {
                setErrorMsg(getErrorMessage(err, 'Gagal memuat daftar pengiriman'));
            } finally {
                setLoading(false);
            }
        };

        fetchDeliveries();
    }, [authorized, router, user?.id]);

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;
    if (loading) return <div className="p-8 text-center flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard Mandor</h1>
                        <p className="text-gray-500 mt-1">Kelola dan pantau semua pengiriman hasil panen.</p>
                    </div>
                    <button 
                        onClick={() => router.push('/deliveries/create')} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-2xl transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Pengiriman
                    </button>
                </div>
                
                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                        {errorMsg}
                    </div>
                )}
                
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supir Truk</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payload</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Persetujuan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {deliveries.length > 0 ? deliveries.map(d => (
                                    <tr 
                                        key={d.id} 
                                        onClick={() => router.push(`/deliveries/${d.id}`)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {d.id.substring(0,8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(d.tanggal || d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {d.supirName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {d.payloadKg} Kg
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={d.status} type="delivery" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={d.approvalStatus} type="approval" />
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <p className="mb-2">Belum ada pengiriman yang dibuat.</p>
                                            <button onClick={() => router.push('/deliveries/create')} className="text-blue-600 font-medium hover:underline">Buat pengiriman pertama Anda</button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
