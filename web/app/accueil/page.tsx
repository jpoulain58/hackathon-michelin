/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TyreImage, KIND_LABEL, type TyreKind } from "@/components/TyreImage";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const DISCIPLINE_PHOTO: Record<TyreKind, string> = {
  road: "/photos/road-forest.jpg",
  gravel: "/photos/trail.jpg",
  mtb: "/photos/bike-gravel.jpg",
  city: "/photos/city-bike.jpg",
};

const STATS = [
  { k: "2,4 M km", v: "roules par le peloton Michelin ce mois" },
  { k: "12 300", v: "riders dans la communaute" },
  { k: "100 % verifies", v: "avis adosses aux vrais kilometres Strava" },
];

const CONCEPTS = [
  {
    title: "Trouve ton pneu + Comparateur",
    body: "Connexion Strava / Garmin, quelques questions, et une selection personnalisee. Comparateur transparent incluant les concurrents — c'est ca, la preuve.",
    tag: "L'utilite",
  },
  {
    title: "Communaute & emulation",
    body: "Compteurs collectifs, pneus des pros, avis verifies par les km, balades de la semaine, statut et parrainage.",
    tag: "La prescription",
  },
  {
    title: "Club Trust Wheels",
    body: "Abonnement rider : pneus, chambres a air et goodies, defis premium et statut accelere. La fidelite vient apres la preuve.",
    tag: "La fidelite",
  },
];

export default function Accueil() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero avec photo + voile en degrade + halos diffus */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/hero-road.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-veil" />
        </div>
        {/* Halos lumineux facon charte */}
        <div className="pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-michelin-blue/40 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-1/3 -z-10 h-56 w-56 rounded-full bg-michelin-yellow/20 blur-3xl animate-float" />

        <div className="mx-auto max-w-6xl px-6 pb-28 pt-36 text-white sm:pb-32 sm:pt-40">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Michelin Trust Wheels</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-5 max-w-3xl text-5xl font-black leading-[1.03] tracking-tight sm:text-7xl">
            La preuve <span className="text-michelin-yellow">par la route.</span>
          </Reveal>
          <Reveal as="p" delay={120} className="mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
            Michelin a des produits d&apos;exception, mais{" "}
            <strong className="text-white">1 avis quand Continental en a 100</strong>. Trust Wheels
            transforme les riders Michelin en prescripteurs, et leurs kilometres en preuve sociale
            que personne ne peut egaler.
          </Reveal>
          <Reveal delay={180} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/trouve-ton-pneu">Trouve ton pneu</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="border border-white/40 text-white hover:bg-white/10 hover:text-michelin-yellow"
            >
              <a href="#concept">Decouvrir le concept</a>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Compteurs collectifs */}
      <section className="tread-pattern border-b border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-12 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal
              key={s.k}
              delay={i * 80}
              className="rounded-2xl border border-michelin-gray-line bg-white/70 p-5 shadow-soft card-interactive"
            >
              <div className="h-1 w-10 rounded-pill bg-michelin-yellow" />
              <div className="mt-3 text-4xl font-black text-gradient-blue">{s.k}</div>
              <div className="mt-1 text-sm text-michelin-ink">{s.v}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Disciplines */}
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Un pneu pour chaque terrain</span>
        </Reveal>
        <Reveal as="h2" delay={60} className="mt-4 text-3xl font-black tracking-tight text-michelin-navy sm:text-4xl">
          Choisis ton terrain
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["road", "gravel", "mtb", "city"] as TyreKind[]).map((k, i) => (
            <Reveal key={k} delay={i * 70}>
              <Card className="group h-full overflow-hidden card-interactive">
                <div className="relative h-32 w-full overflow-hidden">
                  <img src={DISCIPLINE_PHOTO[k]} alt="" className="img-zoom h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-michelin-navy/55 to-transparent" />
                </div>
                <CardContent className="flex items-center gap-3 p-4">
                  <TyreImage kind={k} className="h-10 w-10 shrink-0 transition-transform duration-300 ease-out-strong group-hover:rotate-[8deg]" />
                  <span className="font-bold text-michelin-navy">{KIND_LABEL[k]}</span>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Concept */}
      <section id="concept" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Le concept</span>
        </Reveal>
        <Reveal as="h2" delay={60} className="mt-4 text-3xl font-black tracking-tight text-michelin-navy sm:text-4xl">
          Une app en 2 parties + un club
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {CONCEPTS.map((c, i) => (
            <Reveal key={c.title} delay={i * 80} className="h-full">
              <Card className="group relative h-full overflow-hidden card-interactive">
                <span className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-michelin-yellow/15 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                <CardContent className="p-6">
                  <Badge variant="secondary">{c.tag}</Badge>
                  <h3 className="mt-3 text-lg font-bold text-michelin-navy">{c.title}</h3>
                  <p className="mt-2 text-sm text-michelin-ink">{c.body}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
