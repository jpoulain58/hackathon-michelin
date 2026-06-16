"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TyreCard } from "@/components/TyreCard";
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

      <section className="mx-auto max-w-4xl px-6 py-10">
        <span className="kicker">Trouve ton pneu</span>
        <h1 className="mt-4 text-4xl font-black text-michelin-navy">Trouve ton pneu</h1>
        <p className="mt-2 text-michelin-ink">
          D&apos;après tes ~1 240 km analysés sur Strava.
        </p>

        {/* Discipline */}
        <fieldset className="mt-8">
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

        {error && (
          <p className="mt-6 rounded-xl border border-michelin-gray-line bg-michelin-gray-light p-4 text-sm text-michelin-ink">
            {error}
          </p>
        )}

        {results && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-michelin-navy">
              {results.length} pneus pour toi
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {results.map((t, i) => (
                <TyreCard key={t.range + i} tyre={t} rank={i + 1} best={i === 0} />
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
      className="capitalize"
    >
      {label}
    </Button>
  );
}
