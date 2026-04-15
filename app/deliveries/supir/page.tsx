"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-api';

export default function SupirDeliveryPage() {
    const router = useRouter();

    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'SUPIR_TRUK';

    useEffect(() => {
        if (!authorized) {
            router.replace('/deliveries');
        }
    }, [authorized, router]);

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-blue-800 mb-4">Dashboard Supir: Tugas Pengiriman</h1>
                <p className="text-gray-600 mb-8">
                    Halaman ini khusus untuk Supir (RBAC: SUPIR_TRUK).
                    Logika frontend untuk mengupdate status (PATCH /api/deliveries/:id/status) akan diproses di sini.
                </p>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Daftar Pengiriman Saya</h2>
                    <p className="text-sm text-gray-500 italic">List pengiriman placeholder...</p>
                </div>
            </div>
        </main>
    );
}
