/* eslint-disable @next/next/no-img-element */
import { AuthPanel } from "@/components/AuthPanel";

export default function Welcome() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden">
      {/* Fond : photo vélo + voile sombre pour le contraste */}
      <div className="absolute inset-0 -z-10">
        <img src="/velo-bg.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-michelin-navy/70 via-michelin-navy/55 to-michelin-navy/90" />
      </div>

      {/* Logo */}
      <header className="px-6 pt-10">
        <span className="inline-flex items-center rounded-pill bg-white/95 px-4 py-2.5 shadow-sm">
          <img src="/trust-wheels-logo.png" alt="Michelin Trust Wheels" className="h-9 w-auto" />
        </span>
      </header>

      {/* Accroche */}
      <section className="px-6 text-white">
        <div className="mx-auto max-w-md">
          <div className="h-1 w-16 bg-michelin-yellow" />
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">La preuve par la route.</h1>
          <p className="mt-4 text-lg text-white/85">
            Trouve ton pneu, compare, et rejoins la communauté qui transforme ses kilomètres en preuve.
          </p>
        </div>
      </section>

      {/* Connexion */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-md">
          <AuthPanel />
        </div>
      </section>
    </main>
  );
}
