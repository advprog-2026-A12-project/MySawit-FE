"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import {
  ApiError,
  getMe,
  loginWithGoogle,
  persistAuthSession,
  persistUserProfile,
  UserRole,
} from "@/lib/auth-api";

type GoogleRegisterContext = {
  role: Exclude<UserRole, "ADMIN">;
  mandorCertificationNumber?: string;
};

type GoogleAuthButtonProps = {
  label: string;
  onError: (message: string | null) => void;
  registerContext?: GoogleRegisterContext;
  promptRoleOnRegister?: boolean;
};

export default function GoogleAuthButton({
  label,
  onError,
  registerContext,
  promptRoleOnRegister = false,
}: GoogleAuthButtonProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-500"
      >
        {label} (NEXT_PUBLIC_GOOGLE_CLIENT_ID belum di-set)
      </button>
    );
  }

  return (
    <GoogleAuthButtonEnabled
      label={label}
      onError={onError}
      registerContext={registerContext}
      promptRoleOnRegister={promptRoleOnRegister}
    />
  );
}

function GoogleAuthButtonEnabled({
  label,
  onError,
  registerContext,
  promptRoleOnRegister,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingAuthorizationCode, setPendingAuthorizationCode] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, "ADMIN">>(
    registerContext?.role ?? "BURUH"
  );
  const [selectedCertificationNumber, setSelectedCertificationNumber] = useState(
    registerContext?.mandorCertificationNumber ?? ""
  );

  async function submitGoogleAuth(payload: {
    authorizationCode: string;
    role?: Exclude<UserRole, "ADMIN">;
    mandorCertificationNumber?: string;
  }) {
    setLoading(true);

    try {
      const trimmedCertificationNumber = payload.mandorCertificationNumber?.trim();

      const authResponse = await loginWithGoogle({
        authorizationCode: payload.authorizationCode,
        redirectUri: "postmessage",
        role: payload.role,
        mandorCertificationNumber:
          payload.role === "MANDOR" ? trimmedCertificationNumber ?? null : undefined,
      });

      persistAuthSession(authResponse.data);

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
        onError(err.message || "Google login gagal. Silakan coba lagi.");
      } else {
        onError("Tidak dapat terhubung ke server. Pastikan backend menyala.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (promptRoleOnRegister) {
      onError(null);
      login();
      return;
    }

    if (
      registerContext?.role === "MANDOR" &&
      !registerContext.mandorCertificationNumber?.trim()
    ) {
      onError("Nomor sertifikasi mandor wajib diisi sebelum daftar dengan Google.");
      return;
    }

    onError(null);
    login();
  }

  async function handleConfirmRoleSelection() {
    if (!pendingAuthorizationCode) {
      onError("Authorization code Google tidak ditemukan. Silakan coba lagi.");
      setShowRoleModal(false);
      return;
    }

    if (selectedRole === "MANDOR" && !selectedCertificationNumber.trim()) {
      onError("Nomor sertifikasi mandor wajib diisi.");
      return;
    }

    onError(null);
    setShowRoleModal(false);

    await submitGoogleAuth({
      authorizationCode: pendingAuthorizationCode,
      role: selectedRole,
      mandorCertificationNumber: selectedRole === "MANDOR" ? selectedCertificationNumber : undefined,
    });

    setPendingAuthorizationCode(null);
  }

  function handleCancelRoleSelection() {
    setShowRoleModal(false);
    setPendingAuthorizationCode(null);
    onError("Pemilihan role dibatalkan.");
  }

  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (tokenResponse) => {
      if (promptRoleOnRegister) {
        setPendingAuthorizationCode(tokenResponse.code);
        setShowRoleModal(true);
        return;
      }

      await submitGoogleAuth({
        authorizationCode: tokenResponse.code,
        role: registerContext?.role,
        mandorCertificationNumber: registerContext?.mandorCertificationNumber,
      });
    },
    onError: () => {
      onError("Autentikasi Google dibatalkan atau gagal.");
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {loading ? "Memproses Google..." : label}
      </button>

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Pilih Role Akun</h3>
            <p className="mt-1 text-sm text-gray-600">
              Pilih role untuk akun Google Anda sebelum registrasi diselesaikan.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="google-register-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="google-register-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Exclude<UserRole, "ADMIN">)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-white"
                >
                  <option value="BURUH">Buruh Sawit</option>
                  <option value="MANDOR">Mandor</option>
                  <option value="SUPIR_TRUK">Supir Truk</option>
                </select>
              </div>

              {selectedRole === "MANDOR" && (
                <div>
                  <label
                    htmlFor="google-register-mandor-cert"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nomor Sertifikasi Mandor
                  </label>
                  <input
                    id="google-register-mandor-cert"
                    type="text"
                    value={selectedCertificationNumber}
                    onChange={(e) => setSelectedCertificationNumber(e.target.value)}
                    placeholder="Masukkan nomor sertifikasi"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelRoleSelection}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleSelection}
                disabled={loading}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}