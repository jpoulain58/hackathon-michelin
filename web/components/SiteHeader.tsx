"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { SignOutButton } from "./SignOutButton";
import { cn } from "@/lib/utils";

// Liens de navigation. `cta` = action principale, sortie de la rangee et
// affichee en bouton jaune a droite (desktop).
const LINKS = [
  { href: "/accueil", label: "Accueil" },
  { href: "/trouve-ton-pneu", label: "Trouve ton pneu", cta: true },
  { href: "/communaute", label: "Communaute" },
  { href: "/balades", label: "Balades" },
  { href: "/actualites", label: "Actualites" },
  { href: "/club", label: "Club" },
  { href: "/profil", label: "Profil" },
];

const NAV_LINKS = LINKS.filter((l) => !l.cta);
const CTA = LINKS.find((l) => l.cta)!;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 ease-out-strong",
        scrolled
          ? "border-michelin-gray-line bg-white/90 shadow-soft"
          : "border-transparent bg-white/75",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/accueil"
          aria-label="Accueil Michelin Trust Wheels"
          className="shrink-0 transition-transform duration-200 ease-out-strong hover:scale-[1.03]"
        >
          <Brand />
        </Link>

        {/* Nav centrale (desktop) : liens texte + soulignement anime */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200 ease-out-strong",
                  active ? "text-michelin-blue" : "text-michelin-ink hover:text-michelin-navy",
                )}
              >
                {l.label}
                <span
                  className={cn(
                    "pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-pill bg-michelin-blue transition-transform duration-300 ease-out-strong",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Actions (desktop) : un seul CTA + deconnexion discrete */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href={CTA.href}
            aria-current={isActive(CTA.href) ? "page" : undefined}
            className="inline-flex items-center gap-2 rounded-pill bg-michelin-yellow px-4 py-2 text-sm font-bold text-michelin-navy shadow-[0_6px_18px_-8px_rgba(252,229,0,0.9)] transition-[transform,filter,box-shadow] duration-200 ease-out-strong hover:-translate-y-0.5 hover:shadow-lift hover:brightness-[0.97]"
          >
            <SearchGlyph />
            {CTA.label}
          </Link>
          <SignOutButton className="rounded-lg px-3 py-2 text-sm font-semibold text-michelin-ink transition-colors duration-200 hover:bg-michelin-gray-light hover:text-michelin-navy" />
        </div>

        {/* Burger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-pill text-michelin-navy transition-colors duration-200 hover:bg-michelin-gray-light lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" className="origin-center transition-transform duration-300 ease-out-strong" style={{ transform: open ? "translateY(5px) rotate(45deg)" : undefined }} />
            <line x1="4" y1="12" x2="20" y2="12" className="transition-opacity duration-200" style={{ opacity: open ? 0 : 1 }} />
            <line x1="4" y1="17" x2="20" y2="17" className="origin-center transition-transform duration-300 ease-out-strong" style={{ transform: open ? "translateY(-5px) rotate(-45deg)" : undefined }} />
          </svg>
        </button>
      </div>

      {/* Panneau mobile : ouverture/fermeture fluides (grid-rows) */}
      <nav
        id="menu-mobile"
        className={cn(
          "grid overflow-hidden bg-white/95 backdrop-blur transition-[grid-template-rows] duration-300 ease-out-strong lg:hidden",
          open ? "grid-rows-[1fr] border-t border-michelin-gray-line" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {LINKS.map((l, i) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-semibold transition-[background-color,color,opacity,transform] duration-300 ease-out-strong",
                    open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                    l.cta
                      ? "bg-michelin-yellow text-michelin-navy hover:brightness-95"
                      : active
                        ? "bg-michelin-blue/10 text-michelin-blue"
                        : "text-michelin-navy hover:bg-michelin-gray-light",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
            <SignOutButton
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-michelin-ink transition-colors hover:bg-michelin-gray-light"
            />
          </div>
        </div>
      </nav>
    </header>
  );
}

function SearchGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}
