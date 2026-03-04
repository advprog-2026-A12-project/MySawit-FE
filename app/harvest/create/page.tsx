"use client";

import { useState } from "react";

interface HarvestResponse {
    id: string;
}

export default function HarvestCreatePage() {
    const [amount, setAmount] = useState<number | "">("");
    const [reportNote, setReportNote] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amount === "" || amount < 1) {
            setMessage("Masukkan jumlah panen yang valid");
            return;
        }

        if (reportNote.trim() === "") {
            setMessage("Catatan panen wajib diisi");
            return;
        }

        setSubmitting(true);
        setMessage("Submitting...");

        try {
            const formData = new FormData();
            formData.append("kilogram", amount.toString());
            formData.append("reportNote", reportNote.trim());

            photos.forEach((photo) => formData.append("photos", photo));
            const res = await fetch(`${BACKEND_URL}/api/harvest`, {
                method: "POST",
                headers: {
                    "X-USER-ID": "123e4567-e89b-12d3-a456-426614174000",
                    "X-ROLE": "BURUH",
                },
                body: formData,
            });

            if (res.status === 409) {
                setAlreadySubmitted(true);
                throw new Error("Sudah submit panen hari ini");
            }

            if (!res.ok) {
                // Menangani error jika response bukan JSON
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Terjadi kesalahan saat submit harvest");
            }

            const data: HarvestResponse = await res.json();

            setMessage(`✅ Sukses! ID Panen: ${data.id}`);
            setAmount("");
            setReportNote("");
            setPhotos([]);
            setAlreadySubmitted(false);

        } catch (err) {
            if (err instanceof Error) {
                setMessage(`❌ ${err.message}`);
            } else {
                setMessage("❌ Terjadi kesalahan tak terduga");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 text-black">
            <h1 className="text-3xl font-bold mb-6">Tambah Hasil Panen</h1>

            <form
                className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
                onSubmit={handleSubmit}
            >
                {/* Jumlah Panen */}
                <div className="mb-4">
                    <label className="block text-black font-medium mb-1">Jumlah Panen (Kg)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        required
                        disabled={alreadySubmitted}
                        min={0}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                    />
                </div>

                {/* Report Note */}
                <div className="mb-4">
                    <label className="block text-black font-medium mb-1">Catatan</label>
                    <textarea
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        disabled={alreadySubmitted}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                    />
                </div>

                {/* Upload Foto */}
                <div className="mb-4">
                    <label className="block text-black font-medium mb-1">Foto</label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        disabled={alreadySubmitted}
                        accept="image/*"
                        className="w-full"
                    />
                    {photos.length > 0 && (
                        <p className="mt-1 text-sm text-gray-700">{photos.length} file dipilih</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={submitting || alreadySubmitted}
                    className={`w-full py-2 rounded transition-colors 
            ${alreadySubmitted || submitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"}`}
                >
                    {alreadySubmitted
                        ? "Sudah Submit Hari Ini"
                        : submitting
                            ? "Submitting..."
                            : "Submit"}
                </button>

                {message && (
                    <p className="mt-4 text-center font-medium text-black break-words">{message}</p>
                )}
            </form>
        </div>
    );
}