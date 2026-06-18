"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import type { TyreDetail } from "@/lib/api";
import { getTyreImage } from "@/lib/tyre-images";
import { RetailersSheetTrigger } from "@/components/RetailersSheetTrigger";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function productName(range: string): string {
  return range
    .replace(/^MICHELIN\s+/i, "")
    .replace(/\s+(RACING|COMPETITION|PERFORMANCE|ACCESS)\s+LINE(\s*\([^)]*\))?$/i, "")
    .trim();
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function segmentLabel(segment: string): string {
  if (segment.includes("RACING")) return "Racing Line";
  if (segment.includes("COMPETITION")) return "Competition Line";
  if (segment.includes("PERFORMANCE")) return "Performance Line";
  if (segment.includes("ACCESS")) return "Access Line";
  return segment;
}

function cycleLabel(c: string) {
  return { ROAD: "Route", CITY: "Ville", MTB: "VTT" }[c] ?? c;
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
  return ({
    ASPHALT: "Asphalte", "OFFROAD HARD PACKED": "Tout-chemin",
    "OFFROAD MIXED": "Mixte", "OFFROAD SOFT": "Sol meuble", "OFFROAD MUD": "Boue",
  } as Record<string, string>)[t] ?? t;
}

function techLabel(key: string): string {
  return ({
    rubber: "Gomme", casing: "Carcasse", tread: "Sculpture",
    reinforcement: "Renfort", ebike: "E-Bike", tread_pattern: "Design de bande",
  } as Record<string, string>)[key] ?? key;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function ProduitDetail({ product: p }: { product: TyreDetail }) {
  const name = productName(p.range);
  const techs = Object.entries(p.technologies ?? {}).filter(([, v]) => v && (v as string[]).length > 0);
  const imgSrc = getTyreImage(p.globalId, p.cycleType, p.range);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="border-b border-michelin-gray-line bg-white pt-24">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-michelin-ink/50">
            <Link href="/" className="hover:text-michelin-blue">Accueil</Link>
            <span>/</span>
            <Link href="/produits" className="hover:text-michelin-blue">Catalogue</Link>
            <span>/</span>
            <span className="font-semibold text-michelin-navy">{name}</span>
          </nav>
        </div>
      </div>

      {/* Product layout */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">

          {/* ── Colonne image (sticky) ── */}
          <div className="lg:sticky lg:top-24">
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-michelin-gray-light/60 p-12">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={name}
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-michelin-ink/30">
                  <svg viewBox="0 0 80 80" className="h-20 w-20" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="40" cy="40" r="36" />
                    <circle cx="40" cy="40" r="16" />
                    <path d="M40 4v10M40 66v10M4 40h10M66 40h10" />
                  </svg>
                  <span className="text-sm font-semibold">Image non disponible</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Colonne infos ── */}
          <div className="space-y-7">

            {/* En-tête : marque + nom */}
            <div>
              <p className="font-black italic tracking-wide text-michelin-navy">MICHELIN</p>
              <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-michelin-navy sm:text-4xl">
                {toTitleCase(name)}
              </h1>

              {/* Gamme + type de vélo */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn(
                  "rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-wider text-white",
                  p.segment.includes("RACING") ? "bg-michelin-blue"
                    : p.segment.includes("PERFORMANCE") ? "bg-michelin-green"
                    : p.segment.includes("ACCESS") ? "bg-michelin-ink/50"
                    : "bg-michelin-navy",
                )}>
                  {segmentLabel(p.segment)}
                </span>
                <span className="rounded-pill border border-michelin-gray-line px-3 py-1 text-xs font-semibold text-michelin-ink">
                  {cycleLabel(p.cycleType)}
                </span>
              </div>
            </div>

            {/* Utilisations (chips style Michelin.com) */}
            {p.use.length > 0 && (
              <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-michelin-navy/50">Utilisations</p>
                <div className="flex flex-wrap gap-2">
                  {p.use.map((u) => (
                    <span
                      key={u}
                      className="rounded-full bg-michelin-blue/8 px-3.5 py-1.5 text-xs font-semibold text-michelin-blue ring-1 ring-michelin-blue/20"
                    >
                      {useLabel(u)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Terrains */}
            {p.terrainTypes.length > 0 && (
              <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-michelin-navy/50">Terrains</p>
                <div className="flex flex-wrap gap-2">
                  {p.terrainTypes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-michelin-gray-light px-3.5 py-1.5 text-xs font-semibold text-michelin-ink ring-1 ring-michelin-gray-line"
                    >
                      {terrainLabel(t)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Séparateur */}
            <div className="h-px bg-michelin-gray-line" />

            {/* Stats rapides */}
            {(p.weightG || p.tpi || p.fitting || (p.widthEtrto && p.diameterEtrto)) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {p.weightG && <QuickStat label="Poids" value={`${p.weightG} g`} />}
                {p.tpi && <QuickStat label="TPI" value={p.tpi} />}
                {p.fitting && <QuickStat label="Montage" value={p.fitting === "FRONT/REAR" ? "AV / AR" : p.fitting} />}
                {p.widthEtrto && p.diameterEtrto && (
                  <QuickStat label="Dimensions" value={`${p.widthEtrto}-${p.diameterEtrto}`} />
                )}
              </div>
            )}

            {/* Technologies */}
            {techs.length > 0 && (
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-michelin-navy/50">Technologies</p>
                <div className="space-y-3">
                  {techs.map(([key, values]) => (
                    <div key={key}>
                      <p className="mb-1.5 text-xs font-bold text-michelin-navy">{techLabel(key)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(values as string[]).map((v) => (
                          <span key={v} className="rounded-pill bg-michelin-yellow/15 px-2.5 py-0.5 text-xs font-semibold text-michelin-navy">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Séparateur */}
            <div className="h-px bg-michelin-gray-line" />

            {/* Désignation / référence dimension */}
            <div className="rounded-xl border border-michelin-gray-line bg-michelin-gray-light/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-michelin-navy/50">Référence sélectionnée</p>
              <p className="mt-1 text-base font-black text-michelin-navy">{p.designation}</p>
              {(p.eanCode || p.caiCode) && (
                <div className="mt-2 flex flex-wrap gap-4">
                  {p.eanCode && (
                    <span className="text-xs text-michelin-ink/60">EAN <span className="font-semibold text-michelin-ink">{p.eanCode}</span></span>
                  )}
                  {p.caiCode && (
                    <span className="text-xs text-michelin-ink/60">CAI <span className="font-semibold text-michelin-ink">{p.caiCode}</span></span>
                  )}
                  {p.globalId && (
                    <span className="text-xs text-michelin-ink/60">ID <span className="font-semibold text-michelin-ink">{p.globalId}</span></span>
                  )}
                </div>
              )}
            </div>

            {/* Pression */}
            {(p.minBar || p.maxBar) && (
              <div className="rounded-xl border border-michelin-gray-line p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-michelin-navy/50">Pression recommandée</p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-michelin-navy">{p.minBar}</p>
                    <p className="text-[10px] font-bold uppercase text-michelin-ink/50">bar min{p.minPsi ? ` · ${p.minPsi} psi` : ""}</p>
                  </div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-michelin-gray-line">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-michelin-blue/40 via-michelin-blue to-michelin-blue" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-michelin-navy">{p.maxBar}</p>
                    <p className="text-[10px] font-bold uppercase text-michelin-ink/50">bar max{p.maxPsi ? ` · ${p.maxPsi} psi` : ""}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Références supplémentaires */}
            {(p.brand || p.productType || p.discontinuedDate) && (
              <div className="space-y-1.5">
                {p.brand && <RefRow label="Marque" value={p.brand} />}
                {p.productType && <RefRow label="Type de produit" value={p.productType} />}
                {p.discontinuedDate && (
                  <RefRow
                    label="Fin de vie"
                    value={new Date(p.discontinuedDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                  />
                )}
              </div>
            )}

            {/* CTA */}
            <div className="pt-2">
              <RetailersSheetTrigger
                productName={`${p.range} ${p.designation}`}
                className="h-auto w-full bg-michelin-yellow px-6 py-4 text-base font-black text-michelin-navy transition-[filter] hover:bg-michelin-yellow hover:brightness-95 hover:shadow-soft"
              >
                Voir où acheter →
              </RetailersSheetTrigger>
              <p className="mt-2 text-center text-xs text-michelin-ink/40">
                Disponible chez vos revendeurs Michelin agréés
              </p>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-michelin-gray-line bg-white p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-michelin-ink/40">{label}</p>
      <p className="mt-1 text-sm font-black text-michelin-navy">{value}</p>
    </div>
  );
}

function RefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-michelin-gray-line pb-1.5 last:border-0">
      <dt className="text-xs text-michelin-ink/50">{label}</dt>
      <dd className="text-xs font-semibold text-michelin-navy">{value}</dd>
    </div>
  );
}
