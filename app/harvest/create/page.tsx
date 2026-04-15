"use client";

import { useState } from "react";
import { submitHarvest } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function HarvestCreatePage() {
    const [amount, setAmount] = useState<number | "">("");
    const [reportNote, setReportNote] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setPhotos(Array.from(e.target.files));
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
            const data = await submitHarvest({
                kilogram: Number(amount),
                reportNote: reportNote.trim(),
                photos,
            });

            setMessage(`✅ Sukses! ID Panen: ${data.id}`);
            setAmount("");
            setReportNote("");
            setPhotos([]);
            setAlreadySubmitted(false);

            setTimeout(() => router.push("/harvest"), 1500);

        } catch (err) {
            if (err instanceof Error) {
                if (err.message.includes("409") || err.message.includes("Sudah submit")) {
                    setAlreadySubmitted(true);
                    setMessage("❌ Sudah submit panen hari ini");
                } else {
                    setMessage(`❌ ${err.message}`);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 text-black">
            <h1 className="text-3xl font-bold mb-6">Tambah Hasil Panen</h1>

            <form
                className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4"
                onSubmit={handleSubmit}
            >
                <div>
                    <label className="block font-medium mb-1">Jumlah Panen (Kg)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        required
                        disabled={alreadySubmitted}
                        min={1}
                        className="w-full border rounded px-3 py-2 bg-white focus:ring-2 focus:ring-green-400"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Catatan</label>
                    <textarea
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        disabled={alreadySubmitted}
                        className="w-full border rounded px-3 py-2 bg-white focus:ring-2 focus:ring-green-400"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Foto Panen</label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        disabled={alreadySubmitted}
                        accept="image/*"
                        className="w-full"
                    />
                    {photos.length > 0 && (
                        <p className="mt-1 text-sm text-gray-600">{photos.length} file dipilih</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={submitting || alreadySubmitted}
                    className={`w-full py-2 rounded transition-colors ${
                        alreadySubmitted || submitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                >
                    {alreadySubmitted ? "Sudah Submit Hari Ini" : submitting ? "Submitting..." : "Submit"}
                </button>

                {message && (
                    <p className="mt-2 text-center font-medium break-words">{message}</p>
                )}
            </form>
        </div>
    );
}