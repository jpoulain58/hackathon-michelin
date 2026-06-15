import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <Link href="/trouve-ton-pneu" className="btn-primary">
          Trouve ton pneu
        </Link>
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
            <Link href="/trouve-ton-pneu" className="btn-primary">
              Trouve ton pneu
            </Link>
            <a href="#concept" className="btn-ghost border-white/30 text-white hover:text-michelin-yellow">
              Decouvrir le concept
            </a>
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
        <p className="mt-8 max-w-3xl text-sm text-michelin-ink">
          L&apos;achat est un <strong>renvoi traçable vers un revendeur</strong> (pas de checkout
          in-app) : Trust Wheels cree le moteur d&apos;achat — utilite + preuve + renvoi — pas la
          transaction.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-michelin-gray-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-michelin-ink sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">
              Powered by Strava
            </span>
            <span>Hackathon ESGI 2026 × Michelin LB 2 Wheels — pas de paiement in-app.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ConceptCard({ title, body, tag }: { title: string; body: string; tag: string }) {
  return (
    <div className="rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-sm">
      <span className="chip">{tag}</span>
      <h3 className="mt-3 text-lg font-bold text-michelin-navy">{title}</h3>
      <p className="mt-2 text-sm text-michelin-ink">{body}</p>
    </div>
  );
}
