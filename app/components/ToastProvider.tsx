"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastInput {
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastItem extends ToastInput {
  id: number;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

const toastAccentStyles: Record<ToastType, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const nextToast: ToastItem = {
        id,
        title: toast.title,
        description: toast.description,
        type: toast.type ?? "info",
      };

      setToasts((current) => [nextToast, ...current].slice(0, 4));
      window.setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-lg border shadow-lg ${toastStyles[toast.type]}`}
          >
            <div className={`h-1 ${toastAccentStyles[toast.type]}`} />
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm opacity-80">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-md px-2 py-1 text-sm font-semibold opacity-70 hover:bg-black/5 hover:opacity-100"
              >
                Tutup
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
