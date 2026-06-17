/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { TyreTestReservation } from "@/components/TyreTestReservation";

export const metadata: Metadata = {
  title: "MICHELIN Power Pulse — bientôt sur route | Trust Wheels",
};

const SPECS = [
  { label: "Poids", value: "215 g" },
  { label: "Section", value: "28 mm" },
  { label: "Montage", value: "Tubeless Ready" },
  { label: "Sortie", value: "Juillet 2026" },
];

const HIGHLIGHTS = [
  {
    titre: "Gomme Pulse Compound",
    desc: "Une nouvelle gomme de course qui gagne en rendement sans rien céder sur le grip, même sur le mouillé.",
  },
  {
    titre: "Protection Race Shield X",
    desc: "Une trame anti-crevaison repensée : la légèreté d'un pneu de course, la tranquillité en plus.",
  },
  {
    titre: "Profil aéro",
    desc: "Un profil optimisé en soufflerie pour s'intégrer parfaitement aux jantes larges d'aujourd'hui.",
  },
];

export default function PowerPulse() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/road-sunny.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-veil" />
        </div>
        <div className="pointer-events-none absolute -right-10 top-10 -z-10 h-72 w-72 rounded-full bg-michelin-yellow/20 blur-3xl animate-float" />
        <div className="mx-auto max-w-4xl px-6 py-24">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/70">
            <Link href="/actualites" className="transition-colors hover:text-michelin-yellow">
              Actualités
            </Link>
            <span>/</span>
            <span className="font-medium text-white">Produit</span>
          </nav>
          <Reveal as="span" className="inline-block">
            <span className="kicker">Bientôt sur route</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            MICHELIN Power Pulse
          </Reveal>
          <Reveal as="p" delay={120} className="mt-4 max-w-2xl text-lg text-white/85">
            Le pneu route le plus rapide jamais conçu par Michelin arrive en{" "}
            <strong className="text-white">juillet 2026</strong>. Et les membres du Club le testent
            avant tout le monde.
          </Reveal>
        </div>
      </section>

      {/* Specs */}
      <section className="border-b border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-4">
          {SPECS.map((s, i) => (
            <Reveal key={s.label} delay={i * 60} className="text-center">
              <div className="text-2xl font-black text-michelin-blue">{s.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-michelin-ink">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contenu */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <Reveal as="h2" className="text-2xl font-black tracking-tight text-michelin-navy sm:text-3xl">
          Conçu pour aller (vraiment) plus vite
        </Reveal>
        <Reveal as="p" delay={60} className="mt-3 text-michelin-ink">
          Trois ans de développement, des centaines de milliers de kilomètres de tests, et une
          obsession : faire gagner des watts sans jamais transiger sur la sécurité. Le Power Pulse
          est notre pneu de course le plus abouti, pensé pour les routes et les jantes
          d&apos;aujourd&apos;hui.
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal
              as="article"
              key={h.titre}
              delay={i * 80}
              className="rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft card-interactive"
            >
              <h3 className="font-bold text-michelin-navy">{h.titre}</h3>
              <p className="mt-2 text-sm text-michelin-ink">{h.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Réservation Programme Testeur */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <TyreTestReservation tyreSlug="power-pulse" tyreName="MICHELIN Power Pulse" />
        <div className="mt-8">
          <Link href="/actualites" className="text-sm font-semibold text-michelin-blue link-underline">
            ← Retour aux actualités
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
