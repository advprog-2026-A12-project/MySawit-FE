"use client";

import React, { useEffect, useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-api';
import { 
    getDeliveries, getSupirTasks, advanceDeliveryStatus, 
    mandorApproveDelivery, adminApproveDelivery, Delivery 
} from '@/lib/delivery-api';
import { TimelineTracker } from '@/app/components/delivery/TimelineTracker';
import { ApprovalModal } from '@/app/components/delivery/ApprovalModal';
import { getErrorMessage } from '@/lib/utils';

export default function DeliveryDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const user = useMemo(() => getStoredUser(), []);
    const role = user?.role;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

    const fetchDelivery = async () => {
        try {
            setLoading(true);
            let deliveries: Delivery[] = [];
            
            if (role === 'SUPIR_TRUK') {
                deliveries = await getSupirTasks();
            } else if (role === 'MANDOR' || role === 'ADMIN') {
                deliveries = await getDeliveries();
            }
            
            const found = deliveries.find(d => d.id === params.id);
            if (found) {
                setDelivery(found);
            } else {
                setMsg({ text: "Pengiriman tidak ditemukan atau Anda tidak memiliki akses.", type: "error" });
            }
        } catch (err: unknown) {
            setMsg({ text: getErrorMessage(err, "Gagal memuat detail pengiriman"), type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            router.replace('/login');
            return;
        }
        fetchDelivery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, params.id, router]);

    const handleAdvanceStatus = async () => {
        if (!delivery) return;
        try {
            setSubmitting(true);
            const updated = await advanceDeliveryStatus(delivery.id);
            setDelivery(updated);
            setMsg({ text: "Status pengiriman berhasil diperbarui!", type: "success" });
        } catch (err: unknown) {
            setMsg({ text: getErrorMessage(err, "Gagal memperbarui status"), type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (payloadOverride?: number) => {
        if (!delivery) return;
        try {
            setSubmitting(true);
            let updated: Delivery | undefined;
            if (role === 'MANDOR') {
                updated = await mandorApproveDelivery(delivery.id, true);
            } else if (role === 'ADMIN') {
                updated = await adminApproveDelivery(delivery.id, true, payloadOverride);
            }
            if (updated) {
                setDelivery(updated);
                setMsg({ text: "Pengiriman berhasil disetujui!", type: "success" });
            }
        } catch (err: unknown) {
            setMsg({ text: getErrorMessage(err, "Gagal menyetujui pengiriman"), type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!delivery) return;
        try {
            setSubmitting(true);
            let updated: Delivery | undefined;
            if (role === 'MANDOR') {
                updated = await mandorApproveDelivery(delivery.id, false, reason);
            } else if (role === 'ADMIN') {
                updated = await adminApproveDelivery(delivery.id, false, undefined, reason);
            }
            if (updated) {
                setDelivery(updated);
                setMsg({ text: "Pengiriman berhasil ditolak.", type: "success" });
            }
        } catch (err: unknown) {
            setMsg({ text: getErrorMessage(err, "Gagal menolak pengiriman"), type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    
    if (!delivery) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
                <p className="text-gray-500 mb-6">{msg.text || "Pengiriman yang Anda cari tidak ada atau akses ditolak."}</p>
                <button onClick={() => router.push('/deliveries')} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Kembali ke Dashboard
                </button>
            </div>
        </div>
    );

    const canAdvanceStatus = role === 'SUPIR_TRUK' && delivery.status !== 'TIBA_DI_TUJUAN';
    const canMandorApprove = role === 'MANDOR' && delivery.status === 'TIBA_DI_TUJUAN' && delivery.approvalStatus === 'PENDING';
    const canAdminApprove = role === 'ADMIN' && delivery.status === 'TIBA_DI_TUJUAN' && delivery.approvalStatus === 'APPROVED';

    let nextStatusText = '';
    if (delivery.status === 'MEMUAT') nextStatusText = 'Mulai Mengirim';
    if (delivery.status === 'MENGIRIM') nextStatusText = 'Tiba di Tujuan';

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-8 pb-24">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Detail Pengiriman</h1>
                        <p className="text-gray-500 font-mono text-sm mt-1">{delivery.id}</p>
                    </div>
                </div>

                {msg.text && (
                    <div className={`px-4 py-3 rounded-xl mb-6 border animate-in fade-in slide-in-from-top-2 ${msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {msg.text}
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <TimelineTracker status={delivery.status} approvalStatus={delivery.approvalStatus} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Informasi Umum</h3>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Supir Truk</dt>
                                <dd className="text-base font-semibold text-gray-900 mt-1">{delivery.supirName}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Mandor Pengawas</dt>
                                <dd className="text-base font-semibold text-gray-900 mt-1">{delivery.mandorName || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Tanggal Dibuat</dt>
                                <dd className="text-base text-gray-900 mt-1">
                                    {new Date(delivery.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Detail Muatan</h3>
                        
                        <div className="flex-1 flex flex-col justify-center items-center py-6 bg-gray-50 rounded-lg border border-dashed">
                            <span className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Total Payload</span>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-bold text-gray-900">{delivery.payloadKg}</span>
                                <span className="text-xl text-gray-500 font-medium pb-1">Kg</span>
                            </div>
                        </div>

                        {delivery.approvedPayloadKg && (
                            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg flex justify-between items-center text-sm border border-green-100">
                                <span className="font-medium">Disetujui Admin (Final):</span>
                                <span className="font-bold text-base">{delivery.approvedPayloadKg} Kg</span>
                            </div>
                        )}
                        
                        {delivery.rejectionReason && (
                            <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">
                                <span className="font-bold block mb-1">Alasan Penolakan:</span>
                                <span>{delivery.rejectionReason}</span>
                            </div>
                        )}
                    </div>
                </div>

                {(canAdvanceStatus || canMandorApprove || canAdminApprove) && (
                    <div className="mt-8">
                        <div className="grid gap-4 md:grid-cols-2">
                            {canAdvanceStatus && (
                                <button 
                                    onClick={handleAdvanceStatus}
                                    disabled={submitting}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Memproses...' : nextStatusText}
                                    {!submitting && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {(canMandorApprove || canAdminApprove) && (
                                <button 
                                    onClick={() => setIsApprovalModalOpen(true)}
                                    disabled={submitting}
                                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all"
                                >
                                    Tinjau & Setujui / Tolak
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <ApprovalModal 
                    isOpen={isApprovalModalOpen} 
                    onClose={() => setIsApprovalModalOpen(false)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    title={role === 'ADMIN' ? 'Persetujuan Final Admin' : 'Persetujuan Mandor'}
                    requirePayloadOverride={role === 'ADMIN'}
                    defaultPayload={delivery.payloadKg}
                />
            </div>
        </main>
    );
}
