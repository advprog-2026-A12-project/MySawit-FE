"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
	KebunSummary, KebunDetail, KebunCreatePayload, KebunUpdatePayload, SupirDetail,
	getKebunList, getKebunDetail, createKebun, updateKebun, deleteKebun,
	assignMandor, unassignMandor, assignSupir, unassignSupir,
} from "@/lib/garden-api";
import { getUsers, UserListItem } from "@/lib/auth-api";

const initialForm = {
	nama: "", kode: "", luasHektare: "",
	coord1Lat: "", coord1Lng: "", coord2Lat: "", coord2Lng: "",
	coord3Lat: "", coord3Lng: "", coord4Lat: "", coord4Lng: "",
};
type FormState = typeof initialForm;

const coordFields = [
	{ key: "coord1Lat", label: "Titik 1 Lat" }, { key: "coord1Lng", label: "Titik 1 Lng" },
	{ key: "coord2Lat", label: "Titik 2 Lat" }, { key: "coord2Lng", label: "Titik 2 Lng" },
	{ key: "coord3Lat", label: "Titik 3 Lat" }, { key: "coord3Lng", label: "Titik 3 Lng" },
	{ key: "coord4Lat", label: "Titik 4 Lat" }, { key: "coord4Lng", label: "Titik 4 Lng" },
] as const;

function num(v: string) { return Number.parseFloat(v); }

const NAME_MIN = 3;
const NAME_MAX = 100;
const KODE_MAX = 50;
const LUAS_MIN = 0.01;
const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

function validateKebunForm(form: FormState, opts?: { requireKode?: boolean }) {
	const errors: string[] = [];
	const nama = form.nama.trim();
	if (nama.length < NAME_MIN) errors.push(`Nama kebun minimal ${NAME_MIN} karakter.`);
	if (nama.length > NAME_MAX) errors.push(`Nama kebun maksimal ${NAME_MAX} karakter.`);

	if (opts?.requireKode) {
		const kode = form.kode.trim();
		if (!kode) errors.push("Kode kebun wajib diisi.");
		if (kode.length > KODE_MAX) errors.push(`Kode kebun maksimal ${KODE_MAX} karakter.`);
	}

	const luas = num(form.luasHektare);
	if (!Number.isFinite(luas) || luas < LUAS_MIN) {
		errors.push("Luas hektare harus lebih dari 0.");
	}

	const points: string[] = [];
	for (const field of coordFields) {
		const value = num(form[field.key]);
		if (!Number.isFinite(value)) {
			errors.push(`${field.label} wajib diisi.`);
			continue;
		}
		if (field.key.endsWith("Lat") && (value < LAT_MIN || value > LAT_MAX)) {
			errors.push(`${field.label} harus antara ${LAT_MIN} dan ${LAT_MAX}.`);
		}
		if (field.key.endsWith("Lng") && (value < LNG_MIN || value > LNG_MAX)) {
			errors.push(`${field.label} harus antara ${LNG_MIN} dan ${LNG_MAX}.`);
		}
	}

	if (errors.length === 0) {
		for (let i = 1; i <= 4; i++) {
			const lat = form[`coord${i}Lat` as keyof FormState];
			const lng = form[`coord${i}Lng` as keyof FormState];
			points.push(`${lat},${lng}`);
		}
		const unique = new Set(points);
		if (unique.size < 4) {
			errors.push("4 titik koordinat harus berbeda, tidak boleh ada titik yang sama.");
		}
	}

	return errors.join(" | ");
}

export default function GardenPage() {
	const [items, setItems] = useState<KebunSummary[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const [detail, setDetail] = useState<KebunDetail | null>(null);
	const [loadingList, setLoadingList] = useState(false);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [busy, setBusy] = useState(false);
	const [searchNama, setSearchNama] = useState("");
	const [searchKode, setSearchKode] = useState("");
	const [searchSupir, setSearchSupir] = useState("");
	const [msg, setMsg] = useState("");
	const [err, setErr] = useState("");
	const [createForm, setCreateForm] = useState<FormState>(initialForm);
	const [updateForm, setUpdateForm] = useState<FormState>(initialForm);

	const [mandorList, setMandorList] = useState<UserListItem[]>([]);
	const [supirList, setSupirList] = useState<UserListItem[]>([]);
	const [selMandorId, setSelMandorId] = useState("");
	const [selSupirId, setSelSupirId] = useState("");

	const [reassignModal, setReassignModal] = useState<{
		open: boolean;
		type: "mandor" | "supir";
		userId: string;
		userName: string;
		sourceKebunId: string;
	}>({ open: false, type: "mandor", userId: "", userName: "", sourceKebunId: "" });
	const [reassignTargetKebunId, setReassignTargetKebunId] = useState("");

	const hasSelected = useMemo(() => Boolean(selectedId), [selectedId]);

	const inputCls = "rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none ring-green-300 placeholder:text-gray-400 focus:ring";
	const roCls = "cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500";
	const btnPrimary = "rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-400";
	const btnDanger = "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300";
	const btnAmber = "rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300";

	// --- Data Fetching ---
	const fetchList = async (nama?: string, kode?: string) => {
		setLoadingList(true); setErr("");
		try {
			const r = await getKebunList({ nama, kode });
			const data = Array.isArray(r.data) ? [...r.data] : [];
			data.sort((a, b) => {
				const aTime = Number.isNaN(Date.parse(a.createdAt)) ? 0 : Date.parse(a.createdAt);
				const bTime = Number.isNaN(Date.parse(b.createdAt)) ? 0 : Date.parse(b.createdAt);
				if (aTime !== bTime) return bTime - aTime;
				return a.kode.localeCompare(b.kode);
			});
			setItems(data);
		} catch (e) { setErr(e instanceof Error ? e.message : "Gagal memuat kebun"); }
		finally { setLoadingList(false); }
	};

	const fetchDetail = async (id: string) => {
		setLoadingDetail(true); setErr("");
		try {
			const r = await getKebunDetail(id);
			setDetail(r.data);
			const d = r.data;
			setUpdateForm({
				nama: d.nama, kode: d.kode, luasHektare: String(d.luasHektare),
				coord1Lat: String(d.coord1Lat), coord1Lng: String(d.coord1Lng),
				coord2Lat: String(d.coord2Lat), coord2Lng: String(d.coord2Lng),
				coord3Lat: String(d.coord3Lat), coord3Lng: String(d.coord3Lng),
				coord4Lat: String(d.coord4Lat), coord4Lng: String(d.coord4Lng),
			});
		} catch (e) { setErr(e instanceof Error ? e.message : "Gagal ambil detail"); setDetail(null); }
		finally { setLoadingDetail(false); }
	};

	const fetchUsers = async () => {
		try {
			const [mRes, sRes] = await Promise.all([
				getUsers({ role: "MANDOR", size: 100 }),
				getUsers({ role: "SUPIR_TRUK", size: 100 }),
			]);
			setMandorList(mRes.data.content);
			setSupirList(sRes.data.content);
		} catch { /* ignore if auth unavailable */ }
	};

	useEffect(() => { void fetchList(); void fetchUsers(); }, []);

	// --- Handlers ---
	const onSearch = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault(); setSelectedId(""); setDetail(null); setUpdateForm(initialForm);
		await fetchList(searchNama, searchKode);
	};

	const submitCreate = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault(); setMsg(""); setErr("");
		const validationError = validateKebunForm(createForm, { requireKode: true });
		if (validationError) { setErr(validationError); return; }
		setBusy(true);
		try {
			const p: KebunCreatePayload = {
				nama: createForm.nama.trim(), kode: createForm.kode.trim(),
				luasHektare: num(createForm.luasHektare),
				coord1Lat: num(createForm.coord1Lat), coord1Lng: num(createForm.coord1Lng),
				coord2Lat: num(createForm.coord2Lat), coord2Lng: num(createForm.coord2Lng),
				coord3Lat: num(createForm.coord3Lat), coord3Lng: num(createForm.coord3Lng),
				coord4Lat: num(createForm.coord4Lat), coord4Lng: num(createForm.coord4Lng),
			};
			await createKebun(p);
			setMsg("Kebun berhasil ditambahkan!"); setCreateForm(initialForm);
			await fetchList(searchNama, searchKode);
		} catch (e) { setErr(e instanceof Error ? e.message : "Gagal menambah kebun"); }
		finally { setBusy(false); }
	};

	const submitUpdate = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault(); if (!selectedId) return;
		setMsg(""); setErr("");
		const validationError = validateKebunForm(updateForm);
		if (validationError) { setErr(validationError); return; }
		setBusy(true);
		try {
			const p: KebunUpdatePayload = {
				nama: updateForm.nama.trim(), luasHektare: num(updateForm.luasHektare),
				coord1Lat: num(updateForm.coord1Lat), coord1Lng: num(updateForm.coord1Lng),
				coord2Lat: num(updateForm.coord2Lat), coord2Lng: num(updateForm.coord2Lng),
				coord3Lat: num(updateForm.coord3Lat), coord3Lng: num(updateForm.coord3Lng),
				coord4Lat: num(updateForm.coord4Lat), coord4Lng: num(updateForm.coord4Lng),
			};
			await updateKebun(selectedId, p);
			setMsg("Kebun berhasil diperbarui!"); await fetchList(searchNama, searchKode); await fetchDetail(selectedId);
		} catch (e) { setErr(e instanceof Error ? e.message : "Gagal update"); }
		finally { setBusy(false); }
	};

	const handleDelete = async () => {
		if (!selectedId || !confirm("Yakin mau hapus kebun ini?")) return;
		setBusy(true); setMsg(""); setErr("");
		try {
			await deleteKebun(selectedId);
			setMsg("Kebun berhasil dihapus."); setSelectedId(""); setDetail(null); setUpdateForm(initialForm);
			await fetchList(searchNama, searchKode);
		} catch (e) { setErr(e instanceof Error ? e.message : "Gagal hapus"); }
		finally { setBusy(false); }
	};

	const handleAssignMandor = async () => {
		if (!selectedId || !selMandorId) return;
		setBusy(true); setMsg(""); setErr("");
		try {
			await assignMandor(selectedId, selMandorId);
			setMsg("Mandor berhasil ditugaskan!"); setSelMandorId(""); await fetchDetail(selectedId); await fetchList(searchNama, searchKode);
		} catch (e) { setErr(e instanceof Error ? e.message : "Gagal assign mandor"); }
		finally { setBusy(false); }
	};

	const openReassignMandorModal = () => {
		if (!selectedId || !detail?.mandorId) return;
		setReassignModal({
			open: true,
			type: "mandor",
			userId: detail.mandorId,
			userName: detail.mandorName ?? "Mandor",
			sourceKebunId: selectedId,
		});
		setReassignTargetKebunId("");
	};

	const openReassignSupirModal = (supirId: string, supirName: string) => {
		if (!selectedId) return;
		setReassignModal({
			open: true,
			type: "supir",
			userId: supirId,
			userName: supirName || "Supir",
			sourceKebunId: selectedId,
		});
		setReassignTargetKebunId("");
	};

	const confirmReassign = async () => {
		if (!reassignTargetKebunId) return;
		setBusy(true); setMsg(""); setErr("");
		try {
			if (reassignModal.type === "mandor") {
				await unassignMandor(reassignModal.sourceKebunId);
				await assignMandor(reassignTargetKebunId, reassignModal.userId);
				setMsg("Mandor berhasil dipindahkan ke kebun lain!");
			} else {
				await unassignSupir(reassignModal.sourceKebunId, reassignModal.userId);
				await assignSupir(reassignTargetKebunId, reassignModal.userId);
				setMsg("Supir berhasil dipindahkan ke kebun lain!");
			}
			setReassignModal((m) => ({ ...m, open: false }));
			await fetchDetail(selectedId);
			await fetchList(searchNama, searchKode);
		} catch (e) {
			setErr(e instanceof Error ? e.message : "Gagal memindahkan");
		} finally { setBusy(false); }
	};

	const handleAssignSupir = async () => {
		if (!selectedId || !selSupirId) return;
		setBusy(true); setMsg(""); setErr("");
		try {
			await assignSupir(selectedId, selSupirId);
			setMsg("Supir berhasil ditugaskan!");
			setSelSupirId("");
			await fetchDetail(selectedId);
			await fetchList(searchNama, searchKode);
		} catch (e) { setErr(e instanceof Error ? e.message : "Gagal assign supir"); }
		finally { setBusy(false); }
	};

	const filteredSupir: SupirDetail[] = (detail?.supirList ?? []).filter(
		(s) => !searchSupir.trim() || (s.name ?? "").toLowerCase().includes(searchSupir.toLowerCase())
	);

	return (
		<main className="min-h-screen bg-green-50 p-6 md:p-8">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Header */}
				<header className="rounded-2xl border border-green-200 bg-white px-6 py-5 shadow-sm">
					<h1 className="text-2xl font-bold text-green-900 md:text-3xl">Manajemen Kebun Sawit</h1>
					<p className="mt-1 text-sm text-green-700 md:text-base">
						Kelola data kebun, mandor, dan supir truk dalam satu tampilan.
					</p>
				</header>

				{/* Alert */}
				{(msg || err) && (
					<div className={`rounded-xl border px-4 py-3 text-sm ${err ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
						{err || msg}
					</div>
				)}

				<section className="grid gap-6 lg:grid-cols-12">
					{/* LEFT: Search + Table */}
					<div className="space-y-6 lg:col-span-7">
						{/* Search */}
						<div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
							<form onSubmit={(e) => { void onSearch(e); }} className="grid gap-3 md:grid-cols-3">
								<input value={searchNama} onChange={(e) => setSearchNama(e.target.value)} placeholder="Cari nama kebun" className={inputCls} />
								<input value={searchKode} onChange={(e) => setSearchKode(e.target.value)} placeholder="Cari kode kebun" className={inputCls} />
								<button type="submit" className={btnPrimary}>Cari Kebun</button>
							</form>
						</div>

						{/* Table */}
						<div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
							<div className="border-b border-green-100 bg-green-50 px-5 py-3">
								<h2 className="font-semibold text-green-900">Daftar Kebun</h2>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-green-100">
									<thead className="bg-green-50">
										<tr>
											{["Nama", "Kode", "Luas (Ha)", "Mandor", "Supir", "Status"].map((h) => (
												<th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-green-700">{h}</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-green-100 bg-white">
										{loadingList && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Memuat data kebun...</td></tr>}
										{!loadingList && items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Belum ada data kebun.</td></tr>}
										{!loadingList && items.map((item) => {
											const active = selectedId === item.id;
											return (
												<tr key={item.id} onClick={() => { setSelectedId(item.id); void fetchDetail(item.id); }}
													className={`cursor-pointer transition ${active ? "bg-green-100/60" : "hover:bg-green-50"}`}>
													<td className="px-4 py-3 text-sm font-medium text-gray-800">{item.nama}</td>
													<td className="px-4 py-3 text-sm text-gray-600">{item.kode}</td>
													<td className="px-4 py-3 text-sm text-gray-600">{item.luasHektare}</td>
													<td className="px-4 py-3 text-sm text-gray-600">{item.mandorName ?? "—"}</td>
													<td className="px-4 py-3 text-sm text-gray-600">{item.totalSupir ?? 0}</td>
													<td className="px-4 py-3 text-sm">
														<span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"}`}>
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

					{/* RIGHT: Forms + Detail */}
					<div className="space-y-6 lg:col-span-5">
						{/* Create Form */}
						<form onSubmit={(e) => { void submitCreate(e); }} className="space-y-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
							<h2 className="text-lg font-semibold text-green-900">Tambah Kebun</h2>
							<div className="grid gap-3 md:grid-cols-2">
								<input value={createForm.nama} onChange={(e) => setCreateForm((p) => ({ ...p, nama: e.target.value }))} placeholder="Nama kebun" required className={inputCls} />
								<input value={createForm.kode} onChange={(e) => setCreateForm((p) => ({ ...p, kode: e.target.value }))} placeholder="Kode kebun" required className={inputCls} />
								<input value={createForm.luasHektare} onChange={(e) => setCreateForm((p) => ({ ...p, luasHektare: e.target.value }))} placeholder="Luas (Ha)" type="number" step="0.01" min={LUAS_MIN} required className={inputCls} />
							</div>
							<p className="text-xs font-medium uppercase tracking-wide text-gray-500">4 Titik Koordinat</p>
							<div className="grid gap-2 md:grid-cols-2">
								{coordFields.map((f) => {
									const isLat = f.key.endsWith("Lat");
									return (
										<input key={f.key} value={createForm[f.key]} onChange={(e) => setCreateForm((p) => ({ ...p, [f.key]: e.target.value }))}
											placeholder={f.label} type="number" step="0.000001" min={isLat ? LAT_MIN : LNG_MIN} max={isLat ? LAT_MAX : LNG_MAX} required className={inputCls} />
									);
								})}
							</div>
							<button type="submit" disabled={busy} className={`w-full ${btnPrimary}`}>{busy ? "Menyimpan..." : "Simpan Kebun"}</button>
						</form>

						{/* Edit Form */}
						<div className="space-y-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-green-900">Edit / Detail Kebun</h2>
								{loadingDetail && <span className="text-xs text-gray-500">Memuat detail...</span>}
							</div>

							{!hasSelected && <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">Pilih kebun dari tabel untuk mulai edit/hapus.</p>}

							{hasSelected && detail && (
								<>
									<form onSubmit={(e) => { void submitUpdate(e); }} className="space-y-3">
										<div className="grid gap-3 md:grid-cols-2">
											<input value={updateForm.nama} onChange={(e) => setUpdateForm((p) => ({ ...p, nama: e.target.value }))} placeholder="Nama" required className={inputCls} />
											<input value={updateForm.kode} readOnly className={roCls} />
											<input value={updateForm.luasHektare} onChange={(e) => setUpdateForm((p) => ({ ...p, luasHektare: e.target.value }))} placeholder="Luas (Ha)" type="number" step="0.01" min={LUAS_MIN} required className={inputCls} />
										</div>
										<div className="grid gap-2 md:grid-cols-2">
											{coordFields.map((f) => {
												const isLat = f.key.endsWith("Lat");
												return (
													<input key={f.key} value={updateForm[f.key]} onChange={(e) => setUpdateForm((p) => ({ ...p, [f.key]: e.target.value }))}
														placeholder={f.label} type="number" step="0.000001" min={isLat ? LAT_MIN : LNG_MIN} max={isLat ? LAT_MAX : LNG_MAX} required className={inputCls} />
												);
											})}
										</div>
										<div className="flex gap-2">
											<button type="submit" disabled={busy} className={`flex-1 ${btnAmber}`}>{busy ? "Menyimpan..." : "Update Kebun"}</button>
											<button type="button" onClick={() => { void handleDelete(); }} disabled={busy} className={`flex-1 ${btnDanger}`}>{busy ? "Menghapus..." : "Hapus Kebun"}</button>
										</div>
									</form>

									{/* Mandor Section */}
									<div className="rounded-xl border border-green-100 bg-green-50/50 p-4 space-y-3">
										<h3 className="text-sm font-semibold text-green-800">Mandor</h3>
										{detail.mandorId ? (
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm font-medium text-gray-800">{detail.mandorName ?? "—"}</p>
													<p className="text-xs text-gray-500">{detail.mandorEmail ?? detail.mandorId}</p>
												</div>
												<button onClick={openReassignMandorModal} disabled={busy} className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
													Copot
												</button>
											</div>
										) : (
											<p className="text-xs text-gray-500">Belum ada mandor ditugaskan.</p>
										)}
										<div className="flex gap-2">
											<select value={selMandorId} onChange={(e) => setSelMandorId(e.target.value)} className={`flex-1 ${inputCls}`}>
												<option value="">— Pilih Mandor —</option>
												{mandorList.filter((m) => m.active).map((m) => (
													<option key={m.id} value={m.id}>{m.name} ({m.email})</option>
												))}
											</select>
											<button onClick={() => { void handleAssignMandor(); }} disabled={busy || !selMandorId} className={btnPrimary}>
												Assign
											</button>
										</div>
									</div>

									{/* Supir Section */}
									<div className="rounded-xl border border-green-100 bg-green-50/50 p-4 space-y-3">
										<h3 className="text-sm font-semibold text-green-800">Supir Truk ({detail.totalSupir ?? 0})</h3>
										<input value={searchSupir} onChange={(e) => setSearchSupir(e.target.value)} placeholder="Filter supir..." className={inputCls + " w-full"} />
										{filteredSupir.length === 0 ? (
											<p className="text-xs text-gray-500">Belum ada supir.</p>
										) : (
											<ul className="max-h-40 space-y-2 overflow-y-auto">
												{filteredSupir.map((s) => (
													<li key={s.id} className="flex items-center justify-between rounded-lg bg-white p-2 text-sm shadow-sm">
														<div>
															<span className="font-medium text-gray-800">{s.name ?? "—"}</span>
															<span className="ml-2 text-xs text-gray-500">{s.email ?? ""}</span>
														</div>
														<button onClick={() => openReassignSupirModal(s.id, s.name ?? "")} disabled={busy} className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60">
															Copot
														</button>
													</li>
												))}
											</ul>
										)}
										<div className="flex gap-2">
											<select value={selSupirId} onChange={(e) => setSelSupirId(e.target.value)} className={`flex-1 ${inputCls}`}>
												<option value="">— Pilih Supir —</option>
												{supirList.filter((s) => s.active).map((s) => (
													<option key={s.id} value={s.id}>{s.name} ({s.email})</option>
												))}
											</select>
											<button onClick={() => { void handleAssignSupir(); }} disabled={busy || !selSupirId} className={btnPrimary}>
												Assign
											</button>
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</section>

				{reassignModal.open && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
						<div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 shadow-xl">
							<h3 className="text-lg font-bold text-green-900">
								Pindahkan {reassignModal.type === "mandor" ? "Mandor" : "Supir"}
							</h3>
							<p className="mt-1 text-sm text-gray-600">
								<strong>{reassignModal.userName}</strong> akan dicopot dari kebun ini.
								Pilih kebun tujuan baru untuk menugaskan kembali.
							</p>
							<select
								value={reassignTargetKebunId}
								onChange={(e) => setReassignTargetKebunId(e.target.value)}
								className="mt-4 w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none ring-green-300 focus:ring"
							>
								<option value="">— Pilih Kebun Tujuan —</option>
								{items
									.filter((k) => k.id !== reassignModal.sourceKebunId)
									.map((k) => (
										<option key={k.id} value={k.id}>
											{k.nama} ({k.kode})
										</option>
									))}
							</select>
							<div className="mt-5 flex gap-3">
								<button
									onClick={() => setReassignModal((m) => ({ ...m, open: false }))}
									disabled={busy}
									className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
								>
									Batal
								</button>
								<button
									onClick={() => { void confirmReassign(); }}
									disabled={busy || !reassignTargetKebunId}
									className="flex-1 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-400"
								>
									{busy ? "Memproses..." : "Pindahkan"}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
