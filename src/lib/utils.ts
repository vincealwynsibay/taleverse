import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(str: string): string {
  return (
      str
          .trim()
          .replace(/[\s]+/gi, "-")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\-]/gi, "_")
          .toLowerCase()
  );
}
