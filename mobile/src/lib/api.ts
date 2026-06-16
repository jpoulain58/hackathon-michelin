import type { Session } from "@supabase/supabase-js";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export interface ApiTyre {
  range: string;
  designation: string;
  segment: string;
  cycleType: string;
  use: string[];
  terrainTypes: string[];
  weightG?: number;
  technologies?: Record<string, string[]>;
  score: number;
  why: string[];
}

export async function fetchRecommendations(params: {
  discipline: string;
  priority: string;
  ebike: boolean;
  limit?: number;
}): Promise<ApiTyre[]> {
  const q = new URLSearchParams({
    discipline: params.discipline,
    priority: params.priority,
    ebike: String(params.ebike),
    limit: String(params.limit ?? 5),
  });
  const res = await fetch(`${API_BASE}/api/tyres/recommend?${q}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: ApiTyre[] }).items;
}

export async function syncRider(session: Session | null): Promise<void> {
  if (!session?.access_token) return;

  const response = await fetch(`${API_BASE}/api/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Sync auth API ${response.status}`);
  }
}
