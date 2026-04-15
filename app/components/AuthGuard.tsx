"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, clearAuthSession, getAccessToken, getMe, subscribeAuthChange } from "@/lib/auth-api";

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

function getServerTokenSnapshot() {
  return undefined;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeToStorage, getToken, getServerTokenSnapshot);

  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (!isPublic && token === null) {
      router.replace("/login");
    }
  }, [isPublic, token, router]);

  useEffect(() => {
    if (isPublic || !token) return;

    let cancelled = false;

    const verifySession = async () => {
      try {
        await getMe();
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearAuthSession();
          router.replace("/login");
        }
      }
    };

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [isPublic, token, router]);

  if (!isPublic && (token === undefined || token === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-800 text-sm">Memuat...</p>
      </div>
    );
  }

  return <>{children}</>;
}
