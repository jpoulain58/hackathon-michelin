import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper shadcn/ui : fusionne les classes conditionnelles (clsx) puis
// dedoublonne les utilitaires Tailwind en conflit (tailwind-merge).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
