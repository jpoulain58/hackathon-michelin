import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import {
  createClient,
  type SupabaseClient,
  type User,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";

type SyncedRider = {
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

export type SafeProviderConnection = {
  provider: string;
  providerUserId: string | null;
  scopes: string[];
  profile: Record<string, unknown>;
  stats: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
  lastSyncAt: string | null;
};

type ProviderConnectionRow = {
  provider: string;
  provider_user_id: string | null;
  scopes: string[] | null;
  profile: Record<string, unknown> | null;
  stats: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  last_sync_at: string | null;
};

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient | null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.supabase =
      supabaseUrl && supabaseKey
        ? createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            realtime: { transport: realtimeTransport },
          })
        : null;
  }

  async getUserFromAuthorization(authorization?: string): Promise<User> {
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      throw new UnauthorizedException("Token Supabase manquant.");
    }

    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException("Session Supabase invalide.");
    }

    return user;
  }

  async getOptionalUserFromAuthorization(authorization?: string): Promise<User | null> {
    if (!authorization?.match(/^Bearer\s+(.+)$/i)) return null;
    return this.getUserFromAuthorization(authorization);
  }

  async syncRiderFromAuthorization(authorization?: string): Promise<SyncedRider> {
    const user = await this.getUserFromAuthorization(authorization);
    return this.syncRider(user);
  }

  async syncRider(user: User): Promise<SyncedRider> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const provider = this.getProvider(user);
    const identities = user.identities ?? [];
    const displayName =
      this.firstString(
        user.user_metadata.full_name,
        user.user_metadata.name,
        user.user_metadata.display_name,
        user.user_metadata.username,
        user.email,
      ) ?? "Rider Michelin";

    const stravaIdentity = this.findIdentity(user, "strava");
    const garminIdentity = this.findIdentity(user, "garmin");
    // Strava et Garmin ne sont pas des providers Supabase natifs : l'id est stocke
    // dans les user_metadata par le flux OAuth backend (voir Strava/GarminService).
    const stravaId =
      stravaIdentity?.id ?? this.firstString(user.user_metadata.strava_id) ?? null;
    const garminId =
      garminIdentity?.id ?? this.firstString(user.user_metadata.garmin_id) ?? null;

    const payload = {
      id: user.id,
      email: user.email ?? null,
      display_name: displayName,
      provider,
      providers: this.getProviders(user),
      strava_id: stravaId,
      garmin_id: garminId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("riders")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Impossible de synchroniser le rider Supabase: ${error.message}`,
      );
    }

    return data as SyncedRider;
  }

  async getProviderConnections(userId: string): Promise<SafeProviderConnection[]> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const { data, error } = await this.supabase
      .from("provider_connections")
      .select("provider, provider_user_id, scopes, profile, stats, created_at, updated_at, last_sync_at")
      .eq("user_id", userId);

    if (error) {
      if (isMissingProviderConnectionsTable(error.message)) return [];
      throw new InternalServerErrorException(
        `Impossible de lire les comptes connectes: ${error.message}`,
      );
    }

    return ((data ?? []) as ProviderConnectionRow[]).map((connection) => ({
      provider: connection.provider,
      providerUserId: connection.provider_user_id,
      scopes: connection.scopes ?? [],
      profile: connection.profile ?? {},
      stats: connection.stats ?? {},
      createdAt: connection.created_at,
      updatedAt: connection.updated_at,
      lastSyncAt: connection.last_sync_at,
    }));
  }

  private getProvider(user: User): string | null {
    return this.firstString(user.app_metadata.provider) ?? null;
  }

  private getProviders(user: User): string[] {
    const providers = user.app_metadata.providers;
    return Array.isArray(providers) ? providers.filter((item) => typeof item === "string") : [];
  }

  private findIdentity(user: User, provider: string) {
    const aliases = new Set([provider, `custom:${provider}`]);
    return (user.identities ?? []).find((identity) => aliases.has(identity.provider));
  }

  private firstString(...values: unknown[]): string | undefined {
    return values.find((value): value is string => typeof value === "string" && value.length > 0);
  }
}

function isMissingProviderConnectionsTable(message: string): boolean {
  return /provider_connections|relation .* does not exist|Could not find the table/i.test(message);
}
