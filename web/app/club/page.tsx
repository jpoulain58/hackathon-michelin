/* eslint-disable @next/next/no-img-element */
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
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
          <div className="absolute inset-0 hero-veil" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-michelin-yellow/20 blur-3xl animate-float" />
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Le Club</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Le Club Trust Wheels
          </Reveal>
          <Reveal as="p" delay={120} className="mt-3 text-lg text-white/85">
            La fidelite vient apres la preuve.
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        {/* Offre */}
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-michelin-gray-line shadow-soft card-interactive">
            <div className="shine relative overflow-hidden bg-michelin-navy p-7 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-michelin-blue/40 blur-3xl" />
              <div className="relative text-3xl font-black text-michelin-yellow">Club starter</div>
              <div className="relative mt-1 text-xl font-bold">9 &euro; / mois</div>
            </div>
            <div className="bg-white p-7">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-michelin-ink">Mes avantages</h2>
              <ul className="mt-4 space-y-3">
                {AVANTAGES.map((a, i) => (
                  <Reveal as="li" key={a} delay={i * 70} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-michelin-green/10 text-sm font-bold text-michelin-green">
                      &#10003;
                    </span>
                    <span className="text-michelin-navy">{a}</span>
                  </Reveal>
                ))}
              </ul>
              <Button size="lg" className="mt-7 w-full">Rejoindre le Club</Button>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
