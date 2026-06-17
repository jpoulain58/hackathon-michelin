/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseServer } from "@/lib/supabase/server";

type Article = {
  id: number;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  photo: string | null;
  is_featured: boolean;
  published_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const revalidate = 60;

export default async function Actualites() {
  const { data: articles = [] } = await supabaseServer
    .from("articles")
    .select("id, slug, category, title, excerpt, photo, is_featured, published_at")
    .order("published_at", { ascending: false });

  const featured = articles?.find((a) => a.is_featured) ?? articles?.[0] ?? null;
  const rest = articles?.filter((a) => a !== featured) ?? [];

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-32">
        <Reveal as="span" className="inline-block">
          <span className="kicker">Actualites</span>
        </Reveal>
        <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight text-michelin-navy sm:text-5xl">
          Le fil de la communaute
        </Reveal>
        <Reveal as="p" delay={120} className="mt-3 max-w-2xl text-michelin-ink">
          Evenements, produits, balades et coulisses : tout ce qui fait rouler Michelin Trust Wheels.
        </Reveal>

        {/* A la une : teaser produit dedie (page statique /actualites/power-pulse) */}
        <Reveal delay={120}>
          <Link href="/actualites/power-pulse">
            <Card className="group mt-8 overflow-hidden card-interactive">
              <div className="grid md:grid-cols-2">
                <div className="relative min-h-[260px] overflow-hidden">
                  <img
                    src="/photos/road-sunny.jpg"
                    alt=""
                    className="img-zoom absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="kicker absolute left-4 top-4">A la une</span>
                </div>
                <CardContent className="flex flex-col justify-center gap-3 p-8">
                  <div className="flex items-center gap-3">
                    <span className="kicker">Produit</span>
                    <span className="text-xs font-semibold text-michelin-ink">Bientot · Juillet 2026</span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight tracking-tight text-michelin-navy">
                    MICHELIN Power Pulse : le pneu le plus rapide arrive
                  </h2>
                  <p className="text-michelin-ink">
                    Le nouveau pneu route Michelin sort en juillet 2026. Membres du Club : reservez
                    votre essai en avant-premiere.
                  </p>
                  <div>
                    <Button className="mt-2">Decouvrir &amp; reserver</Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        </Reveal>

        {featured && (
          <Reveal delay={120}>
            <Link href={`/actualites/${featured.slug}`}>
              <Card className="group mt-8 overflow-hidden card-interactive">
                <div className="grid md:grid-cols-2">
                  <div className="relative min-h-[260px] overflow-hidden">
                    {featured.photo && (
                      <img
                        src={featured.photo}
                        alt=""
                        className="img-zoom absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <span className="kicker absolute left-4 top-4">A la une</span>
                  </div>
                  <CardContent className="flex flex-col justify-center gap-3 p-8">
                    <div className="flex items-center gap-3">
                      <span className="kicker">{featured.category}</span>
                      <span className="text-xs font-semibold text-michelin-ink">
                        {formatDate(featured.published_at)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black leading-tight tracking-tight text-michelin-navy">
                      {featured.title}
                    </h2>
                    <p className="text-michelin-ink">{featured.excerpt}</p>
                    <div>
                      <Button className="mt-2">Lire l&apos;article</Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </Reveal>
        )}

        {rest.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a: Article, i: number) => (
              <Reveal key={a.id} delay={(i % 3) * 80} className="h-full">
                <Link href={`/actualites/${a.slug}`} className="h-full">
                  <Card className="group flex h-full flex-col overflow-hidden card-interactive">
                    <div className="relative h-44 w-full overflow-hidden">
                      {a.photo && (
                        <img
                          src={a.photo}
                          alt=""
                          className="img-zoom absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <span className="kicker absolute left-3 top-3">{a.category}</span>
                    </div>
                    <CardContent className="flex flex-1 flex-col gap-2 p-5">
                      <span className="text-xs font-semibold text-michelin-ink">
                        {formatDate(a.published_at)}
                      </span>
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
        )}

        {!featured && (
          <p className="mt-16 text-center text-michelin-ink">Aucun article publié pour l&apos;instant.</p>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
