"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";
import {
  ApiError,
  getMe,
  login,
  persistAuthSession,
  persistUserProfile,
} from "@/lib/auth-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loginResponse = await login({ email, password });
      persistAuthSession(loginResponse.data);

      let redirectPath = "/profile";

      try {
        const meResponse = await getMe();
        persistUserProfile(meResponse.data);
        redirectPath = meResponse.data.role === "ADMIN" ? "/user" : "/profile";
      } catch {
        // Keep fallback redirect if profile endpoint is temporarily unavailable.
      }

      router.replace(redirectPath);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Login gagal. Periksa kembali email dan password.");
      } else {
        setError("Tidak dapat terhubung ke server. Pastikan backend menyala.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-900 tracking-tight">
            🌴 MySawit
          </h1>
          <p className="text-green-700 mt-1 text-lg">Masuk ke akun Anda</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 focus:ring-2 focus:ring-green-300 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-400">atau</span>
            </div>
          </div>

          <GoogleAuthButton label="Masuk dengan Google" onError={setError} />

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-green-700 hover:text-green-800">
              Daftar di sini
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          MySawit &middot; {new Date().toLocaleDateString("id-ID")}
        </p>
      </div>
    </main>
  );
}
