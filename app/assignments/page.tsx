"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ApiError,
  AssignmentItem,
  assignBuruhToMandor,
  getAssignments,
  getMe,
  getUsers,
  reassignBuruhMandor,
  unassignBuruhMandor,
} from "@/lib/auth-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

const columnHelper = createColumnHelper<AssignmentItem>();

function formatDate(date: string) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [buruhNameInput, setBuruhNameInput] = useState("");
  const [mandorNameInput, setMandorNameInput] = useState("");
  const [mandorIdInput, setMandorIdInput] = useState("ALL");

  const [filters, setFilters] = useState<{
    buruhName?: string;
    mandorName?: string;
    mandorId?: string;
  }>({});

  const [newAssignmentBuruhId, setNewAssignmentBuruhId] = useState("");
  const [newAssignmentMandorId, setNewAssignmentMandorId] = useState("");
  const [reassignMandorByBuruh, setReassignMandorByBuruh] = useState<Record<string, string>>({});

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const isAdmin = meQuery.data?.data.role === "ADMIN";

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", page, size, filters],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await getAssignments({
        page,
        size,
        ...filters,
      });
      return response.data;
    },
  });

  const buruhOptionsQuery = useQuery({
    queryKey: ["user-options", "BURUH"],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await getUsers({
        page: 0,
        size: 100,
        role: "BURUH",
        sort: "name,asc",
      });

      return response.data.content;
    },
  });

  const mandorOptionsQuery = useQuery({
    queryKey: ["user-options", "MANDOR"],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await getUsers({
        page: 0,
        size: 100,
        role: "MANDOR",
        sort: "name,asc",
      });

      return response.data.content;
    },
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { buruhId: string; mandorId: string }) => assignBuruhToMandor(payload),
    onSuccess: () => {
      setNewAssignmentBuruhId("");
      setNewAssignmentMandorId("");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: (payload: { buruhId: string; newMandorId: string }) => reassignBuruhMandor(payload),
    onSuccess: (_, variables) => {
      setReassignMandorByBuruh((prev) => {
        const next = { ...prev };
        delete next[variables.buruhId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (buruhId: string) => unassignBuruhMandor(buruhId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const columns = [
    columnHelper.accessor((row) => row.buruh.name, {
      id: "buruh",
      header: "Buruh",
      cell: (info) => (
        <div>
          <p className="font-medium text-gray-900">{info.getValue()}</p>
          <p className="text-xs text-gray-500">{info.row.original.buruh.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.mandor.name, {
      id: "mandor",
      header: "Mandor",
      cell: (info) => (
        <div>
          <p className="font-medium text-gray-900">{info.getValue()}</p>
          <p className="text-xs text-gray-500">{info.row.original.mandor.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor("assignedAt", {
      header: "Ditetapkan",
      cell: (info) => <p className="text-gray-600">{formatDate(info.getValue())}</p>,
    }),
    columnHelper.display({
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const currentMandorId = row.original.mandor.id;
        const selectedMandor = reassignMandorByBuruh[row.original.buruh.id] ?? "";
        const isReassigning = reassignMutation.isPending && reassignMutation.variables?.buruhId === row.original.buruh.id;
        const isUnassigning = unassignMutation.isPending && unassignMutation.variables === row.original.buruh.id;

        return (
          <div className="flex min-w-65 flex-col gap-2">
            <div className="flex gap-2">
              <select
                value={selectedMandor}
                onChange={(event) =>
                  setReassignMandorByBuruh((prev) => ({
                    ...prev,
                    [row.original.buruh.id]: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
              >
                <option value="">Pilih Mandor Baru</option>
                {(mandorOptionsQuery.data ?? []).map((mandor) => (
                  <option key={mandor.id} value={mandor.id}>
                    {mandor.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  if (!selectedMandor || selectedMandor === currentMandorId) return;

                  reassignMutation.mutate({
                    buruhId: row.original.buruh.id,
                    newMandorId: selectedMandor,
                  });
                }}
                disabled={!selectedMandor || selectedMandor === currentMandorId || isReassigning}
                className="rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReassigning ? "Memindah..." : "Pindah"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const isConfirmed = window.confirm(
                  `Lepas assignment ${row.original.buruh.name} dari ${row.original.mandor.name}?`
                );

                if (isConfirmed) {
                  unassignMutation.mutate(row.original.buruh.id);
                }
              }}
              disabled={isUnassigning}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUnassigning ? "Melepas..." : "Unassign"}
            </button>
          </div>
        );
      },
    }),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: assignmentsQuery.data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = assignmentsQuery.data?.totalPages ?? 1;

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
          <p className="mt-2 text-sm text-gray-600">
            Halaman assignment Buruh-Mandor hanya dapat diakses oleh role ADMIN.
          </p>
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

  return (
    <main className="min-h-screen bg-green-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-green-900">Assignment Buruh-Mandor</h1>
              <p className="mt-1 text-sm text-green-700">Atur penugasan buruh ke mandor, termasuk reassign dan unassign.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/user"
                className="inline-flex rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                Manajemen User
              </Link>
              <Link
                href="/profile"
                className="inline-flex rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                Profil Saya
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-green-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Assign Buruh ke Mandor</h2>
          <p className="mt-1 text-sm text-gray-500">Pilih buruh dan mandor untuk membuat assignment baru.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="new-buruh" className="mb-1 block text-sm font-medium text-gray-700">
                Buruh
              </label>
              <select
                id="new-buruh"
                value={newAssignmentBuruhId}
                onChange={(event) => setNewAssignmentBuruhId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              >
                <option value="">Pilih Buruh</option>
                {(buruhOptionsQuery.data ?? []).map((buruh) => (
                  <option key={buruh.id} value={buruh.id}>
                    {buruh.name} ({buruh.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="new-mandor" className="mb-1 block text-sm font-medium text-gray-700">
                Mandor
              </label>
              <select
                id="new-mandor"
                value={newAssignmentMandorId}
                onChange={(event) => setNewAssignmentMandorId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              >
                <option value="">Pilih Mandor</option>
                {(mandorOptionsQuery.data ?? []).map((mandor) => (
                  <option key={mandor.id} value={mandor.id}>
                    {mandor.name} ({mandor.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  if (!newAssignmentBuruhId || !newAssignmentMandorId) return;

                  assignMutation.mutate({
                    buruhId: newAssignmentBuruhId,
                    mandorId: newAssignmentMandorId,
                  });
                }}
                disabled={!newAssignmentBuruhId || !newAssignmentMandorId || assignMutation.isPending}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assignMutation.isPending ? "Menyimpan..." : "Assign Buruh"}
              </button>
            </div>
          </div>

          {assignMutation.isError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {(assignMutation.error as ApiError).message}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-green-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Filter Assignment</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="buruh-filter" className="mb-1 block text-sm font-medium text-gray-700">
                Nama Buruh
              </label>
              <input
                id="buruh-filter"
                value={buruhNameInput}
                onChange={(event) => setBuruhNameInput(event.target.value)}
                placeholder="Cari nama buruh"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              />
            </div>

            <div>
              <label htmlFor="mandor-filter" className="mb-1 block text-sm font-medium text-gray-700">
                Nama Mandor
              </label>
              <input
                id="mandor-filter"
                value={mandorNameInput}
                onChange={(event) => setMandorNameInput(event.target.value)}
                placeholder="Cari nama mandor"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              />
            </div>

            <div>
              <label htmlFor="mandor-id-filter" className="mb-1 block text-sm font-medium text-gray-700">
                Mandor Spesifik
              </label>
              <select
                id="mandor-id-filter"
                value={mandorIdInput}
                onChange={(event) => setMandorIdInput(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              >
                <option value="ALL">Semua Mandor</option>
                {(mandorOptionsQuery.data ?? []).map((mandor) => (
                  <option key={mandor.id} value={mandor.id}>
                    {mandor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPage(0);
                  setFilters({
                    buruhName: buruhNameInput.trim() || undefined,
                    mandorName: mandorNameInput.trim() || undefined,
                    mandorId: mandorIdInput === "ALL" ? undefined : mandorIdInput,
                  });
                }}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Terapkan
              </button>
              <button
                type="button"
                onClick={() => {
                  setBuruhNameInput("");
                  setMandorNameInput("");
                  setMandorIdInput("ALL");
                  setPage(0);
                  setFilters({});
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-green-200 bg-white">
          {assignmentsQuery.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(assignmentsQuery.error as ApiError).message}
            </div>
          )}

          {reassignMutation.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(reassignMutation.error as ApiError).message}
            </div>
          )}

          {unassignMutation.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(unassignMutation.error as ApiError).message}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-100/60">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {assignmentsQuery.isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                      Memuat assignment...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                      Tidak ada data assignment sesuai filter.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-green-50/50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 align-top text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{assignmentsQuery.data?.totalElements ?? 0}</span> assignment
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-600">
                Per halaman
              </label>
              <select
                id="page-size"
                value={size}
                onChange={(event) => {
                  setPage(0);
                  setSize(Number(event.target.value));
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page <= 0 || assignmentsQuery.isLoading}
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
                disabled={page + 1 >= totalPages || assignmentsQuery.isLoading}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
