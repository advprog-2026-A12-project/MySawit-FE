interface Delivery {
    id: string;
    supirName: string;
    payloadKg: number;
    status: string;
    createdAt: string;
}

async function getDeliveries() {
    const res = await fetch('http://localhost:8082/api/deliveries', {
        cache: 'no-store'
    });

    if (!res.ok) {
        throw new Error('Gagal mengambil data dari backend. Pastikan server Spring Boot menyala!');
    }

    return res.json();
}

export default async function DeliveriesPage() {
    const deliveries = await getDeliveries();

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-green-800">Manajemen Pengiriman Sawit</h1>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-700">Live Data</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pengiriman</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Supir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payload (Kg)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {deliveries.map((delivery: Delivery) => (
                            <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                                    {delivery.id.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {delivery.supirName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className={delivery.payloadKg > 400 ? "text-red-600 font-bold" : ""}>
                      {delivery.payloadKg} Kg
                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${delivery.status === 'MEMUAT' ? 'bg-yellow-100 text-yellow-800' :
                        delivery.status === 'MENGIRIM' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'}`}>
                      {delivery.status}
                    </span>
                                </td>
                            </tr>
                        ))}
                        {deliveries.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                                    Belum ada data pengiriman. Silakan isi melalui Database IntelliJ.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <strong>Aturan Sistem:</strong> Muatan maksimal adalah 400 Kg sesuai batasan logistik modul 4.
                    </div>
                </div>
            </div>
        </main>
    );
}