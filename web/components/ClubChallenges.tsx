"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase/client";

interface Props {
  userId?: string;
}

type Progress = {
  totalKm: number;
  reviewsCount: number;
  garageCount: number;
};

const CHALLENGES = [
  {
    id: "km",
    label: "Kilomètreur",
    desc: "Roule 200 km au total",
    target: 200,
    unit: "km",
    badgeLabel: "Kilomètreur",
    badgeDesc: "200 km parcourus",
    barColor: "bg-michelin-yellow",
    badgeBg: "bg-michelin-yellow/15 ring-michelin-yellow/40",
    badgeText: "text-michelin-navy",
    getValue: (p: Progress) => p.totalKm,
  },
  {
    id: "reviews",
    label: "Voix de la communauté",
    desc: "Laisse 3 avis vérifiés",
    target: 3,
    unit: "avis",
    badgeLabel: "Testeur Vocal",
    badgeDesc: "3 avis publiés",
    barColor: "bg-michelin-blue",
    badgeBg: "bg-michelin-blue/10 ring-michelin-blue/30",
    badgeText: "text-michelin-blue",
    getValue: (p: Progress) => p.reviewsCount,
  },
  {
    id: "garage",
    label: "Garage configuré",
    desc: "Ajoute 2 pneus à ton Garage",
    target: 2,
    unit: "pneus",
    badgeLabel: "Mécanicien",
    badgeDesc: "Garage opérationnel",
    barColor: "bg-michelin-green",
    badgeBg: "bg-michelin-green/10 ring-michelin-green/30",
    badgeText: "text-michelin-green",
    getValue: (p: Progress) => p.garageCount,
  },
] as const;

export function ClubChallenges({ userId }: Props) {
  const [progress, setProgress] = useState<Progress>({ totalKm: 0, reviewsCount: 0, garageCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [riderRes, garageRes] = await Promise.all([
          // total_km et reviews_count sont des colonnes de la ligne du rider,
          // lisibles via la RLS "Riders can read their own profile".
          supabase!
            .from("riders")
            .select("total_km, reviews_count")
            .eq("id", userId!)
            .maybeSingle(),
          // garage_tyres est lisible via la RLS "Riders manage their own garage".
          supabase!
            .from("garage_tyres")
            .select("id", { count: "exact", head: true })
            .eq("rider_id", userId!),
        ]);

        setProgress({
          totalKm: riderRes.data?.total_km ?? 0,
          reviewsCount: riderRes.data?.reviews_count ?? 0,
          garageCount: garageRes.count ?? 0,
        });
      } catch {
        // silencieux — on garde les valeurs à 0
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const earnedBadges = CHALLENGES.filter((c) => !loading && c.getValue(progress) >= c.target);

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Reveal as="span" className="inline-block">
        <span className="kicker">Défis</span>
      </Reveal>
      <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
        Tes défis &amp; badges
      </Reveal>
      <Reveal as="p" delay={120} className="mt-2 text-michelin-ink">
        Accomplis ces défis pour débloquer des badges affichés sur ton profil.
      </Reveal>

      {/* Cartes défis */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {CHALLENGES.map((c, i) => {
          const value = c.getValue(progress);
          const pct = loading ? 0 : Math.min(100, Math.round((value / c.target) * 100));
          const done = pct === 100;

          return (
            <Reveal
              key={c.id}
              as="article"
              delay={i * 80}
              className={`overflow-hidden rounded-2xl border shadow-soft transition-[box-shadow] hover:shadow-md ${
                done ? "border-michelin-green/30" : "border-michelin-gray-line"
              } bg-white`}
            >
              {/* En-tête */}
              <div className={`px-5 py-3 ${done ? "bg-michelin-green" : "bg-michelin-navy"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-white/80">
                    {done ? "Complété ✓" : "En cours"}
                  </span>
                  {done && (
                    <span className="rounded-pill bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                      Badge débloqué
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-black text-white">{c.label}</p>
              </div>

              {/* Corps */}
              <div className="p-5">
                <p className="text-xs text-michelin-ink">{c.desc}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-michelin-ink/60">Progression</span>
                    <span className="text-sm font-black text-michelin-navy">
                      {loading ? "—" : value}
                      <span className="text-xs font-semibold text-michelin-ink/50">
                        /{c.target} {c.unit}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-michelin-gray-line">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ease-out ${done ? "bg-michelin-green" : c.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] font-bold text-michelin-ink/40">{pct} %</p>
                </div>

                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${c.badgeBg} ${done ? "opacity-100" : "opacity-30"}`}
                >
                  <span className={`text-xs font-black ${c.badgeText}`}>{c.badgeLabel}</span>
                  {!done && (
                    <span className="ml-auto text-[10px] text-michelin-ink/50">verrouillé</span>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Badges gagnés */}
      {earnedBadges.length > 0 && (
        <Reveal delay={200}>
          <div className="mt-10 rounded-2xl border border-michelin-green/30 bg-michelin-green/5 p-6">
            <p className="text-sm font-black uppercase tracking-wide text-michelin-green">
              Badges débloqués
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {earnedBadges.map((b) => (
                <div
                  key={b.id}
                  className={`flex flex-col items-center rounded-2xl px-5 py-4 ring-1 shadow-sm ${b.badgeBg}`}
                >
                  <span className={`text-base font-black ${b.badgeText}`}>{b.badgeLabel}</span>
                  <span className="mt-0.5 text-[10px] text-michelin-ink/60">{b.badgeDesc}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}
