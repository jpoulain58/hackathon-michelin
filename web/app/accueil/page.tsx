/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TyreImage, KIND_LABEL, type TyreKind } from "@/components/TyreImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const DISCIPLINE_PHOTO: Record<TyreKind, string> = {
  road: "/photos/road-forest.jpg",
  gravel: "/photos/trail.jpg",
  mtb: "/photos/bike-gravel.jpg",
  city: "/photos/city-bike.jpg",
};

export default function Accueil() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero avec photo */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/hero-road.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-michelin-navy via-michelin-navy/85 to-michelin-navy/40" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-24 text-white sm:py-28">
          <span className="kicker">Michelin Trust Wheels</span>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.05] sm:text-6xl">
            La preuve par la route.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Michelin a des produits d&apos;exception, mais{" "}
            <strong className="text-white">1 avis quand Continental en a 100</strong>. Trust Wheels
            transforme les riders Michelin en prescripteurs, et leurs kilometres en preuve sociale
            que personne ne peut egaler.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
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
          </div>
        </div>
      </section>

      {/* Compteurs collectifs */}
      <section className="border-b border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-3">
          {[
            { k: "2,4 M km", v: "roules par le peloton Michelin ce mois" },
            { k: "12 300", v: "riders dans la communaute" },
            { k: "100 % verifies", v: "avis adosses aux vrais kilometres Strava" },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-3xl font-black text-michelin-blue">{s.k}</div>
              <div className="mt-1 text-sm text-michelin-ink">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Disciplines */}
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <span className="kicker">Un pneu pour chaque terrain</span>
        <h2 className="mt-4 text-3xl font-black text-michelin-navy">Choisis ton terrain</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["road", "gravel", "mtb", "city"] as TyreKind[]).map((k) => (
            <Card key={k} className="overflow-hidden">
              <div className="relative h-28 w-full">
                <img src={DISCIPLINE_PHOTO[k]} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-michelin-navy/25" />
              </div>
              <CardContent className="flex items-center gap-3 p-4">
                <TyreImage kind={k} className="h-10 w-10 shrink-0" />
                <span className="font-bold text-michelin-navy">{KIND_LABEL[k]}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Concept */}
      <section id="concept" className="mx-auto max-w-6xl px-6 py-16">
        <span className="kicker">Le concept</span>
        <h2 className="mt-4 text-3xl font-black text-michelin-navy">Une app en 2 parties + un club</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <ConceptCard
            title="Trouve ton pneu + Comparateur"
            body="Connexion Strava / Garmin, quelques questions, et une selection personnalisee. Comparateur transparent incluant les concurrents — c'est ca, la preuve."
            tag="L'utilite"
          />
          <ConceptCard
            title="Communaute & emulation"
            body="Compteurs collectifs, pneus des pros, avis verifies par les km, balades de la semaine, statut et parrainage."
            tag="La prescription"
          />
          <ConceptCard
            title="Club Trust Wheels"
            body="Abonnement rider : pneus, chambres a air et goodies, defis premium et statut accelere. La fidelite vient apres la preuve."
            tag="La fidelite"
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function ConceptCard({ title, body, tag }: { title: string; body: string; tag: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <Badge variant="secondary">{tag}</Badge>
        <h3 className="mt-3 text-lg font-bold text-michelin-navy">{title}</h3>
        <p className="mt-2 text-sm text-michelin-ink">{body}</p>
      </CardContent>
    </Card>
  );
}
