"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TyreCard } from "@/components/TyreCard";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import {
  fetchOptions,
  fetchRecommendations,
  FALLBACK_OPTIONS,
  type Options,
  type RecoView,
} from "@/lib/api";

export default function TrouveTonPneu() {
  const [options, setOptions] = useState<Options>(FALLBACK_OPTIONS);
  const [discipline, setDiscipline] = useState("road");
  const [priority, setPriority] = useState("speed");
  const [ebike, setEbike] = useState(false);
  const [results, setResults] = useState<RecoView[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOptions()
      .then(setOptions)
      .catch(() => setOptions(FALLBACK_OPTIONS));
  }, []);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchRecommendations({ discipline, priority, ebike, limit: 5 });
      setResults(items);
    } catch (err) {
      setError("Impossible de récupérer les recommandations pour le moment. Réessaie dans un instant.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Trouve ton pneu</span>
        </Reveal>
        <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight text-michelin-navy sm:text-5xl">
          Trouve ton pneu
        </Reveal>
        <Reveal as="p" delay={120} className="mt-3 text-michelin-ink">
          D&apos;après tes ~1 240 km analysés sur Strava.
        </Reveal>

        {/* Formulaire en panneau */}
        <Reveal delay={120}>
          <div className="mt-8 rounded-3xl border border-michelin-gray-line bg-white p-6 shadow-soft sm:p-8">
            {/* Discipline */}
            <fieldset>
              <legend className="text-sm font-semibold text-michelin-navy">Ta discipline</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {options.disciplines.map((d) => (
                  <Choice
                    key={d.key}
                    label={d.label}
                    active={discipline === d.key}
                    onClick={() => setDiscipline(d.key)}
                  />
                ))}
              </div>
            </fieldset>

            {/* Priorite */}
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-michelin-navy">Ta priorite</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {options.priorities.map((p) => (
                  <Choice
                    key={p.key}
                    label={p.label}
                    active={priority === p.key}
                    onClick={() => setPriority(p.key)}
                  />
                ))}
              </div>
            </fieldset>

            {/* E-bike */}
            <label className="mt-6 flex w-fit cursor-pointer items-center gap-2 text-sm text-michelin-navy">
              <input
                type="checkbox"
                checked={ebike}
                onChange={(e) => setEbike(e.target.checked)}
                className="h-4 w-4 accent-michelin-blue"
              />
              Velo a assistance electrique (E-Bike)
            </label>

            <Button onClick={onSubmit} disabled={loading} size="lg" className="mt-8">
              {loading ? "Recherche..." : "Voir mes pneus"}
            </Button>
          </div>
        </Reveal>

        {error && (
          <p className="mt-6 rounded-xl border border-michelin-gray-line bg-michelin-gray-light p-4 text-sm text-michelin-ink">
            {error}
          </p>
        )}

        {/* Skeletons pendant la recherche */}
        {loading && !results && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        )}

        {results && (
          <div className="mt-10">
            <Reveal as="h2" className="text-xl font-bold text-michelin-navy">
              {results.length} pneus pour toi
            </Reveal>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {results.map((t, i) => (
                <Reveal key={t.range + i} delay={(i % 2) * 80} className="h-full">
                  <TyreCard tyre={t} rank={i + 1} best={i === 0} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

function Choice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={active ? "default" : "outline"}
      size="sm"
      aria-pressed={active}
      className="capitalize"
    >
      {label}
    </Button>
  );
}

/** Carte fantome (shimmer) affichee pendant le chargement des recommandations. */
function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-michelin-gray-light" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-michelin-gray-light" />
          <div className="h-4 w-2/3 rounded bg-michelin-gray-light" />
          <div className="h-3 w-1/2 rounded bg-michelin-gray-light" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-pill bg-michelin-gray-light" />
        <div className="h-6 w-14 rounded-pill bg-michelin-gray-light" />
      </div>
      <div className="mt-4 h-10 w-full rounded-pill bg-michelin-gray-light" />
      {/* Reflet shimmer */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}
