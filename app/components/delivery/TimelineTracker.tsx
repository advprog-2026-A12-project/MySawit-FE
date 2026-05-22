import React from 'react';

export function TimelineTracker({ status, approvalStatus }: { status: string, approvalStatus: string }) {
    const steps = [
        { key: 'MEMUAT', label: 'Memuat' },
        { key: 'MENGIRIM', label: 'Mengirim' },
        { key: 'TIBA_DI_TUJUAN', label: 'Tiba di Tujuan' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === status);
    
    return (
        <div className="py-8">
            <div className="flex items-center justify-between relative px-4">
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
                <div 
                    className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full transition-all"
                    style={{ width: `calc(${Math.max(0, currentStepIndex) * 50}% - 2rem)` }}
                />
                
                {steps.map((step, index) => (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${index <= currentStepIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                            {index + 1}
                        </div>
                        <span className={`text-xs mt-2 absolute -bottom-6 w-24 text-center font-medium ${index <= currentStepIndex ? 'text-blue-900' : 'text-gray-500'}`}>{step.label}</span>
                    </div>
                ))}
            </div>
            
            {(approvalStatus !== 'PENDING') && (
                <div className="mt-12 p-3 bg-gray-50 border rounded-lg text-sm flex justify-between items-center">
                    <span className="text-gray-600">Status Persetujuan:</span>
                    <span className={`font-bold ${approvalStatus === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                        {approvalStatus}
                    </span>
                </div>
            )}
        </div>
    );
}
