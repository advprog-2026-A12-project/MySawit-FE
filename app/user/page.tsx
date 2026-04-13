"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ApiError,
  UserListItem,
  UserRole,
  deleteUser,
  getMe,
  getUsers,
} from "@/lib/auth-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

const columnHelper = createColumnHelper<UserListItem>();

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  BURUH: "Buruh",
  MANDOR: "Mandor",
  SUPIR_TRUK: "Supir Truk",
};

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

function formatDate(date: string) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UserPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<"ALL" | UserRole>("ALL");

  const [filters, setFilters] = useState<{
    name?: string;
    email?: string;
    role?: UserRole;
  }>({});

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });

  const usersQuery = useQuery({
    queryKey: ["users", page, size, filters],
    enabled: meQuery.data?.data.role === "ADMIN",
    queryFn: async () => {
      const response = await getUsers({
        page,
        size,
        sort: "createdAt,desc",
        ...filters,
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const columns = [
    columnHelper.accessor("username", {
      header: "Username",
      cell: (info) => <p className="font-medium text-gray-900">{info.getValue()}</p>,
    }),
    columnHelper.accessor("name", {
      header: "Nama",
      cell: (info) => <p className="text-gray-700">{info.getValue()}</p>,
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => <p className="text-gray-700">{info.getValue()}</p>,
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: (info) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge(info.getValue())}`}>
          {roleLabels[info.getValue()]}
        </span>
      ),
    }),
    columnHelper.accessor("active", {
      header: "Status",
      cell: (info) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            info.getValue() ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {info.getValue() ? "Aktif" : "Nonaktif"}
        </span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Dibuat",
      cell: (info) => <p className="text-gray-600">{formatDate(info.getValue())}</p>,
    }),
    columnHelper.display({
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const isDeleting = deleteMutation.isPending && deleteMutation.variables === row.original.id;

        return (
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              const isConfirmed = window.confirm(
                `Hapus user ${row.original.name}? User akan dinonaktifkan (soft delete).`
              );

              if (isConfirmed) {
                deleteMutation.mutate(row.original.id);
              }
            }}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        );
      },
    }),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: usersQuery.data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = usersQuery.data?.totalPages ?? 1;

  if (meQuery.isLoading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <p className="text-green-800 text-sm">Memuat data akun...</p>
      </main>
    );
  }

  if (meQuery.isError) {
    const error = meQuery.error as ApiError;
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      </main>
    );
  }

  if (meQuery.data?.data.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-green-50 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-green-900">Akses Terbatas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Halaman manajemen user hanya dapat diakses oleh role ADMIN.
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
        <div className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-green-900">Manajemen Pengguna</h1>
              <p className="mt-1 text-sm text-green-700">Kelola data user, filter role, dan nonaktifkan akun.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/assignments"
                className="inline-flex rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                Assignment
              </Link>
              <Link
                href="/profile"
                className="inline-flex rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                Profil Saya
              </Link>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-green-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="name-filter" className="mb-1 block text-sm font-medium text-gray-700">
                Nama
              </label>
              <input
                id="name-filter"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Cari nama"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              />
            </div>

            <div>
              <label htmlFor="email-filter" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email-filter"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="Cari email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              />
            </div>

            <div>
              <label htmlFor="role-filter" className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role-filter"
                value={roleInput}
                onChange={(event) => setRoleInput(event.target.value as "ALL" | UserRole)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              >
                <option value="ALL">Semua Role</option>
                <option value="ADMIN">ADMIN</option>
                <option value="BURUH">BURUH</option>
                <option value="MANDOR">MANDOR</option>
                <option value="SUPIR_TRUK">SUPIR_TRUK</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPage(0);
                  setFilters({
                    name: nameInput.trim() || undefined,
                    email: emailInput.trim() || undefined,
                    role: roleInput === "ALL" ? undefined : roleInput,
                  });
                }}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Terapkan
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameInput("");
                  setEmailInput("");
                  setRoleInput("ALL");
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
          {usersQuery.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(usersQuery.error as ApiError).message}
            </div>
          )}

          {deleteMutation.isError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {(deleteMutation.error as ApiError).message}
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
                {usersQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      Memuat daftar user...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      Tidak ada data user sesuai filter.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-green-50/50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm">
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
              Total: <span className="font-semibold">{usersQuery.data?.totalElements ?? 0}</span> user
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
                disabled={page <= 0 || usersQuery.isLoading}
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
                disabled={page + 1 >= totalPages || usersQuery.isLoading}
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
