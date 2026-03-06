"use client";

import { useSyncExternalStore, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeToStorage, getToken, () => null);

  const isPublic = isPublicPath(pathname);

  const shouldRedirect = !isPublic && !token;

  const handleRedirect = useCallback(() => {
    if (shouldRedirect) {
      router.replace("/login");
    }
  }, [shouldRedirect, router]);

  // Trigger redirect synchronously during render if needed
  if (shouldRedirect) {
    // Schedule navigation after paint to avoid React warnings
    if (typeof window !== "undefined") {
      queueMicrotask(handleRedirect);
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-800 text-sm">Memuat...</p>
      </div>
    );
  }

  return <>{children}</>;
}
