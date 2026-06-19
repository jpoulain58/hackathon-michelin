/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseServer } from "@/lib/supabase/server";
import { listRecentReviews, type ProductReview } from "@/lib/reviews";
import { fetchPros, fetchStats, FALLBACK_PROS, FALLBACK_STATS, type ProRider } from "@/lib/api";

export const revalidate = 60;

type Article = {
  id: number;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  photo: string | null;
  published_at: string;
};

const CLUB_HIGHLIGHTS = [
  "Programme Testeur : recois les pneus en avant-premiere",
  "Garage connecte : suis l'usure de tes pneus en temps reel",
  "Statut accelere et goodies reserves aux membres",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function SectionHeader({
  kicker,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Reveal as="span" className="inline-block">
          <span className="kicker">{kicker}</span>
        </Reveal>
        <Reveal as="h2" delay={60} className="mt-4 text-2xl font-bold tracking-tight text-michelin-navy sm:text-3xl">
          {title}
        </Reveal>
        {subtitle && (
          <Reveal as="p" delay={100} className="mt-1 max-w-2xl text-sm text-michelin-ink">
            {subtitle}
          </Reveal>
        )}
      </div>
      <Link href={href} className="shrink-0 text-sm font-semibold text-michelin-blue hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

export default async function Accueil() {
  const [stats, reviewsResult, prosResult, articlesResult] = await Promise.all([
    fetchStats().catch(() => FALLBACK_STATS),
    listRecentReviews(3).catch(() => ({ items: [] as ProductReview[], count: 0 })),
    fetchPros()
      .then((items) => items.slice(0, 3))
      .catch(() => FALLBACK_PROS.slice(0, 3)),
    supabaseServer
      .from("articles")
      .select("id, slug, category, title, excerpt, photo, published_at")
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  const reviews: ProductReview[] = reviewsResult.items;
  const reviewCount: number = reviewsResult.count;
  const pros: ProRider[] = prosResult;
  const articles: Article[] = articlesResult.data ?? [];

  const STATS_DISPLAY = [
    { value: stats.totalKm, suffix: " km", v: "roules par le peloton Michelin" },
    { value: stats.ridersCount, suffix: "", v: "riders dans la communaute" },
    { value: reviewCount, suffix: "", v: "avis publies par de vrais utilisateurs" },
  ];

  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero avec photo (Ken Burns) + voile en degrade + halos diffus + fondu vers la page */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="/photos/hero-road.jpg"
            alt=""
            className="h-full w-full origin-center scale-105 object-cover animate-kenburns"
          />
          <div className="absolute inset-0 hero-veil" />
          {/* Fondu doux vers le fond de page : evite la coupure nette entre le hero et la suite */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />
        </div>
        <div className="pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-michelin-blue/40 blur-3xl animate-float" />
        <div
          className="pointer-events-none absolute right-10 top-1/3 -z-10 h-56 w-56 rounded-full bg-michelin-yellow/20 blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-36 text-white sm:pb-28 sm:pt-40">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Michelin Trust Wheels</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-5 max-w-3xl text-5xl font-black leading-[1.03] tracking-tight sm:text-7xl">
            La preuve <span className="text-michelin-yellow">par la route.</span>
          </Reveal>
          <Reveal as="p" delay={120} className="mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
            Michelin a des produits d&apos;exception, mais{" "}
            <strong className="text-white">1 avis quand Continental en a 100</strong>. Trust Wheels
            transforme les riders Michelin en prescripteurs, et leurs kilometres en preuve sociale
            que personne ne peut egaler.
          </Reveal>
          <Reveal delay={180} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="transition-transform duration-200 ease-out-strong hover:scale-[1.04]">
              <Link href="/trouve-ton-pneu">Trouve ton pneu</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="border border-white/40 text-white transition-transform duration-200 ease-out-strong hover:scale-[1.04] hover:bg-white/10 hover:text-michelin-yellow"
            >
              <Link href="/club">Accèder au club</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Le Club — section dediee, juste apres le hero, sur fond clair (pas de chevauchement photo-sur-photo) */}
      <section className="relative overflow-hidden bg-white px-6 pb-8 pt-4 sm:pt-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Card className="shine group relative overflow-hidden border-michelin-blue/20 bg-michelin-navy mesh-navy text-white shadow-lift transition-[box-shadow,transform] duration-300 ease-out-strong hover:-translate-y-1 hover:shadow-glow">
              <div className="h-1 w-full bg-gradient-to-r from-michelin-blue via-michelin-yellow to-michelin-blue" />
              <span className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-michelin-yellow/20 blur-3xl animate-float" />
              <span
                className="pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-michelin-blue/30 blur-3xl animate-float"
                style={{ animationDelay: "2s" }}
              />
              <CardContent className="grid gap-0 p-0 sm:grid-cols-2">
                <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                  <Reveal as="span" className="inline-block">
                    <span className="kicker">Le Club</span>
                  </Reveal>
                  <Reveal as="h2" delay={60} className="text-3xl font-black tracking-tight sm:text-4xl">
                    Le Club Trust Wheels
                  </Reveal>
                  <Reveal as="p" delay={100} className="max-w-md text-white/80">
                    La fidelite vient apres la preuve. Roule, teste, et fais partie de ceux qui font
                    avancer Michelin.
                  </Reveal>
                  <ul className="flex flex-col gap-2.5 rounded-[1.45rem] border border-white/10 bg-white/[0.06] p-4">
                    {CLUB_HIGHLIGHTS.map((h, i) => (
                      <Reveal key={h} as="li" delay={140 + i * 80} className="flex items-start gap-2.5 text-sm text-white/85">
                        <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-michelin-yellow" fill="currentColor">
                          <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.4 0L3.3 9.5a1 1 0 1 1 1.4-1.4L8 11.4l6.7-6.7a1 1 0 0 1 1.4 0Z" />
                        </svg>
                        {h}
                      </Reveal>
                    ))}
                  </ul>
                  <Reveal delay={420}>
                    <Button asChild size="lg" className="mt-2 w-fit transition-transform duration-200 ease-out-strong hover:scale-[1.04]">
                      <Link href="/club">Decouvrir le Club →</Link>
                    </Button>
                  </Reveal>
                </div>
                <div className="relative hidden min-h-[22rem] overflow-hidden sm:block">
                  <img
                    src="/photos/city-rider.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full scale-100 object-cover transition-transform duration-700 ease-out-strong animate-kenburns group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-michelin-navy via-michelin-navy/10 to-transparent sm:from-michelin-navy/90" />
                  <Reveal delay={300} className="absolute bottom-4 left-4 right-4">
                    <div className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-michelin-yellow animate-pulse" />
                      2 pneus Michelin offerts / an aux membres
                    </div>
                  </Reveal>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Intro communaute — titre explicatif avant compteurs / avis / pros */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-8 text-center">
        <Reveal as="span" className="inline-block">
          <span className="kicker">La communaute</span>
        </Reveal>
        <Reveal as="h2" delay={60} className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight text-michelin-navy sm:text-4xl">
          Des milliers de riders qui roulent, testent et partagent
        </Reveal>
        <Reveal as="p" delay={100} className="mx-auto mt-3 max-w-xl text-michelin-ink">
          Chaque kilometre, chaque avis et chaque pro qui roule Michelin nourrit la preuve sociale de
          Trust Wheels.
        </Reveal>
      </section>

      {/* Compteurs collectifs */}
      <section className="tread-pattern border-b border-michelin-gray-line bg-michelin-gray-light">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-12 sm:grid-cols-3">
          {STATS_DISPLAY.map((s, i) => (
            <Reveal
              key={s.v}
              delay={i * 80}
              className="group rounded-2xl border border-michelin-gray-line bg-white/70 p-5 shadow-soft card-interactive"
            >
              <div className="h-1 w-10 rounded-pill bg-michelin-yellow transition-[width] duration-500 ease-out-strong group-hover:w-16" />
              <div className="mt-3 text-4xl font-black text-gradient-blue">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-sm text-michelin-ink">{s.v}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Trouve ton pneu — feature phare */}
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <Reveal>
          <Card className="shine group relative overflow-hidden border-michelin-blue/20 bg-michelin-navy mesh-navy text-white transition-[box-shadow,transform] duration-300 ease-out-strong hover:-translate-y-1 hover:shadow-glow">
            <div className="h-1 w-full bg-gradient-to-r from-michelin-blue via-michelin-yellow to-michelin-blue" />
            <span className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-michelin-yellow/20 blur-3xl animate-float" />
            <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="kicker">L&apos;outil phare</span>
                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  Trouve ton pneu en 2 minutes
                </h2>
                <p className="mt-2 max-w-xl text-white/80">
                  Connecte ton Strava ou reponds a quelques questions : terrain, priorite, budget.
                  On te propose la selection Michelin qui te correspond, et un comparateur honnete.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0 transition-transform duration-200 ease-out-strong hover:scale-[1.04]">
                <Link href="/trouve-ton-pneu">Lancer le quiz →</Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* Avis de la communaute */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <SectionHeader
            kicker="La preuve sociale"
            title="Les derniers avis de la communaute"
            subtitle="Ce que les riders pensent vraiment de leurs pneus, en direct de la communaute."
            href="/communaute"
            linkLabel="Voir tous les avis"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal as="article" key={r.id} delay={(i % 3) * 70} className="rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-soft card-interactive">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-michelin-navy">{r.riderName}</span>
                  {r.isAmbassador && (
                    <span className="rounded-pill bg-michelin-yellow/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-michelin-navy">
                      Ambassadeur
                    </span>
                  )}
                </div>
                {r.tyre && (
                  <div className="mt-1 flex items-center gap-2">
                    <TyreImage kind={kindFromText(r.tyre)} className="h-7 w-7 shrink-0" />
                    <span className="text-sm font-semibold text-michelin-blue">{r.tyre}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1" aria-label={`Avis, ${r.rating} sur 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-2 w-2 rounded-full ${n <= r.rating ? "bg-michelin-blue" : "bg-michelin-gray-line"}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-michelin-navy">&laquo; {r.text} &raquo;</p>
                <p className="mt-3 text-xs text-michelin-ink/50">{formatDate(r.createdAt)}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Pneus des pros */}
      {pros.length > 0 && (
        <section className="tread-pattern border-y border-michelin-gray-line bg-michelin-gray-light">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <SectionHeader
              kicker="Ils roulent Michelin"
              title="Les pneus des pros"
              subtitle="Vois ce que roulent les pros et les riders comme toi."
              href="/communaute"
              linkLabel="Voir tous les pros"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pros.map((p, i) => (
                <Reveal key={p.slug ?? p.name} delay={(i % 3) * 70}>
                  <Link
                    href={p.slug ? `/communaute/pros/${p.slug}` : p.productId ? `/produits/${p.productId}` : "/produits"}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-soft transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out-strong group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-michelin-gray-light">
                        <TyreImage kind={kindFromText(p.tyre)} className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-michelin-navy/90 via-michelin-navy/20 to-transparent" />
                    <span className="absolute right-3 top-3 rounded-pill bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-michelin-navy backdrop-blur-sm">
                      {p.team}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">{p.discipline}</div>
                      <div className="text-lg font-bold text-white">{p.name}</div>
                      <span className="mt-2 inline-block rounded-pill bg-michelin-yellow px-3 py-1 text-xs font-bold text-michelin-navy transition-[filter] group-hover:brightness-95">
                        Voir sa fiche →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Derniers articles */}
      {articles.length > 0 && (
        <section className="relative overflow-hidden border-y border-michelin-gray-line bg-gradient-to-b from-white to-michelin-blue/[0.06]">
          <div className="pointer-events-none absolute -right-20 top-0 -z-0 h-72 w-72 rounded-full bg-michelin-yellow/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-6 py-16">
            <SectionHeader
              kicker="Actualites"
              title="Les derniers articles"
              subtitle="Evenements, produits, balades et coulisses de Michelin Trust Wheels."
              href="/actualites"
              linkLabel="Tous les articles"
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {articles.map((a, i) => (
                <Reveal key={a.id} delay={i * 70} className="h-full">
                  <Link href={`/actualites/${a.slug}`} className="h-full">
                    <Card className="group flex h-full flex-col overflow-hidden card-interactive">
                      <div className="relative h-40 w-full overflow-hidden">
                        {a.photo && (
                          <img src={a.photo} alt="" className="img-zoom absolute inset-0 h-full w-full object-cover" />
                        )}
                        <span className="kicker absolute left-3 top-3">{a.category}</span>
                      </div>
                      <CardContent className="flex flex-1 flex-col gap-2 p-5">
                        <span className="text-xs font-semibold text-michelin-ink">{formatDate(a.published_at)}</span>
                        <h3 className="text-lg font-bold leading-tight text-michelin-navy">{a.title}</h3>
                        <p className="text-sm text-michelin-ink">{a.excerpt}</p>
                        <span className="link-underline mt-auto w-fit pt-2 text-sm font-semibold text-michelin-blue">
                          Lire la suite →
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
