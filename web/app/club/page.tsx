/* eslint-disable @next/next/no-img-element */
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const AVANTAGES = [
  "2 pneus Michelin offerts / an",
  "Chambres a air a volonte",
  "Actualites exclusives",
  "10% de reduction chez nos revendeurs partenaires",
];

export default function Club() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Banniere */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/city-rider.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-michelin-navy via-michelin-navy/85 to-michelin-navy/50" />
        </div>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <span className="kicker">Le Club</span>
          <h1 className="mt-4 text-4xl font-black">Le Club Trust Wheels</h1>
          <p className="mt-2 text-white/85">La fidelite vient apres la preuve.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        {/* Offre */}
        <div className="overflow-hidden rounded-2xl border border-michelin-gray-line shadow-sm">
          <div className="bg-michelin-navy p-6 text-white">
            <div className="text-3xl font-black text-michelin-yellow">Club starter</div>
            <div className="mt-1 text-xl font-bold">9 &euro; / mois</div>
          </div>
          <div className="bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-michelin-ink">Mes avantages</h2>
            <ul className="mt-4 space-y-3">
              {AVANTAGES.map((a) => (
                <li key={a} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-michelin-green/10 text-sm font-bold text-michelin-green">
                    &#10003;
                  </span>
                  <span className="text-michelin-navy">{a}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-6 w-full">Rejoindre le Club</Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
