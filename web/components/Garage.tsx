"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase/client";
import { fetchStravaStats, fetchTyres } from "@/lib/api";

const FALLBACK_MODELS = [
  "MICHELIN Power Cup 2",
  "MICHELIN Power Cup S",
  "MICHELIN Power Road",
  "MICHELIN Power Road TLR",
  "MICHELIN Power All Season",
  "MICHELIN Power Gravel",
  "MICHELIN Power Adventure",
  "MICHELIN Power Protection TLR",
  "MICHELIN PRO4 Endurance",
  "MICHELIN PRO5",
  "MICHELIN PRO5 TLR",
  "MICHELIN Force AM2",
  "MICHELIN Force AM2 Competition Line",
  "MICHELIN Wild Enduro Front",
  "MICHELIN Wild Enduro Rear",
  "MICHELIN Wild XC3",
  "MICHELIN Force XC3",
  "MICHELIN City Cargo",
  "MICHELIN City Street",
  "MICHELIN E-Wild Front",
  "MICHELIN E-Wild Rear",
];

type Tyre = {
  id: string;
  label: string;
  model: string | null;
  km: number;
  lifespan_km: number;
};

// loading : etat initial / anonymous : non connecte
// locked : connecte mais pas membre / ready : membre du Club
type Gate = "loading" | "anonymous" | "locked" | "ready";

// % de vie restante d'un pneu = 100 - usure (km / duree de vie).
function lifeRemaining(km: number, lifespan: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - (km / Math.max(1, lifespan)) * 100)));
}

function lifeColor(pct: number): string {
  if (pct > 50) return "bg-michelin-green";
  if (pct > 20) return "bg-michelin-yellow";
  return "bg-destructive";
}

function isStravaConnected(session: Session | null): boolean {
  const u = session?.user;
  if (!u) return false;
  const providers = u.app_metadata?.providers;
  return (
    u.app_metadata?.provider === "strava" ||
    (Array.isArray(providers) && providers.includes("strava")) ||
    Boolean((u.user_metadata as Record<string, unknown> | undefined)?.strava_id)
  );
}

export function Garage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Saisie d'un nouveau pneu.
  const [draft, setDraft] = useState({ label: "Pneu avant", model: "", km: 0, lifespan_km: 4000 });
  const [adding, setAdding] = useState(false);

  // Synchro Strava.
  const [stravaKm, setStravaKm] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stravaError, setStravaError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS);

  const loadTyres = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("garage_tyres")
      .select("id, label, model, km, lifespan_km")
      .eq("rider_id", uid)
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    setTyres((data as Tyre[]) ?? []);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setGate("anonymous");
      return;
    }
    let active = true;

    const resolve = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      const uid = next?.user.id;
      if (!uid) {
        setGate("anonymous");
        return;
      }
      const { data, error } = await supabase!
        .from("riders")
        .select("club_member")
        .eq("id", uid)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setError(error.message);
        setGate("locked");
        return;
      }
      if (data?.club_member) {
        setGate("ready");
        loadTyres(uid);
      } else {
        setGate("locked");
      }
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => resolve(next));

    // L'adhesion peut changer depuis la carte Club : on reagit en direct.
    // On relit la session fraiche pour eviter toute closure obsolete.
    const onMembership = (e: Event) => {
      const member = (e as CustomEvent<{ member: boolean }>).detail?.member;
      if (member === false) {
        setGate("locked");
        return;
      }
      if (member) {
        supabase!.auth.getSession().then(({ data }) => {
          const next = data.session;
          if (!next) return;
          setSession(next);
          setGate("ready");
          loadTyres(next.user.id);
        });
      }
    };
    window.addEventListener("club-membership-changed", onMembership);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("club-membership-changed", onMembership);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTyres]);

  useEffect(() => {
    fetchTyres()
      .then((tyres) => {
        const names = [...new Set(tyres.map((t) => t.designation).filter(Boolean))].sort() as string[];
        if (names.length > 0) setModels(names);
      })
      .catch(() => {});
  }, []);

  function patchLocal(id: string, patch: Partial<Tyre>) {
    setTyres((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function saveTyre(t: Tyre) {
    if (!supabase) return;
    setError(null);
    const { error } = await supabase
      .from("garage_tyres")
      .update({
        label: t.label,
        model: t.model,
        km: t.km,
        lifespan_km: t.lifespan_km,
        updated_at: new Date().toISOString(),
      })
      .eq("id", t.id);
    if (error) setError(error.message);
  }

  async function deleteTyre(id: string) {
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.from("garage_tyres").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTyres((list) => list.filter((t) => t.id !== id));
  }

  async function addTyre() {
    if (!supabase || !session) return;
    setAdding(true);
    setError(null);
    const { data, error } = await supabase
      .from("garage_tyres")
      .insert({
        rider_id: session.user.id,
        label: draft.label || "Pneu",
        model: draft.model || null,
        km: Number(draft.km) || 0,
        lifespan_km: Number(draft.lifespan_km) || 4000,
      })
      .select("id, label, model, km, lifespan_km")
      .single();
    setAdding(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTyres((list) => [...list, data as Tyre]);
    setDraft({ label: "Pneu arriere", model: "", km: 0, lifespan_km: 4000 });
  }

  async function syncStrava() {
    if (!session?.access_token) return;
    setSyncing(true);
    setStravaError(null);
    try {
      const stats = await fetchStravaStats(session.access_token);
      if (!stats.connected) {
        setStravaError("Aucun compte Strava lie. Connecte-toi via Strava pour synchroniser.");
        return;
      }
      setStravaKm(stats.totalKm);
    } catch (e) {
      setStravaError(e instanceof Error ? e.message : "Synchronisation Strava impossible.");
    } finally {
      setSyncing(false);
    }
  }

  // --- Etats non-membres ----------------------------------------------------

  if (gate === "loading") {
    return <div className="h-40 animate-pulse rounded-3xl bg-michelin-gray-light" />;
  }

  if (gate !== "ready") {
    // Teaser verrouille : on montre la promesse, l'acces est reserve aux membres.
    return (
      <div className="relative overflow-hidden rounded-3xl border border-michelin-gray-line bg-white p-8 text-center shadow-soft">
        <div className="pointer-events-none absolute inset-0 tread-pattern opacity-60" />
        <div className="relative">
          <span className="flex mx-auto h-12 w-12 items-center justify-center rounded-pill bg-michelin-navy text-white">
            <LockGlyph />
          </span>
          <h3 className="mt-4 text-xl font-black text-michelin-navy">Mon Garage connecte</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-michelin-ink">
            Suis l&apos;usure de tes pneus, saisis tes km a la main ou synchronise-les depuis
            Strava. Reserve aux membres du Club.
          </p>
          {gate === "anonymous" ? (
            <Button asChild size="lg" className="mt-6">
              <Link href="/">Connecte-toi</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-6">
              <a href="#club-offre">Rejoindre le Club pour debloquer</a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --- Garage actif (membre) ------------------------------------------------

  const stravaConnected = isStravaConnected(session);

  return (
    <div className="space-y-6">
      <datalist id="tyre-models">
        {models.map((m) => <option key={m} value={m} />)}
      </datalist>

      {/* Synchro Strava */}
      <div className="rounded-3xl border border-michelin-gray-line bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-michelin-navy">Mes kilometres</h3>
            <p className="text-sm text-michelin-ink">
              {stravaConnected
                ? "Recupere ton cumul reel depuis Strava."
                : "Connecte-toi via Strava pour importer tes km automatiquement."}
            </p>
          </div>
          {stravaKm !== null ? (
            <div className="text-right">
              <div className="text-3xl font-black text-michelin-blue">
                {stravaKm.toLocaleString("fr-FR")} km
              </div>
              <div className="text-xs font-medium text-michelin-ink">cumul Strava</div>
            </div>
          ) : (
            <Button onClick={syncStrava} disabled={syncing || !stravaConnected} className="gap-2">
              <StravaGlyph />
              {syncing ? "Synchronisation..." : "Synchroniser Strava"}
            </Button>
          )}
        </div>
        {stravaError ? (
          <p className="mt-3 text-sm font-medium text-destructive">{stravaError}</p>
        ) : null}
      </div>

      {/* Pneus suivis */}
      <div className="rounded-3xl border border-michelin-gray-line bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-michelin-navy">Mes pneus</h3>
          <span className="chip">{tyres.length} pneu{tyres.length > 1 ? "x" : ""}</span>
        </div>

        {tyres.length === 0 ? (
          <p className="mt-4 text-sm text-michelin-ink">
            Aucun pneu pour le moment. Ajoute ton premier pneu ci-dessous.
          </p>
        ) : (
          <ul className="mt-4 space-y-5">
            {tyres.map((t) => {
              const pct = lifeRemaining(t.km, t.lifespan_km);
              return (
                <li key={t.id} className="rounded-2xl border border-michelin-gray-line p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-michelin-ink">
                      Emplacement
                      <input
                        value={t.label}
                        onChange={(e) => patchLocal(t.id, { label: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm font-medium text-michelin-navy outline-none focus:border-michelin-blue"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-michelin-ink">
                      Modele
                      <input
                        list="tyre-models"
                        value={t.model ?? ""}
                        onChange={(e) => patchLocal(t.id, { model: e.target.value })}
                        placeholder="MICHELIN Power Cup"
                        className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm font-medium text-michelin-navy outline-none focus:border-michelin-blue"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-michelin-ink">
                      Km parcourus
                      <input
                        type="number"
                        min={0}
                        value={t.km}
                        onChange={(e) => patchLocal(t.id, { km: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm font-medium text-michelin-navy outline-none focus:border-michelin-blue"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-michelin-ink">
                      Duree de vie estimee (km)
                      <input
                        type="number"
                        min={1}
                        value={t.lifespan_km}
                        onChange={(e) => patchLocal(t.id, { lifespan_km: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm font-medium text-michelin-navy outline-none focus:border-michelin-blue"
                      />
                    </label>
                  </div>

                  <div className="mt-3">
                    <div className="h-2.5 w-full overflow-hidden rounded-pill bg-michelin-gray-line">
                      <div
                        className={`h-full rounded-pill transition-[width] duration-500 ${lifeColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs font-medium text-michelin-ink">
                      {pct}% de vie restante
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => saveTyre(t)}>
                      Enregistrer
                    </Button>
                    {stravaKm !== null ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchLocal(t.id, { km: stravaKm })}
                      >
                        Utiliser mes km Strava
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => deleteTyre(t.id)}>
                      Supprimer
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Ajout d'un pneu */}
        <div className="mt-6 rounded-2xl bg-michelin-gray-light p-4">
          <h4 className="text-sm font-bold text-michelin-navy">Ajouter un pneu</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-michelin-ink">
              Emplacement
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="ex. Pneu avant"
                className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm text-michelin-navy outline-none focus:border-michelin-blue"
              />
            </label>
            <label className="block text-xs font-semibold text-michelin-ink">
              Modele
              <input
                list="tyre-models"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="ex. MICHELIN Power Cup"
                className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm text-michelin-navy outline-none focus:border-michelin-blue"
              />
            </label>
            <label className="block text-xs font-semibold text-michelin-ink">
              Km parcourus
              <input
                type="number"
                min={0}
                value={draft.km}
                onChange={(e) => setDraft({ ...draft, km: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm text-michelin-navy outline-none focus:border-michelin-blue"
              />
            </label>
            <label className="block text-xs font-semibold text-michelin-ink">
              Duree de vie estimee (km)
              <input
                type="number"
                min={1}
                value={draft.lifespan_km}
                onChange={(e) => setDraft({ ...draft, lifespan_km: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-michelin-gray-line px-3 py-2 text-sm text-michelin-navy outline-none focus:border-michelin-blue"
              />
            </label>
          </div>
          <Button onClick={addTyre} disabled={adding} className="mt-3">
            {adding ? "Ajout..." : "Ajouter le pneu"}
          </Button>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function StravaGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 6 14h3.6L12 9.2 14.4 14H18L12 2zm2.4 12-1.8 3.6L10.8 14H8.4L12.6 22l4.2-8h-2.4z" />
    </svg>
  );
}
