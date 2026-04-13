"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken, subscribeAuthChange } from "@/lib/auth-api";

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function getToken() {
  return getAccessToken();
}

function subscribeToStorage(callback: () => void) {
  return subscribeAuthChange(callback);
}

const subscribeNoop = () => () => {};

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const token = useSyncExternalStore(subscribeToStorage, getToken, () => null);

  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isPublic && !token) {
      router.replace("/login");
    }
  }, [isHydrated, isPublic, token, router]);

  if (!isPublic && (!isHydrated || !token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-800 text-sm">Memuat...</p>
      </div>
    );
  }

  return <>{children}</>;
}
