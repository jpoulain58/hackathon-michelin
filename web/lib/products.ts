import { API_BASE } from "@/lib/api";

export interface ProductOption {
  id: number;
  brand: string | null;
  range: string;
  designation: string;
  segment: string | null;
  cycleType: string | null;
}

export async function searchProducts(query: string): Promise<ProductOption[]> {
  const res = await fetch(`${API_BASE}/api/products/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { items: ProductOption[] };
  return data.items;
}

export function formatProductLabel(p: Pick<ProductOption, "brand" | "range" | "designation">): string {
  return [p.brand, p.range, p.designation].filter(Boolean).join(" ");
}
