import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";

const defaultApiBase = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_BASE =
  defaultApiBase ||
  (Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001");

export type ProviderId = "strava" | "garmin" | "google";

export type ProviderSummary = {
  id: ProviderId;
  connected: boolean;
  providerUserId: string | null;
  scopes: string[];
  linkedAt: string | null;
  lastSyncAt: string | null;
};

export type StravaProfile = {
  connected: true;
  athlete: {
    id: string | null;
    username: string | null;
    firstname: string | null;
    lastname: string | null;
    profile: string | null;
    profileMedium: string | null;
    city: string | null;
    country: string | null;
  };
  totals: {
    allRideKm: number;
    allRideCount: number;
    allRideElevationM: number;
    recentRideKm: number;
    recentRideCount: number;
    recentRideElevationM: number;
    recentAverageSpeedKmh: number | null;
  };
  recentActivities: Array<{
    id: string;
    name: string;
    distanceKm: number;
    elevationM: number;
    movingTimeSeconds: number;
    sportType: string;
    startDate: string | null;
  }>;
  scopes: string[];
  lastSyncAt: string | null;
  error?: string;
};

export type AuthProfile = {
  user: {
    id: string;
    email: string | null;
    createdAt: string;
  };
  rider: {
    id: string;
    email: string | null;
    display_name: string;
    provider: string | null;
    providers: string[];
    strava_id: string | null;
    garmin_id: string | null;
    tier: string;
    total_km: number;
    reviews_count: number;
    created_at: string;
    updated_at: string;
  };
  providers: ProviderSummary[];
  strava: StravaProfile | null;
};

export interface ApiTyre {
  id: string;
  range: string;
  designation: string;
  productType: string;
  segment: string;
  cycleType: string;
  use: string[];
  terrainTypes: string[];
  fitting?: string;
  widthEtrto?: string;
  diameterEtrto?: string;
  webDiameterInch?: string;
  webWidthMm?: string;
  tpi?: string;
  weightG?: number;
  pressure?: {
    minBar?: number | null;
    maxBar?: number | null;
    minPsi?: number | null;
    maxPsi?: number | null;
  };
  technologies?: Record<string, string[]>;
  sidewallColor?: string;
  score?: number;
  why?: string[];
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

export interface StravaStats {
  connected: boolean;
  totalKm: number;
  rideCount: number;
}

/** Cumul des km Strava du rider connecte (Club : "Mon Garage"). */
export async function fetchStravaStats(accessToken: string): Promise<StravaStats> {
  const res = await fetch(`${API_BASE}/api/auth/strava/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  return (await res.json()) as StravaStats;
export async function fetchTyres(params: { ids?: string[]; limit?: number } = {}): Promise<ApiTyre[]> {
  const q = new URLSearchParams();
  if (params.ids?.length) q.set("ids", params.ids.join(","));
  if (params.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(`${API_BASE}/api/tyres${suffix}`);
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

export async function fetchAuthProfile(
  session: Session | null,
  options: { refresh?: boolean } = {},
): Promise<AuthProfile | null> {
  if (!session?.access_token) return null;

  const url = new URL(`${API_BASE}/api/auth/profile`);
  if (options.refresh) url.searchParams.set("refresh", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Profil API ${response.status}`);
  }

  return (await response.json()) as AuthProfile;
}
