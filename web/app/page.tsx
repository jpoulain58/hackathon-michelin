/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

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
        <div className="mx-auto max-w-md space-y-3">
          <Link
            href="/accueil"
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-[#FC5200] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            <StravaGlyph />
            Continuer avec Strava
          </Link>
          <Link
            href="/accueil"
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-white px-6 py-3.5 font-semibold text-michelin-navy shadow-sm transition hover:bg-michelin-gray-light"
          >
            Continuer avec Garmin
          </Link>
          <Link
            href="/accueil"
            className="flex w-full items-center justify-center gap-2 rounded-pill border border-white/50 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
          >
            Continuer avec un e-mail
          </Link>
        </div>
      </section>
    </main>
  );
}

function StravaGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 6 14h3.6L12 9.2 14.4 14H18L12 2zm2.4 12-1.8 3.6L10.8 14H8.4L12.6 22l4.2-8h-2.4z" />
    </svg>
  );
}
