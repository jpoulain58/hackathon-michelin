"use client";

import { useEffect, useState } from "react";
import { CheckCircledIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { Button, type ButtonProps } from "@/components/ui/button";
import { fetchRetailers, type Retailer } from "@/lib/api";
import { cn } from "@/lib/utils";

let retailersCache: Retailer[] | null = null;

export function RetailersSheetTrigger({
  productName,
  children = "Voir où acheter",
  className,
  variant,
  size,
}: {
  productName?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const [retailers, setRetailers] = useState<Retailer[]>(retailersCache ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || retailersCache) return;

    let alive = true;
    setLoading(true);
    fetchRetailers({ limit: 12 })
      .then((items) => {
        if (!alive) return;
        const clean = items.filter((item) => item.website);
        retailersCache = clean;
        setRetailers(clean);
      })
      .catch(() => {
        if (alive) setRetailers([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(0,12,52,0.48)] p-3 backdrop-blur-sm sm:p-6">
          <button
            type="button"
            aria-label="Fermer les revendeurs"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Revendeurs"
            className="retailer-sheet-panel relative max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white text-michelin-navy shadow-[0_24px_90px_rgba(0,12,52,0.34)]"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-michelin-blue via-michelin-yellow to-michelin-blue" />
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-pill bg-michelin-navy/18" />

            <div className="grid gap-5 px-5 pb-5 pt-5 sm:grid-cols-[1fr_auto] sm:px-6">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-pill border border-michelin-blue/12 bg-michelin-blue/6 px-3 py-1 text-xs font-black uppercase tracking-wide text-michelin-blue">
                  <CheckCircledIcon className="h-3.5 w-3.5" />
                  Revendeurs de la base
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Où acheter ce pneu</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-michelin-ink">
                  {productName
                    ? `Sélectionne un revendeur partenaire pour chercher ${productName}.`
                    : "Sélectionne un revendeur partenaire pour vérifier la disponibilité."}
                </p>
              </div>
              <div className="flex items-start justify-between gap-3 sm:justify-end">
                <div className="hidden rounded-2xl bg-michelin-navy px-4 py-3 text-white sm:block">
                  <p className="text-2xl font-black leading-none">{retailers.length || "..."}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/50">revendeurs</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-michelin-gray-line bg-white text-michelin-ink transition-colors hover:border-michelin-blue hover:text-michelin-blue"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-[56vh] overflow-y-auto bg-michelin-gray-light/60 px-5 py-4 sm:px-6 sm:py-5">
              {loading ? (
                <div className="rounded-2xl border border-michelin-gray-line bg-white p-6 text-center text-sm font-semibold text-michelin-ink">
                  Chargement des revendeurs…
                </div>
              ) : retailers.length === 0 ? (
                <div className="rounded-2xl border border-michelin-gray-line bg-white p-6 text-center text-sm font-semibold text-michelin-ink">
                  Aucun revendeur disponible pour le moment.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {retailers.map((retailer) => (
                    <RetailerLink key={retailer.id} retailer={retailer} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function RetailerLink({ retailer }: { retailer: Retailer }) {
  const domain = formatRetailerDomain(retailer.website);
  const location = [retailer.country, retailer.region].filter(Boolean).join(" · ") || "Revendeur en ligne";

  return (
    <a
      href={normalizeRetailerUrl(retailer.website)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[88px] items-center gap-3 rounded-2xl border border-michelin-gray-line bg-white p-4 text-left text-michelin-navy shadow-[0_14px_40px_-30px_rgba(0,12,52,0.5)] transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-michelin-blue/45 hover:shadow-soft"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-michelin-blue/10 text-base font-black text-michelin-blue">
        {domain.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-black">{domain}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-michelin-ink/60">{location}</span>
        <span className="mt-2 inline-flex items-center rounded-pill bg-michelin-yellow/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-michelin-navy">
          Voir le site
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-michelin-navy text-white transition-transform group-hover:translate-x-0.5">
        <ExternalLinkIcon className="h-4 w-4" />
      </span>
    </a>
  );
}

function normalizeRetailerUrl(website: string): string {
  const value = website.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function formatRetailerDomain(website: string): string {
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}
