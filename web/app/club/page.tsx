/* eslint-disable @next/next/no-img-element */
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { ClubMembership } from "@/components/ClubMembership";

// Etapes du Programme Testeur (avantage phare du Club).
const PROGRAMME = [
  {
    titre: "Recois en avant-premiere",
    desc: "Les nouveaux pneus Michelin t'arrivent avant leur sortie publique, livres chez toi.",
  },
  {
    titre: "Teste sur la route",
    desc: "Pas un labo : ton terrain, ta meteo, tes kilometres. La preuve par la route, pour de vrai.",
  },
  {
    titre: "Partage ta preuve",
    desc: "Ton avis verifie (km Strava a l'appui) guide la communaute et nourrit la R&D Michelin.",
  },
];

// Donnees mock du "Garage connecte" (estimation d'usure basee sur les km).
const GARAGE = [
  { label: "Pneu avant", tyre: "Power Cup", km: "1 240 km", life: 78 },
  { label: "Pneu arriere", tyre: "Power Cup", km: "1 240 km", life: 54 },
];

function lifeColor(life: number) {
  if (life > 50) return "bg-michelin-green";
  if (life > 20) return "bg-michelin-yellow";
  return "bg-destructive";
}

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
            La fidelite vient apres la preuve. Roule, teste, et fais partie de ceux qui font avancer
            Michelin.
          </Reveal>
        </div>
      </section>

      {/* Offre + adhesion */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <ClubMembership />
      </section>

      {/* Programme Testeur */}
      <section className="tread-pattern border-t border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Exclusif membres</span>
          </Reveal>
          <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
            Le Programme Testeur Michelin
          </Reveal>
          <Reveal as="p" delay={120} className="mt-2 max-w-2xl text-michelin-ink">
            Les membres du Club deviennent les testeurs officiels des nouveaux pneus. Tu roules, tu
            partages, Michelin ecoute.
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PROGRAMME.map((p, i) => (
              <Reveal
                as="article"
                key={p.titre}
                delay={i * 80}
                className="rounded-2xl border border-michelin-gray-line bg-white p-6 shadow-soft card-interactive"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-michelin-blue text-sm font-black text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-bold text-michelin-navy">{p.titre}</h3>
                <p className="mt-2 text-sm text-michelin-ink">{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mon Garage connecte */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal as="span" className="inline-block">
              <span className="kicker">Inclus dans le Club</span>
            </Reveal>
            <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
              Mon Garage connecte
            </Reveal>
            <Reveal as="p" delay={120} className="mt-2 text-michelin-ink">
              On relie tes kilometres Strava a tes pneus pour estimer leur usure en temps reel. Tu
              sais exactement quand changer, et tu gardes l&apos;historique de tout ce que tu as
              roule.
            </Reveal>
          </div>

          <Reveal delay={120} className="rounded-3xl border border-michelin-gray-line bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="font-bold text-michelin-navy">Mon velo route</span>
              <span className="chip">Synchronise Strava</span>
            </div>
            <div className="mt-5 space-y-5">
              {GARAGE.map((g) => (
                <div key={g.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-michelin-navy">{g.label}</span>
                    <span className="text-michelin-ink">
                      {g.tyre} &middot; {g.km}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-pill bg-michelin-gray-line">
                    <div
                      className={`h-full rounded-pill ${lifeColor(g.life)}`}
                      style={{ width: `${g.life}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs font-medium text-michelin-ink">
                    {g.life}% de vie restante
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
