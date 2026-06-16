"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { authProviders, type AuthProviderId } from "@/lib/auth/providers";
import { syncRider } from "@/lib/auth/sync";
import { API_BASE } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export function AuthPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<AuthProviderId | "email" | "signout" | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/accueil");
    return callbackUrl.toString();
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

    // Strava n'est pas un provider OIDC : flux OAuth pilote par le backend
    // (comme Garmin) plutot que le custom provider Supabase.
    if (providerId === "strava") {
      try {
        const callbackUrl = new URL("/auth/callback", window.location.origin);
        callbackUrl.searchParams.set("next", "/accueil");
        const startUrl = `${API_BASE}/api/auth/strava/start?redirect_to=${encodeURIComponent(
          callbackUrl.toString(),
        )}`;
        const response = await fetch(startUrl);
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? `Demarrage Strava impossible (${response.status}).`);
        }
        const { authorizeUrl } = (await response.json()) as { authorizeUrl?: string };
        if (!authorizeUrl) throw new Error("URL d'autorisation Strava introuvable.");
        window.location.href = authorizeUrl;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Connexion Strava impossible.");
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

  async function signInWithEmail() {
    if (!supabase || !email.trim()) return;

    setStatus(null);
    setLoading("email");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setStatus(error ? error.message : "Lien de connexion envoye. Verifie ta boite mail.");
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
      <div className="rounded-xl border border-white/30 bg-white/10 p-4 text-sm text-white">
        Configuration Supabase manquante. Renseigne `NEXT_PUBLIC_SUPABASE_URL` et
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
      </div>
    );
  }

  if (session) {
    return (
      <div className="space-y-3 rounded-xl bg-white/95 p-4 text-michelin-navy shadow-sm">
        <p className="text-sm font-semibold">Connecte avec {session.user.email ?? "Supabase"}</p>
        <Link
          href="/accueil"
          className="flex w-full items-center justify-center rounded-pill bg-michelin-blue px-6 py-3.5 font-semibold text-white transition hover:brightness-95"
        >
          Entrer dans Trust Wheels
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="w-full rounded-pill border border-michelin-gray-line px-6 py-3 text-sm font-semibold"
        >
          {loading === "signout" ? "Deconnexion..." : "Se deconnecter"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {authProviders.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => signInWithProvider(provider.id)}
          className={`flex w-full items-center justify-center gap-2 rounded-pill px-6 py-3.5 font-semibold shadow-sm transition ${provider.className}`}
        >
          {provider.id === "strava" ? <StravaGlyph /> : null}
          {loading === provider.id ? "Connexion..." : provider.label}
        </button>
      ))}

      <div className="rounded-xl border border-white/40 bg-white/10 p-3">
        <label htmlFor="email-auth" className="sr-only">
          Email
        </label>
        <div className="flex gap-2">
          <input
            id="email-auth"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemple.fr"
            className="min-w-0 flex-1 rounded-pill border-0 px-4 py-3 text-sm font-medium text-michelin-navy outline-none"
          />
          <button
            type="button"
            onClick={signInWithEmail}
            className="rounded-pill bg-michelin-yellow px-4 py-3 text-sm font-bold text-michelin-navy"
          >
            {loading === "email" ? "..." : "Email"}
          </button>
        </div>
      </div>

      {status ? <p className="text-center text-sm font-medium text-white">{status}</p> : null}
    </div>
  );
}

function StravaGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 6 14h3.6L12 9.2 14.4 14H18L12 2zm2.4 12-1.8 3.6L10.8 14H8.4L12.6 22l4.2-8h-2.4z" />
    </svg>
  );
}
