import Link from "next/link";
import { Brand } from "@/components/Brand";
import { TyreImage, KIND_LABEL, type TyreKind } from "@/components/TyreImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Accueil() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/accueil">
          <Brand />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-michelin-blue">
          <Link href="/communaute" className="hidden hover:underline sm:inline">Communaute</Link>
          <Link href="/balades" className="hidden hover:underline sm:inline">Balades</Link>
          <Link href="/club" className="hidden hover:underline sm:inline">Club</Link>
          <Button asChild size="sm">
            <Link href="/trouve-ton-pneu">Trouve ton pneu</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-michelin-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="h-1 w-16 bg-michelin-yellow" />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            La preuve par la route.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
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
              className="border border-white/30 text-white hover:bg-white/10 hover:text-michelin-yellow"
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
              <div className="text-3xl font-bold text-michelin-blue">{s.k}</div>
              <div className="mt-1 text-sm text-michelin-ink">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Disciplines */}
      <section className="mx-auto max-w-6xl px-6 pt-14">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-michelin-ink">
          Un pneu pour chaque terrain
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["road", "gravel", "mtb", "city"] as TyreKind[]).map((k) => (
            <Card key={k} className="flex flex-col items-center gap-2 p-5">
              <TyreImage kind={k} className="h-20 w-20" />
              <span className="text-sm font-semibold text-michelin-navy">{KIND_LABEL[k]}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Concept */}
      <section id="concept" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-michelin-navy">Une app en 2 parties + un club</h2>
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

      {/* Footer */}
      <footer className="border-t border-michelin-gray-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-michelin-ink sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">
              Powered by Strava
            </span>
            <Link href="/" className="hover:underline">Se deconnecter</Link>
          </div>
        </div>
      </footer>
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
