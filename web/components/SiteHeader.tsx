"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "./Brand";
import { cn } from "@/lib/utils";

// Navigation unique, identique sur toutes les pages de l'app.
// >= lg : rangee complete. < lg : menu burger (aucun lien masque).
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
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-michelin-gray-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo : toujours en haut a gauche, inchange */}
        <Link href="/accueil" className="shrink-0" aria-label="Accueil Michelin Trust Wheels">
          <Brand />
        </Link>

        {/* Menu desktop (>= lg) */}
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-pill px-3 py-2 text-sm font-semibold transition-colors",
                isActive(l.href)
                  ? "bg-michelin-blue text-white"
                  : l.cta
                    ? "bg-michelin-yellow text-michelin-navy hover:brightness-95"
                    : "text-michelin-navy hover:bg-michelin-gray-light",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Deconnexion desktop (>= lg) */}
        <Link
          href="/"
          className="hidden shrink-0 whitespace-nowrap text-sm font-semibold text-michelin-ink transition-colors hover:text-michelin-blue lg:inline-block"
        >
          Se deconnecter
        </Link>

        {/* Bouton burger (< lg) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-pill text-michelin-navy transition-colors hover:bg-michelin-gray-light lg:hidden"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Panneau mobile (< lg) */}
      {open && (
        <nav id="menu-mobile" className="border-t border-michelin-gray-line bg-white lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive(l.href)
                    ? "bg-michelin-blue text-white"
                    : l.cta
                      ? "bg-michelin-yellow text-michelin-navy hover:brightness-95"
                      : "text-michelin-navy hover:bg-michelin-gray-light",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-michelin-ink transition-colors hover:bg-michelin-gray-light"
            >
              Se deconnecter
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
