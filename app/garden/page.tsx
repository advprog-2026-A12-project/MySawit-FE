"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type KebunSummary = {
	id: string;
	nama: string;
	kode: string;
	luasHektare: number;
	mandorId: string | null;
	isActive: boolean;
	createdAt: string;
};

type KebunDetail = KebunSummary & {
	coord1Lat: number;
	coord1Lng: number;
	coord2Lat: number;
	coord2Lng: number;
	coord3Lat: number;
	coord3Lng: number;
	coord4Lat: number;
	coord4Lng: number;
	supirIds: string[];
	updatedAt: string;
};

type FieldError = {
	field: string;
	message: string;
};

type CreatePayload = {
	nama: string;
	kode: string;
	luasHektare: number;
	coord1Lat: number;
	coord1Lng: number;
	coord2Lat: number;
	coord2Lng: number;
	coord3Lat: number;
	coord3Lng: number;
	coord4Lat: number;
	coord4Lng: number;
};

type UpdatePayload = Omit<CreatePayload, "kode">;

const API_BASE =
	process.env.NEXT_PUBLIC_SAWIT_API_URL ?? "http://localhost:8082";

const initialForm = {
	nama: "",
	kode: "",
	luasHektare: "",
	coord1Lat: "",
	coord1Lng: "",
	coord2Lat: "",
	coord2Lng: "",
	coord3Lat: "",
	coord3Lng: "",
	coord4Lat: "",
	coord4Lng: "",
};

type FormState = typeof initialForm;

const coordinateFields = [
	{ key: "coord1Lat", label: "Koordinat 1 - Latitude" },
	{ key: "coord1Lng", label: "Koordinat 1 - Longitude" },
	{ key: "coord2Lat", label: "Koordinat 2 - Latitude" },
	{ key: "coord2Lng", label: "Koordinat 2 - Longitude" },
	{ key: "coord3Lat", label: "Koordinat 3 - Latitude" },
	{ key: "coord3Lng", label: "Koordinat 3 - Longitude" },
	{ key: "coord4Lat", label: "Koordinat 4 - Latitude" },
	{ key: "coord4Lng", label: "Koordinat 4 - Longitude" },
] as const;

function num(value: string): number {
	return Number.parseFloat(value);
}

async function parseErrorMessage(response: Response): Promise<string> {
	try {
		const data = (await response.json()) as {
			message?: string;
			errors?: FieldError[];
		};

		if (Array.isArray(data.errors) && data.errors.length > 0) {
			return data.errors.map((e) => `${e.field}: ${e.message}`).join(" | ");
		}

		if (data.message) {
			return data.message;
		}
	} catch {
		return `Request gagal (${response.status})`;
	}

	return `Request gagal (${response.status})`;
}

export default function GardenPage() {
	const [items, setItems] = useState<KebunSummary[]>([]);
	const [selectedId, setSelectedId] = useState<string>("");
	const [selectedDetail, setSelectedDetail] = useState<KebunDetail | null>(null);
	const [loadingList, setLoadingList] = useState(false);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
	const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [searchNama, setSearchNama] = useState("");
	const [searchKode, setSearchKode] = useState("");
	const [message, setMessage] = useState<string>("");
	const [error, setError] = useState<string>("");

	const [createForm, setCreateForm] = useState<FormState>(initialForm);
	const [updateForm, setUpdateForm] = useState<FormState>(initialForm);

	const hasSelected = useMemo(() => Boolean(selectedId), [selectedId]);
	const inputClass =
		"rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none ring-green-300 placeholder:text-gray-400 focus:ring";
	const readOnlyInputClass =
		"cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500";

	const fetchKebun = async (nama?: string, kode?: string) => {
		setLoadingList(true);
		setError("");

		try {
			const params = new URLSearchParams();
			if (nama && nama.trim()) params.set("nama", nama.trim());
			if (kode && kode.trim()) params.set("kode", kode.trim());
			const query = params.toString();
			const url = `${API_BASE}/api/kebun${query ? `?${query}` : ""}`;

			const response = await fetch(url, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(await parseErrorMessage(response));
			}

			const data = (await response.json()) as KebunSummary[];
			setItems(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat data kebun");
		} finally {
			setLoadingList(false);
		}
	};

	const fetchDetail = async (id: string) => {
		setLoadingDetail(true);
		setError("");

		try {
			const response = await fetch(`${API_BASE}/api/kebun/${id}`, {
				cache: "no-store",
			});
			if (!response.ok) {
				throw new Error(await parseErrorMessage(response));
			}

			const detail = (await response.json()) as KebunDetail;
			setSelectedDetail(detail);
			setUpdateForm({
				nama: detail.nama,
				kode: detail.kode,
				luasHektare: String(detail.luasHektare),
				coord1Lat: String(detail.coord1Lat),
				coord1Lng: String(detail.coord1Lng),
				coord2Lat: String(detail.coord2Lat),
				coord2Lng: String(detail.coord2Lng),
				coord3Lat: String(detail.coord3Lat),
				coord3Lng: String(detail.coord3Lng),
				coord4Lat: String(detail.coord4Lat),
				coord4Lng: String(detail.coord4Lng),
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal mengambil detail kebun");
			setSelectedDetail(null);
		} finally {
			setLoadingDetail(false);
		}
	};

	useEffect(() => {
		void fetchKebun();
	}, []);

	const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmittingCreate(true);
		setMessage("");
		setError("");

		try {
			const payload: CreatePayload = {
				nama: createForm.nama.trim(),
				kode: createForm.kode.trim(),
				luasHektare: num(createForm.luasHektare),
				coord1Lat: num(createForm.coord1Lat),
				coord1Lng: num(createForm.coord1Lng),
				coord2Lat: num(createForm.coord2Lat),
				coord2Lng: num(createForm.coord2Lng),
				coord3Lat: num(createForm.coord3Lat),
				coord3Lng: num(createForm.coord3Lng),
				coord4Lat: num(createForm.coord4Lat),
				coord4Lng: num(createForm.coord4Lng),
			};

			const response = await fetch(`${API_BASE}/api/kebun`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(await parseErrorMessage(response));
			}

			setMessage("Kebun baru berhasil ditambahkan.");
			setCreateForm(initialForm);
			await fetchKebun(searchNama, searchKode);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal menambah kebun");
		} finally {
			setIsSubmittingCreate(false);
		}
	};

	const submitUpdate = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selectedId) return;

		setIsSubmittingUpdate(true);
		setMessage("");
		setError("");

		try {
			const payload: UpdatePayload = {
				nama: updateForm.nama.trim(),
				luasHektare: num(updateForm.luasHektare),
				coord1Lat: num(updateForm.coord1Lat),
				coord1Lng: num(updateForm.coord1Lng),
				coord2Lat: num(updateForm.coord2Lat),
				coord2Lng: num(updateForm.coord2Lng),
				coord3Lat: num(updateForm.coord3Lat),
				coord3Lng: num(updateForm.coord3Lng),
				coord4Lat: num(updateForm.coord4Lat),
				coord4Lng: num(updateForm.coord4Lng),
			};

			const response = await fetch(`${API_BASE}/api/kebun/${selectedId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(await parseErrorMessage(response));
			}

			setMessage("Data kebun berhasil diperbarui.");
			await fetchKebun(searchNama, searchKode);
			await fetchDetail(selectedId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memperbarui kebun");
		} finally {
			setIsSubmittingUpdate(false);
		}
	};

	const deleteKebun = async () => {
		if (!selectedId) return;

		const confirmed = window.confirm(
			"Yakin mau hapus kebun ini? Data akan di-soft delete di backend."
		);
		if (!confirmed) return;

		setIsDeleting(true);
		setMessage("");
		setError("");

		try {
			const response = await fetch(`${API_BASE}/api/kebun/${selectedId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(await parseErrorMessage(response));
			}

			setMessage("Kebun berhasil dihapus.");
			setSelectedId("");
			setSelectedDetail(null);
			setUpdateForm(initialForm);
			await fetchKebun(searchNama, searchKode);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal menghapus kebun");
		} finally {
			setIsDeleting(false);
		}
	};

	const onSearch = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSelectedId("");
		setSelectedDetail(null);
		setUpdateForm(initialForm);
		await fetchKebun(searchNama, searchKode);
	};

	return (
		<main className="min-h-screen bg-green-50 p-6 md:p-8">
			<div className="mx-auto max-w-7xl space-y-6">
				<header className="rounded-2xl border border-green-200 bg-white px-6 py-5 shadow-sm">
					<h1 className="text-2xl font-bold text-green-900 md:text-3xl">
						Manajemen Kebun
					</h1>
					<p className="mt-1 text-sm text-green-700 md:text-base">
						Template awal modul garden (milestone 50%): user bisa cari,
						tambah, lihat detail, edit, dan hapus data kebun dengan cepat.
					</p>
				</header>

				<section className="grid gap-3 rounded-2xl border border-green-200 bg-white p-4 shadow-sm md:grid-cols-3">
					<div className="rounded-lg bg-green-50 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-green-800">
							1. Cari Data
						</p>
						<p className="mt-1 text-sm text-gray-700">
							Pakai filter nama/kode untuk nemuin kebun yang mau dikelola.
						</p>
					</div>
					<div className="rounded-lg bg-green-50 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-green-800">
							2. Pilih Baris
						</p>
						<p className="mt-1 text-sm text-gray-700">
							Klik data di tabel untuk buka detail dan form edit otomatis.
						</p>
					</div>
					<div className="rounded-lg bg-green-50 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-green-800">
							3. Simpan Perubahan
						</p>
						<p className="mt-1 text-sm text-gray-700">
							Gunakan tombol Simpan/Update/Hapus sesuai aksi yang dibutuhin.
						</p>
					</div>
				</section>

				{(message || error) && (
					<div
						className={`rounded-xl border px-4 py-3 text-sm ${
							error
								? "border-red-200 bg-red-50 text-red-700"
								: "border-emerald-200 bg-emerald-50 text-emerald-700"
						}`}
					>
						{error || message}
					</div>
				)}

				<section className="grid gap-6 lg:grid-cols-12">
					<div className="space-y-6 lg:col-span-7">
						<div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
							<p className="mb-3 text-xs text-gray-500">
								Tips: kosongkan filter lalu klik "Cari Kebun" untuk reload semua
								data.
							</p>
							<form
								onSubmit={(event) => {
									void onSearch(event);
								}}
								className="grid gap-3 md:grid-cols-3"
							>
								<input
									value={searchNama}
									onChange={(event) => setSearchNama(event.target.value)}
									placeholder="Cari nama kebun"
									className={inputClass}
								/>
								<input
									value={searchKode}
									onChange={(event) => setSearchKode(event.target.value)}
									placeholder="Cari kode kebun"
									className={inputClass}
								/>
								<button
									type="submit"
									className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800"
								>
									Cari Kebun
								</button>
							</form>
						</div>

						<div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
							<div className="border-b border-green-100 bg-green-50 px-5 py-3">
								<h2 className="font-semibold text-green-900">Daftar Kebun</h2>
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-green-100">
									<thead className="bg-green-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-700">
												Nama
											</th>
											<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-700">
												Kode
											</th>
											<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-700">
												Luas (Ha)
											</th>
											<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-700">
												Status
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-green-100 bg-white">
										{loadingList && (
											<tr>
												<td
													colSpan={4}
													className="px-4 py-8 text-center text-sm text-gray-500"
												>
													Memuat data kebun...
												</td>
											</tr>
										)}

										{!loadingList && items.length === 0 && (
											<tr>
												<td
													colSpan={4}
													className="px-4 py-8 text-center text-sm text-gray-500"
												>
													Belum ada data kebun.
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
														className={`cursor-pointer transition ${
															active ? "bg-green-100/60" : "hover:bg-green-50"
														}`}
													>
														<td className="px-4 py-3 text-sm font-medium text-gray-800">
															{item.nama}
														</td>
														<td className="px-4 py-3 text-sm text-gray-600">
															{item.kode}
														</td>
														<td className="px-4 py-3 text-sm text-gray-600">
															{item.luasHektare}
														</td>
														<td className="px-4 py-3 text-sm">
															<span
																className={`rounded-full px-2 py-1 text-xs font-medium ${
																	item.isActive
																		? "bg-emerald-100 text-emerald-700"
																		: "bg-gray-200 text-gray-700"
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

					<div className="space-y-6 lg:col-span-5">
						<form
							onSubmit={(event) => {
								void submitCreate(event);
							}}
							className="space-y-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm"
						>
							<h2 className="text-lg font-semibold text-green-900">Tambah Kebun</h2>
							<p className="text-xs text-gray-500">
								Isi data kebun baru lengkap dengan 4 titik koordinat polygon.
							</p>

							<div className="grid gap-3 md:grid-cols-2">
								<input
									value={createForm.nama}
									onChange={(event) =>
										setCreateForm((prev) => ({ ...prev, nama: event.target.value }))
									}
									placeholder="Nama kebun"
									required
									className={inputClass}
								/>
								<input
									value={createForm.kode}
									onChange={(event) =>
										setCreateForm((prev) => ({ ...prev, kode: event.target.value }))
									}
									placeholder="Kode kebun"
									required
									className={inputClass}
								/>
								<input
									value={createForm.luasHektare}
									onChange={(event) =>
										setCreateForm((prev) => ({
											...prev,
											luasHektare: event.target.value,
										}))
									}
									placeholder="Luas hektare"
									type="number"
									step="0.01"
									required
									className={inputClass}
								/>
							</div>

							<p className="text-xs font-medium uppercase tracking-wide text-gray-500">
								4 Titik Koordinat
							</p>
							<div className="grid gap-2 md:grid-cols-2">
								{coordinateFields.map((field) => (
									<input
										key={field.key}
										value={createForm[field.key]}
										onChange={(event) =>
											setCreateForm((prev) => ({
												...prev,
												[field.key]: event.target.value,
											}))
										}
										placeholder={field.label}
										type="number"
										step="0.000001"
										required
										className={inputClass}
									/>
								))}
							</div>

							<button
								type="submit"
								disabled={isSubmittingCreate}
								className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-400"
							>
								{isSubmittingCreate ? "Menyimpan..." : "Simpan Kebun"}
							</button>
						</form>

						<form
							onSubmit={(event) => {
								void submitUpdate(event);
							}}
							className="space-y-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm"
						>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-green-900">Edit Kebun</h2>
								{loadingDetail && (
									<span className="text-xs text-gray-500">Memuat detail...</span>
								)}
							</div>
							<p className="text-xs text-gray-500">
								Pilih satu kebun dari tabel kiri, lalu ubah data sesuai kebutuhan.
							</p>

							{!hasSelected && (
								<p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
									Pilih kebun dari tabel untuk mulai edit/hapus.
								</p>
							)}

							{hasSelected && selectedDetail && (
								<>
									<div className="grid gap-3 md:grid-cols-2">
										<input
											value={updateForm.nama}
											onChange={(event) =>
												setUpdateForm((prev) => ({
													...prev,
													nama: event.target.value,
												}))
											}
											placeholder="Nama kebun"
											required
											className={inputClass}
										/>
										<input
											value={updateForm.kode}
											readOnly
											className={readOnlyInputClass}
										/>
										<input
											value={updateForm.luasHektare}
											onChange={(event) =>
												setUpdateForm((prev) => ({
													...prev,
													luasHektare: event.target.value,
												}))
											}
											placeholder="Luas hektare"
											type="number"
											step="0.01"
											required
											className={inputClass}
										/>
									</div>

									<div className="grid gap-2 md:grid-cols-2">
										{coordinateFields.map((field) => (
											<input
												key={field.key}
												value={updateForm[field.key]}
												onChange={(event) =>
													setUpdateForm((prev) => ({
														...prev,
														[field.key]: event.target.value,
													}))
												}
												placeholder={field.label}
												type="number"
												step="0.000001"
												required
												className={inputClass}
											/>
										))}
									</div>

									<div className="flex gap-2">
										<button
											type="submit"
											disabled={isSubmittingUpdate}
											className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
										>
											{isSubmittingUpdate ? "Menyimpan..." : "Update Kebun"}
										</button>
										<button
											type="button"
											onClick={() => {
												void deleteKebun();
											}}
											disabled={isDeleting}
											className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
										>
											{isDeleting ? "Menghapus..." : "Hapus Kebun"}
										</button>
									</div>

									<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
										Mandor: {selectedDetail.mandorId ?? "Belum ditugaskan"} | Supir:
										{" "}
										{selectedDetail.supirIds.length}
									</div>
								</>
							)}
						</form>
					</div>
				</section>
			</div>
		</main>
	);
}
