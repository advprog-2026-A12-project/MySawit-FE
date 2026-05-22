"use client";

import { useState, useEffect } from "react";
import { submitHarvest } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HarvestCreatePage() {
    const [amount, setAmount] = useState<number | "">("");
    const [reportNote, setReportNote] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]); // State untuk preview gambar
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        return () => {
            previews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previews]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            // Gabungkan foto lama dengan foto baru (biar bisa tambah berkali-kali)
            setPhotos((prev) => [...prev, ...newFiles]);

            // Buat URL sementara untuk preview
            const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
            setPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removePhoto = (indexToRemove: number) => {
        setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
        setPreviews((prev) => {
            // Hapus url dari memori
            URL.revokeObjectURL(prev[indexToRemove]);
            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amount === "" || Number(amount) <= 0) {
            setMessage("❌ Masukkan jumlah panen yang valid");
            return;
        }

        if (reportNote.trim() === "") {
            setMessage("❌ Catatan panen wajib diisi");
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
            setPreviews([]);
            setAlreadySubmitted(false);

            setTimeout(() => router.push("/harvest"), 1500);
        } catch (err) {
            if (err instanceof Error) {
                const msg = err.message;
                if (msg.includes("409") || msg.includes("Sudah submit")) {
                    setAlreadySubmitted(true);
                    setMessage("❌ Anda sudah melaporkan panen hari ini.");
                } else {
                    setMessage("❌ Gagal mengirim laporan. Silakan coba lagi nanti.");
                }
            } else {
                setMessage("❌ Terjadi kesalahan pada sistem.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 text-black font-sans">
            <div className="mx-auto max-w-2xl">

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-green-800">Tambah Hasil Panen</h1>
                        <p className="text-gray-500 mt-1">Laporkan hasil kerja harian Anda </p>
                    </div>
                    <button
                        onClick={() => router.push("/harvest")}
                        className="text-sm text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                    >
                        ← Daftar Panen
                    </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                    <div className="border-b border-gray-200 bg-gray-50 p-4">
                        <h2 className="font-semibold text-gray-700">Form Laporan Harian</h2>
                    </div>

                    <form className="p-6 space-y-6" onSubmit={handleSubmit}>

                        {/* Input Jumlah */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Jumlah Panen (Kg)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="Contoh: 50"
                                required
                                disabled={alreadySubmitted}
                                min={1}
                                className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-700 transition-all"
                            />
                        </div>

                        {/* Input Catatan */}
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
                                className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-700 transition-all"
                            />
                        </div>

                        {/* Upload Multiple Foto & Preview */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Foto Bukti Panen (Bisa Lebih Dari Satu)
                            </label>

                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex justify-center text-sm text-gray-600">
                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-800 hover:text-green-700 focus-within:outline-none">
                                            <span>Tambah file gambar</span>
                                            <input
                                                type="file"
                                                className="sr-only"
                                                multiple
                                                onChange={handleFileChange}
                                                disabled={alreadySubmitted}
                                                accept="image/*"
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-400">Pilih satu atau beberapa file sekaligus</p>
                                </div>
                            </div>

                            {/* Grid Preview Gambar */}
                            {previews.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-green-800 mb-2">
                                        {previews.length} foto terpilih:
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {previews.map((src, index) => (
                                            <div key={index} className="relative group rounded-md overflow-hidden border border-gray-200 aspect-square">
                                                <Image
                                                    src={src}
                                                    alt={`Preview ${index}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {/* Tombol hapus muncul saat di-hover */}
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">HAPUS</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {message && (
                            <div className={`p-4 rounded-md text-sm font-medium ${
                                message.startsWith("✅")
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || alreadySubmitted || photos.length === 0}
                            className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all ${
                                alreadySubmitted || submitting || photos.length === 0
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-green-800 hover:bg-green-900 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                            }`}
                        >
                            {alreadySubmitted
                                ? "Laporan Sudah Dikirim"
                                : submitting
                                    ? "Sedang Mengirim Data..."
                                    : "Kirim Laporan"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}