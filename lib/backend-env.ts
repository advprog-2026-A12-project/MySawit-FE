const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const MAIN_BACKEND_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"
);

const AUTH_BACKEND_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8001"
);

const PAYMENT_BACKEND_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8002"
);

export { AUTH_BACKEND_BASE_URL, MAIN_BACKEND_BASE_URL, PAYMENT_BACKEND_BASE_URL };
