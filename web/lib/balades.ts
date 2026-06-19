import { API_BASE } from "@/lib/api";

export type LatLng = [number, number];

export interface TyreDetail {
  productId?: number | null;
  name: string;
  designation: string;
  weightG: number;
  dimensions: number;
}

export interface ProTip {
  author: string;
  text: string;
}

export interface UsedTyre {
  productId: number;
  brand: string | null;
  range: string;
  designation: string;
  rating: number | null;
}

export interface Ride {
  id: string;
  name: string;
  km: number;
  dplus: number;
  durationSeconds: number;
  kcal: number | null;
  terrain: string;
  landscape: string | null;
  difficulty: "Débutant" | "Intermédiaire" | "Expert" | string;
  tags: string[];
  tyre: string | null;
  tyreDetail: TyreDetail | null;
  usedTyre: UsedTyre | null;
  description: string;
  instructions: string;
  proTip: ProTip | null;
  pts: LatLng[];
  source: "strava" | "manual";
  isAmbassador: boolean;
  createdAt: string;
}

export const CENTER: LatLng = [45.7772, 3.087]; // Clermont-Ferrand (siège Michelin)

export async function fetchRides(
  filters: { terrain?: string; difficulty?: string; ambassador?: boolean } = {},
): Promise<Ride[]> {
  const q = new URLSearchParams();
  if (filters.terrain) q.set("terrain", filters.terrain);
  if (filters.difficulty) q.set("difficulty", filters.difficulty);
  if (filters.ambassador) q.set("ambassador", "true");
  const url = `${API_BASE}/api/rides${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { items: Ride[] };
  return data.items;
}

export async function fetchRide(id: string): Promise<Ride | null> {
  const res = await fetch(`${API_BASE}/api/rides/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as Ride;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Décodeur de polyline encodée Strava/Google (algorithme officiel). */
export function decodePolyline(str: string, precision = 5): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords: LatLng[] = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / factor, lng / factor]);
  }
  return coords;
}
