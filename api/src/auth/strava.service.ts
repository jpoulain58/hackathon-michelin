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
// Liste separee par des virgules (format Strava). `read` suffit pour le profil ;
// `activity:read_all` sert a analyser les sorties.
const DEFAULT_SCOPES = "read,activity:read_all";

// Etat OAuth conserve entre /start et /callback. En memoire : suffisant pour une
// instance unique (hackathon). Pour scaler, deplacer vers Redis/Postgres.
type PendingAuth = {
  redirectTo: string;
  expiresAt: number;
};

type StravaAthlete = {
  id?: number | string;
  username?: string;
  firstname?: string;
  lastname?: string;
};

type StravaTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  athlete?: StravaAthlete;
};

export type StravaSessionTicket = {
  redirectTo: string;
  tokenHash: string;
  type: "magiclink";
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
  buildAuthorizeUrl(redirectTo: string): string {
    if (!redirectTo) {
      throw new BadRequestException("Parametre redirect_to manquant.");
    }

    const clientId = this.requireEnv("STRAVA_CLIENT_ID");
    const state = base64Url(randomBytes(16));

    this.cleanupExpired();
    this.pending.set(state, {
      redirectTo,
      expiresAt: Date.now() + STATE_TTL_MS,
    });

    const authorizeUrl = new URL(process.env.STRAVA_AUTHORIZE_URL ?? DEFAULT_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", this.getRedirectUri());
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("approval_prompt", "auto");
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
  }): Promise<StravaSessionTicket | { redirectTo: string; error: string } | { error: string }> {
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
  private async provisionSupabaseUser(
    athlete: StravaAthlete,
    tokens: StravaTokens,
  ): Promise<string> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const stravaId = athlete.id != null ? String(athlete.id) : null;
    if (!stravaId) {
      throw new Error("Reponse Strava sans identifiant d'athlete.");
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

    // Persiste les tokens Strava (server-only) pour pouvoir lire les km plus tard.
    // Best-effort : un echec ici ne doit pas casser la connexion.
    await this.storeTokens(userId, athlete, tokens).catch(() => undefined);

    // Genere le token final apres que les metadonnees soient a jour.
    const link = await this.supabase.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error(link.error?.message ?? "Generation du lien de session Supabase echouee.");
    }

    return link.data.properties.hashed_token;
  }

  /** Enregistre (ou met a jour) les tokens Strava du rider dans strava_tokens. */
  private async storeTokens(
    userId: string,
    athlete: StravaAthlete,
    tokens: StravaTokens,
  ): Promise<void> {
    if (!this.supabase || !tokens.access_token || !tokens.refresh_token) return;

    const { error } = await this.supabase.from("strava_tokens").upsert(
      {
        rider_id: userId,
        athlete_id: athlete.id != null ? String(athlete.id) : null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "rider_id" },
    );

    if (error) {
      throw new Error(`Stockage des tokens Strava echoue: ${error.message}`);
    }
  }

  /**
   * Cumul des km parcourus a velo, lu en direct depuis Strava (all_ride_totals).
   * Rafraichit le token si necessaire. `connected: false` si le rider n'a pas de
   * compte Strava lie.
   */
  async getRiderStats(
    userId: string,
  ): Promise<{ connected: boolean; totalKm: number; rideCount: number }> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const { data, error } = await this.supabase
      .from("strava_tokens")
      .select("rider_id, athlete_id, access_token, refresh_token, expires_at")
      .eq("rider_id", userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Lecture des tokens Strava echouee: ${error.message}`);
    }
    if (!data || !data.athlete_id) {
      return { connected: false, totalKm: 0, rideCount: 0 };
    }

    const accessToken = await this.ensureFreshToken(data);
    const statsUrl = `https://www.strava.com/api/v3/athletes/${data.athlete_id}/stats`;
    const response = await fetch(statsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new InternalServerErrorException(
        `Recuperation des stats Strava echouee (${response.status}). ${detail}`.trim(),
      );
    }

    const stats = (await response.json()) as {
      all_ride_totals?: { count?: number; distance?: number };
    };
    const totals = stats.all_ride_totals ?? {};
    return {
      connected: true,
      totalKm: Math.round((totals.distance ?? 0) / 1000),
      rideCount: totals.count ?? 0,
    };
  }

  /** Renvoie un access_token valide, en le rafraichissant via le refresh_token si expire. */
  private async ensureFreshToken(row: {
    rider_id: string;
    access_token: string;
    refresh_token: string;
    expires_at: number | null;
  }): Promise<string> {
    const nowSec = Math.floor(Date.now() / 1000);
    // Marge de 60 s pour eviter d'utiliser un token a la limite de l'expiration.
    if (row.expires_at && row.expires_at > nowSec + 60) {
      return row.access_token;
    }

    const clientId = this.requireEnv("STRAVA_CLIENT_ID");
    const clientSecret = this.requireEnv("STRAVA_CLIENT_SECRET");
    const tokenUrl = process.env.STRAVA_TOKEN_URL ?? DEFAULT_TOKEN_URL;

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new InternalServerErrorException(
        `Rafraichissement du token Strava echoue (${response.status}). ${detail}`.trim(),
      );
    }

    const tokens = (await response.json()) as StravaTokens;
    if (!tokens.access_token) {
      throw new InternalServerErrorException("Rafraichissement Strava sans access_token.");
    }

    await this.supabase!.from("strava_tokens")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? row.refresh_token,
        expires_at: tokens.expires_at ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("rider_id", row.rider_id);

    return tokens.access_token;
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
