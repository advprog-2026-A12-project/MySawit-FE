"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";
import { ApiError, getMe } from "@/lib/auth-api";
import {
  TopupStatus,
  TopupTransaction,
  getTopupDetail,
  getTopupHistory,
  initiateTopup,
} from "@/lib/topup-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const statusLabels: Record<TopupStatus, string> = {
  PENDING: "Pending",
  SUCCESS: "Sukses",
  FAILED: "Gagal",
  EXPIRED: "Expired",
};

const sortOptions = [
  { value: "createdAt,desc", label: "Terbaru" },
  { value: "createdAt,asc", label: "Terlama" },
  { value: "amountSawitDollar,desc", label: "Nominal terbesar" },
  { value: "amountSawitDollar,asc", label: "Nominal terkecil" },
] as const;

function statusBadge(status: TopupStatus) {
  switch (status) {
    case "SUCCESS":
      return "bg-green-100 text-green-700";
    case "FAILED":
      return "bg-red-100 text-red-700";
    case "EXPIRED":
      return "bg-gray-100 text-gray-700";
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

function formatSawitDollar(value?: number) {
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)} SD`;
}

function formatRupiah(value?: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function parseAmount(value: string) {
  return Number(value.replace(",", "."));
}

export default function TopupPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState("createdAt,desc");
  const [status, setStatus] = useState<TopupStatus | "">("");
  const [amountSawitDollar, setAmountSawitDollar] = useState("");
  const [latestTopup, setLatestTopup] = useState<TopupTransaction | null>(null);
  const [selectedTopupId, setSelectedTopupId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const isAdmin = meQuery.data?.data.role === "ADMIN";

  const historyQuery = useQuery({
    queryKey: ["topup", "history", page, size, sort, status],
    queryFn: () =>
      getTopupHistory({
        page,
        size,
        sort,
        status: status || undefined,
      }).then((response) => response.data),
    enabled: isAdmin,
  });

  const detailQuery = useQuery({
    queryKey: ["topup", "detail", selectedTopupId],
    queryFn: () => getTopupDetail(selectedTopupId as string).then((response) => response.data),
    enabled: Boolean(selectedTopupId),
  });

  const topupMutation = useMutation({
    mutationFn: initiateTopup,
    onSuccess: (response) => {
      setLatestTopup(response.data);
      setAmountSawitDollar("");
      setPage(0);
      showToast({
        type: "success",
        title: "Invoice top-up dibuat",
        description: "Buka link Xendit untuk menyelesaikan pembayaran.",
      });
      queryClient.invalidateQueries({ queryKey: ["topup", "history"] });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Gagal membuat invoice",
        description: (error as ApiError).message,
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLatestTopup(null);

    const amount = parseAmount(amountSawitDollar);

    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
      showToast({
        type: "error",
        title: "Nominal tidak valid",
        description: "Nominal top-up harus berada di antara 1.00 SD dan 100000.00 SD.",
      });
      return;
    }

    topupMutation.mutate({ amountSawitDollar: amount });
  }

  function resetFilters() {
    setPage(0);
    setSize(10);
    setSort("createdAt,desc");
    setStatus("");
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
          <p className="mt-2 text-sm text-gray-600">Top-up wallet hanya dapat diakses oleh role ADMIN.</p>
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

  const historyData = historyQuery.data;
  const historyItems = historyData?.content ?? [];
  const totalPages = Math.max(historyData?.totalPages ?? 1, 1);
  const selectedTopup = detailQuery.data;
  const amountPreview = parseAmount(amountSawitDollar || "0");
  const safeAmountPreview = Number.isFinite(amountPreview) ? amountPreview : 0;

  return (
    <main className="min-h-screen bg-green-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-green-900">Top-up Admin</h1>
          <p className="mt-1 text-sm text-green-700">Tambah saldo SawitDollar untuk pembayaran payroll.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-green-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">Mulai Top-up</h2>
            <p className="mt-1 text-sm text-gray-500">1 SawitDollar = Rp 10.000.</p>

            {latestTopup?.paymentUrl && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-900">Invoice pembayaran sudah dibuat.</p>
                <p className="mt-1 text-sm text-blue-800">Expired: {formatDateTime(latestTopup.expiresAt)}</p>
                <a
                  href={latestTopup.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Buka Xendit
                </a>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="amountSawitDollar" className="mb-1 block text-sm font-medium text-gray-700">
                  Nominal SawitDollar
                </label>
                <input
                  id="amountSawitDollar"
                  type="number"
                  min="1"
                  max="100000"
                  step="0.01"
                  required
                  value={amountSawitDollar}
                  onChange={(event) => setAmountSawitDollar(event.target.value)}
                  placeholder="Contoh: 1000"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <button
                type="submit"
                disabled={topupMutation.isPending}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {topupMutation.isPending ? "Membuat invoice..." : "Buat Invoice Top-up"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-green-200 bg-white p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Estimasi Pembayaran</h2>
                <p className="mt-1 text-sm text-gray-500">Nilai rupiah dihitung dari rate tetap backend.</p>
              </div>
              <button
                type="button"
                onClick={() => historyQuery.refetch()}
                disabled={historyQuery.isFetching}
                className="inline-flex w-fit rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100 disabled:opacity-60"
              >
                {historyQuery.isFetching ? "Memuat..." : "Refresh Riwayat"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">SawitDollar</p>
                <p className="mt-2 text-2xl font-bold text-green-950">{formatSawitDollar(safeAmountPreview)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500">Rupiah</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatRupiah(safeAmountPreview * 10000)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500">Gateway</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">Xendit</p>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-green-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(event) => {
                  setPage(0);
                  setStatus(event.target.value as TopupStatus | "");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">Semua</option>
                <option value="PENDING">PENDING</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="mb-1 block text-sm font-medium text-gray-700">
                Urutkan
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => {
                  setPage(0);
                  setSort(event.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="size" className="mb-1 block text-sm font-medium text-gray-700">
                Per halaman
              </label>
              <select
                id="size"
                value={size}
                onChange={(event) => {
                  setPage(0);
                  setSize(Number(event.target.value));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-green-200 bg-white">
          {historyQuery.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(historyQuery.error as ApiError).message}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-100/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Nominal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Rupiah
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Gateway
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Dibuat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Expired
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {historyQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      Memuat riwayat top-up...
                    </td>
                  </tr>
                ) : historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      Belum ada riwayat top-up.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((topup) => (
                    <tr key={topup.id} className="hover:bg-green-50/50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatSawitDollar(topup.amountSawitDollar)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatRupiah(topup.amountIdr)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {topup.paymentGateway}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                            topup.status
                          )}`}
                        >
                          {statusLabels[topup.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(topup.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(topup.expiresAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {topup.paymentUrl && topup.status === "PENDING" && (
                            <a
                              href={topup.paymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Bayar
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedTopupId(topup.id)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{historyData?.totalElements ?? 0}</span> top-up
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page <= 0 || historyQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-gray-600">
                Halaman {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={page + 1 >= totalPages || historyQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      </div>

      {selectedTopupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-green-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Detail Top-up</h2>
                <p className="mt-1 text-sm text-gray-500">Informasi transaksi top-up admin.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopupId(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>

            <div className="px-6 py-5">
              {detailQuery.isLoading && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                  Memuat detail top-up...
                </div>
              )}

              {detailQuery.isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
                  {(detailQuery.error as ApiError).message}
                </div>
              )}

              {selectedTopup && (
                <div className="space-y-5">
                  <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-700">Nominal top-up</p>
                    <p className="mt-2 text-3xl font-bold text-green-950">
                      {formatSawitDollar(selectedTopup.amountSawitDollar)}
                    </p>
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Admin</dt>
                      <dd className="font-medium text-gray-900">{selectedTopup.admin?.name ?? "Admin"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Rupiah</dt>
                      <dd className="font-medium text-gray-900">{formatRupiah(selectedTopup.amountIdr)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Exchange Rate</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedTopup.exchangeRate ?? "1 SD = Rp 10,000"}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Gateway</dt>
                      <dd className="font-medium text-gray-900">{selectedTopup.paymentGateway}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Gateway Ref</dt>
                      <dd className="max-w-[260px] truncate font-medium text-gray-900">
                        {selectedTopup.gatewayReferenceId ?? "-"}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Status</dt>
                      <dd>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                            selectedTopup.status
                          )}`}
                        >
                          {statusLabels[selectedTopup.status]}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Payment Link</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedTopup.paymentUrl ? (
                          <a
                            href={selectedTopup.paymentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:text-blue-800 hover:underline"
                          >
                            Buka Xendit
                          </a>
                        ) : (
                          "-"
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Dibuat</dt>
                      <dd className="font-medium text-gray-900">{formatDateTime(selectedTopup.createdAt)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                      <dt className="text-gray-500">Expired</dt>
                      <dd className="font-medium text-gray-900">{formatDateTime(selectedTopup.expiresAt)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-gray-500">Diperbarui</dt>
                      <dd className="font-medium text-gray-900">{formatDateTime(selectedTopup.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
