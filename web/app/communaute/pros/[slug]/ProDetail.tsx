/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { getTyreImage } from "@/lib/tyre-images";
import type { ProRider } from "@/lib/api";

function tyreCycleType(kind: ReturnType<typeof kindFromText>): string {
  if (kind === "mtb") return "MTB";
  if (kind === "city") return "CITY";
  return "ROAD";
}

/** Vraie photo produit (catalogue) quand on peut la deduire du nom du pneu, sinon icone illustrative. */
function TyrePhoto({ name, className }: { name: string; className?: string }) {
  const kind = kindFromText(name);
  const src = getTyreImage(undefined, tyreCycleType(kind), name);
  if (src) return <img src={src} alt={name} className={className} />;
  return <TyreImage kind={kind} className={className} />;
}

export function ProDetail({ pro }: { pro: ProRider }) {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-10">
          <img src={pro.image} alt={pro.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-veil" />
        </div>
        <div className="pointer-events-none absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-michelin-blue/40 blur-3xl" />
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-32">
          <nav className="flex items-center gap-2 text-xs text-white/70">
            <Link href="/communaute" className="hover:text-white">Communaute</Link>
            <span>/</span>
            <span className="font-semibold text-white">{pro.name}</span>
          </nav>
          <Reveal as="span" delay={60} className="mt-6 inline-block">
            <span className="rounded-pill bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {pro.team}
            </span>
          </Reveal>
          <Reveal as="h1" delay={100} className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            {pro.name}
          </Reveal>
          <Reveal as="p" delay={140} className="mt-2 text-sm font-semibold uppercase tracking-wide text-white/80">
            {pro.discipline}
          </Reveal>
          {pro.bio && (
            <Reveal as="p" delay={180} className="mt-3 max-w-2xl text-base text-white/85">
              {pro.bio}
            </Reveal>
          )}
        </div>
      </section>

      {/* Pneu actuel */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <Reveal className="flex flex-wrap items-center gap-4 rounded-2xl border border-michelin-gray-line bg-michelin-gray-light p-5">
          <TyrePhoto name={pro.tyre} className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain p-1" />
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-michelin-ink/60">Pneu signature</div>
            <div className="text-lg font-bold text-michelin-navy">{pro.tyre}</div>
          </div>
          {pro.productId && (
            <Link
              href={`/produits/${pro.productId}`}
              className="rounded-pill bg-michelin-yellow px-4 py-2 text-sm font-bold text-michelin-navy transition-[filter] hover:brightness-95"
            >
              Voir le pneu →
            </Link>
          )}
        </Reveal>

        {/* Palmares / competitions */}
        <Reveal as="h2" delay={60} className="mt-12 text-2xl font-bold tracking-tight text-michelin-navy">
          Ses pneus en competition
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {pro.competitions.map((c, i) => (
            <Reveal key={c.name} delay={(i % 2) * 80}>
              <Link
                href={c.productId ? `/produits/${c.productId}` : "/produits"}
                className="group flex flex-col rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-michelin-blue hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-michelin-navy">{c.name}</span>
                    {c.date && <div className="mt-0.5 text-xs text-michelin-ink/60">{c.date}</div>}
                  </div>
                  {c.result && (
                    <span className="shrink-0 rounded-pill bg-michelin-yellow/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-michelin-navy">
                      {c.result}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <TyrePhoto name={c.tyre} className="h-12 w-12 shrink-0 rounded-xl bg-michelin-gray-light object-contain p-1" />
                  <span className="text-sm font-semibold text-michelin-blue">{c.tyre}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
