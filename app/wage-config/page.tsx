"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useToast } from "@/app/components/ToastProvider";
import { ApiError, getMe } from "@/lib/auth-api";
import {
  WageConfig,
  WageConfigPayload,
  getActiveWageConfig,
  getWageConfigHistory,
  updateWageConfig,
} from "@/lib/wage-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRate(value?: number, currency = "SawitDollar") {
  const amount = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

  return `${amount} ${currency === "SawitDollar" ? "SD" : currency}/kg`;
}

function rateCards(config: WageConfig) {
  return [
    { label: "Buruh", value: config.upahBuruhPerKg, tone: "green" },
    { label: "Supir Truk", value: config.upahSupirPerKg, tone: "blue" },
    { label: "Mandor", value: config.upahMandorPerKg, tone: "amber" },
  ];
}

export default function WageConfigPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [historyPage, setHistoryPage] = useState(0);
  const [pendingPayload, setPendingPayload] = useState<WageConfigPayload | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const isAdmin = meQuery.data?.data.role === "ADMIN";

  const activeQuery = useQuery({
    queryKey: ["wage-config", "active"],
    queryFn: () => getActiveWageConfig(),
    enabled: isAdmin,
    retry: (failureCount, error) => {
      if ((error as ApiError).status === 404) return false;
      return failureCount < 2;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["wage-config", "history", historyPage],
    queryFn: () => getWageConfigHistory({ page: historyPage, size: 10 }),
    enabled: isAdmin,
  });

  const activeConfig = activeQuery.data?.data;

  const updateMutation = useMutation({
    mutationFn: updateWageConfig,
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Tarif berhasil diperbarui",
        description: "Konfigurasi baru sudah aktif untuk payroll berikutnya.",
      });
      setPendingPayload(null);
      setHistoryPage(0);
      queryClient.invalidateQueries({ queryKey: ["wage-config"] });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Gagal memperbarui tarif",
        description: (error as ApiError).message,
      });
    },
  });

  function parseRate(value: string) {
    return Number(value.replace(",", "."));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      upahBuruhPerKg: parseRate(String(formData.get("upahBuruhPerKg") || "")),
      upahSupirPerKg: parseRate(String(formData.get("upahSupirPerKg") || "")),
      upahMandorPerKg: parseRate(String(formData.get("upahMandorPerKg") || "")),
    };

    if (
      !Number.isFinite(payload.upahBuruhPerKg) ||
      !Number.isFinite(payload.upahSupirPerKg) ||
      !Number.isFinite(payload.upahMandorPerKg) ||
      payload.upahBuruhPerKg <= 0 ||
      payload.upahSupirPerKg <= 0 ||
      payload.upahMandorPerKg <= 0
    ) {
      showToast({
        type: "error",
        title: "Tarif tidak valid",
        description: "Semua tarif harus berupa angka lebih dari 0.",
      });
      return;
    }

    setPendingPayload(payload);
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
          <p className="mt-2 text-sm text-gray-600">Konfigurasi tarif hanya dapat diakses oleh role ADMIN.</p>
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

  const activeError = activeQuery.isError ? (activeQuery.error as ApiError) : null;
  const activeMissing = activeError?.status === 404;
  const historyData = historyQuery.data?.data;
  const historyItems = historyData?.content ?? [];
  const historyTotalPages = Math.max(historyData?.totalPages ?? 1, 1);

  return (
    <main className="min-h-screen bg-green-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-green-900">Konfigurasi Tarif Upah</h1>
              <p className="mt-1 text-sm text-green-700">
                Kelola rate pembayaran per kilogram untuk payroll berikutnya.
              </p>
            </div>

          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-green-200 bg-white p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Tarif Aktif</h2>
                <p className="mt-1 text-sm text-gray-500">Tarif yang digunakan untuk payroll baru.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  activeQuery.refetch();
                  historyQuery.refetch();
                }}
                disabled={activeQuery.isFetching || historyQuery.isFetching}
                className="inline-flex w-fit rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100 disabled:opacity-60"
              >
                {activeQuery.isFetching || historyQuery.isFetching ? "Memuat..." : "Refresh"}
              </button>
            </div>

            {activeQuery.isLoading && (
              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                Memuat konfigurasi aktif...
              </div>
            )}

            {activeMissing && (
              <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-5">
                <p className="text-sm font-semibold text-yellow-800">Belum ada konfigurasi tarif aktif.</p>
                <p className="mt-1 text-sm text-yellow-700">
                  Isi form di samping untuk membuat konfigurasi awal.
                </p>
              </div>
            )}

            {activeError && !activeMissing && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
                {activeError.message}
              </div>
            )}

            {activeConfig && (
              <div className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {rateCards(activeConfig).map((rate) => (
                    <div key={rate.label} className="rounded-lg border border-green-100 bg-green-50 p-4">
                      <p className="text-sm font-medium text-green-700">{rate.label}</p>
                      <p className="mt-2 text-2xl font-bold text-green-950">
                        {formatRate(rate.value, activeConfig.currency)}
                      </p>
                    </div>
                  ))}
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <dt className="text-gray-500">Diperbarui oleh</dt>
                    <dd className="mt-1 font-semibold text-gray-900">{activeConfig.updatedBy.name}</dd>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <dt className="text-gray-500">Berlaku sejak</dt>
                    <dd className="mt-1 font-semibold text-gray-900">
                      {formatDateTime(activeConfig.effectiveFrom)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-green-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">Update Tarif</h2>
            <p className="mt-1 text-sm text-gray-500">Config lama akan dinonaktifkan dan config baru dibuat.</p>

            <form
              key={activeConfig?.id ?? "new-wage-config"}
              onSubmit={handleSubmit}
              className="mt-5 space-y-4"
            >
              <div>
                <label htmlFor="upahBuruhPerKg" className="mb-1 block text-sm font-medium text-gray-700">
                  Upah Buruh per Kg
                </label>
                <input
                  id="upahBuruhPerKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  name="upahBuruhPerKg"
                  defaultValue={activeConfig?.upahBuruhPerKg}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label htmlFor="upahSupirPerKg" className="mb-1 block text-sm font-medium text-gray-700">
                  Upah Supir per Kg
                </label>
                <input
                  id="upahSupirPerKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  name="upahSupirPerKg"
                  defaultValue={activeConfig?.upahSupirPerKg}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label htmlFor="upahMandorPerKg" className="mb-1 block text-sm font-medium text-gray-700">
                  Upah Mandor per Kg
                </label>
                <input
                  id="upahMandorPerKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  name="upahMandorPerKg"
                  defaultValue={activeConfig?.upahMandorPerKg}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Tarif"}
              </button>
            </form>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-green-200 bg-white">
          <div className="border-b border-green-100 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">Riwayat Konfigurasi</h2>
            <p className="mt-1 text-sm text-gray-500">Perubahan tarif terdahulu untuk audit admin.</p>
          </div>

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
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Buruh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Supir
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Mandor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Updated By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Effective From
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {historyQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      Memuat riwayat konfigurasi...
                    </td>
                  </tr>
                ) : historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      Belum ada riwayat konfigurasi.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((config) => (
                    <tr key={config.id} className="hover:bg-green-50/50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            config.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {config.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatRate(config.upahBuruhPerKg, config.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatRate(config.upahSupirPerKg, config.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatRate(config.upahMandorPerKg, config.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {config.updatedBy.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(config.effectiveFrom)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{historyData?.totalElements ?? 0}</span> konfigurasi
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 0))}
                disabled={historyPage <= 0 || historyQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>

              <span className="text-sm text-gray-600">
                Halaman {historyPage + 1} / {historyTotalPages}
              </span>

              <button
                type="button"
                onClick={() => setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages - 1))}
                disabled={historyPage + 1 >= historyTotalPages || historyQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingPayload)}
        title="Update konfigurasi tarif?"
        description="Tarif baru akan langsung aktif dan hanya berlaku untuk payroll yang dibuat setelah konfigurasi ini tersimpan. Payroll lama tetap memakai snapshot tarif sebelumnya."
        confirmLabel="Simpan Tarif"
        cancelLabel="Batal"
        isLoading={updateMutation.isPending}
        onCancel={() => {
          if (!updateMutation.isPending) {
            setPendingPayload(null);
          }
        }}
        onConfirm={() => {
          if (pendingPayload) {
            updateMutation.mutate(pendingPayload);
          }
        }}
      />
    </main>
  );
}
