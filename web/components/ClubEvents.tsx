import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { EVENEMENTS } from "@/lib/evenements";

export function ClubEvents() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Reveal as="span" className="inline-block">
        <span className="kicker">Évènements</span>
      </Reveal>
      <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
        Évènements en cours
      </Reveal>
      <Reveal as="p" delay={120} className="mt-2 max-w-2xl text-michelin-ink">
        Participe aux challenges et jeux concours du Club pour tenter de remporter des
        recompenses exclusives.
      </Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {EVENEMENTS.map((e, i) => (
          <Reveal
            as="article"
            key={e.id}
            delay={i * 80}
            className="flex flex-col rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft card-interactive"
          >
            <span className="chip self-start">{e.badge}</span>
            <h3 className="mt-3 font-bold text-michelin-navy">{e.title}</h3>
            <p className="mt-2 flex-1 text-sm text-michelin-ink">{e.summary}</p>
            <p className="mt-3 text-xs font-bold text-michelin-blue">🏆 {e.reward}</p>
            <p className="mt-1 text-xs font-medium text-michelin-ink/60">{e.dateRange}</p>
            <Link
              href={`/club/evenements/${e.id}`}
              className="mt-5 inline-block self-start rounded-pill bg-michelin-navy px-4 py-2 text-xs font-bold text-white transition-[filter] hover:brightness-110"
            >
              Voir l&apos;évènement →
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
