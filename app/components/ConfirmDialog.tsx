"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-700 text-white hover:bg-red-800"
      : "bg-green-700 text-white hover:bg-green-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-green-200 bg-white shadow-xl"
      >
        <div className="px-6 py-5">
          <h2 id="confirm-dialog-title" className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-gray-600">
            {description}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {isLoading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
