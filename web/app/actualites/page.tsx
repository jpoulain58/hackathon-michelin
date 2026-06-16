/* eslint-disable @next/next/no-img-element */
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Article = {
  category: string;
  date: string;
  title: string;
  excerpt: string;
  photo: string;
};

const FEATURED: Article = {
  category: "Evenement",
  date: "12 juin 2026",
  title: "Trust Wheels x Tour de France : la caravane connectee",
  excerpt:
    "Cet ete, la communaute prend la route du Tour. Scanne les bornes Trust Wheels sur les etapes, debloque des defis et fais grimper tes kilometres verifies au classement collectif.",
  photo: "/photos/peloton.jpg",
};

const ARTICLES: Article[] = [
  {
    category: "Produit",
    date: "8 juin 2026",
    title: "Power Cup : 3 920 km verifies, le verdict des riders",
    excerpt:
      "Rendement, accroche, longevite : on a compile les avis adosses aux vrais kilometres Strava. Le pneu route le plus recommande de la communaute ce mois-ci.",
    photo: "/photos/bike-road.jpg",
  },
  {
    category: "Balades",
    date: "5 juin 2026",
    title: "Gravel Series 2026 : 5 etapes, 1 pneu conseille par terrain",
    excerpt:
      "Du chemin blanc au single technique, decouvre les itineraires de la saison et la recommandation Michelin adaptee a chaque profil.",
    photo: "/photos/trail.jpg",
  },
  {
    category: "Communaute",
    date: "1 juin 2026",
    title: "Pauline Ferrand-Prevot partage ses sorties avec la communaute",
    excerpt:
      "La championne ouvre ses traces et ses choix de pneus. La preuve par la route, du peloton pro jusqu'a ton garage.",
    photo: "/photos/community-duo.jpg",
  },
  {
    category: "Coulisses",
    date: "28 mai 2026",
    title: "Comment on verifie un avis avec tes kilometres Strava",
    excerpt:
      "Pas d'avis sans preuve : on explique comment les sorties, terrains et distances rendent chaque retour credible et impossible a falsifier.",
    photo: "/photos/road-forest.jpg",
  },
  {
    category: "Club",
    date: "22 mai 2026",
    title: "Le Club Trust Wheels ouvre ses portes",
    excerpt:
      "Pneus offerts, chambres a air a volonte et defis premium : l'abonnement rider qui recompense ta fidelite, apres la preuve.",
    photo: "/photos/city-rider.jpg",
  },
];

export default function Actualites() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Actualites</span>
        </Reveal>
        <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight text-michelin-navy sm:text-5xl">
          Le fil de la communaute
        </Reveal>
        <Reveal as="p" delay={120} className="mt-3 max-w-2xl text-michelin-ink">
          Evenements, produits, balades et coulisses : tout ce qui fait rouler Michelin Trust Wheels.
        </Reveal>

        {/* A la une */}
        <Reveal delay={120}>
          <Card className="group mt-8 overflow-hidden card-interactive">
            <div className="grid md:grid-cols-2">
              <div className="relative min-h-[260px] overflow-hidden">
                <img src={FEATURED.photo} alt="" className="img-zoom absolute inset-0 h-full w-full object-cover" />
                <span className="kicker absolute left-4 top-4">A la une</span>
              </div>
              <CardContent className="flex flex-col justify-center gap-3 p-8">
                <div className="flex items-center gap-3">
                  <span className="kicker">{FEATURED.category}</span>
                  <span className="text-xs font-semibold text-michelin-ink">{FEATURED.date}</span>
                </div>
                <h2 className="text-2xl font-black leading-tight tracking-tight text-michelin-navy">{FEATURED.title}</h2>
                <p className="text-michelin-ink">{FEATURED.excerpt}</p>
                <div>
                  <Button className="mt-2">Lire l&apos;article</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </Reveal>

        {/* Grille d'articles */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a, i) => (
            <Reveal key={a.title} delay={(i % 3) * 80} className="h-full">
              <Card className="group flex h-full flex-col overflow-hidden card-interactive">
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={a.photo} alt="" className="img-zoom absolute inset-0 h-full w-full object-cover" />
                  <span className="kicker absolute left-3 top-3">{a.category}</span>
                </div>
                <CardContent className="flex flex-1 flex-col gap-2 p-5">
                  <span className="text-xs font-semibold text-michelin-ink">{a.date}</span>
                  <h3 className="text-lg font-bold leading-tight text-michelin-navy">{a.title}</h3>
                  <p className="text-sm text-michelin-ink">{a.excerpt}</p>
                  <a
                    href="#"
                    className="link-underline mt-auto w-fit pt-2 text-sm font-semibold text-michelin-blue"
                  >
                    Lire la suite →
                  </a>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
