"use client";

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
import {
  type WalletTransaction,
  type WalletTransactionType,
  getMyWallet,
  getMyWalletTransactions,
} from "@/lib/wallet-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  BURUH: "Buruh",
  MANDOR: "Mandor",
  SUPIR_TRUK: "Supir Truk",
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatWalletAmount(amount?: number, currency = "SawitDollar") {
  const value = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

  return `${value} ${currency === "SawitDollar" ? "SD" : currency}`;
}

const referenceTypeLabels: Record<string, string> = {
  PAYROLL_DISBURSEMENT: "Pencairan Upah",
  PAYROLL_DEDUCTION: "Pembayaran Upah",
  TOPUP: "Top Up",
};

const transactionSortOptions = [
  { value: "createdAt,desc", label: "Terbaru" },
  { value: "createdAt,asc", label: "Terlama" },
  { value: "amount,desc", label: "Nominal terbesar" },
  { value: "amount,asc", label: "Nominal terkecil" },
] as const;

const transactionSizeOptions = [5, 10, 20] as const;

function transactionAmountLabel(transaction: WalletTransaction, currency?: string) {
  const sign = transaction.transactionType === "CREDIT" ? "+" : "-";
  return `${sign}${formatWalletAmount(transaction.amount, currency)}`;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [transactionPage, setTransactionPage] = useState(0);
  const [transactionType, setTransactionType] = useState<WalletTransactionType | "">("");
  const [transactionDateFrom, setTransactionDateFrom] = useState("");
  const [transactionDateTo, setTransactionDateTo] = useState("");
  const [transactionSort, setTransactionSort] = useState("createdAt,desc");
  const [transactionSize, setTransactionSize] = useState(5);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const profile = meQuery.data?.data;

  const walletQuery = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: () => getMyWallet(),
    enabled: Boolean(profile),
    retry: (failureCount, error) => {
      if ((error as ApiError).status === 404) return false;
      return failureCount < 2;
    },
  });

  const wallet = walletQuery.data?.data;

  const transactionsQuery = useQuery({
    queryKey: [
      "wallet",
      "me",
      "transactions",
      transactionPage,
      transactionSize,
      transactionSort,
      transactionType,
      transactionDateFrom,
      transactionDateTo,
    ],
    queryFn: () =>
      getMyWalletTransactions({
        page: transactionPage,
        size: transactionSize,
        sort: transactionSort,
        transactionType: transactionType || undefined,
        dateFrom: transactionDateFrom || undefined,
        dateTo: transactionDateTo || undefined,
      }),
    enabled: Boolean(wallet),
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

  function resetTransactionFilters() {
    setTransactionPage(0);
    setTransactionType("");
    setTransactionDateFrom("");
    setTransactionDateTo("");
    setTransactionSort("createdAt,desc");
    setTransactionSize(5);
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
  const walletError = walletQuery.isError ? (walletQuery.error as ApiError) : null;
  const walletMissing = walletError?.status === 404;
  const transactionsError = transactionsQuery.isError ? (transactionsQuery.error as ApiError) : null;
  const transactions = transactionsQuery.data?.data.content ?? [];
  const transactionPageInfo = transactionsQuery.data?.data;

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

        <section className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Wallet</h2>
              <p className="mt-1 text-sm text-gray-500">Saldo SawitDollar dan riwayat transaksi akun Anda.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                walletQuery.refetch();
                if (wallet) {
                  transactionsQuery.refetch();
                }
              }}
              disabled={walletQuery.isFetching || transactionsQuery.isFetching}
              className="inline-flex w-fit rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100 disabled:opacity-60"
            >
              {walletQuery.isFetching || transactionsQuery.isFetching ? "Memuat..." : "Refresh"}
            </button>
          </div>

          {walletQuery.isLoading && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
              Memuat wallet...
            </div>
          )}

          {walletMissing && (
            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-5">
              <p className="text-sm font-semibold text-yellow-800">Wallet belum tersedia.</p>
              <p className="mt-1 text-sm text-yellow-700">
                Wallet biasanya dibuat otomatis setelah registrasi. Coba refresh beberapa saat lagi jika event backend
                belum selesai diproses.
              </p>
            </div>
          )}

          {walletError && !walletMissing && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
              {walletError.message}
            </div>
          )}

          {wallet && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-green-100 bg-green-50 p-4 md:col-span-2">
                  <p className="text-sm font-medium text-green-700">Saldo saat ini</p>
                  <p className="mt-2 text-3xl font-bold text-green-950">
                    {formatWalletAmount(wallet.balance, wallet.currency)}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-500">Terakhir diperbarui</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{formatDateTime(wallet.updatedAt)}</p>
                </div>
              </div>

              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Riwayat Transaksi</h3>
                  {transactionPageInfo && (
                    <p className="text-sm text-gray-500">
                      {transactionPageInfo.totalElements} transaksi
                    </p>
                  )}
                </div>

                <div className="mt-4 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label htmlFor="transactionType" className="mb-1 block text-xs font-semibold text-gray-600">
                      Tipe
                    </label>
                    <select
                      id="transactionType"
                      value={transactionType}
                      onChange={(event) => {
                        setTransactionPage(0);
                        setTransactionType(event.target.value as WalletTransactionType | "");
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    >
                      <option value="">Semua</option>
                      <option value="CREDIT">Masuk</option>
                      <option value="DEBIT">Keluar</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="transactionDateFrom" className="mb-1 block text-xs font-semibold text-gray-600">
                      Dari tanggal
                    </label>
                    <input
                      id="transactionDateFrom"
                      type="date"
                      value={transactionDateFrom}
                      max={transactionDateTo || undefined}
                      onChange={(event) => {
                        setTransactionPage(0);
                        setTransactionDateFrom(event.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="transactionDateTo" className="mb-1 block text-xs font-semibold text-gray-600">
                      Sampai tanggal
                    </label>
                    <input
                      id="transactionDateTo"
                      type="date"
                      value={transactionDateTo}
                      min={transactionDateFrom || undefined}
                      onChange={(event) => {
                        setTransactionPage(0);
                        setTransactionDateTo(event.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="transactionSort" className="mb-1 block text-xs font-semibold text-gray-600">
                      Urutkan
                    </label>
                    <select
                      id="transactionSort"
                      value={transactionSort}
                      onChange={(event) => {
                        setTransactionPage(0);
                        setTransactionSort(event.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    >
                      {transactionSortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="transactionSize" className="mb-1 block text-xs font-semibold text-gray-600">
                      Tampil
                    </label>
                    <select
                      id="transactionSize"
                      value={transactionSize}
                      onChange={(event) => {
                        setTransactionPage(0);
                        setTransactionSize(Number(event.target.value));
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    >
                      {transactionSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size} data
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-5">
                    <button
                      type="button"
                      onClick={resetTransactionFilters}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>

                {transactionsQuery.isLoading && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                    Memuat transaksi...
                  </div>
                )}

                {transactionsError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
                    {transactionsError.message}
                  </div>
                )}

                {!transactionsQuery.isLoading && !transactionsError && transactions.length === 0 && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada transaksi wallet.
                  </div>
                )}

                {transactions.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                    <div className="divide-y divide-gray-100">
                      {transactions.map((transaction) => {
                        const isCredit = transaction.transactionType === "CREDIT";

                        return (
                          <div
                            key={transaction.id}
                            className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    isCredit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {isCredit ? "Masuk" : "Keluar"}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {referenceTypeLabels[transaction.referenceType] ?? transaction.referenceType}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">{transaction.description || "-"}</p>
                              <p className="mt-1 text-xs text-gray-400">{formatDateTime(transaction.createdAt)}</p>
                            </div>

                            <div className="shrink-0 text-left sm:text-right">
                              <p className={`text-sm font-bold ${isCredit ? "text-green-700" : "text-red-700"}`}>
                                {transactionAmountLabel(transaction, wallet.currency)}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Saldo: {formatWalletAmount(transaction.balanceAfter, wallet.currency)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {transactionPageInfo && transactionPageInfo.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setTransactionPage((page) => Math.max(page - 1, 0))}
                      disabled={transactionsQuery.isFetching || transactionPageInfo.first}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <p className="text-sm text-gray-500">
                      Halaman {transactionPageInfo.page + 1} dari {transactionPageInfo.totalPages}
                    </p>
                    <button
                      type="button"
                      onClick={() => setTransactionPage((page) => page + 1)}
                      disabled={transactionsQuery.isFetching || transactionPageInfo.last}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Berikutnya
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
