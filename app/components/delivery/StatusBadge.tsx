import React from 'react';

export function StatusBadge({ status, type = 'delivery' }: { status: string, type?: 'delivery' | 'approval' }) {
    let colorClass = "bg-gray-100 text-gray-800";
    
    if (type === 'delivery') {
        if (status === 'MEMUAT') colorClass = "bg-blue-100 text-blue-800";
        if (status === 'MENGIRIM') colorClass = "bg-yellow-100 text-yellow-800";
        if (status === 'TIBA_DI_TUJUAN') colorClass = "bg-green-100 text-green-800";
    } else {
        if (status === 'PENDING') colorClass = "bg-orange-100 text-orange-800";
        if (status === 'APPROVED' || status === 'MANDOR_APPROVED' || status === 'ADMIN_APPROVED') colorClass = "bg-green-100 text-green-800";
        if (status === 'REJECTED') colorClass = "bg-red-100 text-red-800";
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}
