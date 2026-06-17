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
  club_member: boolean;
  created_at: string;
  updated_at: string;
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

  async syncRiderFromAuthorization(authorization?: string): Promise<SyncedRider> {
    const user = await this.getUserFromAuthorization(authorization);

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
