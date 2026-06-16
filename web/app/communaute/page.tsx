"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import {
  fetchStats,
  fetchReviews,
  fetchPros,
  formatKm,
  FALLBACK_STATS,
  FALLBACK_REVIEWS,
  FALLBACK_PROS,
  type CommunityStats,
  type VerifiedReview,
  type ProRider,
} from "@/lib/api";

export default function Communaute() {
  const [stats, setStats] = useState<CommunityStats>(FALLBACK_STATS);
  const [reviews, setReviews] = useState<VerifiedReview[]>(FALLBACK_REVIEWS);
  const [pros, setPros] = useState<ProRider[]>(FALLBACK_PROS);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    fetchReviews().then(setReviews).catch(() => {});
    fetchPros().then(setPros).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Compteurs collectifs */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/peloton.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-veil" />
        </div>
        <div className="pointer-events-none absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-michelin-blue/40 blur-3xl" />
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal as="span" className="inline-block">
            <span className="kicker">La communaute</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            La communaute Michelin
          </Reveal>
          <Reveal as="p" delay={120} className="mt-3 max-w-2xl text-lg text-white/85">
            La preuve sociale qui manquait : des avis <strong className="text-white">adosses aux vrais kilometres</strong>, impossibles a falsifier.
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat i={0} k={formatKm(stats.monthKm)} v="roules ce mois" />
            <Stat i={1} k={stats.ridersCount.toLocaleString("fr-FR")} v="riders" />
            <Stat i={2} k={stats.verifiedReviews.toLocaleString("fr-FR")} v="avis verifies" />
            <Stat i={3} k={formatKm(stats.totalKm)} v="cumul communaute" />
          </div>
        </div>
      </section>

      {/* Avis verifies */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Reveal as="h2" className="text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
          Avis verifies
        </Reveal>
        <Reveal as="p" delay={60} className="mt-1 text-sm text-michelin-ink">
          Chaque avis affiche les km, sorties et terrains Strava qui le rendent credible.
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((r, i) => (
            <Reveal as="article" key={r.id} delay={(i % 2) * 80} className="rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft card-interactive">
              <div className="flex items-center justify-between">
                <span className="font-bold text-michelin-navy">{r.rider}</span>
                <span className="rounded-pill bg-michelin-green/10 px-3 py-1 text-xs font-semibold text-michelin-green">
                  Verifie · {r.verifiedKm.toLocaleString("fr-FR")} km
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <TyreImage kind={kindFromText(r.tyre)} className="h-8 w-8 shrink-0" />
                <span className="text-sm font-semibold text-michelin-blue">{r.tyre}</span>
              </div>
              <div className="mt-2 flex items-center gap-2" aria-label={`Avis vérifié, ${r.rating} sur 5`}>
                <span className="text-xs font-semibold text-michelin-green">Avis vérifié</span>
                <span className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-2 w-2 rounded-full ${n <= r.rating ? "bg-michelin-blue" : "bg-michelin-gray-line"}`}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-2 text-sm text-michelin-navy">&laquo; {r.text} &raquo;</p>
              <p className="mt-3 text-xs text-michelin-ink">
                {r.verifiedRides} sorties · {r.terrains} · {r.avgSpeedKmh} km/h de moyenne
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pneus des pros */}
      <section className="tread-pattern border-t border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Reveal as="h2" className="text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
            Les pneus des pros
          </Reveal>
          <Reveal as="p" delay={60} className="mt-1 text-sm text-michelin-ink">
            Vois ce que roulent les pros et les riders comme toi.
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pros.map((p, i) => (
              <Reveal key={p.name} delay={(i % 4) * 70} className="group rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft card-interactive">
                <TyreImage kind={kindFromText(p.tyre)} className="h-12 w-12 transition-transform duration-300 ease-out-strong group-hover:rotate-[8deg]" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-michelin-ink">{p.discipline}</div>
                <div className="mt-1 font-bold text-michelin-navy">{p.name}</div>
                <div className="mt-2 text-sm font-semibold text-michelin-blue">{p.tyre}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Stat({ k, v, i }: { k: string; v: string; i: number }) {
  return (
    <Reveal delay={i * 70} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
      <div className="text-2xl font-black text-michelin-yellow sm:text-3xl">{k}</div>
      <div className="mt-1 text-sm text-white/70">{v}</div>
    </Reveal>
  );
}
