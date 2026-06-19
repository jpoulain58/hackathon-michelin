"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { CommunityReviewForm } from "@/components/CommunityReviewForm";
import {
  fetchStats,
  fetchRecentReviews,
  fetchPros,
  formatKm,
  FALLBACK_STATS,
  FALLBACK_PROS,
  type CommunityStats,
  type ReviewItem,
  type ProRider,
} from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Communaute() {
  const [stats, setStats] = useState<CommunityStats>(FALLBACK_STATS);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [pros, setPros] = useState<ProRider[]>(FALLBACK_PROS);

  const loadReviews = useCallback(() => {
    fetchRecentReviews(20)
      .then(({ items, count }) => {
        setReviews(items);
        setReviewCount(count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    loadReviews();
    fetchPros().then(setPros).catch(() => {});
  }, [loadReviews]);

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
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32">
          <Reveal as="span" className="inline-block">
            <span className="kicker">La communaute</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            La communaute Michelin
          </Reveal>
          <Reveal as="p" delay={120} className="mt-3 max-w-2xl text-lg text-white/85">
            Les avis des riders qui roulent vraiment ces pneus, partagés avec toute la communauté.
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat i={0} k={formatKm(stats.monthKm)} v="roules ce mois" />
            <Stat i={1} k={stats.ridersCount.toLocaleString("fr-FR")} v="riders" />
            <Stat i={2} k={reviewCount.toLocaleString("fr-FR")} v="avis" />
            <Stat i={3} k={formatKm(stats.totalKm)} v="cumul communaute" />
          </div>
        </div>
      </section>

      {/* Avis */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Reveal as="h2" className="text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
          Avis de la communaute
        </Reveal>
        <Reveal as="p" delay={60} className="mt-1 text-sm text-michelin-ink">
          Ce que les riders pensent vraiment de leurs pneus, avis ambassadeurs mis en avant.
        </Reveal>

        <div className="mt-8">
          <CommunityReviewForm onSubmitted={loadReviews} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={(i % 2) * 80}>
              <Link
                href={`/produits/${r.productId}`}
                className="block rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft card-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-michelin-navy">{r.riderName}</span>
                  {r.isAmbassador && (
                    <span className="rounded-pill bg-michelin-yellow/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-michelin-navy">
                      Ambassadeur
                    </span>
                  )}
                </div>
                {r.tyre && (
                  <div className="mt-1 flex items-center gap-2">
                    <TyreImage kind={kindFromText(r.tyre)} className="h-8 w-8 shrink-0" />
                    <span className="text-sm font-semibold text-michelin-blue">{r.tyre}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1" aria-label={`Avis, ${r.rating} sur 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-2 w-2 rounded-full ${n <= r.rating ? "bg-michelin-blue" : "bg-michelin-gray-line"}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-michelin-navy">&laquo; {r.text} &raquo;</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-michelin-ink/50">{formatDate(r.createdAt)}</p>
                  <span className="shrink-0 rounded-pill bg-michelin-yellow px-3 py-1.5 text-xs font-bold text-michelin-navy transition-[filter]">
                    Voir le pneu →
                  </span>
                </div>
              </Link>
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
            Vois ce que roulent les pros sur leurs compétitions, et retrouve les mêmes pneus pour toi.
          </Reveal>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pros.map((p, i) => (
              <Reveal key={p.slug ?? p.name} delay={(i % 3) * 70}>
                <Link
                  href={p.slug ? `/communaute/pros/${p.slug}` : p.productId ? `/produits/${p.productId}` : "/produits"}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-soft transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out-strong group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-michelin-gray-light">
                      <TyreImage kind={kindFromText(p.tyre)} className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-michelin-navy/90 via-michelin-navy/20 to-transparent" />
                  <span className="absolute right-3 top-3 rounded-pill bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-michelin-navy backdrop-blur-sm">
                    {p.team}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">{p.discipline}</div>
                    <div className="text-lg font-bold text-white">{p.name}</div>
                    <span className="mt-2 inline-block rounded-pill bg-michelin-yellow px-3 py-1 text-xs font-bold text-michelin-navy transition-[filter] group-hover:brightness-95">
                      Voir sa fiche →
                    </span>
                  </div>
                </Link>
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
