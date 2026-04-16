"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getUsers, UserListItem, getAccessToken } from '@/lib/auth-api';

interface Delivery {
    id: string;
    supirName: string;
    payloadKg: number;
    status: string;
    createdAt: string;
}

export default function MandorDeliveryPage() {
    const router = useRouter();

    const user = useMemo(() => getStoredUser(), []);
    const authorized = user?.role === 'MANDOR';

    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [supirList, setSupirList] = useState<UserListItem[]>([]);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [filterName, setFilterName] = useState("");

    const [formParams, setFormParams] = useState({
        supirId: "",
        harvestId: "00000000-0000-0000-0000-000000000000", // placeholder as harvest API is not the main scope here
        payloadKg: ""
    });

    useEffect(() => {
        if (!authorized) {
            router.replace('/deliveries');
            return;
        }

        const loadInitialData = async () => {
            try {
                try {
                    const supirRes = await getUsers({ role: 'SUPIR_TRUK' });
                    setSupirList(supirRes.data?.content || []);
                } catch (userErr) {
                    console.warn("Could not fetch supir list, proceeding without it.", userErr);
                }

                await fetchDeliveries();
            } catch (err) {
                setMsg({ text: "Gagal memuat data awal.", type: "error" });
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [authorized, router]);

    const fetchDeliveries = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8082';
            const res = await fetch(`${baseUrl}/api/deliveries`, {
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'X-User-Id': user?.id || '',
                    'X-User-Role': user?.role || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setDeliveries(data);
            }
        } catch (error) {
            console.error("Gagal mendapatkan daftar pengiriman", error);
        }
    };

    const handleSearchSupir = async () => {
        try {
            setMsg({ text: "", type: "" });
            const supirRes = await getUsers({ role: 'SUPIR_TRUK', name: filterName });
            setSupirList(supirRes.data?.content || []);
        } catch (err: any) {
             setMsg({ text: err.status === 403 ? "Anda tidak memiliki akses untuk mencari supir (Membutuhkan Admin)." : "Gagal mencari supir.", type: "error" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ text: "", type: "" });
        
        const payload = parseFloat(formParams.payloadKg);
        if (isNaN(payload) || payload < 1 || payload > 400) {
            setMsg({ text: "Payload harus berupa angka antara 1 dan 400 Kg", type: "error" });
            return;
        }

        if (!formParams.supirId) {
            setMsg({ text: "Silahkan pilih supir truk.", type: "error" });
            return;
        }

        const selectedSupir = supirList.find(s => s.id === formParams.supirId);

        try {
            const token = getAccessToken();
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8082';
            
            const reqBody = {
                supirId: formParams.supirId,
                supirName: selectedSupir ? selectedSupir.name : "Supir Truk (Manual)",
                harvestId: formParams.harvestId,
                payloadKg: payload
            };

            const res = await fetch(`${baseUrl}/api/deliveries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-User-Id': user?.id || '',
                    'X-User-Role': user?.role || '',
                    'X-User-Name': user?.name || ''
                },
                body: JSON.stringify(reqBody)
            });

            if (!res.ok) {
                const errResult = await res.text();
                throw new Error(errResult || "Gagal membuat pengiriman");
            }

            setMsg({ text: "Berhasil menugaskan pengiriman!", type: "success" });
            setFormParams({ ...formParams, payloadKg: "", supirId: "" });
            fetchDeliveries(); // refresh list
        } catch (error: any) {
             setMsg({ text: error.message || "Gagal menghubungi server", type: "error" });
        }
    };

    if (!authorized) return <div className="p-8 text-center">Memverifikasi akses Anda...</div>;
    if (loading) return <div className="p-8 text-center">Loading Data...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-green-800 mb-8">Dashboard Mandor: Kelola Pengiriman</h1>
                
                {msg.text && (
                    <div className={`px-4 py-3 rounded mb-6 border ${msg.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
                        {msg.text}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* KOLOM KIRI: FORM PENUGASAN */}
                    <div>
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Cari Supir Truk</h2>
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    className="flex-1 p-2 border rounded" 
                                    placeholder="Cari berdasarkan nama..." 
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                />
                                <button onClick={handleSearchSupir} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded transition">
                                    Cari
                                </button>
                            </div>
                            
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 mt-8">Buat Penugasan Baru</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Supir</label>
                                    {supirList.length > 0 ? (
                                        <select 
                                            required 
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                                            value={formParams.supirId}
                                            onChange={(e) => setFormParams({...formParams, supirId: e.target.value})}
                                        >
                                            <option value="" disabled>-- Pilih Supir --</option>
                                            {supirList.map(supir => (
                                                <option key={supir.id} value={supir.id}>{supir.name} ({supir.email})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="Contoh: 123e4567... (Masukkan UUID ID Supir)"
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                                                value={formParams.supirId}
                                                onChange={(e) => setFormParams({...formParams, supirId: e.target.value})}
                                            />
                                            <p className="text-xs text-orange-500 mt-1">Pencarian supir dibatasi hanya untuk Admin. Harap masukkan UUID manual.</p>
                                        </>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harvest ID (Otomatis/Sistem)</label>
                                    <input type="text" className="w-full p-2 border border-gray-300 rounded bg-gray-100" value={formParams.harvestId} disabled />
                                    <p className="text-xs text-gray-400 mt-1">Secara asitektur, ini di-generate dari Modul 3.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Muatan / Payload (Kg)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="1" 
                                        max="400"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500" 
                                        placeholder="Maks 400 Kg"
                                        value={formParams.payloadKg}
                                        onChange={(e) => setFormParams({...formParams, payloadKg: e.target.value})}
                                    />
                                </div>

                                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition">
                                    Tugaskan Pengiriman
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* KOLOM KANAN: DAFTAR PENGIRIMAN */}
                    <div>
                         <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                             <div className="p-4 border-b border-gray-200 bg-gray-50">
                                 <h2 className="font-semibold text-gray-700">Riwayat Penugasan Anda</h2>
                             </div>
                             <div className="overflow-y-auto max-h-[600px]">
                                {deliveries.length > 0 ? deliveries.map(d => (
                                    <div key={d.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-800">{d.supirName}</p>
                                            <p className="text-sm text-gray-500">ID: {d.id.substring(0,8)}...</p>
                                            <p className="text-sm font-medium text-gray-600 mt-1">Payload: {d.payloadKg} Kg</p>
                                        </div>
                                        <div>
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${d.status === 'MEMUAT' ? 'bg-yellow-100 text-yellow-800' :
                                                  d.status === 'MENGIRIM' ? 'bg-blue-100 text-blue-800' :
                                                      'bg-green-100 text-green-800'}`}>
                                                {d.status}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-500 italic">Belum ada penugasan yang dibuat.</div>
                                )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
