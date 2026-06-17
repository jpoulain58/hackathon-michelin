import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Provider, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { API_BASE } from "./api";

WebBrowser.maybeCompleteAuthSession();

export type AuthProviderId = "strava" | "google" | "garmin";

export const authProviders: Array<{
  id: AuthProviderId;
  label: string;
  provider: Provider;
}> = [
  { id: "strava", label: "Se connecter avec Strava", provider: "custom:strava" as Provider },
  { id: "google", label: "Se connecter avec Google", provider: "google" },
  { id: "garmin", label: "Se connecter avec Garmin", provider: "custom:garmin" as Provider },
];

function getMobileRedirectTo(): string {
  const redirectTo = Linking.createURL("auth/callback");
  console.info("Mobile auth return URL:", redirectTo);
  return redirectTo;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getWebAuthCallbackBase(): string {
  const configuredCallback = process.env.EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL?.trim();
  if (configuredCallback) return configuredCallback;

  const configuredWebUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (configuredWebUrl) return `${trimTrailingSlash(configuredWebUrl)}/auth/callback`;

  const apiBase = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      url.port = "3000";
      url.pathname = "/auth/callback";
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      // Fallback below keeps local development usable when the env is malformed.
    }
  }

  return "http://localhost:3000/auth/callback";
}

function getWebPasswordResetUrl(): string {
  const url = new URL(getWebAuthCallbackBase());
  url.pathname = "/auth/update-password";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function getSupabaseRedirectTo(mobileRedirectTo: string): string {
  const redirectTo = new URL(getWebAuthCallbackBase());
  redirectTo.searchParams.set("mobile_redirect_to", mobileRedirectTo);
  console.info("Supabase OAuth bridge URL:", redirectTo.toString());
  return redirectTo.toString();
}

function assertMobileCallback(url: string, redirectTo: string): void {
  if (url.startsWith(redirectTo)) return;

  throw new Error(
    `Callback mobile non autorise. Le navigateur a termine sur ${url} au lieu de ${redirectTo}. Verifie EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL et le callback /auth/callback.`,
  );
}

export async function signInWithProvider(providerId: AuthProviderId): Promise<Session | null> {
  if (!supabase) throw new Error("Configuration Supabase manquante.");

  // Garmin et Strava ne sont pas des providers Supabase natifs : flux OAuth 2.0
  // dedies pilotes par le backend NestJS.
  if (providerId === "garmin") {
    return signInWithGarmin();
  }
  if (providerId === "strava") {
    return signInWithStrava();
  }

  const provider = authProviders.find((item) => item.id === providerId);
  if (!provider) throw new Error("Provider inconnu.");

  const mobileRedirectTo = getMobileRedirectTo();
  const redirectTo = getSupabaseRedirectTo(mobileRedirectTo);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("URL OAuth Supabase introuvable.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, mobileRedirectTo);
  if (result.type !== "success") return null;
  assertMobileCallback(result.url, mobileRedirectTo);

  const callbackUrl = new URL(result.url);
  const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
  const callbackError =
    callbackUrl.searchParams.get("error_description") ??
    hashParams.get("error_description") ??
    callbackUrl.searchParams.get("error") ??
    hashParams.get("error");
  if (callbackError) throw new Error(callbackError);

  const code = callbackUrl.searchParams.get("code");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (code) {
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return sessionData.session;
  }

  if (accessToken && refreshToken) {
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
    return sessionData.session;
  }

  throw new Error("Callback OAuth sans session Supabase.");
}

async function signInWithStrava(): Promise<Session | null> {
  if (!supabase) throw new Error("Configuration Supabase manquante.");

  const mobileRedirectTo = getMobileRedirectTo();

  // 1. Le backend genere l'URL d'autorisation Strava et memorise la destination.
  const startUrl = `${API_BASE}/api/auth/strava/start?redirect_to=${encodeURIComponent(
    mobileRedirectTo,
  )}`;
  const startResponse = await fetch(startUrl);
  if (!startResponse.ok) {
    const body = (await startResponse.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Demarrage Strava impossible (${startResponse.status}).`);
  }
  const { authorizeUrl } = (await startResponse.json()) as { authorizeUrl?: string };
  if (!authorizeUrl) throw new Error("URL d'autorisation Strava introuvable.");

  // 2. Ouvre le consentement Strava ; le backend redirige vers notre deep link.
  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, mobileRedirectTo);
  if (result.type !== "success") return null;
  assertMobileCallback(result.url, mobileRedirectTo);

  const callbackUrl = new URL(result.url);
  const callbackError =
    callbackUrl.searchParams.get("error_description") ?? callbackUrl.searchParams.get("error");
  if (callbackError) throw new Error(callbackError);

  // 3. Echange le token_hash magiclink contre une vraie session Supabase.
  const tokenHash = callbackUrl.searchParams.get("token_hash");
  if (!tokenHash) throw new Error("Callback Strava sans token de session.");

  const { data, error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (error) throw error;
  return data.session;
}

async function signInWithGarmin(): Promise<Session | null> {
  if (!supabase) throw new Error("Configuration Supabase manquante.");

  const mobileRedirectTo = getMobileRedirectTo();

  // 1. Le backend genere le PKCE + l'URL d'autorisation Garmin.
  const startUrl = `${API_BASE}/api/auth/garmin/start?mobile_redirect_to=${encodeURIComponent(
    mobileRedirectTo,
  )}`;
  const startResponse = await fetch(startUrl);
  if (!startResponse.ok) {
    const body = (await startResponse.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Demarrage Garmin impossible (${startResponse.status}).`);
  }
  const { authorizeUrl } = (await startResponse.json()) as { authorizeUrl?: string };
  if (!authorizeUrl) throw new Error("URL d'autorisation Garmin introuvable.");

  // 2. Ouvre le consentement Garmin ; le backend redirige vers notre deep link.
  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, mobileRedirectTo);
  if (result.type !== "success") return null;
  assertMobileCallback(result.url, mobileRedirectTo);

  const callbackUrl = new URL(result.url);
  const callbackError =
    callbackUrl.searchParams.get("error_description") ?? callbackUrl.searchParams.get("error");
  if (callbackError) throw new Error(callbackError);

  // 3. Echange le token_hash magiclink contre une vraie session Supabase.
  const tokenHash = callbackUrl.searchParams.get("token_hash");
  if (!tokenHash) throw new Error("Callback Garmin sans token de session.");

  const { data, error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email: string): Promise<void> {
  if (!supabase) throw new Error("Configuration Supabase manquante.");

  const redirectTo = getMobileRedirectTo();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) throw error;
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<Session | null> {
  if (!supabase) throw new Error("Configuration Supabase manquante.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session;
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!supabase) throw new Error("Configuration Supabase manquante.");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getWebPasswordResetUrl(),
  });

  if (error) throw error;
}
