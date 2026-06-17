/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRightIcon,
  ExitIcon,
  LightningBoltIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { SignOutButton } from "./SignOutButton";

const FOOTER_GROUPS = [
  {
    title: "Outils",
    links: [
      { href: "/trouve-ton-pneu", label: "Trouve ton pneu" },
      { href: "/comparateur", label: "Comparateur" },
      { href: "/produits", label: "Produits" },
    ],
  },
  {
    title: "Communauté",
    links: [
      { href: "/communaute", label: "Avis vérifiés" },
      { href: "/balades", label: "Balades" },
      { href: "/actualites", label: "Actualités" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-michelin-navy text-white">
      <div className="h-1 w-full bg-gradient-to-r from-michelin-blue via-michelin-yellow to-michelin-blue" />
      <div className="pointer-events-none absolute inset-0 opacity-90 mesh-navy" />
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-michelin-blue/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-michelin-yellow/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_0.9fr] lg:items-stretch">
          <section className="liquid-footer-panel p-4 sm:p-6">
            <img
              src="/trust-wheels-logo-footer.png"
              alt="Michelin Trust Wheels"
              className="h-14 w-auto sm:h-16"
            />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/72 sm:mt-5">
              La preuve par la route. Trust Wheels transforme les kilomètres des riders en avis fiables, comparables et utiles.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              <span className="inline-flex items-center gap-2 rounded-pill bg-[#FC5200] px-3 py-1.5 text-xs font-black text-white">
                <LightningBoltIcon className="h-3.5 w-3.5" />
                Powered by Strava
              </span>
              <span className="inline-flex rounded-pill border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                Michelin LB 2 Wheels
              </span>
            </div>
          </section>

          <section className="grid gap-4 rounded-[1.45rem] border border-white/10 bg-white/[0.06] p-4 sm:grid-cols-2 sm:p-6">
            {FOOTER_GROUPS.map((group) => (
              <nav key={group.title} className="space-y-3" aria-label={group.title}>
                <h2 className="text-xs font-black uppercase tracking-wide text-white/45">{group.title}</h2>
                <div className="grid gap-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/78 transition-colors hover:text-michelin-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-yellow/60"
                    >
                      {link.label}
                      <ArrowRightIcon className="h-3.5 w-3.5 opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </nav>
            ))}
          </section>

          <section className="liquid-footer-panel flex flex-col justify-between gap-4 p-4 sm:gap-5 sm:p-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wide text-white/45">Compte</h2>
              <p className="mt-3 text-sm leading-6 text-white/72">
                Retrouve ton profil, tes connexions sport et tes avantages Club.
              </p>
            </div>
            <div className="grid gap-2">
              <Link
                href="/profil"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-michelin-navy transition-[filter,transform] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-yellow/70"
              >
                <PersonIcon className="h-4 w-4" />
                Voir mon profil
              </Link>
              <SignOutButton
                label="Se déconnecter"
                loadingLabel="Déconnexion..."
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-bold text-white/72 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-yellow/60 disabled:opacity-60"
              >
                <ExitIcon className="h-4 w-4" />
              </SignOutButton>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs font-semibold text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Michelin Trust Wheels</p>
          <p>Hackathon ESGI x Michelin LB 2 Wheels</p>
        </div>
      </div>
    </footer>
  );
}
