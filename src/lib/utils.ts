import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * รวม class names และ resolve Tailwind conflicts
 * ใช้กับ shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * จัดรูปแบบวันที่เป็นภาษาไทย
 */
export function formatDateThai(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * จัดรูปแบบเวลา (HH:mm)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format ราคาเป็นสกุลเงินบาท
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate เลขคิว (Q001, Q002, ...)
 */
export function generateQueueNumber(sequence: number): string {
  return `Q${String(sequence).padStart(3, "0")}`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
