"use client";

import React, { useState } from 'react';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (payloadKg?: number) => void;
    onReject: (reason: string) => void;
    title: string;
    requirePayloadOverride?: boolean;
    defaultPayload?: number;
}

export function ApprovalModal({ isOpen, onClose, onApprove, onReject, title, requirePayloadOverride, defaultPayload }: ApprovalModalProps) {
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null);
    const [reason, setReason] = useState('');
    const [payload, setPayload] = useState(defaultPayload?.toString() || '');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white text-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 border animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
                
                {!action ? (
                    <div className="flex gap-4">
                        <button onClick={() => setAction('APPROVE')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">Setujui</button>
                        <button onClick={() => setAction('REJECT')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors">Tolak</button>
                        <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors">Batal</button>
                    </div>
                ) : action === 'APPROVE' ? (
                    <div className="space-y-4">
                        {requirePayloadOverride && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payload Disetujui (Kg)</label>
                                <input type="number" value={payload} onChange={e => setPayload(e.target.value)} className="w-full border border-gray-300 text-gray-900 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Masukkan total Kg akhir" />
                            </div>
                        )}
                        <p className="text-sm text-gray-600">Anda yakin ingin menyetujui pengiriman ini?</p>
                        <div className="flex gap-2 justify-end mt-4">
                            <button onClick={() => setAction(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Kembali</button>
                            <button onClick={() => {
                                onApprove(requirePayloadOverride ? Number(payload) : undefined);
                                onClose();
                            }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">Konfirmasi Persetujuan</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan <span className="text-red-500">*</span></label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full border border-gray-300 text-gray-900 p-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" rows={3} placeholder="Wajib diisi..." required />
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <button onClick={() => setAction(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Kembali</button>
                            <button onClick={() => {
                                onReject(reason);
                                onClose();
                            }} disabled={!reason.trim()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">Konfirmasi Penolakan</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
