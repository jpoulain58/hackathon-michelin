"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
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
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Brand />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-michelin-blue">
          <Link href="/balades" className="hover:underline">Balades</Link>
          <Link href="/club" className="hover:underline">Club</Link>
          <Link href="/trouve-ton-pneu" className="btn-primary">Trouve ton pneu</Link>
        </nav>
      </header>

      {/* Compteurs collectifs */}
      <section className="bg-michelin-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="h-1 w-12 bg-michelin-yellow" />
          <h1 className="mt-4 text-3xl font-bold">La communaute Michelin</h1>
          <p className="mt-2 max-w-2xl text-white/80">
            La preuve sociale qui manquait : des avis <strong className="text-white">adosses aux vrais kilometres</strong>, impossibles a falsifier.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat k={formatKm(stats.monthKm)} v="roules ce mois" />
            <Stat k={stats.ridersCount.toLocaleString("fr-FR")} v="riders" />
            <Stat k={stats.verifiedReviews.toLocaleString("fr-FR")} v="avis verifies" />
            <Stat k={formatKm(stats.totalKm)} v="cumul communaute" />
          </div>
        </div>
      </section>

      {/* Avis verifies */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-2xl font-bold text-michelin-navy">Avis verifies</h2>
        <p className="mt-1 text-sm text-michelin-ink">
          Chaque avis affiche les km, sorties et terrains Strava qui le rendent credible.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-sm">
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
            </article>
          ))}
        </div>
      </section>

      {/* Pneus des pros */}
      <section className="border-t border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-bold text-michelin-navy">Les pneus des pros</h2>
          <p className="mt-1 text-sm text-michelin-ink">Vois ce que roulent les pros et les riders comme toi.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pros.map((p) => (
              <div key={p.name} className="rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-sm">
                <TyreImage kind={kindFromText(p.tyre)} className="h-12 w-12" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-michelin-ink">{p.discipline}</div>
                <div className="mt-1 font-bold text-michelin-navy">{p.name}</div>
                <div className="mt-2 text-sm font-semibold text-michelin-blue">{p.tyre}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-michelin-yellow">{k}</div>
      <div className="mt-1 text-sm text-white/70">{v}</div>
    </div>
  );
}
