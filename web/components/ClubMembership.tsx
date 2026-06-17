"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase/client";

// Avantages affiches dans la carte "Club starter".
const AVANTAGES = [
  "2 pneus Michelin offerts / an",
  "Acces prioritaire au Programme Testeur",
  "Mon Garage connecte : suivi d'usure de tes pneus",
  "Badge Testeur Michelin sur ton profil",
  "Actualites & sorties exclusives",
  "10% de reduction chez nos revendeurs partenaires",
];

// loading : etat initial / anonymous : non connecte
// guest : connecte, pas membre / member : membre du Club
type State = "loading" | "anonymous" | "guest" | "member";

export function ClubMembership() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setState("anonymous");
      return;
    }
    let active = true;

    const load = async (sessionUser: User | null) => {
      if (!active) return;
      if (!sessionUser) {
        setUser(null);
        setState("anonymous");
        return;
      }
      setUser(sessionUser);
      // RLS : un rider ne lit que sa propre ligne (auth.uid() = id).
      const { data, error } = await supabase!
        .from("riders")
        .select("club_member")
        .eq("id", sessionUser.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setError(error.message);
        setState("guest");
        return;
      }
      setState(data?.club_member ? "member" : "guest");
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => load(session?.user ?? null));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function setMembership(next: boolean) {
    if (!supabase || !user) return;
    setBusy(true);
    setError(null);

    // 1. Tente de mettre a jour la ligne existante du rider.
    const { data: updated, error: updateError } = await supabase
      .from("riders")
      .update({ club_member: next, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("club_member");

    if (updateError) {
      setBusy(false);
      setError(updateError.message);
      return;
    }

    // 2. Aucune ligne touchee -> le rider n'a pas encore ete synchronise : on cree
    //    sa ligne. Garantit que l'adhesion est bien persistee (survit au refresh).
    if (!updated || updated.length === 0) {
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const displayName =
        (typeof meta?.full_name === "string" && meta.full_name) ||
        (typeof meta?.name === "string" && meta.name) ||
        user.email ||
        "Rider Michelin";
      const { error: insertError } = await supabase.from("riders").insert({
        id: user.id,
        email: user.email ?? null,
        display_name: displayName,
        club_member: next,
      });
      if (insertError) {
        setBusy(false);
        setError(insertError.message);
        return;
      }
    }

    setBusy(false);
    setState(next ? "member" : "guest");
    // Previent les autres sections (Mon Garage) du changement d'adhesion.
    window.dispatchEvent(new CustomEvent("club-membership-changed", { detail: { member: next } }));
  }

  const isMember = state === "member";

  return (
    <Reveal>
      <div className="overflow-hidden rounded-3xl border border-michelin-gray-line shadow-soft card-interactive">
        <div className="shine relative overflow-hidden bg-michelin-navy p-7 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-michelin-blue/40 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="text-3xl font-black text-michelin-yellow">Club starter</div>
            {isMember ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-michelin-green/20 px-3 py-1 text-xs font-bold text-white ring-1 ring-michelin-green/40">
                <span className="h-1.5 w-1.5 rounded-full bg-michelin-green" />
                Membre actif
              </span>
            ) : null}
          </div>
          <div className="relative mt-1 text-xl font-bold">9 &euro; / mois</div>
        </div>

        <div className="bg-white p-7">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-michelin-ink">
            Mes avantages
          </h2>
          <ul className="mt-4 space-y-3">
            {AVANTAGES.map((a, i) => (
              <Reveal as="li" key={a} delay={i * 50} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-michelin-green/10 text-sm font-bold text-michelin-green">
                  &#10003;
                </span>
                <span className="text-michelin-navy">{a}</span>
              </Reveal>
            ))}
          </ul>

          <div className="mt-7">{renderAction()}</div>

          {error ? (
            <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>
          ) : null}
        </div>
      </div>
    </Reveal>
  );

  function renderAction() {
    if (state === "loading") {
      return (
        <Button size="lg" className="w-full" disabled>
          Chargement...
        </Button>
      );
    }
    if (state === "anonymous") {
      return (
        <Button asChild size="lg" className="w-full">
          <Link href="/">Connecte-toi pour rejoindre</Link>
        </Button>
      );
    }
    if (state === "member") {
      return (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-michelin-green">
            Tu fais partie du Club. Profite de tes avantages !
          </p>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => setMembership(false)}
          >
            {busy ? "..." : "Quitter le Club"}
          </Button>
        </div>
      );
    }
    return (
      <Button size="lg" className="w-full" disabled={busy} onClick={() => setMembership(true)}>
        {busy ? "..." : "Rejoindre le Club"}
      </Button>
    );
  }
}
