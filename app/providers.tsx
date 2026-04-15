"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const appContent = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  if (!googleClientId) {
    return appContent;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{appContent}</GoogleOAuthProvider>;
}