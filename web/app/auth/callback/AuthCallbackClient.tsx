"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_NEXT = "/accueil";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return DEFAULT_NEXT;
  return value;
}

function buildMobileCallbackUrl(search: URLSearchParams, hash: string): string | null {
  const mobileRedirectTo = search.get("mobile_redirect_to");
  if (!mobileRedirectTo) return null;

  const target = new URL(mobileRedirectTo);
  search.forEach((value, key) => {
    if (key === "mobile_redirect_to" || key === "next") return;
    target.searchParams.set(key, value);
  });

  if (hash) {
    target.hash = hash;
  }

  return target.toString();
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Finalisation de la connexion...");

  useEffect(() => {
    let mounted = true;
    const search = new URLSearchParams(searchParams.toString());

    try {
      const mobileCallbackUrl = buildMobileCallbackUrl(search, window.location.hash);
      if (mobileCallbackUrl) {
        setStatus("Retour vers l'application mobile...");
        window.location.replace(mobileCallbackUrl);
        return;
      }
    } catch {
      setStatus("Callback mobile invalide.");
      return;
    }

    async function finishWebCallback() {
      try {
        const [{ isSupabaseConfigured, supabase }, { syncRider }] = await Promise.all([
          import("@/lib/supabase/client"),
          import("@/lib/auth/sync"),
        ]);

        if (!isSupabaseConfigured || !supabase) {
          throw new Error("Configuration Supabase manquante.");
        }

        const callbackError = search.get("error_description") ?? search.get("error");
        if (callbackError) throw new Error(callbackError);

        // Pont OAuth backend (Strava) : ticket magiclink a echanger contre une session.
        const tokenHash = search.get("token_hash");
        const code = search.get("code");
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: "magiclink",
            token_hash: tokenHash,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error("Session Supabase introuvable apres le callback OAuth.");
        }

        await syncRider(data.session);

        if (mounted) {
          router.replace(safeNext(search.get("next")));
        }
      } catch (error) {
        if (!mounted) return;
        setStatus(error instanceof Error ? error.message : "Connexion impossible.");
      }
    }

    void finishWebCallback();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return <p className="text-sm font-medium text-white/85">{status}</p>;
}
