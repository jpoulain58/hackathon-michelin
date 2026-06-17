"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function UpdatePasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>("Verification du lien...");

  useEffect(() => {
    let mounted = true;

    async function prepareRecoverySession() {
      try {
        const { isSupabaseConfigured, supabase } = await import("@/lib/supabase/client");
        if (!isSupabaseConfigured || !supabase) {
          throw new Error("Configuration Supabase manquante.");
        }

        const callbackError = searchParams.get("error_description") ?? searchParams.get("error");
        if (callbackError) throw new Error(callbackError);

        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error("Lien invalide ou expire. Demande un nouveau reset.");
        }

        if (mounted) {
          setReady(true);
          setStatus("Lien valide.");
        }
      } catch (error) {
        if (!mounted) return;
        setReady(false);
        setStatus(error instanceof Error ? error.message : "Reset impossible.");
      }
    }

    void prepareRecoverySession();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setStatus("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (!supabase) throw new Error("Configuration Supabase manquante.");

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("Mot de passe mis a jour.");
      router.replace("/accueil");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Mise a jour impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={updatePassword} className="mt-5 space-y-3">
      <label htmlFor="new-password" className="block text-xs font-bold text-michelin-ink">
        Nouveau mot de passe
      </label>
      <input
        id="new-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        disabled={!ready || loading}
        className="w-full rounded-xl border border-michelin-gray-line bg-white px-4 py-3 text-sm font-semibold text-michelin-navy outline-none transition focus:border-michelin-blue focus:ring-2 focus:ring-michelin-blue/20 disabled:cursor-not-allowed disabled:bg-michelin-gray-light"
      />

      <label htmlFor="confirm-password" className="block text-xs font-bold text-michelin-ink">
        Confirmer le mot de passe
      </label>
      <input
        id="confirm-password"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        disabled={!ready || loading}
        className="w-full rounded-xl border border-michelin-gray-line bg-white px-4 py-3 text-sm font-semibold text-michelin-navy outline-none transition focus:border-michelin-blue focus:ring-2 focus:ring-michelin-blue/20 disabled:cursor-not-allowed disabled:bg-michelin-gray-light"
      />

      <button
        type="submit"
        disabled={!ready || loading}
        className="w-full rounded-xl bg-michelin-navy px-4 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Mise a jour..." : "Enregistrer"}
      </button>

      {status ? (
        <p className="rounded-xl bg-michelin-gray-light px-3 py-2 text-sm font-semibold text-michelin-navy">
          {status}
        </p>
      ) : null}

      {!ready ? (
        <Link href="/" className="block text-center text-sm font-bold text-michelin-blue underline-offset-4 hover:underline">
          Retour connexion
        </Link>
      ) : null}
    </form>
  );
}
