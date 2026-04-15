"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:8001";

const ROLES = [
  { value: "BURUH", label: "Buruh Sawit" },
  { value: "MANDOR", label: "Mandor" },
  { value: "SUPIR_TRUK", label: "Supir Truk" },
] as const;

type RegisterRole = (typeof ROLES)[number]["value"];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("BURUH");
  const [mandorCertificationNumber, setMandorCertificationNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);
    setLoading(true);

    try {
      const payload: Record<string, string | null> = {
        name,
        email,
        password,
        role,
        mandorCertificationNumber: role === "MANDOR" ? mandorCertificationNumber : null,
      };

      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      if (!res.ok) {
        if (body.errors && Array.isArray(body.errors)) {
          setFieldErrors(body.errors);
        }
        setError(body.message ?? "Registrasi gagal. Silakan coba lagi.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Tidak dapat terhubung ke server. Pastikan backend menyala.");
    } finally {
      setLoading(false);
    }
  }

  function getFieldError(field: string) {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  if (success) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-900 tracking-tight">
              🌴 MySawit
            </h1>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">Registrasi Berhasil!</h2>
            <p className="text-gray-600 mb-6">Akun Anda telah dibuat. Silakan masuk untuk melanjutkan.</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition"
            >
              Masuk Sekarang
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-900 tracking-tight">
            🌴 MySawit
          </h1>
          <p className="text-green-700 mt-1 text-lg">Buat akun baru</p>
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

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition ${
                  getFieldError("name")
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                }`}
              />
              {getFieldError("name") && (
                <p className="mt-1 text-xs text-red-600">{getFieldError("name")}</p>
              )}
            </div>

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
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition ${
                  getFieldError("email")
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                }`}
              />
              {getFieldError("email") && (
                <p className="mt-1 text-xs text-red-600">{getFieldError("email")}</p>
              )}
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter, huruf besar, kecil, angka, spesial"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition ${
                  getFieldError("password")
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                }`}
              />
              {getFieldError("password") && (
                <p className="mt-1 text-xs text-red-600">{getFieldError("password")}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value as RegisterRole)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandor Certification Number */}
            {role === "MANDOR" && (
              <div>
                <label
                  htmlFor="mandorCertificationNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nomor Sertifikasi Mandor
                </label>
                <input
                  id="mandorCertificationNumber"
                  type="text"
                  required
                  value={mandorCertificationNumber}
                  onChange={(e) => setMandorCertificationNumber(e.target.value)}
                  placeholder="Masukkan nomor sertifikasi"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition ${
                    getFieldError("mandorCertificationNumber")
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                  }`}
                />
                {getFieldError("mandorCertificationNumber") && (
                  <p className="mt-1 text-xs text-red-600">
                    {getFieldError("mandorCertificationNumber")}
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 focus:ring-2 focus:ring-green-300 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Daftar"}
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

          <GoogleAuthButton
            label="Daftar dengan Google"
            onError={setError}
            promptRoleOnRegister
            registerContext={{
              role,
              mandorCertificationNumber:
                role === "MANDOR" ? mandorCertificationNumber : undefined,
            }}
          />

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-green-700 hover:text-green-800">
              Masuk di sini
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
