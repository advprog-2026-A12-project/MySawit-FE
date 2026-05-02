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

        if (amount === "" || Number(amount) <= 0) {
            setMessage("Masukkan jumlah panen yang valid");
            return;
        }

        if (reportNote.trim() === "") {
            setMessage("Catatan panen wajib diisi");
            return;
        }

        setSubmitting(true);
        setMessage("");

        try {
            const res = await submitHarvest({
                kilogram: Number(amount),
                reportNote: reportNote.trim(),
                photos,
            });

            const data = res?.data ?? res;

            setMessage(`✅ Sukses! ID Panen: ${data.id}`);
            setAmount("");
            setReportNote("");
            setPhotos([]);

            setAlreadySubmitted(false);

            setTimeout(() => router.push("/harvest"), 1500);
        } catch (err) {
            if (err instanceof Error) {
                const msg = err.message;
                if (msg.includes("409") || msg.includes("Sudah submit")) {
                    setAlreadySubmitted(true);
                    setMessage("❌ Sudah submit panen hari ini");
                } else {
                    setMessage(`❌ ${msg}`);
                }
            } else {
                setMessage("❌ Terjadi kesalahan");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 text-black font-sans">
            <div className="mx-auto max-w-2xl">

                {/* HEADER */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900">Tambah Hasil Panen</h1>
                        <p className="text-gray-500 mt-1">Laporkan hasil kerja harian Anda</p>
                    </div>
                    <button
                        onClick={() => router.push("/harvest")}
                        className="text-sm text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                    >
                        ← Daftar Panen
                    </button>
                </div>

                {/* FORM CARD */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                    <div className="border-b border-gray-200 bg-gray-50 p-4">
                        <h2 className="font-semibold text-gray-700">Form Laporan Harian</h2>
                    </div>

                    <form className="p-6 space-y-6" onSubmit={handleSubmit}>

                        {/* AMOUNT */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Jumlah Panen (Kg)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                placeholder="Contoh: 50"
                                required
                                disabled={alreadySubmitted}
                                min={1}
                                className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all"
                            />
                        </div>

                        {/* NOTE */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Catatan Laporan
                            </label>
                            <textarea
                                value={reportNote}
                                onChange={(e) => setReportNote(e.target.value)}
                                placeholder="Ceritakan kondisi lahan atau hasil panen..."
                                disabled={alreadySubmitted}
                                rows={4}
                                className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all"
                            />
                        </div>

                        {/* FILE UPLOAD */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Foto Bukti Panen
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-900 hover:text-blue-800 focus-within:outline-none">
                                            <span>Upload file</span>
                                            <input
                                                type="file"
                                                className="sr-only"
                                                multiple
                                                onChange={handleFileChange}
                                                disabled={alreadySubmitted}
                                                accept="image/*"
                                            />
                                        </label>
                                        <p className="pl-1 text-gray-500">atau drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-400">PNG, JPG, JPEG hingga 10MB</p>
                                </div>
                            </div>
                            {photos.length > 0 && (
                                <p className="mt-2 text-sm font-medium text-blue-900">
                                    ✅ {photos.length} file terpilih
                                </p>
                            )}
                        </div>

                        {/* MESSAGE */}
                        {message && (
                            <div className={`p-4 rounded-md text-sm font-medium ${
                                message.startsWith("✅")
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {message}
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={submitting || alreadySubmitted}
                            className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all ${
                                alreadySubmitted || submitting
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                            }`}
                        >
                            {alreadySubmitted
                                ? "Laporan Sudah Dikirim"
                                : submitting
                                    ? "Sedang Mengirim..."
                                    : "Kirim Laporan"}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400">
                    Sistem Manajemen Panen MySawit v1.0
                </p>
            </div>
        </main>
    );
}