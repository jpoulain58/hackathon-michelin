import type { TyreView } from "@/lib/api";

export type ComparisonMetric = "speed" | "grip" | "protection";

export function tyreName(tyre: Pick<TyreView, "range">): string {
  return tyre.range.replace(/^MICHELIN\s+/i, "");
}

export function tyreFullName(tyre: Pick<TyreView, "range" | "designation">): string {
  return `${tyre.range} ${tyre.designation}`.trim();
}

/**
 * Slug stable derive de range+designation, identique a `makeTyreId` cote API.
 * Sert de cle commune entre les recommandations (dataset statique) et les
 * produits Supabase, qui n'ont pas le meme identifiant numerique.
 */
export function tyreSlug(tyre: Pick<TyreView, "range" | "designation">): string {
  return `${tyre.range} ${tyre.designation}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function tyreSize(tyre: TyreView): string {
  if (tyre.widthEtrto && tyre.diameterEtrto) return `${tyre.widthEtrto}-${tyre.diameterEtrto}`;
  const diameter = tyre.webDiameterInch ? `${tyre.webDiameterInch}"` : "";
  const width = tyre.webWidthMm ? `${tyre.webWidthMm} mm` : "";
  return [diameter, width].filter(Boolean).join(" / ") || "Non précisé";
}

export function tyreFormat(tyre: TyreView): string {
  const designation = tyre.designation.toUpperCase();
  if (designation.includes("TLR")) return "Tubeless ready";
  if (designation.includes("TUBULAR")) return "Boyau";
  if (designation.includes("FOLDABLE")) return "Tringle souple";
  return tyre.productType === "TUBULAR" ? "Boyau" : "Pneu";
}

export function formatWeight(tyre: Pick<TyreView, "weightG">): string {
  return tyre.weightG ? `${Math.round(tyre.weightG)} g` : "Non précisé";
}

export function formatPressure(tyre: TyreView): string {
  const maxBar = tyre.pressure?.maxBar;
  const maxPsi = tyre.pressure?.maxPsi;
  if (maxBar && maxPsi) return `${maxBar} bar / ${maxPsi} psi`;
  if (maxBar) return `${maxBar} bar`;
  if (maxPsi) return `${maxPsi} psi`;
  return "Non précisée";
}

export function shortTechnologyList(tyre: TyreView): string {
  const values = Object.values(tyre.technologies ?? {}).flat().filter(Boolean);
  if (values.length === 0) return "Standard";
  return [...new Set(values)].slice(0, 3).join(", ");
}

export function terrainLabel(tyre: TyreView): string {
  const label = tyre.terrainTypes
    .slice(0, 2)
    .map((terrain) => TERRAIN_LABELS[terrain] ?? terrain.toLowerCase().replace(/^offroad /, ""))
    .join(", ");
  return label || "Non précisé";
}

const TERRAIN_LABELS: Record<string, string> = {
  ASPHALT: "Asphalte",
  "OFFROAD HARD PACKED": "Chemin roulant",
  "OFFROAD MIXED": "Terrain mixte",
  "OFFROAD SOFT": "Sol meuble",
  "OFFROAD MUD": "Boue",
};

export function metricScore(tyre: TyreView, metric: ComparisonMetric): number {
  const text = tyreFullName(tyre).toUpperCase();
  const tech = tyre.technologies ?? {};
  const width = Number(tyre.webWidthMm || tyre.widthEtrto || 0);
  const tpi = Number(String(tyre.tpi ?? "").match(/\d+/)?.[0] ?? 0);

  if (metric === "speed") {
    let score = 2;
    if (/TIME TRIAL|POWER CUP|RACING|RS/.test(text)) score += 2;
    if ((tyre.weightG ?? 999) <= 300) score += 1;
    return clampScore(score);
  }

  if (metric === "grip") {
    let score = 2;
    if ((tech.rubber ?? []).length > 0) score += 1;
    if (/MAGI-X|GUM-X|GRIP/.test(text + " " + (tech.rubber ?? []).join(" "))) score += 1;
    if (tyre.terrainTypes.some((terrain) => !terrain.includes("ASPHALT"))) score += 1;
    return clampScore(score);
  }

  let score = 2;
  if ([...(tech.casing ?? []), ...(tech.reinforcement ?? [])].length > 0) score += 1;
  if (/SHIELD|PROTEK|PROTECTION|GUARD|TLR/.test(text + " " + shortTechnologyList(tyre).toUpperCase())) {
    score += 1;
  }
  if (width >= 35 || tpi >= 120) score += 1;
  return clampScore(score);
}

function clampScore(value: number): number {
  return Math.min(5, Math.max(1, value));
}
