"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useToast } from "@/app/components/ToastProvider";
import { ApiError, UserRole, getMe, getUserDetail } from "@/lib/auth-api";
import {
  Payroll,
  PayrollReferenceType,
  PayrollStatus,
  acceptPayroll,
  getPayrolls,
  rejectPayroll,
} from "@/lib/payroll-api";
import { getWalletByUserId } from "@/lib/wallet-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  BURUH: "Buruh",
  MANDOR: "Mandor",
  SUPIR_TRUK: "Supir Truk",
};

const statusLabels: Record<PayrollStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
};

const referenceTypeLabels: Record<PayrollReferenceType, string> = {
  HARVEST: "Panen",
  DELIVERY: "Pengiriman",
};

const payrollStatusOptions: PayrollStatus[] = ["PENDING", "ACCEPTED", "REJECTED"];

function roleBadge(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "bg-amber-100 text-amber-700";
    case "MANDOR":
      return "bg-blue-100 text-blue-700";
    case "SUPIR_TRUK":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function statusBadge(status: PayrollStatus) {
  switch (status) {
    case "ACCEPTED":
      return "bg-green-100 text-green-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAmount(value?: number, currency = "SawitDollar") {
  const amount = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

  return `${amount} ${currency === "SawitDollar" ? "SD" : currency}`;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default function AdminUserProfilePage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const userId = params.id;
  const [payrollPage, setPayrollPage] = useState(0);
  const [payrollStatus, setPayrollStatus] = useState<PayrollStatus | "">("");
  const [pendingAcceptPayroll, setPendingAcceptPayroll] = useState<Payroll | null>(null);
  const [pendingRejectPayroll, setPendingRejectPayroll] = useState<Payroll | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const isAdmin = meQuery.data?.data.role === "ADMIN";

  const userQuery = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => getUserDetail(userId),
    enabled: Boolean(isAdmin && userId),
  });

  const walletQuery = useQuery({
    queryKey: ["wallet", "admin", userId],
    queryFn: () => getWalletByUserId(userId),
    enabled: Boolean(isAdmin && userId),
    retry: (failureCount, error) => {
      if ((error as ApiError).status === 404) return false;
      return failureCount < 2;
    },
  });

  const payrollQuery = useQuery({
    queryKey: ["payrolls", "admin", "user", userId, payrollPage, payrollStatus],
    queryFn: () =>
      getPayrolls({
        page: payrollPage,
        size: 10,
        sort: "createdAt,desc",
        userId,
        status: payrollStatus || undefined,
      }).then((response) => response.data),
    enabled: Boolean(isAdmin && userId),
  });

  const acceptMutation = useMutation({
    mutationFn: (payrollId: string) => acceptPayroll(payrollId),
    onSuccess: (response) => {
      showToast({
        type: "success",
        title: "Payroll diterima",
        description: `Payroll sebesar ${formatAmount(response.data.amount)} berhasil dibayarkan.`,
      });
      setPendingAcceptPayroll(null);
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "admin", userId] });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Gagal menerima payroll",
        description: (error as ApiError).message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { payrollId: string; rejectionReason: string }) =>
      rejectPayroll(payload.payrollId, payload.rejectionReason),
    onSuccess: (response) => {
      showToast({
        type: "success",
        title: "Payroll ditolak",
        description: `Payroll sebesar ${formatAmount(response.data.amount)} berhasil ditolak.`,
      });
      setPendingRejectPayroll(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Gagal menolak payroll",
        description: (error as ApiError).message,
      });
    },
  });

  function handleRejectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedReason = rejectionReason.trim();
    if (trimmedReason.length < 10) {
      showToast({
        type: "error",
        title: "Alasan penolakan terlalu pendek",
        description: "Alasan penolakan minimal 10 karakter.",
      });
      return;
    }

    if (!pendingRejectPayroll) return;

    rejectMutation.mutate({
      payrollId: pendingRejectPayroll.id,
      rejectionReason: trimmedReason,
    });
  }

  if (meQuery.isLoading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <p className="text-green-800 text-sm">Memuat data akun...</p>
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

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-green-50 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-green-900">Akses Terbatas</h1>
          <p className="mt-2 text-sm text-gray-600">Profil user lain hanya dapat diakses oleh role ADMIN.</p>
          <Link
            href="/profile"
            className="mt-6 inline-flex rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Buka Profil Saya
          </Link>
        </div>
      </main>
    );
  }

  const user = userQuery.data?.data;
  const wallet = walletQuery.data?.data;
  const walletError = walletQuery.isError ? (walletQuery.error as ApiError) : null;
  const payrollData = payrollQuery.data;
  const payrolls = payrollData?.content ?? [];
  const payrollTotalPages = Math.max(payrollData?.totalPages ?? 1, 1);

  return (
    <main className="min-h-screen bg-green-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-green-900">
                {user?.name ?? "Profil Pengguna"}
              </h1>
              <p className="mt-1 text-sm text-green-700">Detail user, wallet, dan payroll milik pengguna.</p>
            </div>

            <Link
              href="/user"
              className="inline-flex w-fit rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
            >
              Kembali ke User
            </Link>
          </div>
        </section>

        {userQuery.isError && (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            {(userQuery.error as ApiError).message}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-green-200 bg-white p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900">Data Profil</h2>

            {userQuery.isLoading ? (
              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                Memuat profil user...
              </div>
            ) : user ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Nama</p>
                  <p className="mt-1 font-semibold text-gray-900">{user.name}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Role</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge(user.role)}`}>
                    {roleLabels[user.role]}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="mt-1 font-semibold text-gray-900">{user.email}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="mt-1 font-semibold text-gray-900">{user.username}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="mt-1 font-semibold text-gray-900">{user.active === false ? "Nonaktif" : "Aktif"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Dibuat</p>
                  <p className="mt-1 font-semibold text-gray-900">{formatDateTime(user.createdAt)}</p>
                </div>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-green-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">Wallet</h2>
            <p className="mt-1 text-sm text-gray-500">Saldo SawitDollar pengguna.</p>

            {walletQuery.isLoading && (
              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                Memuat wallet user...
              </div>
            )}

            {walletError?.status === 404 && (
              <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-5">
                <p className="text-sm font-semibold text-yellow-800">Wallet user belum tersedia.</p>
                <p className="mt-1 text-sm text-yellow-700">
                  Wallet mungkin belum dibuat atau event registrasi belum selesai diproses.
                </p>
              </div>
            )}

            {walletError && walletError.status !== 404 && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
                {walletError.message}
              </div>
            )}

            {wallet && (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-700">Saldo saat ini</p>
                  <p className="mt-2 text-3xl font-bold text-green-950">
                    {formatAmount(wallet.balance, wallet.currency)}
                  </p>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                    <dt className="text-gray-500">Dibuat</dt>
                    <dd className="font-medium text-gray-900">{formatDateTime(wallet.createdAt)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-gray-500">Diperbarui</dt>
                    <dd className="font-medium text-gray-900">{formatDateTime(wallet.updatedAt)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-green-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-green-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payroll Pengguna</h2>
              <p className="mt-1 text-sm text-gray-500">Daftar payroll yang terkait dengan user ini.</p>
            </div>

            <div className="w-full sm:w-52">
              <label htmlFor="payroll-status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="payroll-status"
                value={payrollStatus}
                onChange={(event) => {
                  setPayrollPage(0);
                  setPayrollStatus(event.target.value as PayrollStatus | "");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">Semua</option>
                {payrollStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {statusLabels[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {payrollQuery.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(payrollQuery.error as ApiError).message}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-100/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Referensi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Kg
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Dibuat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {payrollQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      Memuat payroll pengguna...
                    </td>
                  </tr>
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      Belum ada payroll sesuai filter.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-green-50/50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {referenceTypeLabels[payroll.referenceType]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatAmount(payroll.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatNumber(payroll.kilogram)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatAmount(payroll.ratePerKg)}/kg
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                            payroll.status
                          )}`}
                        >
                          {statusLabels[payroll.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(payroll.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {payroll.status === "PENDING" ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPendingAcceptPayroll(payroll)}
                              className="rounded-md border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingRejectPayroll(payroll);
                                setRejectionReason("");
                              }}
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{payrollData?.totalElements ?? 0}</span> payroll
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPayrollPage((prev) => Math.max(prev - 1, 0))}
                disabled={payrollPage <= 0 || payrollQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>

              <span className="text-sm text-gray-600">
                Halaman {payrollPage + 1} / {payrollTotalPages}
              </span>

              <button
                type="button"
                onClick={() => setPayrollPage((prev) => Math.min(prev + 1, payrollTotalPages - 1))}
                disabled={payrollPage + 1 >= payrollTotalPages || payrollQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingAcceptPayroll)}
        title="Accept payroll?"
        description={
          pendingAcceptPayroll
            ? `Payroll sebesar ${formatAmount(
                pendingAcceptPayroll.amount
              )} akan dibayarkan dari wallet admin ke wallet pekerja.`
            : ""
        }
        confirmLabel="Accept Payroll"
        cancelLabel="Batal"
        isLoading={acceptMutation.isPending}
        onCancel={() => {
          if (!acceptMutation.isPending) setPendingAcceptPayroll(null);
        }}
        onConfirm={() => {
          if (pendingAcceptPayroll) acceptMutation.mutate(pendingAcceptPayroll.id);
        }}
      />

      {pendingRejectPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-green-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900">Reject Payroll</h2>
              <p className="mt-2 text-sm text-gray-600">Beri alasan penolakan untuk payroll ini.</p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="rejectionReason" className="mb-1 block text-sm font-medium text-gray-700">
                  Alasan penolakan
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  minLength={10}
                  rows={4}
                  required
                  placeholder="Contoh: Data kilogram tidak sesuai dengan laporan lapangan."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!rejectMutation.isPending) {
                      setPendingRejectPayroll(null);
                      setRejectionReason("");
                    }
                  }}
                  disabled={rejectMutation.isPending}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rejectMutation.isPending ? "Memproses..." : "Reject Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
