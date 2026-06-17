"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { authProviders, type AuthProviderId } from "@/lib/auth/providers";
import { syncRider } from "@/lib/auth/sync";
import { API_BASE } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type LoadingState = AuthProviderId | "email" | "reset" | "signout" | null;

export function AuthPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/accueil");
    return callbackUrl.toString();
  }, []);

  const passwordResetRedirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new URL("/auth/update-password", window.location.origin).toString();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const handleSession = (nextSession: Session | null) => {
      setSession(nextSession);
      syncRider(nextSession).catch((error) => {
        setStatus(error instanceof Error ? error.message : "Synchronisation rider impossible.");
      });
    };

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => handleSession(nextSession));

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithProvider(providerId: AuthProviderId) {
    if (!supabase) return;
    const provider = authProviders.find((item) => item.id === providerId);
    if (!provider) return;

    setStatus(null);
    setLoading(providerId);

    // Strava et Garmin passent par le backend OAuth dedie.
    if (providerId === "strava" || providerId === "garmin") {
      try {
        const callbackUrl = new URL("/auth/callback", window.location.origin);
        callbackUrl.searchParams.set("next", "/accueil");
        const searchParam = providerId === "strava" ? "redirect_to" : "mobile_redirect_to";
        const startUrl = `${API_BASE}/api/auth/${providerId}/start?${searchParam}=${encodeURIComponent(
          callbackUrl.toString(),
        )}`;
        const response = await fetch(startUrl);
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string };
          const providerName = providerId === "strava" ? "Strava" : "Garmin";
          throw new Error(body.message ?? `Demarrage ${providerName} impossible (${response.status}).`);
        }
        const { authorizeUrl } = (await response.json()) as { authorizeUrl?: string };
        const providerName = providerId === "strava" ? "Strava" : "Garmin";
        if (!authorizeUrl) throw new Error(`URL d'autorisation ${providerName} introuvable.`);
        window.location.href = authorizeUrl;
      } catch (error) {
        const providerName = providerId === "strava" ? "Strava" : "Garmin";
        setStatus(error instanceof Error ? error.message : `Connexion ${providerName} impossible.`);
        setLoading(null);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider.supabaseProvider,
      options: { redirectTo },
    });
    if (error) setStatus(error.message);
    setLoading(null);
  }

  async function signInWithEmail(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!supabase || !email.trim() || !password) return;

    setStatus(null);
    setLoading("email");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setStatus(error ? error.message : "Connexion email reussie.");
    setLoading(null);
  }

  async function resetPassword() {
    if (!supabase) return;
    if (!email.trim()) {
      setStatus("Saisis ton email pour recevoir le lien de reinitialisation.");
      return;
    }

    setStatus(null);
    setLoading("reset");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: passwordResetRedirectTo,
    });
    setStatus(error ? error.message : "Email de reinitialisation envoye.");
    setLoading(null);
  }

  async function signOut() {
    if (!supabase) return;
    setLoading("signout");
    await supabase.auth.signOut();
    setLoading(null);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm text-white">
        Configuration Supabase manquante. Renseigne `NEXT_PUBLIC_SUPABASE_URL` et
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
      </div>
    );
  }

  if (session) {
    return (
      <div className="space-y-3 rounded-3xl border border-white/50 bg-white/95 p-6 text-michelin-navy shadow-[0_24px_80px_-38px_rgba(0,12,52,0.85)] backdrop-blur-xl">
        <p className="text-sm font-semibold">
          Connecté en tant que <span className="font-black">{session.user.email ?? "Supabase"}</span>
        </p>
        <Link
          href="/accueil"
          className="flex w-full items-center justify-center rounded-pill bg-michelin-blue px-6 py-3.5 font-semibold text-white transition hover:brightness-95"
        >
          Entrer dans Trust Wheels
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="w-full rounded-pill border border-michelin-gray-line px-6 py-3 text-sm font-semibold transition hover:bg-michelin-gray-light"
        >
          {loading === "signout" ? "Déconnexion..." : "Se déconnecter"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-white/50 bg-white/95 p-6 text-michelin-navy shadow-[0_24px_80px_-38px_rgba(0,12,52,0.85)] backdrop-blur-xl sm:p-7">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">Bienvenue sur Trust Wheels</h2>
        <p className="mt-1.5 text-sm font-medium text-michelin-ink">
          Connecte-toi en un clic pour rejoindre la communauté.
        </p>
      </div>

      <div className="space-y-2.5">
        {authProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => signInWithProvider(provider.id)}
            disabled={loading !== null}
            aria-label={provider.label}
            className={`relative flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-3.5 text-[0.95rem] font-bold transition-[transform,filter,background-color] duration-150 ease-out-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${getProviderClass(
              provider.id,
            )}`}
          >
            {provider.id === "garmin" ? (
              // Garmin = logotype (wordmark), affiché en blanc et centré.
              <img
                src="https://cdn.simpleicons.org/garmin/ffffff"
                alt="Garmin"
                className="h-[18px] w-auto"
              />
            ) : (
              <>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <BrandMark id={provider.id} />
                </span>
                <span>{provider.label}</span>
              </>
            )}
            {loading === provider.id ? (
              <span className="absolute right-5">
                <Spinner id={provider.id} />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-michelin-gray-line" />
        <span className="text-[0.7rem] font-bold uppercase tracking-wider text-michelin-ink/55">
          ou par email
        </span>
        <span className="h-px flex-1 bg-michelin-gray-line" />
      </div>

      {showEmail ? (
        <form onSubmit={signInWithEmail} className="space-y-3">
          <div>
            <label htmlFor="email-auth" className="mb-1 block text-xs font-bold text-michelin-ink">
              Email
            </label>
            <input
              id="email-auth"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@exemple.fr"
              autoComplete="email"
              className="w-full rounded-2xl border border-michelin-gray-line bg-white px-4 py-3 text-sm font-semibold text-michelin-navy outline-none transition-[border-color,box-shadow] duration-150 ease-out-strong placeholder:font-medium placeholder:text-michelin-ink/40 focus:border-michelin-blue focus:ring-2 focus:ring-michelin-blue/20"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password-auth" className="block text-xs font-bold text-michelin-ink">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={resetPassword}
                disabled={loading !== null}
                className="text-xs font-bold text-michelin-blue underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "reset" ? "Envoi..." : "Mot de passe oublié ?"}
              </button>
            </div>
            <input
              id="password-auth"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-michelin-gray-line bg-white px-4 py-3 text-sm font-semibold text-michelin-navy outline-none transition-[border-color,box-shadow] duration-150 ease-out-strong placeholder:text-michelin-ink/40 focus:border-michelin-blue focus:ring-2 focus:ring-michelin-blue/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading !== null || !email.trim() || !password}
            className="w-full rounded-2xl bg-michelin-navy px-4 py-3.5 text-sm font-black text-white shadow-[0_14px_28px_-20px_rgba(0,12,52,0.85)] transition-[transform,filter,opacity] duration-150 ease-out-strong hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "email" ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            setShowEmail(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-michelin-gray-line bg-white px-5 py-3.5 text-[0.95rem] font-bold text-michelin-navy transition-[transform,background-color] duration-150 ease-out-strong hover:bg-michelin-gray-light active:scale-[0.98]"
        >
          <span className="text-lg">@</span>
          Continuer avec un email
        </button>
      )}

      {status ? (
        <p className="mt-4 rounded-xl bg-michelin-gray-light px-3 py-2 text-center text-sm font-semibold text-michelin-navy">
          {status}
        </p>
      ) : null}
    </div>
  );
}

function getProviderClass(id: AuthProviderId) {
  if (id === "strava") {
    return "border-transparent bg-[#FC5200] text-white shadow-[0_14px_30px_-20px_rgba(252,82,0,0.9)] hover:brightness-95";
  }
  if (id === "garmin") {
    return "border-transparent bg-michelin-navy text-white shadow-[0_14px_30px_-22px_rgba(0,12,52,0.9)] hover:brightness-110";
  }
  return "border-michelin-gray-line bg-white text-michelin-navy hover:bg-michelin-gray-light";
}

/** Vrais logos de marque : Google en multicolore (officiel), Strava/Garmin en blanc. */
function BrandMark({ id }: { id: AuthProviderId }) {
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.98 10.98 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    );
  }

  const slug = id === "strava" ? "strava" : "garmin";
  return (
    <img
      src={`https://cdn.simpleicons.org/${slug}/ffffff`}
      alt=""
      aria-hidden="true"
      className="h-5 w-5"
    />
  );
}

function Spinner({ id }: { id: AuthProviderId }) {
  const color = id === "google" ? "border-michelin-navy/30 border-t-michelin-navy" : "border-white/40 border-t-white";
  return <span className={`h-4 w-4 shrink-0 animate-spin rounded-full border-2 ${color}`} aria-hidden="true" />;
}
