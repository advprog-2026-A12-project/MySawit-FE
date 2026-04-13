"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ApiError,
  UserRole,
  clearAuthSession,
  getMe,
  getRefreshToken,
  logout,
  persistUserProfile,
  updateMe,
} from "@/lib/auth-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  BURUH: "Buruh",
  MANDOR: "Mandor",
  SUPIR_TRUK: "Supir Truk",
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; password?: string }) => updateMe(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(["me"], response);
      persistUserProfile(response.data);
      setFormMessage("Profil berhasil diperbarui.");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logout(refreshToken);
      }
    },
    onSettled: () => {
      clearAuthSession();
      window.location.href = "/login";
    },
  });

  const profile = meQuery.data?.data;

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    if (!profile) return;

    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("name") || "").trim();
    const nextPassword = String(formData.get("password") || "").trim();

    const payload: { name?: string; password?: string } = {};

    if (nextName && nextName !== profile.name) {
      payload.name = nextName;
    }

    if (nextPassword) {
      payload.password = nextPassword;
    }

    if (!payload.name && !payload.password) {
      setFormMessage("Tidak ada perubahan untuk disimpan.");
      return;
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        event.currentTarget.reset();
      },
    });
  }

  if (meQuery.isLoading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <p className="text-green-800 text-sm">Memuat profil...</p>
      </main>
    );
  }

  if (meQuery.isError) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-700">{(meQuery.error as ApiError).message}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const updateError = updateMutation.isError ? (updateMutation.error as ApiError) : null;

  return (
    <main className="min-h-screen bg-green-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-green-900">Profil Saya</h1>
              <p className="mt-1 text-sm text-green-700">Lihat informasi akun dan perbarui profil Anda.</p>
            </div>

            <div className="flex gap-2">
              {profile.role === "ADMIN" && (
                <>
                  <Link
                    href="/user"
                    className="inline-flex rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
                  >
                    Manajemen User
                  </Link>
                  <Link
                    href="/assignments"
                    className="inline-flex rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
                  >
                    Assignment
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="inline-flex rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {logoutMutation.isPending ? "Keluar..." : "Logout"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-green-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Informasi Akun</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Nama</dt>
                <dd className="font-medium text-gray-900">{profile.name}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Username</dt>
                <dd className="font-medium text-gray-900">{profile.username}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{profile.email}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Role</dt>
                <dd>
                  <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {roleLabels[profile.role]}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Provider OAuth</dt>
                <dd className="font-medium text-gray-900">{profile.oauthProvider ?? "-"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Dibuat</dt>
                <dd className="font-medium text-gray-900">{formatDateTime(profile.createdAt)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-gray-500">Diperbarui</dt>
                <dd className="font-medium text-gray-900">{formatDateTime(profile.updatedAt)}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-green-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Edit Profil</h2>
            <p className="mt-1 text-sm text-gray-500">Anda dapat mengubah nama dan password akun.</p>

            {formMessage && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {formMessage}
              </div>
            )}

            {updateError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {updateError.message}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Nama
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={profile.name}
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                  Password Baru
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}
