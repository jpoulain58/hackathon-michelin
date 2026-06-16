import { Controller, Get, Headers, Post, Query, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
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

  // Demarre le flux Garmin OAuth 2.0 (PKCE). Le mobile passe son deep link de
  // retour et recoit l'URL d'autorisation Garmin a ouvrir dans le navigateur.
  @Get("garmin/start")
  start(@Query("mobile_redirect_to") mobileRedirectTo: string) {
    return { authorizeUrl: this.garminService.buildAuthorizeUrl(mobileRedirectTo) };
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
    if ("tokenHash" in result) {
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
  stravaStart(@Query("redirect_to") redirectTo: string) {
    return { authorizeUrl: this.stravaService.buildAuthorizeUrl(redirectTo) };
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
    if ("tokenHash" in result) {
      target.searchParams.set("token_hash", result.tokenHash);
      target.searchParams.set("type", result.type);
    } else {
      target.searchParams.set("error_description", result.error);
    }

    res.redirect(target.toString());
  }
}
