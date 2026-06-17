"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import type { TyreView } from "@/lib/api";

// ─── Labels d'affichage ──────────────────────────────────────────────────────

function cycleLabel(cycleType: string): string {
  const map: Record<string, string> = { ROAD: "Route", CITY: "Ville", MTB: "VTT" };
  return map[cycleType] ?? cycleType;
}

function segmentShort(segment: string): string {
  if (segment.includes("RACING")) return "Racing";
  if (segment.includes("COMPETITION")) return "Compét.";
  if (segment.includes("PERFORMANCE")) return "Perf.";
  return "Access";
}

function useLabel(u: string): string {
  const map: Record<string, string> = {
    RACING: "Course", URBAN: "Urbain", ENDURO: "Enduro", DOWNHILL: "Descente",
    CYCLOCROSS: "Cyclocross", TREKKING: "Trekking", TOURING: "Randonnée",
    CARGO: "Cargo", ENDURANCE: "Endurance", VERSATILE: "Polyvalent",
    TRAIL: "Trail", SPEED: "Vitesse", LEISURE: "Loisir",
    "ALL ROAD": "All Road", "E-ROAD": "E-Route", "E-GRAVEL": "E-Gravel",
    "E-CITY": "E-Ville", "E-CARGO": "E-Cargo", "E-ENDURO": "E-Enduro",
    "E-TREKKING": "E-Trekking", "E-TOURING": "E-Randonnée", SPEEDELEC: "Speed Pedelec",
  };
  return map[u] ?? u;
}

function terrainLabel(t: string): string {
  const map: Record<string, string> = {
    ASPHALT: "Asphalte", "OFFROAD HARD PACKED": "Tout-chemin",
    "OFFROAD MIXED": "Mixte", "OFFROAD SOFT": "Sol meuble", "OFFROAD MUD": "Boue",
  };
  return map[t] ?? t;
}

function productName(range: string): string {
  return range
    .replace(/^MICHELIN\s+/i, "")
    .replace(/\s+(RACING|COMPETITION|PERFORMANCE|ACCESS)\s+LINE(\s*\([^)]*\))?$/i, "")
    .trim();
}

// ─── Filtres ─────────────────────────────────────────────────────────────────

const FILTER_GROUPS = [
  { label: "Type de vélo", values: ["Route", "VTT", "Ville"] },
  { label: "Gamme", values: ["Racing Line", "Competition Line", "Performance Line", "Access Line"] },
];

function matchesFilters(tyre: TyreView, active: Set<string>): boolean {
  if (active.size === 0) return true;
  return [...active].every((f) => {
    if (f === "Route") return tyre.cycleType === "ROAD";
    if (f === "VTT") return tyre.cycleType === "MTB";
    if (f === "Ville") return tyre.cycleType === "CITY";
    if (f === "Racing Line") return tyre.segment?.includes("RACING");
    if (f === "Competition Line") return tyre.segment?.includes("COMPETITION");
    if (f === "Performance Line") return tyre.segment?.includes("PERFORMANCE");
    if (f === "Access Line") return tyre.segment?.includes("ACCESS");
    return false;
  });
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ProduitsClient({ tyres }: { tyres: TyreView[] }) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = useCallback((f: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }, []);

  const filtered = useMemo(
    () => tyres.filter((t) => matchesFilters(t, activeFilters)),
    [tyres, activeFilters],
  );

  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/road-forest.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-veil" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-michelin-blue/40 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Catalogue Michelin</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Tous nos pneus vélo
          </Reveal>
          <Reveal as="p" delay={120} className="mt-3 text-lg text-white/85">
            {tyres.length} références · Racing, Competition, Performance &amp; Access Line
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">

        {/* ── Barre de filtres ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-0.5 bg-michelin-yellow" />
              <span className="text-xs font-bold uppercase tracking-widest text-michelin-navy">Filtres</span>
            </div>
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="flex items-center gap-1.5 rounded-pill border border-michelin-gray-line px-3 py-1 text-xs font-semibold text-michelin-ink transition-colors hover:border-michelin-blue hover:text-michelin-blue"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Tout effacer
              </button>
            )}
          </div>

          <div className="no-scrollbar overflow-x-auto">
            <div className="flex min-w-max items-start gap-4 pb-1 lg:min-w-0 lg:flex-wrap">
              {FILTER_GROUPS.map((group, gi) => (
                <div key={group.label} className="flex items-start gap-4">
                  {gi > 0 && <div className="mt-5 h-8 w-px shrink-0 bg-michelin-yellow/40" />}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-michelin-navy">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.values.map((f) => {
                        const active = activeFilters.has(f);
                        return (
                          <button
                            key={f}
                            onClick={() => toggleFilter(f)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                              active
                                ? "bg-michelin-blue text-white shadow-sm"
                                : "border border-michelin-gray-line bg-white text-michelin-ink hover:border-michelin-blue hover:text-michelin-blue",
                            )}
                          >
                            {f}
                            {active && (
                              <svg viewBox="0 0 24 24" className="h-3 w-3 text-michelin-yellow" fill="none" stroke="currentColor" strokeWidth={3}>
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Récap filtres actifs + compteur ── */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-michelin-ink">
            <span className="font-bold text-michelin-navy">{filtered.length}</span>{" "}
            pneu{filtered.length > 1 ? "s" : ""}
          </span>
          {activeFilters.size > 0 && (
            <>
              <span className="h-3.5 w-px bg-michelin-gray-line" />
              {[...activeFilters].map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className="flex items-center gap-1 rounded-pill bg-michelin-blue/10 px-2.5 py-0.5 text-xs font-semibold text-michelin-blue transition-colors hover:bg-michelin-blue/20"
                >
                  {f}
                  <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </>
          )}
        </div>

        {/* ── Grille produits ── */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-michelin-gray-line bg-white p-12 text-center">
              <p className="text-michelin-ink">Aucun produit ne correspond à ces filtres.</p>
              <button
                onClick={() => setActiveFilters(new Set())}
                className="mt-3 text-sm font-semibold text-michelin-blue hover:underline"
              >
                Effacer les filtres
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tyre, i) => (
                <ProductCard key={i} tyre={tyre} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

// ─── Carte produit ────────────────────────────────────────────────────────────

function ProductCard({ tyre }: { tyre: TyreView }) {
  const name = productName(tyre.range ?? "");
  const isRacing = tyre.segment?.includes("RACING");
  const isPerf = tyre.segment?.includes("PERFORMANCE");
  const isAccess = tyre.segment?.includes("ACCESS");

  return (
    <Link
      href={tyre.id ? `/produits/${tyre.id}` : "#"}
      className="group flex flex-col rounded-2xl border border-michelin-gray-line bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-michelin-blue hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black leading-tight text-michelin-navy">{name}</h3>
          <p className="mt-0.5 truncate text-xs text-michelin-ink/60">{tyre.designation}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
            isRacing ? "bg-michelin-blue"
              : isPerf ? "bg-michelin-green"
              : isAccess ? "bg-michelin-ink/60"
              : "bg-michelin-navy",
          )}
        >
          {segmentShort(tyre.segment ?? "")}
        </span>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        <div className="flex flex-wrap gap-1">
          {(tyre.use ?? []).map((u) => (
            <span key={u} className="rounded-pill bg-michelin-yellow/20 px-2 py-0.5 text-[10px] font-semibold text-michelin-navy">
              {useLabel(u)}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(tyre.terrainTypes ?? []).map((t) => (
            <span key={t} className="rounded-pill bg-michelin-gray-light px-2 py-0.5 text-[10px] text-michelin-ink">
              {terrainLabel(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-michelin-gray-line pt-3">
        <span className="text-xs font-semibold text-michelin-ink">
          {tyre.weightG ? `${tyre.weightG} g` : "—"}
        </span>
        <span className="chip">{cycleLabel(tyre.cycleType ?? "")}</span>
      </div>
    </Link>
  );
}
