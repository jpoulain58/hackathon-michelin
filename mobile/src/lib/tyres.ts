import type { ApiTyre } from "./api";
import type { Tyre, TyreCategory } from "../types";

export type ComparisonMetric = "speed" | "grip" | "protection";

export function apiToTyre(t: ApiTyre, index = 0): Tyre {
  const score = t.score ?? metricScore(t, "speed") * 18;
  return {
    id: t.id,
    name: `${t.range} ${t.designation}`.trim(),
    weight: formatWeight(t),
    dimensions: tyreSize(t),
    matchScore: Math.min(99, Math.max(1, Math.round(score))),
    bestChoice: index === 0,
    categories: categoriesFor(t),
    range: t.range,
    designation: t.designation,
    productType: t.productType,
    segment: t.segment,
    cycleType: t.cycleType,
    use: t.use,
    terrainTypes: t.terrainTypes,
    fitting: t.fitting,
    widthEtrto: t.widthEtrto,
    diameterEtrto: t.diameterEtrto,
    webDiameterInch: t.webDiameterInch,
    webWidthMm: t.webWidthMm,
    tpi: t.tpi,
    weightG: t.weightG,
    pressure: t.pressure,
    technologies: t.technologies,
    score: t.score,
    why: t.why,
  };
}

export function tyreShortName(tyre: Tyre): string {
  return (tyre.range ?? tyre.name).replace(/^MICHELIN\s+/i, "");
}

export function formatWeight(tyre: Pick<ApiTyre | Tyre, "weightG">): string {
  return tyre.weightG ? `${Math.round(tyre.weightG)} g` : "Non précisé";
}

export function tyreSize(tyre: Pick<ApiTyre | Tyre, "widthEtrto" | "diameterEtrto" | "webDiameterInch" | "webWidthMm">): string {
  if (tyre.widthEtrto && tyre.diameterEtrto) return `${tyre.widthEtrto}-${tyre.diameterEtrto}`;
  const diameter = tyre.webDiameterInch ? `${tyre.webDiameterInch}"` : "";
  const width = tyre.webWidthMm ? `${tyre.webWidthMm} mm` : "";
  return [diameter, width].filter(Boolean).join(" / ") || "Non précisé";
}

export function tyreFormat(tyre: Pick<Tyre, "designation" | "productType">): string {
  const designation = (tyre.designation ?? "").toUpperCase();
  if (designation.includes("TLR")) return "Tubeless ready";
  if (designation.includes("TUBULAR")) return "Boyau";
  if (designation.includes("FOLDABLE")) return "Tringle souple";
  return tyre.productType === "TUBULAR" ? "Boyau" : "Pneu";
}

export function formatPressure(tyre: Pick<Tyre, "pressure">): string {
  const maxBar = tyre.pressure?.maxBar;
  const maxPsi = tyre.pressure?.maxPsi;
  if (maxBar && maxPsi) return `${maxBar} bar / ${maxPsi} psi`;
  if (maxBar) return `${maxBar} bar`;
  if (maxPsi) return `${maxPsi} psi`;
  return "Non précisée";
}

export function shortTechnologyList(tyre: Pick<Tyre, "technologies">): string {
  const values = Object.values(tyre.technologies ?? {}).flat().filter(Boolean);
  if (values.length === 0) return "Standard";
  return [...new Set(values)].slice(0, 2).join(", ");
}

export function metricScore(tyre: Pick<Tyre | ApiTyre, "range" | "designation" | "weightG" | "technologies" | "terrainTypes" | "tpi" | "widthEtrto" | "webWidthMm">, metric: ComparisonMetric): number {
  const text = `${tyre.range ?? ""} ${tyre.designation ?? ""}`.toUpperCase();
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
    if ((tyre.terrainTypes ?? []).some((terrain) => !terrain.includes("ASPHALT"))) score += 1;
    return clampScore(score);
  }

  let score = 2;
  if ([...(tech.casing ?? []), ...(tech.reinforcement ?? [])].length > 0) score += 1;
  if (/SHIELD|PROTEK|PROTECTION|GUARD|TLR/.test(text + " " + shortTechnologyList({ technologies: tech }).toUpperCase())) {
    score += 1;
  }
  if (width >= 35 || tpi >= 120) score += 1;
  return clampScore(score);
}

function categoriesFor(tyre: ApiTyre): TyreCategory[] {
  if (tyre.cycleType === "MTB") return ["Montagne"];
  if (/RACING|COMPETITION|POWER/.test(tyre.segment)) return ["Route", "Performance"];
  return ["Route"];
}

function clampScore(value: number): number {
  return Math.min(5, Math.max(1, value));
}
