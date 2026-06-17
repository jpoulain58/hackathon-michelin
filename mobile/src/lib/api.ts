import type { Session } from "@supabase/supabase-js";

export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

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
    polyline: string | null;
    averageSpeedKmh: number | null;
    bikeBucket: "road" | "gravel" | "mtb";
    ebike: boolean;
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

export interface InferredProfile {
  discipline: "road" | "gravel" | "mtb" | "city";
  priority: "speed" | "grip" | "durability" | "comfort" | "puncture";
  ebike: boolean;
  basedOnRides: number;
}

/** Profil pneu deduit des dernieres sorties Strava de l'utilisateur connecte. */
export async function fetchStravaTyreProfile(
  session: Session | null,
): Promise<{ profile: InferredProfile; items: ApiTyre[] } | null> {
  if (!session?.access_token) return null;

  const res = await fetch(`${API_BASE}/api/tyres/recommend/from-strava`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as { profile: InferredProfile; items: ApiTyre[] };
}

export interface RideTyreDetail {
  name: string;
  designation: string;
  weightG: number;
  dimensions: number;
}

export interface RideProTip {
  author: string;
  text: string;
}

export interface ApiRide {
  id: string;
  name: string;
  km: number;
  dplus: number;
  durationSeconds: number;
  kcal: number | null;
  terrain: string;
  landscape: string | null;
  difficulty: string;
  tags: string[];
  tyre: string | null;
  tyreDetail: RideTyreDetail | null;
  description: string;
  instructions: string;
  proTip: RideProTip | null;
  pts: [number, number][];
  source: "strava" | "manual";
  createdAt: string;
}

export interface CreateRideForm {
  name: string;
  description?: string;
  instructions?: string;
  terrain: string;
  landscape: string;
  difficulty?: string;
  tags?: string[];
  tyre: string;
  tyreDetail: RideTyreDetail;
  proTip: RideProTip;
}

export async function fetchRides(): Promise<ApiRide[]> {
  const res = await fetch(`${API_BASE}/api/rides`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: ApiRide[] }).items;
}

export async function createRideFromStrava(
  session: Session | null,
  activityId: string,
  form: CreateRideForm,
): Promise<ApiRide> {
  if (!session?.access_token) throw new Error("Connecte-toi pour publier une balade.");
  const res = await fetch(`${API_BASE}/api/rides/from-strava`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ activityId, ...form }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  return (await res.json()) as ApiRide;
}

export async function createRideFromGpx(
  session: Session | null,
  gpxXml: string,
  form: CreateRideForm,
): Promise<ApiRide> {
  if (!session?.access_token) throw new Error("Connecte-toi pour publier une balade.");
  const res = await fetch(`${API_BASE}/api/rides/from-gpx`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ gpxXml, ...form }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  return (await res.json()) as ApiRide;
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
