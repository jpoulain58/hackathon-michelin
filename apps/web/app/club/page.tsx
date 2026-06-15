import Link from "next/link";
import { Brand } from "@/components/Brand";

const AVANTAGES = [
  "2 pneus Michelin offerts / an",
  "Chambres a air a volonte",
  "Actualites exclusives",
  "10% de reduction chez nos revendeurs partenaires",
];

export default function Club() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Brand />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-michelin-blue">
          <Link href="/communaute" className="hidden hover:underline sm:inline">Communaute</Link>
          <Link href="/trouve-ton-pneu" className="btn-primary">Trouve ton pneu</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-8">
        <div className="h-1 w-12 bg-michelin-yellow" />
        <h1 className="mt-4 text-3xl font-bold text-michelin-navy">Le Club Trust Wheels</h1>
        <p className="mt-1 text-michelin-ink">La fidelite vient apres la preuve.</p>

        {/* Offre */}
        <div className="mt-6 rounded-2xl bg-michelin-navy p-6 text-white shadow-sm">
          <div className="text-3xl font-bold text-michelin-yellow">Club starter</div>
          <div className="mt-1 text-xl font-bold">9 &euro; / mois</div>
        </div>

        {/* Avantages */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-michelin-ink">Mes avantages</h2>
        <ul className="mt-4 space-y-3">
          {AVANTAGES.map((a) => (
            <li key={a} className="flex items-center gap-3 rounded-2xl border border-michelin-gray-line bg-white p-4 shadow-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-michelin-green/10 text-sm font-bold text-michelin-green">
                &#10003;
              </span>
              <span className="text-michelin-navy">{a}</span>
            </li>
          ))}
        </ul>

        <button className="btn-primary mt-8 w-full">Rejoindre le Club</button>
        <p className="mt-3 text-center text-xs text-michelin-ink">
          Demo — l&apos;abonnement se finalise hors application (pas de paiement in-app).
        </p>
      </section>
    </main>
  );
}
