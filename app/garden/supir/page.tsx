"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth-api";
import {
	getKebunDetail,
	getKebunList,
	KebunDetail,
	KebunSummary,
} from "@/lib/garden-api";

export default function SupirGardenPage() {
	const router = useRouter();
	const user = useMemo(() => getStoredUser(), []);
	const authorized = user?.role === "SUPIR_TRUK";

	const [items, setItems] = useState<KebunSummary[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const [detail, setDetail] = useState<KebunDetail | null>(null);
	const [loadingList, setLoadingList] = useState(true);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [error, setError] = useState("");

	const cardCls = "rounded-2xl border border-green-200 bg-white p-5 shadow-sm";
	const titleCls = "text-lg font-semibold text-green-900";

	const fetchList = async () => {
		setLoadingList(true);
		setError("");
		try {
			const res = await getKebunList();
			setItems(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat kebun");
			setItems([]);
		} finally {
			setLoadingList(false);
		}
	};

	const fetchDetail = async (id: string) => {
		setLoadingDetail(true);
		setError("");
		try {
			const res = await getKebunDetail(id);
			setDetail(res.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal mengambil detail kebun");
			setDetail(null);
		} finally {
			setLoadingDetail(false);
		}
	};

	useEffect(() => {
		if (!user) {
			router.replace("/login");
			return;
		}

		if (!authorized) {
			router.replace("/garden");
			return;
		}

		void fetchList();
	}, [authorized, router, user]);

	if (!authorized) {
		return <div className="min-h-screen bg-green-50 p-8 text-center">Memverifikasi akses Anda...</div>;
	}

	return (
		<main className="min-h-screen bg-green-50 p-6 md:p-8">
			<div className="mx-auto max-w-6xl space-y-6">
				<header className={cardCls}>
					<h1 className="text-2xl font-bold text-green-900 md:text-3xl">Dashboard Supir - Kebun Tugas</h1>
					<p className="mt-1 text-sm text-green-700 md:text-base">Lihat informasi kebun tempat Anda bertugas.</p>
				</header>

				{error && (
					<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				)}

				<section className="grid gap-6 lg:grid-cols-12">
					<div className="space-y-4 lg:col-span-7">
						<div className={cardCls}>
							<div className="flex items-center justify-between">
								<h2 className={titleCls}>Daftar Kebun</h2>
								<button
									type="button"
									onClick={() => void fetchList()}
									className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
								>
									Refresh
								</button>
							</div>
							<div className="mt-4 overflow-x-auto">
								<table className="min-w-full divide-y divide-green-100">
									<thead className="bg-green-50">
										<tr>
											{["Nama", "Kode", "Luas (Ha)", "Mandor", "Status"].map((h) => (
												<th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-700">
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-green-100 bg-white">
										{loadingList && (
											<tr>
												<td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
													Memuat data kebun...
												</td>
											</tr>
										)}
										{!loadingList && items.length === 0 && (
											<tr>
												<td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
													Belum ada kebun yang ditugaskan.
												</td>
											</tr>
										)}
										{!loadingList &&
											items.map((item) => {
												const active = selectedId === item.id;
												return (
													<tr
														key={item.id}
														onClick={() => {
															setSelectedId(item.id);
															void fetchDetail(item.id);
														}}
														className={`cursor-pointer transition ${active ? "bg-green-100/60" : "hover:bg-green-50"}`}
													>
														<td className="px-4 py-3 text-sm font-medium text-gray-800">{item.nama}</td>
														<td className="px-4 py-3 text-sm text-gray-600">{item.kode}</td>
														<td className="px-4 py-3 text-sm text-gray-600">{item.luasHektare}</td>
														<td className="px-4 py-3 text-sm text-gray-600">{item.mandorName ?? "-"}</td>
														<td className="px-4 py-3 text-sm">
															<span
																className={`rounded-full px-2 py-1 text-xs font-medium ${
																	item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"
																}`}
															>
																{item.isActive ? "Aktif" : "Nonaktif"}
															</span>
														</td>
													</tr>
												);
											})}
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<div className="space-y-4 lg:col-span-5">
						<div className={cardCls}>
							<div className="flex items-center justify-between">
								<h2 className={titleCls}>Detail Kebun</h2>
								{loadingDetail && <span className="text-xs text-gray-500">Memuat detail...</span>}
							</div>

							{!selectedId && (
								<p className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
									Pilih kebun dari tabel untuk melihat detail.
								</p>
							)}

							{selectedId && detail && (
								<div className="mt-4 space-y-4">
									<div className="grid gap-3 md:grid-cols-2">
										<div className="rounded-lg border border-green-100 bg-green-50/60 px-3 py-2 text-sm">
											<p className="text-xs uppercase text-green-700">Nama</p>
											<p className="font-semibold text-gray-800">{detail.nama}</p>
										</div>
										<div className="rounded-lg border border-green-100 bg-green-50/60 px-3 py-2 text-sm">
											<p className="text-xs uppercase text-green-700">Kode</p>
											<p className="font-semibold text-gray-800">{detail.kode}</p>
										</div>
										<div className="rounded-lg border border-green-100 bg-green-50/60 px-3 py-2 text-sm">
											<p className="text-xs uppercase text-green-700">Luas (Ha)</p>
											<p className="font-semibold text-gray-800">{detail.luasHektare}</p>
										</div>
										<div className="rounded-lg border border-green-100 bg-green-50/60 px-3 py-2 text-sm">
											<p className="text-xs uppercase text-green-700">Mandor</p>
											<p className="font-semibold text-gray-800">{detail.mandorName ?? "-"}</p>
										</div>
									</div>

									<div className="rounded-xl border border-green-100 bg-green-50/40 p-4">
										<h3 className="text-sm font-semibold text-green-800">Koordinat Kebun</h3>
										<div className="mt-2 grid gap-2 text-sm text-gray-700">
											<div>Titik 1: {detail.coord1Lat}, {detail.coord1Lng}</div>
											<div>Titik 2: {detail.coord2Lat}, {detail.coord2Lng}</div>
											<div>Titik 3: {detail.coord3Lat}, {detail.coord3Lng}</div>
											<div>Titik 4: {detail.coord4Lat}, {detail.coord4Lng}</div>
										</div>
									</div>

									<div className="rounded-xl border border-green-100 bg-green-50/40 p-4">
										<h3 className="text-sm font-semibold text-green-800">Informasi Supir</h3>
										<p className="mt-2 text-sm text-gray-700">Total supir: {detail.totalSupir ?? 0}</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
