"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import type { TyreDetail } from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function productName(range: string): string {
  return range
    .replace(/^MICHELIN\s+/i, "")
    .replace(/\s+(RACING|COMPETITION|PERFORMANCE|ACCESS)\s+LINE(\s*\([^)]*\))?$/i, "")
    .trim();
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

function segmentColor(segment: string) {
  if (segment.includes("RACING")) return "bg-michelin-blue";
  if (segment.includes("PERFORMANCE")) return "bg-michelin-green";
  if (segment.includes("ACCESS")) return "bg-michelin-ink/60";
  return "bg-michelin-navy";
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function ProduitDetail({ product: p }: { product: TyreDetail }) {
  const name = productName(p.range);
  const techs = Object.entries(p.technologies ?? {}).filter(([, v]) => v && (v as string[]).length > 0);

  return (
    <main className="min-h-screen bg-michelin-gray-light/30">
      <SiteHeader />

      {/* Hero compact */}
      <section className="bg-michelin-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link
            href="/produits"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Catalogue
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-pill px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white", segmentColor(p.segment))}>
                  {segmentLabel(p.segment)}
                </span>
                <span className="rounded-pill border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white/70">
                  {cycleLabel(p.cycleType)}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{name}</h1>
              <p className="mt-1 text-base text-white/60">{p.designation}</p>
            </div>

            {/* Stats rapides */}
            <div className="flex flex-wrap gap-4">
              {p.weightG && (
                <Stat label="Poids" value={`${p.weightG} g`} />
              )}
              {p.tpi && (
                <Stat label="TPI" value={p.tpi} />
              )}
              {p.fitting && (
                <Stat label="Montage" value={p.fitting === "FRONT/REAR" ? "AV/AR" : p.fitting} />
              )}
              {p.widthEtrto && p.diameterEtrto && (
                <Stat label="Dimensions" value={`${p.widthEtrto}-${p.diameterEtrto}`} />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Colonne principale */}
          <div className="space-y-6 lg:col-span-2">

            {/* Usages */}
            <Card title="Utilisations">
              <div className="flex flex-wrap gap-2">
                {p.use.map((u) => (
                  <span key={u} className="rounded-pill bg-michelin-yellow/20 px-3 py-1 text-sm font-semibold text-michelin-navy">
                    {useLabel(u)}
                  </span>
                ))}
              </div>
            </Card>

            {/* Terrains */}
            <Card title="Terrains">
              <div className="flex flex-wrap gap-2">
                {p.terrainTypes.map((t) => (
                  <span key={t} className="rounded-pill border border-michelin-gray-line bg-white px-3 py-1 text-sm text-michelin-ink">
                    {terrainLabel(t)}
                  </span>
                ))}
              </div>
            </Card>

            {/* Technologies */}
            {techs.length > 0 && (
              <Card title="Technologies">
                <div className="space-y-3">
                  {techs.map(([key, values]) => (
                    <div key={key}>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-michelin-navy">
                        {techLabel(key)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(values as string[]).map((v) => (
                          <span key={v} className="rounded-pill bg-michelin-blue/10 px-2.5 py-0.5 text-xs font-semibold text-michelin-blue">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Colonne secondaire */}
          <div className="space-y-6">

            {/* Pression */}
            {(p.minBar || p.maxBar) && (
              <Card title="Pression recommandée">
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-michelin-ink">Min</span>
                    <span className="text-xs text-michelin-ink">Max</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-michelin-gray-line">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-michelin-blue/40 to-michelin-blue" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-center">
                      <p className="text-xl font-black text-michelin-navy">{p.minBar} <span className="text-sm font-semibold">bar</span></p>
                      {p.minPsi && <p className="text-xs text-michelin-ink/60">{p.minPsi} psi</p>}
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-michelin-navy">{p.maxBar} <span className="text-sm font-semibold">bar</span></p>
                      {p.maxPsi && <p className="text-xs text-michelin-ink/60">{p.maxPsi} psi</p>}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Références */}
            <Card title="Références">
              <dl className="space-y-2">
                {p.eanCode && <Row label="EAN" value={p.eanCode} />}
                {p.caiCode && <Row label="CAI" value={p.caiCode} />}
                {p.globalId && <Row label="ID Global" value={p.globalId} />}
                {p.productType && <Row label="Type" value={p.productType} />}
                {p.brand && <Row label="Marque" value={p.brand} />}
                {p.discontinuedDate && (
                  <Row label="Fin de vie" value={new Date(p.discontinuedDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })} />
                )}
              </dl>
            </Card>

            {/* CTA */}
            <div className="rounded-2xl bg-michelin-blue p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Ce pneu vous convient ?</p>
              <p className="mt-1 text-lg font-black">{name}</p>
              <p className="mt-0.5 text-sm text-white/70">{p.designation}</p>
              <button className="mt-4 w-full rounded-pill bg-michelin-yellow px-4 py-2.5 text-sm font-bold text-michelin-navy transition-[filter] hover:brightness-95">
                Voir où acheter →
              </button>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-michelin-gray-line bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-0.5 bg-michelin-yellow" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-michelin-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
      <p className="mt-0.5 text-base font-black text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-michelin-gray-line pb-2 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold text-michelin-ink/60">{label}</dt>
      <dd className="text-right text-xs font-semibold text-michelin-navy">{value}</dd>
    </div>
  );
}
