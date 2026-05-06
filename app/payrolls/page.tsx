"use client";

import { FormEvent, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useToast } from "@/app/components/ToastProvider";
import { ApiError, UserRole, getMe } from "@/lib/auth-api";
import {
  Payroll,
  PayrollReferenceType,
  PayrollStatus,
  PayrollUserRole,
  acceptPayroll,
  getPayrollDetail,
  getMyPayrolls,
  getPayrolls,
  rejectPayroll,
} from "@/lib/payroll-api";
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

const payrollSortOptions = [
  { value: "createdAt,desc", label: "Terbaru" },
  { value: "createdAt,asc", label: "Terlama" },
  { value: "amount,desc", label: "Nominal terbesar" },
  { value: "amount,asc", label: "Nominal terkecil" },
  { value: "kilogram,desc", label: "Kg terbesar" },
  { value: "kilogram,asc", label: "Kg terkecil" },
] as const;

const myPayrollSortOptions = payrollSortOptions.filter((option) => !option.value.startsWith("kilogram"));

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

function roleBadge(role: PayrollUserRole) {
  switch (role) {
    case "MANDOR":
      return "bg-blue-100 text-blue-700";
    case "SUPIR_TRUK":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-emerald-100 text-emerald-700";
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

export default function PayrollsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState("createdAt,desc");
  const [status, setStatus] = useState<PayrollStatus | "">("");
  const [userRole, setUserRole] = useState<PayrollUserRole | "">("");
  const [referenceType, setReferenceType] = useState<PayrollReferenceType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userNameInput, setUserNameInput] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [pendingAcceptPayroll, setPendingAcceptPayroll] = useState<Payroll | null>(null);
  const [pendingRejectPayroll, setPendingRejectPayroll] = useState<Payroll | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const profile = meQuery.data?.data;
  const isAdmin = profile?.role === "ADMIN";

  const payrollsQuery = useQuery({
    queryKey: [
      "payrolls",
      isAdmin ? "admin" : "me",
      profile?.id,
      page,
      size,
      sort,
      status,
      userRole,
      referenceType,
      dateFrom,
      dateTo,
      userNameFilter,
    ],
    queryFn: () => {
      if (isAdmin) {
        return getPayrolls({
          page,
          size,
          sort,
          status: status || undefined,
          userRole: userRole || undefined,
          referenceType: referenceType || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          userName: userNameFilter || undefined,
        }).then((response) => response.data);
      }

      return getMyPayrolls({
        page,
        size,
        sort: sort.startsWith("kilogram") ? "createdAt,desc" : sort,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }).then((response) => response.data);
    },
    enabled: Boolean(profile),
  });

  const detailQuery = useQuery({
    queryKey: ["payrolls", "detail", selectedPayrollId],
    queryFn: () => getPayrollDetail(selectedPayrollId as string).then((response) => response.data),
    enabled: Boolean(selectedPayrollId),
  });

  const acceptMutation = useMutation({
    mutationFn: (payrollId: string) => acceptPayroll(payrollId),
    onSuccess: (response) => {
      showToast({
        type: "success",
        title: "Payroll diterima",
        description: `${response.data.user.name} menerima ${formatAmount(response.data.amount)}.`,
      });
      setPendingAcceptPayroll(null);
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
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
        description: `Payroll ${response.data.user.name} berhasil ditolak.`,
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

  function resetFilters() {
    setPage(0);
    setSize(10);
    setSort("createdAt,desc");
    setStatus("");
    setUserRole("");
    setReferenceType("");
    setDateFrom("");
    setDateTo("");
    setUserNameInput("");
    setUserNameFilter("");
  }

  function handleApplyNameFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setUserNameFilter(userNameInput.trim());
  }

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

  const payrollData = payrollsQuery.data;
  const payrolls = payrollData?.content ?? [];
  const totalPages = payrollData?.totalPages ?? 1;
  const detailPayroll = detailQuery.data;

  return (
    <main className="min-h-screen bg-green-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-green-900">
                {isAdmin ? "Payroll Admin" : "Payroll Saya"}
              </h1>
              <p className="mt-1 text-sm text-green-700">
                {isAdmin
                  ? "Review payroll, setujui pencairan, atau tolak dengan alasan."
                  : "Pantau status payroll dan detail pembayaran Anda."}
              </p>
            </div>

          </div>
        </section>

        <section className="rounded-2xl border border-green-200 bg-white p-6">
          <div className="grid gap-4 lg:grid-cols-6">
            {isAdmin && (
              <form onSubmit={handleApplyNameFilter} className="lg:col-span-2">
                <label htmlFor="userName" className="mb-1 block text-sm font-medium text-gray-700">
                  Nama penerima
                </label>
                <div className="flex gap-2">
                  <input
                    id="userName"
                    value={userNameInput}
                    onChange={(event) => setUserNameInput(event.target.value)}
                    placeholder="Cari nama"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    Cari
                  </button>
                </div>
              </form>
            )}

            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(event) => {
                  setPage(0);
                  setStatus(event.target.value as PayrollStatus | "");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="">Semua</option>
                <option value="PENDING">PENDING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {isAdmin && (
              <>
                <div>
                  <label htmlFor="userRole" className="mb-1 block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="userRole"
                    value={userRole}
                    onChange={(event) => {
                      setPage(0);
                      setUserRole(event.target.value as PayrollUserRole | "");
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  >
                    <option value="">Semua</option>
                    <option value="BURUH">BURUH</option>
                    <option value="MANDOR">MANDOR</option>
                    <option value="SUPIR_TRUK">SUPIR_TRUK</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="referenceType" className="mb-1 block text-sm font-medium text-gray-700">
                    Referensi
                  </label>
                  <select
                    id="referenceType"
                    value={referenceType}
                    onChange={(event) => {
                      setPage(0);
                      setReferenceType(event.target.value as PayrollReferenceType | "");
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  >
                    <option value="">Semua</option>
                    <option value="HARVEST">HARVEST</option>
                    <option value="DELIVERY">DELIVERY</option>
                  </select>
                </div>
              </>
            )}

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
                {(isAdmin ? payrollSortOptions : myPayrollSortOptions).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-gray-700">
                Dari tanggal
              </label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => {
                  setPage(0);
                  setDateFrom(event.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div>
              <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-gray-700">
                Sampai tanggal
              </label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => {
                  setPage(0);
                  setDateTo(event.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
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
          {payrollsQuery.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(payrollsQuery.error as ApiError).message}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-100/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {isAdmin ? "Penerima" : "Payroll"}
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
                    Referensi
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
                {payrollsQuery.isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                      Memuat daftar payroll...
                    </td>
                  </tr>
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                      Tidak ada payroll sesuai filter.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-green-50/50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {isAdmin && payroll.user ? (
                          <>
                            <p className="font-semibold text-gray-900">{payroll.user.name}</p>
                            <span
                              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge(
                                payroll.user.role
                              )}`}
                            >
                              {roleLabels[payroll.user.role]}
                            </span>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900">
                              {referenceTypeLabels[payroll.referenceType]}
                            </p>
                            <p className="mt-1 max-w-xs truncate text-xs text-gray-500">{payroll.description}</p>
                          </>
                        )}
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
                        {referenceTypeLabels[payroll.referenceType]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(payroll.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPayrollId(payroll.id)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Detail
                          </button>
                          {isAdmin && payroll.status === "PENDING" && (
                            <>
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
                            </>
                          )}
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
              Total: <span className="font-semibold">{payrollData?.totalElements ?? 0}</span> payroll
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page <= 0 || payrollsQuery.isLoading}
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
                disabled={page + 1 >= totalPages || payrollsQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      </div>

      {selectedPayrollId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-green-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Detail Payroll</h2>
                <p className="mt-1 text-sm text-gray-500">Informasi lengkap payroll dan approval.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayrollId(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>

            <div className="px-6 py-5">
              {detailQuery.isLoading && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                  Memuat detail payroll...
                </div>
              )}

              {detailQuery.isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
                  {(detailQuery.error as ApiError).message}
                </div>
              )}

              {detailPayroll && (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-green-100 bg-green-50 p-4 sm:col-span-2">
                      <p className="text-sm font-medium text-green-700">Nominal payroll</p>
                      <p className="mt-2 text-3xl font-bold text-green-950">{formatAmount(detailPayroll.amount)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                          detailPayroll.status
                        )}`}
                      >
                        {statusLabels[detailPayroll.status]}
                      </span>
                    </div>
                  </div>

                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <dt className="text-gray-500">Penerima</dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {detailPayroll.user
                          ? `${detailPayroll.user.name} (${roleLabels[detailPayroll.user.role]})`
                          : profile?.name ?? "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <dt className="text-gray-500">Referensi</dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {referenceTypeLabels[detailPayroll.referenceType]}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <dt className="text-gray-500">Kilogram</dt>
                      <dd className="mt-1 font-semibold text-gray-900">{formatNumber(detailPayroll.kilogram)} kg</dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <dt className="text-gray-500">Rate dan multiplier</dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {formatAmount(detailPayroll.ratePerKg)}/kg x {formatNumber(detailPayroll.multiplier)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <dt className="text-gray-500">Dibuat</dt>
                      <dd className="mt-1 font-semibold text-gray-900">{formatDateTime(detailPayroll.createdAt)}</dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <dt className="text-gray-500">Disetujui/Ditolak</dt>
                      <dd className="mt-1 font-semibold text-gray-900">{formatDateTime(detailPayroll.approvedAt)}</dd>
                    </div>
                  </dl>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-500">Deskripsi</p>
                    <p className="mt-2 text-sm text-gray-700">{detailPayroll.description || "-"}</p>
                  </div>

                  {detailPayroll.rejectionReason && (
                    <div className="rounded-lg border border-red-200 bg-white p-4">
                      <p className="text-sm font-medium text-red-700">Alasan penolakan</p>
                      <p className="mt-2 text-sm text-gray-700">{detailPayroll.rejectionReason}</p>
                    </div>
                  )}

                  {isAdmin && detailPayroll.status === "PENDING" && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setPendingAcceptPayroll(detailPayroll)}
                        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                      >
                        Accept Payroll
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingRejectPayroll(detailPayroll);
                          setRejectionReason("");
                        }}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Reject Payroll
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAcceptPayroll)}
        title="Accept payroll?"
        description={
          pendingAcceptPayroll
            ? `Payroll ${pendingAcceptPayroll.user?.name ?? "ini"} sebesar ${formatAmount(
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
              <p className="mt-2 text-sm text-gray-600">
                Beri alasan penolakan untuk payroll {pendingRejectPayroll.user?.name ?? "ini"}.
              </p>
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
