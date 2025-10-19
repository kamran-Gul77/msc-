import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// on any other page after update:
export function refreshDashboard() {
  window.dispatchEvent(new Event("refreshDashboard"));
}
