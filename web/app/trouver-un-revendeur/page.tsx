import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RevendeursExplorer } from "@/components/RevendeursExplorer";

export const metadata: Metadata = {
  title: "Trouver un revendeur | Michelin Trust Wheels",
};

export default function TrouverRevendeurPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-6 sm:pt-32">
        <span className="kicker">Explorer</span>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-michelin-navy sm:text-5xl">
          Trouver un revendeur
        </h1>
        <p className="mt-3 max-w-2xl text-michelin-ink">
          Localise les revendeurs Michelin partenaires près de chez toi. Active ta position pour
          trier par proximité, ou cherche par ville, pays ou enseigne.
        </p>

        <div className="mt-8">
          <RevendeursExplorer />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
