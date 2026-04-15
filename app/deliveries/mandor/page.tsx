"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-api';

export default function MandorDeliveryPage() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        // Cek Role Mandor
        if (!user || user.role !== 'MANDOR') {
            router.replace('/deliveries');
            return;
        }
        setAuthorized(true);
    }, [router]);

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-green-800 mb-4">Dashboard Mandor: Kelola Pengiriman</h1>
                <p className="text-gray-600 mb-8">
                    Halaman ini khusus untuk Mandor (RBAC: MANDOR). 
                    Logika frontend untuk membuat pengiriman (POST /api/deliveries) diaplikasikan di sini tanpa hambatan.
                </p>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Form Buat Pengiriman Baru</h2>
                    <p className="text-sm text-gray-500 italic">Form placeholder...</p>
                </div>
            </div>
        </main>
    );
}
