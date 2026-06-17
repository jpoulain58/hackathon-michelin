/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;

type Product = {
  id: number;
  designation: string;
  range: string;
  cycle_type: string;
  segment: string;
  use: string[];
  terrain_types: string[];
  weight_g: number | null;
};

type Params = { slug: string };

export async function generateStaticParams() {
  const { data } = await supabaseServer.from("articles").select("slug");
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const { data: article } = await supabaseServer
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!article) notFound();

  // Pneus liés via service role
  const { data: rows } = await supabaseAdmin
    .from("article_products")
    .select("position, products(id, designation, range, cycle_type, segment, use, terrain_types, weight_g)")
    .eq("article_id", article.id)
    .order("position");

  const products: Product[] = (rows ?? []).map((r: any) => r.products).filter(Boolean);

  const formattedDate = new Date(article.published_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-michelin-ink">
          <Link href="/actualites" className="hover:text-michelin-blue transition-colors">
            Actualités
          </Link>
          <span>/</span>
          <span className="text-michelin-navy font-medium">{article.category}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="kicker">{article.category}</span>
          <span className="text-xs font-semibold text-michelin-ink">{formattedDate}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-michelin-navy sm:text-4xl leading-tight">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-michelin-ink">{article.excerpt}</p>

        {/* Photo */}
        {article.photo && (
          <div className="mt-8 overflow-hidden rounded-xl">
            <img
              src={article.photo}
              alt=""
              className="w-full h-64 object-cover sm:h-80"
            />
          </div>
        )}

        {/* Contenu Markdown */}
        <div className="prose prose-neutral mt-10 max-w-none
          prose-headings:font-black prose-headings:text-michelin-navy prose-headings:tracking-tight
          prose-a:text-michelin-blue prose-a:no-underline hover:prose-a:underline
          prose-strong:text-michelin-navy
          prose-li:text-michelin-ink prose-p:text-michelin-ink">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Pneus liés */}
        {products.length > 0 && (
          <section className="mt-14 border-t border-neutral-200 pt-10">
            <h2 className="text-xl font-black text-michelin-navy tracking-tight mb-6">
              Pneus mentionnés dans cet article
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-neutral-200 bg-white p-5 flex flex-col gap-1"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-michelin-blue">
                    {p.range}
                  </span>
                  <span className="font-bold text-michelin-navy text-base">{p.designation}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.cycle_type && (
                      <span className="kicker">{p.cycle_type}</span>
                    )}
                    {p.terrain_types?.map((t) => (
                      <span key={t} className="kicker">{t}</span>
                    ))}
                    {p.weight_g && (
                      <span className="text-xs text-michelin-ink">{p.weight_g} g</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Retour */}
        <div className="mt-12">
          <Link
            href="/actualites"
            className="text-sm font-semibold text-michelin-blue link-underline"
          >
            ← Retour aux actualités
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
