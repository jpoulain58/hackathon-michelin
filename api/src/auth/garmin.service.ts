import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import {
  createClient,
  type SupabaseClient,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

// Endpoints OAuth 2.0 (PKCE) du Garmin Connect Developer Program.
// Surchargeables via env si Garmin fait evoluer ses URLs.
const DEFAULT_AUTHORIZE_URL = "https://connect.garmin.com/oauth2Confirm";
const DEFAULT_TOKEN_URL = "https://diauth.garmin.com/di-oauth2-service/oauth/token";
const DEFAULT_USER_API_URL = "https://apis.garmin.com/wellness-api/rest/user/id";

// Etat OAuth conserve entre /start et /callback. En memoire : suffisant pour une
// instance unique (hackathon). Pour scaler, deplacer vers Redis/Postgres.
type PendingAuth = {
  codeVerifier: string;
  mobileRedirectTo: string;
  expiresAt: number;
};

type GarminTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export type GarminSessionTicket = {
  mobileRedirectTo: string;
  tokenHash: string;
  type: "magiclink";
};

const STATE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class GarminService {
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

  /** Construit l'URL d'autorisation Garmin et memorise le PKCE pour le callback. */
  buildAuthorizeUrl(mobileRedirectTo: string): string {
    if (!mobileRedirectTo) {
      throw new BadRequestException("Parametre mobile_redirect_to manquant.");
    }

    const clientId = this.requireEnv("GARMIN_CLIENT_ID");
    const codeVerifier = base64Url(randomBytes(32));
    const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());
    const state = base64Url(randomBytes(16));

    this.cleanupExpired();
    this.pending.set(state, {
      codeVerifier,
      mobileRedirectTo,
      expiresAt: Date.now() + STATE_TTL_MS,
    });

    const authorizeUrl = new URL(process.env.GARMIN_AUTHORIZE_URL ?? DEFAULT_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    authorizeUrl.searchParams.set("redirect_uri", this.getRedirectUri());
    authorizeUrl.searchParams.set("state", state);

    return authorizeUrl.toString();
  }

  /**
   * Finalise le callback Garmin : echange le code, recupere l'utilisateur Garmin,
   * provisionne l'utilisateur Supabase et renvoie un ticket magiclink a verifier
   * cote mobile. Le redirect mobile est toujours retourne, meme en erreur, pour
   * que l'app puisse afficher un message plutot que de rester bloquee.
   */
  async completeCallback(params: {
    code?: string;
    state?: string;
    error?: string;
    errorDescription?: string;
  }): Promise<GarminSessionTicket | { mobileRedirectTo: string; error: string } | { error: string }> {
    const pending = params.state ? this.pending.get(params.state) : undefined;
    if (params.state) this.pending.delete(params.state);

    if (!pending || pending.expiresAt < Date.now()) {
      return { error: "Etat OAuth Garmin invalide ou expire. Relance la connexion." };
    }

    const mobileRedirectTo = pending.mobileRedirectTo;

    const callbackError = params.errorDescription ?? params.error;
    if (callbackError) {
      return { mobileRedirectTo, error: callbackError };
    }
    if (!params.code) {
      return { mobileRedirectTo, error: "Code d'autorisation Garmin manquant." };
    }

    try {
      const tokens = await this.exchangeCode(params.code, pending.codeVerifier);
      const garminUserId = await this.fetchGarminUserId(tokens.access_token);
      const tokenHash = await this.provisionSupabaseUser(garminUserId);
      return { mobileRedirectTo, tokenHash, type: "magiclink" };
    } catch (error) {
      return {
        mobileRedirectTo,
        error: error instanceof Error ? error.message : "Connexion Garmin impossible.",
      };
    }
  }

  private async exchangeCode(code: string, codeVerifier: string): Promise<GarminTokens> {
    const clientId = this.requireEnv("GARMIN_CLIENT_ID");
    const clientSecret = this.requireEnv("GARMIN_CLIENT_SECRET");
    const tokenUrl = process.env.GARMIN_TOKEN_URL ?? DEFAULT_TOKEN_URL;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      redirect_uri: this.getRedirectUri(),
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Echange de token Garmin echoue (${response.status}). ${detail}`.trim());
    }

    const tokens = (await response.json()) as GarminTokens;
    if (!tokens.access_token) {
      throw new Error("Reponse Garmin sans access_token.");
    }
    return tokens;
  }

  private async fetchGarminUserId(accessToken: string): Promise<string> {
    const userApiUrl = process.env.GARMIN_USER_API_URL ?? DEFAULT_USER_API_URL;

    const response = await fetch(userApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Recuperation de l'utilisateur Garmin echouee (${response.status}). ${detail}`.trim());
    }

    const data = (await response.json()) as { userId?: string };
    if (!data.userId) {
      throw new Error("Reponse Garmin sans userId.");
    }
    return data.userId;
  }

  /**
   * Cree (ou met a jour) l'utilisateur Supabase associe au compte Garmin et
   * renvoie un token_hash magiclink que le mobile echangera contre une session.
   */
  private async provisionSupabaseUser(garminUserId: string): Promise<string> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    // Garmin ne fournit pas d'email : on derive un email stable et deterministe.
    const email = `garmin_${garminUserId}@users.trustwheels.app`.toLowerCase();
    const appMetadata = { provider: "garmin", providers: ["garmin"] };
    const userMetadata = {
      provider: "garmin",
      garmin_id: garminUserId,
      full_name: "Rider Garmin",
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
        throw new Error(lookup.error?.message ?? "Utilisateur Garmin introuvable cote Supabase.");
      }
      userId = lookup.data.user.id;
      await this.supabase.auth.admin.updateUserById(userId, {
        app_metadata: appMetadata,
        user_metadata: userMetadata,
      });
    }

    // Genere le token final apres que les metadonnees soient a jour.
    const link = await this.supabase.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error(link.error?.message ?? "Generation du lien de session Supabase echouee.");
    }

    return link.data.properties.hashed_token;
  }

  /** redirect_uri enregistre chez Garmin et utilise tel quel a l'echange. */
  private getRedirectUri(): string {
    const explicit = process.env.GARMIN_REDIRECT_URI?.trim();
    if (explicit) return explicit;

    const port = process.env.PORT ?? "3001";
    const base = (process.env.API_PUBLIC_URL?.trim() ?? `http://localhost:${port}`).replace(/\/+$/, "");
    return `${base}/api/auth/garmin/callback`;
  }

  private requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new InternalServerErrorException(
        `Variable d'environnement ${name} manquante. Renseigne les identifiants Garmin Developer.`,
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
