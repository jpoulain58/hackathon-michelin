"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  Cross2Icon,
  ExitIcon,
  HamburgerMenuIcon,
  MagnifyingGlassIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { Brand } from "./Brand";
import { SignOutButton } from "./SignOutButton";
import { cn } from "@/lib/utils";

const DIRECT_LINKS = [{ href: "/accueil", label: "Accueil" }];

const MENU_GROUPS = [
  {
    id: "outils",
    label: "Outils",
    items: [
      {
        href: "/trouve-ton-pneu",
        label: "Trouve ton pneu",
        description: "Reco pneus personnalisee",
        highlight: true,
      },
      {
        href: "/comparateur",
        label: "Comparateur",
        description: "Comparer les gammes et usages",
      },
    ],
  },
  {
    id: "communaute",
    label: "Communaute",
    items: [
      {
        href: "/communaute",
        label: "Avis",
        description: "Les retours de la communauté",
      },
      {
        href: "/actualites",
        label: "Actualites",
        description: "Conseils, guides et nouveautés",
      },
      {
        href: "/club",
        label: "Club",
        description: "Statut, avantages et recompenses",
      },
    ],
  },
  {
    id: "explorer",
    label: "Explorer",
    items: [
      {
        href: "/balades",
        label: "Balades",
        description: "Parcours et inspirations route",
      },
      {
        href: "/produits",
        label: "Produits",
        description: "Catalogue pneus Michelin",
      },
    ],
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setAccountOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const groupIsActive = (items: Array<{ href: string }>) => items.some((item) => isActive(item.href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-3 z-50 px-3 transition-transform duration-300 ease-out-strong sm:px-6",
        scrolled ? "translate-y-0" : "translate-y-0",
      )}
    >
      <div
        className={cn(
          "liquid-glass-nav mx-auto flex h-[4.25rem] max-w-6xl items-center gap-3 px-3 transition-[box-shadow,border-color,background] duration-300 ease-out-strong sm:px-4",
          scrolled && "shadow-[0_22px_70px_-34px_rgba(0,12,52,0.55)]",
        )}
      >
        <Link
          href="/accueil"
          aria-label="Accueil Michelin Trust Wheels"
          className="shrink-0 rounded-pill px-1 transition-transform duration-200 ease-out-strong hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60"
        >
          <Brand />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {DIRECT_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-pill px-3.5 py-2 text-sm font-bold transition-colors duration-200 ease-out-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                  active
                    ? "bg-white/70 text-michelin-blue shadow-[inset_0_0_0_1px_rgba(39,80,155,0.14)]"
                    : "text-michelin-navy/75 hover:bg-white/55 hover:text-michelin-navy",
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {MENU_GROUPS.map((group) => {
            const active = groupIsActive(group.items);
            const expanded = openMenu === group.id;

            return (
              <div
                key={group.id}
                className="relative"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`nav-menu-${group.id}`}
                  onClick={() => {
                    setAccountOpen(false);
                    setOpenMenu((current) => (current === group.id ? null : group.id));
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-sm font-bold transition-colors duration-200 ease-out-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                    active || expanded
                      ? "bg-white/70 text-michelin-blue shadow-[inset_0_0_0_1px_rgba(39,80,155,0.14)]"
                      : "text-michelin-navy/75 hover:bg-white/55 hover:text-michelin-navy",
                  )}
                >
                  {group.label}
                  <ChevronDownIcon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200 ease-out-strong",
                      expanded && "rotate-180",
                    )}
                  />
                </button>

                <div
                  id={`nav-menu-${group.id}`}
                  className={cn(
                    "liquid-glass-menu absolute left-1/2 top-full mt-3 w-[19rem] -translate-x-1/2 overflow-hidden p-2 transition-[opacity,transform,visibility] duration-200 ease-out-strong",
                    expanded
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0",
                  )}
                >
                  <div className="grid gap-1">
                    {group.items.map((item) => {
                      const itemActive = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={itemActive ? "page" : undefined}
                          className={cn(
                            "group/item rounded-2xl px-3 py-3 transition-colors duration-200 ease-out-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                            itemActive
                              ? "bg-michelin-blue text-white"
                              : item.highlight
                                ? "bg-michelin-yellow/90 text-michelin-navy hover:bg-michelin-yellow"
                                : "text-michelin-navy hover:bg-white/70",
                          )}
                        >
                          <span className="flex items-center justify-between gap-3 text-sm font-black">
                            {item.label}
                            {item.highlight ? <MagnifyingGlassIcon className="h-4 w-4" /> : null}
                          </span>
                          <span
                            className={cn(
                              "mt-1 block text-xs font-semibold",
                              itemActive ? "text-white/75" : "text-michelin-ink/75",
                            )}
                          >
                            {item.description}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <div className="relative">
            <button
              type="button"
              aria-label="Ouvrir le menu du compte"
              aria-expanded={accountOpen}
              aria-controls="account-menu"
              onClick={() => {
                setOpenMenu(null);
                setAccountOpen((current) => !current);
              }}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/65 text-michelin-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_30px_-20px_rgba(0,12,52,0.55)] transition-[background,color,box-shadow] duration-200 ease-out-strong hover:bg-michelin-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                accountOpen && "bg-michelin-yellow",
              )}
            >
              <PersonIcon className="h-5 w-5" />
            </button>

            <div
              id="account-menu"
              className={cn(
                "liquid-glass-menu absolute right-0 top-full mt-3 w-56 overflow-hidden p-2 transition-[opacity,transform,visibility] duration-200 ease-out-strong",
                accountOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
              )}
            >
              <Link
                href="/profil"
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                  isActive("/profil") ? "bg-michelin-blue text-white" : "text-michelin-navy",
                )}
              >
                <PersonIcon className="h-4 w-4" />
                Profil
              </Link>
              <SignOutButton
                label="Se déconnecter"
                loadingLabel="Déconnexion..."
                className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-michelin-navy transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60 disabled:opacity-60"
              >
                <ExitIcon className="h-4 w-4" />
              </SignOutButton>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
          aria-controls="menu-mobile"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/65 text-michelin-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors duration-200 hover:bg-michelin-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60 lg:hidden"
        >
          {mobileOpen ? <Cross2Icon className="h-5 w-5" /> : <HamburgerMenuIcon className="h-5 w-5" />}
        </button>
      </div>

      <nav
        id="menu-mobile"
        className={cn(
          "mx-auto mt-2 grid max-w-6xl overflow-hidden transition-[grid-template-rows] duration-300 ease-out-strong lg:hidden",
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="liquid-glass-menu menu-scroll no-scrollbar flex max-h-[calc(100dvh-6rem)] flex-col gap-2 overflow-y-auto p-2">
            {DIRECT_LINKS.map((link, index) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  style={{ transitionDelay: mobileOpen ? `${index * 24}ms` : "0ms" }}
                  className={cn(
                    "rounded-2xl px-3.5 py-3 transition-[background-color,color,opacity,transform] duration-300 ease-out-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                    mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                    active ? "bg-michelin-blue text-white" : "text-michelin-navy hover:bg-white/70",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="block text-sm font-black">{link.label}</span>
                  </span>
                </Link>
              );
            })}
            {MENU_GROUPS.map((group, groupIndex) => (
              <div key={group.id} className="rounded-2xl bg-white/30 p-1">
                <p className="px-2.5 pb-1 pt-2 text-[0.68rem] font-black uppercase tracking-wide text-michelin-ink/65">
                  {group.label}
                </p>
                <div className="grid gap-1">
                  {group.items.map((link, linkIndex) => {
                    const active = isActive(link.href);
                    const delay = DIRECT_LINKS.length + groupIndex * 3 + linkIndex;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        style={{ transitionDelay: mobileOpen ? `${delay * 24}ms` : "0ms" }}
                        className={cn(
                          "rounded-xl px-3 py-2.5 transition-[background-color,color,opacity,transform] duration-300 ease-out-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                          mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                          active
                            ? "bg-michelin-blue text-white"
                            : link.highlight
                              ? "bg-michelin-yellow/90 text-michelin-navy"
                              : "text-michelin-navy hover:bg-white/70",
                        )}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>
                            <span className="block text-sm font-black">{link.label}</span>
                            <span className={cn("mt-0.5 block text-xs font-semibold", active ? "text-white/70" : "text-michelin-ink/70")}>
                              {link.description}
                            </span>
                          </span>
                          {link.highlight ? <MagnifyingGlassIcon className="h-4 w-4 shrink-0" /> : null}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="my-1 h-px bg-michelin-navy/10" />
            <Link
              href="/profil"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60",
                isActive("/profil") ? "bg-michelin-blue text-white" : "text-michelin-navy hover:bg-white/70",
              )}
            >
              <PersonIcon className="h-4 w-4" />
              Profil
            </Link>
            <SignOutButton
              label="Se déconnecter"
              loadingLabel="Déconnexion..."
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-black text-michelin-navy transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-michelin-blue/60 disabled:opacity-60"
            >
              <ExitIcon className="h-4 w-4" />
            </SignOutButton>
          </div>
        </div>
      </nav>
    </header>
  );
}
