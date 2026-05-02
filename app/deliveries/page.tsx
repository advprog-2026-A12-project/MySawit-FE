"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-api';

export default function DeliveriesIndex() {
    const router = useRouter();

    useEffect(() => {
        const user = getStoredUser();
        
        if (!user) {
            router.replace('/login');
            return;
        }

        // Redirect based on role
        if (user.role === 'ADMIN') {
            router.replace('/deliveries/admin');
        } else if (user.role === 'MANDOR') {
            router.replace('/deliveries/mandor');
        } else if (user.role === 'SUPIR_TRUK') {
            router.replace('/deliveries/supir');
        } else {
            // Fallback for unexpected roles
            router.replace('/deliveries/unauthorized');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Mengarahkan rute sesuai role Anda...</p>
        </div>
    );
}