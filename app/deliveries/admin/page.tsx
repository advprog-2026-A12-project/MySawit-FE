"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-api';
import { getDeliveries, Delivery } from '@/lib/delivery-api';
import { StatusBadge } from '@/app/components/delivery/StatusBadge';

export default function AdminDeliveryPage() {
    const router = useRouter();
    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'ADMIN';

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
                const data = await getDeliveries();
                setDeliveries(data);
            } catch (err: any) {
                setErrorMsg(err.message || 'Gagal memuat daftar pengiriman');
            } finally {
                setLoading(false);
            }
        };

        fetchDeliveries();
    }, [authorized, router]);

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;
    if (loading) return <div className="p-8 text-center flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

    const pendingApproval = deliveries.filter(d => d.status === 'TIBA_DI_TUJUAN' && d.approvalStatus === 'APPROVED'); // Mandor approved, waiting for admin

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin: Pemantauan Pengiriman</h1>
                    <p className="text-gray-500 mt-1">Kelola persetujuan final (Admin Approval) dan pantau seluruh pengiriman hasil panen.</p>
                </div>
                
                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                        {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200">
                        <span className="text-sm text-gray-500">Total Pengiriman</span>
                        <div className="mt-3 text-3xl font-semibold text-gray-900">{deliveries.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200">
                        <span className="text-sm text-gray-500">Menunggu Persetujuan</span>
                        <div className="mt-3 text-3xl font-semibold text-orange-600">{pendingApproval.length}</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                        <h2 className="font-semibold text-gray-800">Semua Data Pengiriman</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mandor</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supir Truk</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payload</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Persetujuan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {deliveries.length > 0 ? deliveries.map(d => {
                                    const needsAdminApproval = d.status === 'TIBA_DI_TUJUAN' && d.approvalStatus === 'APPROVED';
                                    
                                    return (
                                        <tr 
                                            key={d.id} 
                                            onClick={() => router.push(`/deliveries/${d.id}`)}
                                            className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${needsAdminApproval ? 'bg-orange-50/30' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {d.id.substring(0,8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(d.tanggal || d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {d.mandorName || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {d.supirName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                <span className={d.payloadKg > 400 ? "text-red-600" : ""}>{d.payloadKg} Kg</span>
                                                {d.approvedPayloadKg && d.approvedPayloadKg !== d.payloadKg && (
                                                    <span className="ml-2 text-green-600">({d.approvedPayloadKg} Kg)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={d.status} type="delivery" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                                                <StatusBadge status={d.approvalStatus} type="approval" />
                                                {needsAdminApproval && (
                                                    <span className="flex h-2.5 w-2.5 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            Belum ada pengiriman terdaftar dalam sistem.
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
