import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan") {
  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === "string") {
    return error || fallback
  }

  return fallback
}
