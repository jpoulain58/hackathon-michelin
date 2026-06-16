"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { cn } from "@/lib/utils";

// Navigation unique, identique sur toutes les pages de l'app.
// Tous les liens restent toujours visibles : sur petit ecran la rangee
// defile horizontalement au lieu de masquer des entrees.
const LINKS = [
  { href: "/accueil", label: "Accueil" },
  { href: "/trouve-ton-pneu", label: "Trouve ton pneu", cta: true },
  { href: "/communaute", label: "Communaute" },
  { href: "/balades", label: "Balades" },
  { href: "/actualites", label: "Actualites" },
  { href: "/club", label: "Club" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-michelin-gray-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo : toujours en haut a gauche, inchange */}
        <Link href="/accueil" className="shrink-0" aria-label="Accueil Michelin Trust Wheels">
          <Brand />
        </Link>

        {/* Menu principal : toujours present et identique */}
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-pill px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-michelin-blue text-white"
                    : l.cta
                      ? "bg-michelin-yellow text-michelin-navy hover:brightness-95"
                      : "text-michelin-navy hover:bg-michelin-gray-light",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Deconnexion : presente partout */}
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-sm font-semibold text-michelin-ink transition-colors hover:text-michelin-blue"
        >
          Se deconnecter
        </Link>
      </div>
    </header>
  );
}
