import { supabase } from "@/lib/supabase/client";

export interface RetailerStore {
  id: number;
  name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  website: string;
  lat: number;
  lng: number;
}

/** Magasins revendeurs geolocalises (table publique retailer_stores). */
export async function fetchRetailerStores(): Promise<RetailerStore[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("retailer_stores")
    .select("id, name, city, region, country, website, lat, lng")
    .order("country", { ascending: true });
  if (error || !data) return [];
  return data as RetailerStore[];
}

/** Distance a vol d'oiseau (km) entre deux points GPS — formule de Haversine. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Disponibilite simulee d'un pneu dans un magasin (demo). Deterministe pour un
 * couple (magasin, produit) donne : ~72% de chance d'etre en stock.
 */
export function fakeStock(storeId: number, productKey: string | number): boolean {
  const s = `${storeId}:${productKey}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100 < 72;
}

export function normalizeRetailerUrl(website: string): string {
  const value = website.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function formatRetailerDomain(website: string): string {
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}
