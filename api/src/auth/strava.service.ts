import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import {
  createClient,
  type SupabaseClient,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

// Strava n'est PAS un provider OIDC (pas d'id_token ni de JWKS) : il ne peut donc
// pas passer par le "Custom Auth Provider" Supabase. On pilote le flux OAuth 2.0
// cote backend, exactement comme Garmin. Strava etant un client confidentiel
// (client_secret), pas besoin de PKCE.
const DEFAULT_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const DEFAULT_TOKEN_URL = "https://www.strava.com/oauth/token";
const DEFAULT_ATHLETE_URL = "https://www.strava.com/api/v3/athlete";
const DEFAULT_API_URL = "https://www.strava.com/api/v3";
// Liste separee par des virgules (format Strava). `read` suffit pour le profil ;
// `activity:read_all` sert a analyser les sorties.
const DEFAULT_SCOPES = "read,activity:read_all";

// Etat OAuth conserve entre /start et /callback. En memoire : suffisant pour une
// instance unique (hackathon). Pour scaler, deplacer vers Redis/Postgres.
type PendingAuth = {
  redirectTo: string;
  linkUserId?: string;
  expiresAt: number;
};

type StravaAthlete = {
  id?: number | string;
  username?: string;
  firstname?: string;
  lastname?: string;
  profile?: string;
  profile_medium?: string;
  city?: string;
  country?: string;
};

type StravaTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  scope?: string;
  athlete?: StravaAthlete;
};

type StravaActivity = {
  id?: number | string;
  name?: string;
  distance?: number;
  moving_time?: number;
  total_elevation_gain?: number;
  type?: string;
  sport_type?: string;
  start_date?: string;
  average_speed?: number;
  map?: { summary_polyline?: string };
};

type StravaActivityTotals = {
  count?: number;
  distance?: number;
  moving_time?: number;
  elevation_gain?: number;
};

type StravaAthleteStats = {
  all_ride_totals?: StravaActivityTotals;
  recent_ride_totals?: StravaActivityTotals;
};

type StravaConnectionRow = {
  user_id: string;
  provider_user_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  scopes: string[] | null;
  profile: Record<string, unknown> | null;
  stats: Record<string, unknown> | null;
  last_sync_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StravaProfileSummary = {
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
    bikeBucket: BikeBucket;
    ebike: boolean;
  }>;
  scopes: string[];
  lastSyncAt: string | null;
  error?: string;
};

export type StravaSessionTicket = {
  redirectTo: string;
  tokenHash: string;
  type: "magiclink";
};

export type StravaLinkedTicket = {
  redirectTo: string;
  linked: true;
};

const STATE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class StravaService {
  private readonly supabase: SupabaseClient | null;
  private readonly pending = new Map<string, PendingAuth>();

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

  /** Construit l'URL d'autorisation Strava et memorise la destination finale. */
  buildAuthorizeUrl(redirectTo: string, linkUserId?: string): string {
    if (!redirectTo) {
      throw new BadRequestException("Parametre redirect_to manquant.");
    }

    const clientId = this.requireEnv("STRAVA_CLIENT_ID");
    const state = base64Url(randomBytes(16));

    this.cleanupExpired();
    this.pending.set(state, {
      redirectTo,
      linkUserId,
      expiresAt: Date.now() + STATE_TTL_MS,
    });

    const authorizeUrl = new URL(process.env.STRAVA_AUTHORIZE_URL ?? DEFAULT_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", this.getRedirectUri());
    authorizeUrl.searchParams.set("response_type", "code");
    // Force Strava to show the authorization screen instead of silently reusing
    // the previous consent, which feels like a cached login to users.
    authorizeUrl.searchParams.set("approval_prompt", "force");
    authorizeUrl.searchParams.set("scope", process.env.STRAVA_SCOPES ?? DEFAULT_SCOPES);
    authorizeUrl.searchParams.set("state", state);

    return authorizeUrl.toString();
  }

  /**
   * Finalise le callback Strava : echange le code, recupere l'athlete, provisionne
   * l'utilisateur Supabase et renvoie un ticket magiclink. La destination (web ou
   * deep link mobile) est toujours retournee, meme en erreur, pour que le client
   * puisse afficher un message plutot que de rester bloque.
   */
  async completeCallback(params: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<
    | StravaSessionTicket
    | StravaLinkedTicket
    | { redirectTo: string; error: string }
    | { error: string }
  > {
    const pending = params.state ? this.pending.get(params.state) : undefined;
    if (params.state) this.pending.delete(params.state);

    if (!pending || pending.expiresAt < Date.now()) {
      return { error: "Etat OAuth Strava invalide ou expire. Relance la connexion." };
    }

    const redirectTo = pending.redirectTo;

    if (params.error) {
      return { redirectTo, error: params.error };
    }
    if (!params.code) {
      return { redirectTo, error: "Code d'autorisation Strava manquant." };
    }

    try {
      const tokens = await this.exchangeCode(params.code);
      // Strava renvoie deja l'athlete dans la reponse token ; fallback sur l'API.
      const athlete = tokens.athlete ?? (await this.fetchAthlete(tokens.access_token));
      if (pending.linkUserId) {
        await this.linkSupabaseUser(pending.linkUserId, athlete, tokens);
        return { redirectTo, linked: true };
      }

      const tokenHash = await this.provisionSupabaseUser(athlete, tokens);
      return { redirectTo, tokenHash, type: "magiclink" };
    } catch (error) {
      return {
        redirectTo,
        error: error instanceof Error ? error.message : "Connexion Strava impossible.",
      };
    }
  }

  private async exchangeCode(code: string): Promise<StravaTokens> {
    const clientId = this.requireEnv("STRAVA_CLIENT_ID");
    const clientSecret = this.requireEnv("STRAVA_CLIENT_SECRET");
    const tokenUrl = process.env.STRAVA_TOKEN_URL ?? DEFAULT_TOKEN_URL;

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Echange de token Strava echoue (${response.status}). ${detail}`.trim());
    }

    const tokens = (await response.json()) as StravaTokens;
    if (!tokens.access_token) {
      throw new Error("Reponse Strava sans access_token.");
    }
    return tokens;
  }

  private async fetchAthlete(accessToken?: string): Promise<StravaAthlete> {
    if (!accessToken) throw new Error("Access token Strava manquant.");
    const athleteUrl = process.env.STRAVA_ATHLETE_URL ?? DEFAULT_ATHLETE_URL;

    const response = await fetch(athleteUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Recuperation de l'athlete Strava echouee (${response.status}). ${detail}`.trim());
    }

    return (await response.json()) as StravaAthlete;
  }

  /**
   * Cree (ou met a jour) l'utilisateur Supabase associe au compte Strava et
   * renvoie un token_hash magiclink que le client echangera contre une session.
   */
  async getProfile(userId: string, forceRefresh = false): Promise<StravaProfileSummary | null> {
    const connection = await this.getStoredConnection(userId);
    if (!connection) return null;

    if (!forceRefresh && !this.shouldRefresh(connection.last_sync_at)) {
      return this.connectionToSummary(connection);
    }

    try {
      const accessToken = await this.getFreshAccessToken(connection);
      const athlete = await this.fetchAthlete(accessToken);
      const athleteId = stringifyId(athlete.id) ?? connection.provider_user_id;
      const [stats, activities] = await Promise.all([
        athleteId ? this.fetchAthleteStats(accessToken, athleteId) : Promise.resolve(null),
        this.fetchRecentActivities(accessToken),
      ]);
      const summary = buildProfileSummary({
        athlete,
        stats,
        activities,
        scopes: connection.scopes ?? [],
        lastSyncAt: new Date().toISOString(),
      });

      await this.persistProfileSync(userId, athlete, summary);
      await this.updateRiderTotals(userId, summary);

      return summary;
    } catch (error) {
      const fallback = this.connectionToSummary(connection);
      if (fallback) {
        return {
          ...fallback,
          error:
            error instanceof Error
              ? error.message
              : "Actualisation Strava impossible.",
        };
      }
      throw error;
    }
  }

  private async provisionSupabaseUser(athlete: StravaAthlete, tokens: StravaTokens): Promise<string> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const stravaId = athlete.id != null ? String(athlete.id) : null;
    if (!stravaId) {
      throw new Error("Reponse Strava sans identifiant d'athlete.");
    }

    const linkedUser = await this.findUserByProviderConnection(stravaId);
    if (linkedUser) {
      await this.applyStravaMetadata(linkedUser.id, athlete);
      await this.upsertProviderConnection(linkedUser.id, athlete, tokens);
      return this.generateMagicLinkToken(linkedUser.email);
    }

    // Strava ne fournit pas d'email : on derive un email stable et deterministe.
    const email = `strava_${stravaId}@users.trustwheels.app`.toLowerCase();
    const fullName =
      [athlete.firstname, athlete.lastname].filter(Boolean).join(" ").trim() ||
      athlete.username ||
      "Rider Strava";
    const appMetadata = { provider: "strava", providers: ["strava"] };
    const userMetadata = {
      provider: "strava",
      strava_id: stravaId,
      full_name: fullName,
      username: athlete.username ?? null,
    };

    const created = await this.supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    });

    let userId = created.data.user?.id ?? null;

    if (!userId) {
      if (!isAlreadyRegistered(created.error)) {
        throw new Error(created.error?.message ?? "Creation utilisateur Supabase echouee.");
      }
      // Utilisateur deja present : retrouve-le et reapplique les metadonnees.
      const lookup = await this.supabase.auth.admin.generateLink({ type: "magiclink", email });
      if (lookup.error || !lookup.data.user) {
        throw new Error(lookup.error?.message ?? "Utilisateur Strava introuvable cote Supabase.");
      }
      userId = lookup.data.user.id;
      await this.supabase.auth.admin.updateUserById(userId, {
        app_metadata: appMetadata,
        user_metadata: userMetadata,
      });
    }

    await this.upsertProviderConnection(userId, athlete, tokens);
    return this.generateMagicLinkToken(email);
  }

  private async linkSupabaseUser(
    userId: string,
    athlete: StravaAthlete,
    tokens: StravaTokens,
  ): Promise<void> {
    await this.applyStravaMetadata(userId, athlete);
    await this.upsertProviderConnection(userId, athlete, tokens);
  }

  private async applyStravaMetadata(userId: string, athlete: StravaAthlete): Promise<void> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const stravaId = stringifyId(athlete.id);
    if (!stravaId) {
      throw new Error("Reponse Strava sans identifiant d'athlete.");
    }

    const { data, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error || !data.user) {
      throw new Error(error?.message ?? "Utilisateur Supabase introuvable.");
    }

    const appMetadata = objectValue(data.user.app_metadata);
    const existingProviders = Array.isArray(appMetadata.providers)
      ? appMetadata.providers.filter((provider): provider is string => typeof provider === "string")
      : [];
    const providers = Array.from(new Set([...existingProviders, "strava"]));

    const userMetadata = objectValue(data.user.user_metadata);
    const fullName =
      [athlete.firstname, athlete.lastname].filter(Boolean).join(" ").trim() ||
      athlete.username ||
      stringValue(userMetadata.full_name) ||
      "Rider Strava";

    await this.supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...appMetadata,
        provider: stringValue(appMetadata.provider) ?? "strava",
        providers,
      },
      user_metadata: {
        ...userMetadata,
        strava_id: stravaId,
        strava_username: athlete.username ?? null,
        full_name: stringValue(userMetadata.full_name) ?? fullName,
        avatar_url:
          stringValue(userMetadata.avatar_url) ??
          athlete.profile_medium ??
          athlete.profile ??
          null,
      },
    });
  }

  private async upsertProviderConnection(
    userId: string,
    athlete: StravaAthlete,
    tokens: StravaTokens,
  ): Promise<void> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const stravaId = stringifyId(athlete.id);
    if (!stravaId) throw new Error("Reponse Strava sans identifiant d'athlete.");
    if (!tokens.access_token) throw new Error("Reponse Strava sans access_token.");
    if (!tokens.refresh_token) throw new Error("Reponse Strava sans refresh_token.");

    const { error } = await this.supabase.from("provider_connections").upsert(
      {
        user_id: userId,
        provider: "strava",
        provider_user_id: stravaId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: getTokenExpiresAt(tokens),
        scopes: parseScopes(tokens.scope),
        profile: athleteToProfile(athlete),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

    if (error) {
      throw new InternalServerErrorException(
        `Impossible d'enregistrer la connexion Strava: ${formatProviderTableError(error.message)}`,
      );
    }
  }

  private async findUserByProviderConnection(
    stravaId: string,
  ): Promise<{ id: string; email: string } | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from("provider_connections")
      .select("user_id")
      .eq("provider", "strava")
      .eq("provider_user_id", stravaId)
      .maybeSingle();

    if (error) {
      if (isMissingProviderConnectionsTable(error.message)) return null;
      throw new InternalServerErrorException(
        `Impossible de retrouver la connexion Strava: ${error.message}`,
      );
    }

    const userId = stringValue((data as { user_id?: unknown } | null)?.user_id);
    if (!userId) return null;

    const user = await this.supabase.auth.admin.getUserById(userId);
    const email = user.data.user?.email;
    if (user.error || !email) {
      throw new Error(user.error?.message ?? "Utilisateur lie a Strava sans email Supabase.");
    }

    return { id: userId, email };
  }

  private async generateMagicLinkToken(email: string): Promise<string> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const link = await this.supabase.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error(link.error?.message ?? "Generation du lien de session Supabase echouee.");
    }

    return link.data.properties.hashed_token;
  }

  private async getStoredConnection(userId: string): Promise<StravaConnectionRow | null> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const { data, error } = await this.supabase
      .from("provider_connections")
      .select(
        "user_id, provider_user_id, access_token, refresh_token, expires_at, scopes, profile, stats, last_sync_at, created_at, updated_at",
      )
      .eq("user_id", userId)
      .eq("provider", "strava")
      .maybeSingle();

    if (error) {
      if (isMissingProviderConnectionsTable(error.message)) return null;
      throw new InternalServerErrorException(
        `Impossible de lire la connexion Strava: ${error.message}`,
      );
    }

    return (data as StravaConnectionRow | null) ?? null;
  }

  private async getFreshAccessToken(connection: StravaConnectionRow): Promise<string> {
    if (!connection.access_token) throw new Error("Connexion Strava sans access_token.");
    if (!connection.refresh_token) throw new Error("Connexion Strava sans refresh_token.");

    const expiresAt = connection.expires_at ? Date.parse(connection.expires_at) : 0;
    const refreshWindowMs = 60 * 60 * 1000;
    if (Number.isFinite(expiresAt) && expiresAt - Date.now() > refreshWindowMs) {
      return connection.access_token;
    }

    const tokens = await this.refreshAccessToken(connection.refresh_token);
    if (!tokens.access_token) throw new Error("Rafraichissement Strava sans access_token.");
    if (!tokens.refresh_token) throw new Error("Rafraichissement Strava sans refresh_token.");

    if (this.supabase) {
      const { error } = await this.supabase
        .from("provider_connections")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: getTokenExpiresAt(tokens),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", connection.user_id)
        .eq("provider", "strava");

      if (error) {
        throw new InternalServerErrorException(
          `Impossible de mettre a jour le token Strava: ${error.message}`,
        );
      }
    }

    return tokens.access_token;
  }

  private async refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
    const clientId = this.requireEnv("STRAVA_CLIENT_ID");
    const clientSecret = this.requireEnv("STRAVA_CLIENT_SECRET");
    const tokenUrl = process.env.STRAVA_TOKEN_URL ?? DEFAULT_TOKEN_URL;

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Rafraichissement Strava echoue (${response.status}). ${detail}`.trim());
    }

    return (await response.json()) as StravaTokens;
  }

  private async fetchAthleteStats(
    accessToken: string,
    athleteId: string,
  ): Promise<StravaAthleteStats | null> {
    const statsUrl = new URL(
      process.env.STRAVA_STATS_URL ??
        `${(process.env.STRAVA_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "")}/athletes/${encodeURIComponent(
          athleteId,
        )}/stats`,
    );

    const response = await fetch(statsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;
    return (await response.json()) as StravaAthleteStats;
  }

  private async fetchRecentActivities(accessToken: string): Promise<StravaActivity[]> {
    const activitiesUrl = new URL(
      process.env.STRAVA_ACTIVITIES_URL ??
        `${(process.env.STRAVA_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "")}/athlete/activities`,
    );
    activitiesUrl.searchParams.set("page", "1");
    activitiesUrl.searchParams.set("per_page", process.env.STRAVA_ACTIVITIES_PER_PAGE ?? "30");

    const days = Number(process.env.STRAVA_PROFILE_DAYS ?? "365");
    if (Number.isFinite(days) && days > 0) {
      activitiesUrl.searchParams.set(
        "after",
        String(Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000)),
      );
    }

    const response = await fetch(activitiesUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Recuperation des activites Strava echouee (${response.status}). ${detail}`.trim());
    }

    return (await response.json()) as StravaActivity[];
  }

  private async persistProfileSync(
    userId: string,
    athlete: StravaAthlete,
    summary: StravaProfileSummary,
  ): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase
      .from("provider_connections")
      .update({
        provider_user_id: summary.athlete.id,
        profile: athleteToProfile(athlete),
        stats: {
          totals: summary.totals,
          recentActivities: summary.recentActivities,
          fetchedAt: summary.lastSyncAt,
        },
        last_sync_at: summary.lastSyncAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "strava");

    if (error) {
      throw new InternalServerErrorException(
        `Impossible de persister la synchro Strava: ${error.message}`,
      );
    }
  }

  private async updateRiderTotals(userId: string, summary: StravaProfileSummary): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase
      .from("riders")
      .update({
        total_km: Math.round(summary.totals.allRideKm),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error && !/riders|relation .* does not exist|Could not find the table/i.test(error.message)) {
      throw new InternalServerErrorException(
        `Impossible de mettre a jour le rider Strava: ${error.message}`,
      );
    }
  }

  private connectionToSummary(connection: StravaConnectionRow): StravaProfileSummary {
    const profile = connection.profile ?? {};
    const stats = connection.stats ?? {};
    const totals = objectValue(stats.totals);
    const recentActivities = Array.isArray(stats.recentActivities)
      ? stats.recentActivities
      : [];

    return {
      connected: true,
      athlete: {
        id: stringValue(profile.id) ?? connection.provider_user_id,
        username: stringValue(profile.username) ?? null,
        firstname: stringValue(profile.firstname) ?? null,
        lastname: stringValue(profile.lastname) ?? null,
        profile: stringValue(profile.profile) ?? null,
        profileMedium: stringValue(profile.profileMedium) ?? null,
        city: stringValue(profile.city) ?? null,
        country: stringValue(profile.country) ?? null,
      },
      totals: {
        allRideKm: numberValue(totals.allRideKm) ?? 0,
        allRideCount: numberValue(totals.allRideCount) ?? 0,
        allRideElevationM: numberValue(totals.allRideElevationM) ?? 0,
        recentRideKm: numberValue(totals.recentRideKm) ?? 0,
        recentRideCount: numberValue(totals.recentRideCount) ?? 0,
        recentRideElevationM: numberValue(totals.recentRideElevationM) ?? 0,
        recentAverageSpeedKmh: numberValue(totals.recentAverageSpeedKmh) ?? null,
      },
      recentActivities: recentActivities
        .map((activity) => objectValue(activity))
        .map((activity) => {
          const sportType = stringValue(activity.sportType) ?? "Ride";
          return {
            id: stringValue(activity.id) ?? "",
            name: stringValue(activity.name) ?? "Sortie Strava",
            distanceKm: numberValue(activity.distanceKm) ?? 0,
            elevationM: numberValue(activity.elevationM) ?? 0,
            movingTimeSeconds: numberValue(activity.movingTimeSeconds) ?? 0,
            sportType,
            startDate: stringValue(activity.startDate) ?? null,
            polyline: stringValue(activity.polyline) ?? null,
            averageSpeedKmh: numberValue(activity.averageSpeedKmh) ?? null,
            bikeBucket: isBikeBucket(activity.bikeBucket) ? activity.bikeBucket : classifyBikeBucket(sportType),
            ebike: typeof activity.ebike === "boolean" ? activity.ebike : isEbike(sportType),
          };
        })
        .filter((activity) => activity.id),
      scopes: connection.scopes ?? [],
      lastSyncAt: connection.last_sync_at ?? stringValue(stats.fetchedAt) ?? null,
    };
  }

  private shouldRefresh(lastSyncAt: string | null): boolean {
    if (!lastSyncAt) return true;
    const syncedAt = Date.parse(lastSyncAt);
    if (!Number.isFinite(syncedAt)) return true;
    const cacheSeconds = Number(process.env.STRAVA_PROFILE_CACHE_SECONDS ?? "300");
    return Date.now() - syncedAt > cacheSeconds * 1000;
  }

  /** redirect_uri enregistre chez Strava et utilise tel quel a l'echange. */
  private getRedirectUri(): string {
    const explicit = process.env.STRAVA_REDIRECT_URI?.trim();
    if (explicit) return explicit;

    const port = process.env.PORT ?? "3001";
    const base = (process.env.API_PUBLIC_URL?.trim() ?? `http://localhost:${port}`).replace(/\/+$/, "");
    return `${base}/api/auth/strava/callback`;
  }

  private requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new InternalServerErrorException(
        `Variable d'environnement ${name} manquante. Renseigne les identifiants Strava (API application).`,
      );
    }
    return value;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [state, entry] of this.pending) {
      if (entry.expiresAt < now) this.pending.delete(state);
    }
  }
}

function base64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function isAlreadyRegistered(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "email_exists") return true;
  return /already.*registered|already been registered|email_exists/i.test(error.message ?? "");
}

function buildProfileSummary(params: {
  athlete: StravaAthlete;
  stats: StravaAthleteStats | null;
  activities: StravaActivity[];
  scopes: string[];
  lastSyncAt: string;
}): StravaProfileSummary {
  const rideActivities = params.activities.filter(isRideActivity);
  const activityDistanceM = sum(rideActivities.map((activity) => activity.distance));
  const activityMovingTime = sum(rideActivities.map((activity) => activity.moving_time));
  const activityElevation = sum(rideActivities.map((activity) => activity.total_elevation_gain));
  const allRideTotals = params.stats?.all_ride_totals;
  const recentRideTotals = params.stats?.recent_ride_totals;
  const recentDistanceM = recentRideTotals?.distance ?? activityDistanceM;
  const recentMovingTime = recentRideTotals?.moving_time ?? activityMovingTime;

  return {
    connected: true,
    athlete: {
      id: stringifyId(params.athlete.id),
      username: params.athlete.username ?? null,
      firstname: params.athlete.firstname ?? null,
      lastname: params.athlete.lastname ?? null,
      profile: params.athlete.profile ?? null,
      profileMedium: params.athlete.profile_medium ?? null,
      city: params.athlete.city ?? null,
      country: params.athlete.country ?? null,
    },
    totals: {
      allRideKm: kmFromMeters(allRideTotals?.distance ?? activityDistanceM),
      allRideCount: allRideTotals?.count ?? rideActivities.length,
      allRideElevationM: Math.round(allRideTotals?.elevation_gain ?? activityElevation),
      recentRideKm: kmFromMeters(recentDistanceM),
      recentRideCount: recentRideTotals?.count ?? rideActivities.length,
      recentRideElevationM: Math.round(recentRideTotals?.elevation_gain ?? activityElevation),
      recentAverageSpeedKmh:
        recentMovingTime > 0 ? roundOne((recentDistanceM / recentMovingTime) * 3.6) : null,
    },
    recentActivities: rideActivities.slice(0, 20).map((activity) => {
      const sportType = activity.sport_type ?? activity.type ?? "Ride";
      return {
        id: stringifyId(activity.id) ?? randomActivityId(activity),
        name: activity.name?.trim() || "Sortie Strava",
        distanceKm: kmFromMeters(activity.distance ?? 0),
        elevationM: Math.round(activity.total_elevation_gain ?? 0),
        movingTimeSeconds: Math.round(activity.moving_time ?? 0),
        sportType,
        startDate: activity.start_date ?? null,
        polyline: activity.map?.summary_polyline ?? null,
        averageSpeedKmh:
          typeof activity.average_speed === "number" ? roundOne(activity.average_speed * 3.6) : null,
        bikeBucket: classifyBikeBucket(sportType),
        ebike: isEbike(sportType),
      };
    }),
    scopes: params.scopes,
    lastSyncAt: params.lastSyncAt,
  };
}

function athleteToProfile(athlete: StravaAthlete): Record<string, unknown> {
  return {
    id: stringifyId(athlete.id),
    username: athlete.username ?? null,
    firstname: athlete.firstname ?? null,
    lastname: athlete.lastname ?? null,
    profile: athlete.profile ?? null,
    profileMedium: athlete.profile_medium ?? null,
    city: athlete.city ?? null,
    country: athlete.country ?? null,
  };
}

function parseScopes(scope?: string): string[] {
  const raw = scope?.trim() || DEFAULT_SCOPES;
  return raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTokenExpiresAt(tokens: StravaTokens): string | null {
  if (tokens.expires_at) return new Date(tokens.expires_at * 1000).toISOString();
  if (tokens.expires_in) return new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  return null;
}

function isRideActivity(activity: StravaActivity): boolean {
  const sport = `${activity.sport_type ?? ""} ${activity.type ?? ""}`.toLowerCase();
  return /ride|bike|cycling|handcycle|velomobile/.test(sport);
}

export type BikeBucket = "road" | "gravel" | "mtb";

const BIKE_BUCKETS: BikeBucket[] = ["road", "gravel", "mtb"];

function isBikeBucket(value: unknown): value is BikeBucket {
  return typeof value === "string" && (BIKE_BUCKETS as string[]).includes(value);
}

/** Deduit la pratique (route/gravel/VTT) du sport_type Strava (cf. enum SportType de l'API v3). */
function classifyBikeBucket(sportType: string): BikeBucket {
  const sport = sportType.toLowerCase();
  if (sport.includes("mountainbike")) return "mtb";
  if (sport.includes("gravel")) return "gravel";
  return "road";
}

function isEbike(sportType: string): boolean {
  return sportType.toLowerCase().includes("ebike");
}

function kmFromMeters(value: number): number {
  return roundOne(value / 1000);
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function sum(values: Array<number | undefined>): number {
  return values.reduce<number>(
    (total, value) => total + (typeof value === "number" ? value : 0),
    0,
  );
}

function stringifyId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function randomActivityId(activity: StravaActivity): string {
  return `${activity.start_date ?? "activity"}-${activity.name ?? "strava"}`;
}

function isMissingProviderConnectionsTable(message: string): boolean {
  return /provider_connections|relation .* does not exist|Could not find the table/i.test(message);
}

function formatProviderTableError(message: string): string {
  if (isMissingProviderConnectionsTable(message)) {
    return `${message}. Execute supabase/riders.sql pour creer public.provider_connections.`;
  }
  return message;
}
