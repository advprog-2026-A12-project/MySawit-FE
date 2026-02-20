// app/plantations/page.tsx

interface Plantation {
    id: number;
    name: string;
    location: string;
}

async function getPlantations(): Promise<Plantation[]> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SAWIT_API_URL ?? "http://localhost:8082"}/api/plantations`,
            { cache: "no-store" }
        );
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function PlantationsPage() {
    const plantations = await getPlantations();

    return (
        <main className="min-h-screen bg-green-50 px-6 py-12">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-green-900 tracking-tight">
                        🌴 MySawit
                    </h1>
                    <p className="text-green-700 mt-1 text-lg">Daftar Perkebunan</p>
                </div>

                {/* Content */}
                {plantations.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-10 text-center">
                        <p className="text-gray-400 text-lg">Belum ada data perkebunan.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {plantations.map((p) => (
                            <div
                                key={p.id}
                                className="bg-white rounded-2xl shadow-sm border border-green-100 px-6 py-5 flex items-center justify-between hover:shadow-md transition-shadow"
                            >
                                <div>
                                    <h2 className="text-xl font-semibold text-green-900">{p.name}</h2>
                                    <p className="text-green-600 mt-1 flex items-center gap-1">
                                        <span>📍</span>
                                        <span>{p.location}</span>
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                  ID: {p.id}
                </span>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-center text-xs text-gray-400 mt-10">
                    MySawit · {new Date().toLocaleDateString("id-ID")}
                </p>
            </div>
        </main>
    );
}