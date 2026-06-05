"use client";

import React from 'react';
import { HarvestOption } from '@/lib/delivery-api';

export type HarvestRow = {
    id: string;
    status?: string;
    tanggalPanen?: string;
    createdAt?: string;
    buruhName?: string;
    kilogram?: number;
};

export function HarvestMultiSelectTable({ 
    harvests, 
    selectedIds, 
    onSelectionChange 
}: { 
    harvests: HarvestOption[], 
    selectedIds: string[], 
    onSelectionChange: (ids: string[]) => void 
}) {
    
    const toggleRow = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(sid => sid !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    }

    const toggleAll = () => {
        if (selectedIds.length === harvests.length && harvests.length > 0) {
            onSelectionChange([]);
        } else {
            onSelectionChange(harvests.map(h => h.id));
        }
    }

    if (!harvests || harvests.length === 0) return (
        <div className="p-8 text-center border rounded-xl bg-gray-50 text-gray-500">
            Tidak ada panen yang berstatus disetujui untuk dimuat.
        </div>
    );

    return (
        <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 border-b">
                    <tr>
                        <th className="p-3 w-12 text-center">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.length === harvests.length && harvests.length > 0} 
                                onChange={toggleAll} 
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                            />
                        </th>
                        <th className="p-3 font-semibold">ID Panen</th>
                        <th className="p-3 font-semibold">Tanggal</th>
                        <th className="p-3 font-semibold">Pelapor (Buruh)</th>
                        <th className="p-3 font-semibold text-right">Berat (Kg)</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {harvests.map((h) => (
                        <tr 
                            key={h.id} 
                            className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedIds.includes(h.id) ? 'bg-blue-50/30' : ''}`} 
                            onClick={() => toggleRow(h.id)}
                        >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.includes(h.id)} 
                                    onChange={() => toggleRow(h.id)} 
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                                />
                            </td>
                            <td className="p-3 font-mono text-xs text-gray-500">{h.id.substring(0, 8)}...</td>
                            <td className="p-3">{new Date(h.tanggalPanen || h.createdAt || new Date()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="p-3">{h.buruhName || 'Tidak diketahui'}</td>
                            <td className="p-3 font-medium text-right">{h.kilogram ?? 0} Kg</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
