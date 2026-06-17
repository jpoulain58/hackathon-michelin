import type { Session } from "@supabase/supabase-js";
import { API_BASE } from "@/lib/api";

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

export async function fetchAuthProfile(
  session: Session | null,
  options: { refresh?: boolean } = {},
): Promise<AuthProfile | null> {
  if (!session?.access_token) return null;

  const url = new URL(`${API_BASE}/api/auth/profile`);
  if (options.refresh) url.searchParams.set("refresh", "1");

  const response = await fetch(url, {
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
