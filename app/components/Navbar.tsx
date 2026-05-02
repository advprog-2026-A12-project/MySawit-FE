"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { clearAuthSession, getAccessToken, getMe, getRefreshToken, logout, subscribeAuthChange } from "@/lib/auth-api";

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function subscribeToAuthChange(callback: () => void) {
  return subscribeAuthChange(callback);
}

function getTokenSnapshot() {
  return getAccessToken();
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const token = useSyncExternalStore(subscribeToAuthChange, getTokenSnapshot, () => null);
  const isPublic = isPublicPath(pathname);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: Boolean(token) && !isPublic,
  });

  if (isPublic || !token) {
    return null;
  }

  const userRole = meQuery.data?.data.role;

  const navItems = [
    { href: "/profile", label: "Profil" },
    { href: "/harvest", label: "Panen" },
    { href: "/deliveries", label: "Pengiriman" },
    ...(userRole === "ADMIN"
      ? [
          { href: "/user", label: "Manajemen User" },
          { href: "/assignments", label: "Assignment" },
        ]
      : []),
  ];

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logout(refreshToken);
      }
    } catch {
      // Clear local session even when backend logout fails.
    } finally {
      clearAuthSession();
      router.replace("/login");
      setIsLoggingOut(false);
      setIsMenuOpen(false);
    }
  }

  return (
    <header className="border-b border-green-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/profile" className="text-lg font-bold tracking-tight text-green-900">
          MySawit
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="inline-flex rounded-lg border border-green-300 px-3 py-1.5 text-sm font-semibold text-green-800 hover:bg-green-50 md:hidden"
        >
          Menu
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "bg-green-700 text-white" : "text-green-800 hover:bg-green-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="ml-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Keluar..." : "Logout"}
          </button>
        </nav>
      </div>

      {isMenuOpen && (
        <div className="border-t border-green-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? "bg-green-700 text-white" : "text-green-800 hover:bg-green-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Keluar..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
