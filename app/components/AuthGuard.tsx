"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (isPublic) {
      setChecked(true);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-800 text-sm">Memuat...</p>
      </div>
    );
  }

  return <>{children}</>;
}
