import { Controller, Get, Headers, Post, Query, Res } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";
import { AuthService, type SafeProviderConnection } from "./auth.service";
import { GarminService } from "./garmin.service";
import { StravaService } from "./strava.service";

// Reponse Express minimaliste (evite la dependance @types/express).
interface RedirectResponse {
  redirect(url: string): void;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly garminService: GarminService,
    private readonly stravaService: StravaService,
  ) {}

  @Get("me")
  async me(@Headers("authorization") authorization?: string) {
    const user = await this.authService.getUserFromAuthorization(authorization);

    return {
      id: user.id,
      email: user.email,
      provider: user.app_metadata.provider,
      providers: user.app_metadata.providers,
      createdAt: user.created_at,
    };
  }

  @Post("sync")
  async sync(@Headers("authorization") authorization?: string) {
    return this.authService.syncRiderFromAuthorization(authorization);
  }

  @Get("profile")
  async profile(
    @Headers("authorization") authorization?: string,
    @Query("refresh") refresh?: string,
  ) {
    const user = await this.authService.getUserFromAuthorization(authorization);
    const rider = await this.authService.syncRider(user);
    const strava = await this.stravaService.getProfile(user.id, isTruthy(refresh));
    const connections = await this.authService.getProviderConnections(user.id);

    if (strava) {
      rider.total_km = Math.round(strava.totals.allRideKm);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      rider,
      providers: buildProviderSummaries(user, connections, Boolean(strava)),
      strava,
    };
  }

  // Demarre le flux Garmin OAuth 2.0 (PKCE). Le mobile passe son deep link de
  // retour et recoit l'URL d'autorisation Garmin a ouvrir dans le navigateur.
  @Get("garmin/start")
  async start(
    @Query("mobile_redirect_to") mobileRedirectTo: string,
    @Headers("authorization") authorization?: string,
  ) {
    const user = await this.authService.getOptionalUserFromAuthorization(authorization);
    return { authorizeUrl: this.garminService.buildAuthorizeUrl(mobileRedirectTo, user?.id) };
  }

  // Callback appele par Garmin apres consentement. On finalise puis on redirige
  // le navigateur vers le deep link mobile (avec le token de session, ou l'erreur).
  @Get("garmin/callback")
  async callback(
    @Res() res: RedirectResponse,
    @Query("code") code?: string,
    @Query("state") state?: string,
    @Query("error") error?: string,
    @Query("error_description") errorDescription?: string,
  ): Promise<void> {
    const result = await this.garminService.completeCallback({
      code,
      state,
      error,
      errorDescription,
    });

    if (!("mobileRedirectTo" in result)) {
      // Etat inconnu : impossible de retrouver le deep link mobile.
      res.redirect(`data:text/plain,${encodeURIComponent(result.error)}`);
      return;
    }

    const target = new URL(result.mobileRedirectTo);
    if ("linked" in result) {
      target.searchParams.set("garmin", "1");
      target.searchParams.set("linked", "1");
    } else if ("tokenHash" in result) {
      target.searchParams.set("garmin", "1");
      target.searchParams.set("token_hash", result.tokenHash);
      target.searchParams.set("type", result.type);
    } else {
      target.searchParams.set("garmin", "1");
      target.searchParams.set("error_description", result.error);
    }

    res.redirect(target.toString());
  }

  // Demarre le flux Strava OAuth 2.0. Strava n'etant pas un provider OIDC (pas
  // d'id_token/JWKS), on ne peut pas passer par Supabase : flux backend dedie,
  // comme Garmin. Le client passe sa destination de retour (web /auth/callback
  // ou deep link mobile) et recoit l'URL d'autorisation Strava a ouvrir.
  @Get("strava/start")
  async stravaStart(
    @Query("redirect_to") redirectTo: string,
    @Headers("authorization") authorization?: string,
  ) {
    const user = await this.authService.getOptionalUserFromAuthorization(authorization);
    return { authorizeUrl: this.stravaService.buildAuthorizeUrl(redirectTo, user?.id) };
  }

  // Callback appele par Strava apres consentement. On finalise puis on redirige
  // le navigateur vers la destination (avec le token de session, ou l'erreur).
  @Get("strava/callback")
  async stravaCallback(
    @Res() res: RedirectResponse,
    @Query("code") code?: string,
    @Query("state") state?: string,
    @Query("error") error?: string,
  ): Promise<void> {
    const result = await this.stravaService.completeCallback({ code, state, error });

    if (!("redirectTo" in result)) {
      // Etat inconnu : impossible de retrouver la destination de retour.
      res.redirect(`data:text/plain,${encodeURIComponent(result.error)}`);
      return;
    }

    const target = new URL(result.redirectTo);
    target.searchParams.set("strava", "1");
    if ("linked" in result) {
      target.searchParams.set("linked", "1");
    } else if ("tokenHash" in result) {
      target.searchParams.set("token_hash", result.tokenHash);
      target.searchParams.set("type", result.type);
    } else {
      target.searchParams.set("error_description", result.error);
    }

    res.redirect(target.toString());
  }
}

function buildProviderSummaries(
  user: User,
  connections: SafeProviderConnection[],
  hasStravaProfile: boolean,
) {
  const connectionByProvider = new Map(connections.map((connection) => [connection.provider, connection]));
  const providers = new Set<string>();

  for (const identity of user.identities ?? []) {
    const provider = identity.provider.toLowerCase();
    providers.add(provider);
    if (provider.includes("strava")) providers.add("strava");
    if (provider.includes("garmin")) providers.add("garmin");
  }

  const appProvider = user.app_metadata?.provider;
  if (typeof appProvider === "string") providers.add(appProvider.toLowerCase());

  const appProviders = user.app_metadata?.providers;
  if (Array.isArray(appProviders)) {
    for (const provider of appProviders) {
      if (typeof provider === "string") providers.add(provider.toLowerCase());
    }
  }

  for (const connection of connections) {
    providers.add(connection.provider);
  }
  if (hasStravaProfile) providers.add("strava");

  return ["strava", "garmin", "google"].map((id) => {
    const connection = connectionByProvider.get(id);
    return {
      id,
      connected: providers.has(id),
      providerUserId: connection?.providerUserId ?? null,
      scopes: connection?.scopes ?? [],
      linkedAt: connection?.createdAt ?? null,
      lastSyncAt: connection?.lastSyncAt ?? null,
    };
  });
}

function isTruthy(value?: string): boolean {
  return value === "1" || value === "true" || value === "yes";
}
