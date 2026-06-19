/* eslint-disable @next/next/no-img-element */
import { AuthPanel } from "@/components/AuthPanel";
import { Reveal } from "@/components/Reveal";

export default function Connexion() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src="/velo-bg.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 hero-veil" />
      </div>
      <div className="pointer-events-none absolute -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-michelin-blue/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-24 -z-10 h-64 w-64 rounded-full bg-michelin-yellow/20 blur-3xl animate-float" />

      <header className="px-6 pt-10">
        <Reveal as="span" className="inline-flex rounded-pill bg-white/95 px-4 py-2.5 shadow-soft">
          <img src="/logo_a_utiliser.png" alt="Michelin Trust Wheels" className="h-9 w-auto" />
        </Reveal>
      </header>

      <section className="px-6 text-white">
        <div className="mx-auto max-w-md">
          <Reveal className="h-1 w-16 bg-michelin-yellow" />
          <Reveal as="h1" delay={80} className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            La preuve <span className="text-michelin-yellow">par la route.</span>
          </Reveal>
          <Reveal as="p" delay={150} className="mt-4 text-lg text-white/85">
            Trouve ton pneu, compare, et rejoins la communauté qui transforme ses kilomètres en preuve.
          </Reveal>
        </div>
      </section>

      <section className="px-6 pb-12">
        <Reveal delay={220} className="mx-auto max-w-md">
          <AuthPanel />
        </Reveal>
      </section>
    </main>
  );
}
