import React from 'react';

export function PayloadSummaryCard({ totalPayload }: { totalPayload: number }) {
    const isValid = totalPayload > 0 && totalPayload <= 400;

    return (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Ringkasan Payload</h3>
            
            <div className="flex items-end gap-2 mb-4">
                <span className={`text-4xl font-bold ${isValid ? 'text-blue-600' : 'text-red-600'}`}>
                    {totalPayload.toLocaleString('id-ID')}
                </span>
                <span className="text-gray-500 font-medium pb-1">Kg</span>
            </div>

            <div className={`p-3 rounded-lg text-sm flex gap-2 items-start ${isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isValid ? (
                    <>
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Kapasitas payload valid (maksimal 400 Kg).</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>
                            {totalPayload === 0 
                                ? "Pilih setidaknya satu panen untuk dimuat." 
                                : "Kapasitas melebihi batas maksimal 400 Kg."}
                        </span>
                    </>
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-dashed">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Batas Maksimal Kendaraan</span>
                    <span className="font-medium text-gray-700">400 Kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full ${totalPayload > 400 ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min((totalPayload / 400) * 100, 100)}%` }} 
                    />
                </div>
            </div>
        </div>
    );
}
