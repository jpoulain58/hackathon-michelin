/* eslint-disable @next/next/no-img-element */
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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

      <section className="mx-auto max-w-6xl px-6 py-10">
        <span className="kicker">Actualites</span>
        <h1 className="mt-4 text-4xl font-black text-michelin-navy">Le fil de la communaute</h1>
        <p className="mt-2 max-w-2xl text-michelin-ink">
          Evenements, produits, balades et coulisses : tout ce qui fait rouler Michelin Trust Wheels.
        </p>

        {/* A la une */}
        <Card className="mt-8 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[240px]">
              <img src={FEATURED.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <CardContent className="flex flex-col justify-center gap-3 p-8">
              <div className="flex items-center gap-3">
                <span className="kicker">{FEATURED.category}</span>
                <span className="text-xs font-semibold text-michelin-ink">{FEATURED.date}</span>
              </div>
              <h2 className="text-2xl font-black leading-tight text-michelin-navy">{FEATURED.title}</h2>
              <p className="text-michelin-ink">{FEATURED.excerpt}</p>
              <div>
                <Button className="mt-2">Lire l&apos;article</Button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Grille d'articles */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <Card key={a.title} className="flex flex-col overflow-hidden">
              <div className="relative h-44 w-full">
                <img src={a.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className="kicker absolute left-3 top-3">{a.category}</span>
              </div>
              <CardContent className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-xs font-semibold text-michelin-ink">{a.date}</span>
                <h3 className="text-lg font-bold leading-tight text-michelin-navy">{a.title}</h3>
                <p className="text-sm text-michelin-ink">{a.excerpt}</p>
                <a
                  href="#"
                  className="mt-auto pt-2 text-sm font-semibold text-michelin-blue hover:underline"
                >
                  Lire la suite →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
