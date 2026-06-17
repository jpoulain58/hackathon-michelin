/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Brand } from "./Brand";
import { SignOutButton } from "./SignOutButton";

const FOOTER_LINKS = [
  { href: "/trouve-ton-pneu", label: "Trouve ton pneu" },
  { href: "/communaute", label: "Communaute" },
  { href: "/balades", label: "Balades" },
  { href: "/actualites", label: "Actualites" },
  { href: "/club", label: "Club" },
  { href: "/profil", label: "Profil" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-michelin-navy text-white">
      {/* Liseré dégradé charte (bleu -> jaune) */}
      <div className="h-1 w-full bg-gradient-to-r from-michelin-blue via-michelin-blue to-michelin-yellow" />
      {/* Halo discret en fond */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-michelin-blue/30 blur-3xl" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <img
            src="/trust-wheels-logo-footer.png"
            alt="Michelin Trust Wheels"
            className="h-14 w-auto"
          />
          <p className="max-w-xs text-sm text-white/70">
            La preuve par la route. La communaute qui transforme ses kilometres en preuve.
          </p>
          <span className="inline-flex rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">
            Powered by Strava
          </span>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Navigation</span>
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80 transition-colors hover:text-michelin-yellow">
              {l.label}
            </Link>
          ))}
          <SignOutButton className="mt-1 text-left text-white/60 transition-colors hover:text-michelin-yellow" />
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs text-white/50">
          © 2026 Michelin Trust Wheels · Hackathon ESGI × Michelin LB 2 Wheels
        </p>
      </div>
    </footer>
  );
}
