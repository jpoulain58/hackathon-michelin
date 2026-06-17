import { BadRequestException, Injectable } from "@nestjs/common";
import {
  loadTyres,
  recommend,
  DISCIPLINES,
  PRIORITIES,
  type Product,
  type Reco,
} from "@mtw/recommender";
import type { StravaProfileSummary } from "../auth/strava.service";

/** Vue produit exposee par l'API (pas de fuite de champs internes). */
export interface TyreView {
  id: string;
  range: string;
  designation: string;
  productType: string;
  segment: string;
  cycleType: string;
  use: string[];
  terrainTypes: string[];
  fitting?: string;
  widthEtrto?: string;
  diameterEtrto?: string;
  webDiameterInch?: string;
  webWidthMm?: string;
  tpi?: string;
  weightG?: number;
  pressure?: Product["pressure"];
  technologies?: Record<string, string[]>;
  sidewallColor?: string;
}

export interface RecoView extends TyreView {
  score: number;
  why: string[];
}

export interface OptionView {
  key: string;
  label: string;
}

export interface InferredProfile {
  discipline: "road" | "gravel" | "mtb" | "city";
  priority: "speed" | "grip" | "durability" | "comfort" | "puncture";
  ebike: boolean;
  basedOnRides: number;
}

/**
 * Deduit un profil de rider (discipline + priorite) a partir des dernieres
 * sorties velo Strava, plutot que des 7 questions saisies a la main.
 * Regles simples et deterministes : ordre choisi pour la demo, pas une science exacte.
 */
export function inferProfileFromStrava(strava: StravaProfileSummary): InferredProfile {
  const rides = strava.recentActivities;
  const basedOnRides = rides.length;
  const ebike = rides.some((ride) => ride.ebike);

  const bucketCounts: Record<"road" | "gravel" | "mtb", number> = { road: 0, gravel: 0, mtb: 0 };
  for (const ride of rides) bucketCounts[ride.bikeBucket]++;

  let discipline: InferredProfile["discipline"] =
    basedOnRides > 0
      ? (Object.entries(bucketCounts).sort((a, b) => b[1] - a[1])[0][0] as InferredProfile["discipline"])
      : "road";

  const totalKm = rides.reduce((sum, ride) => sum + ride.distanceKm, 0);
  const totalElevationM = rides.reduce((sum, ride) => sum + ride.elevationM, 0);
  const speeds = rides.map((ride) => ride.averageSpeedKmh).filter((v): v is number => v !== null);
  const avgKmPerRide = basedOnRides > 0 ? totalKm / basedOnRides : 0;
  const avgSpeedKmh = speeds.length > 0 ? speeds.reduce((sum, v) => sum + v, 0) / speeds.length : 0;
  const elevationPerKm = totalKm > 0 ? totalElevationM / totalKm : 0;

  // Sorties route courtes et lentes : plus proche d'un usage utilitaire que sportif.
  if (discipline === "road" && avgKmPerRide > 0 && avgKmPerRide < 12 && avgSpeedKmh < 18) {
    discipline = "city";
  }

  let priority: InferredProfile["priority"];
  if (avgSpeedKmh >= 27) priority = "speed";
  else if (elevationPerKm >= 14) priority = "grip";
  else if (avgKmPerRide >= 60) priority = "durability";
  else if (avgKmPerRide > 0 && avgKmPerRide <= 15) priority = "puncture";
  else priority = "comfort";

  return { discipline, priority, ebike, basedOnRides };
}

@Injectable()
export class TyresService {
  private readonly tyres: Product[] = loadTyres();

  count(): number {
    return this.tyres.length;
  }

  /** Disciplines & priorites disponibles, pour alimenter le wizard front. */
  options(): { disciplines: OptionView[]; priorities: OptionView[] } {
    return {
      disciplines: Object.entries(DISCIPLINES).map(([key, d]) => ({ key, label: d.label })),
      priorities: Object.entries(PRIORITIES).map(([key, p]) => ({ key, label: p.label })),
    };
  }

  list(opts: { discipline?: string; ids?: string[]; limit?: number } = {}): TyreView[] {
    if (opts.ids?.length) {
      const byId = new Map(this.tyres.map((p) => [makeTyreId(p), p]));
      return opts.ids
        .map((id) => byId.get(id))
        .filter((p): p is Product => Boolean(p))
        .map(toTyreView);
    }

    let items = this.tyres;
    if (opts.discipline) {
      const disc = DISCIPLINES[opts.discipline];
      if (!disc) throw new BadRequestException(`Discipline inconnue : ${opts.discipline}`);
      items = items.filter((p) => p.cycleType === disc.cycleType);
    }
    const limit = clampLimit(opts.limit, 50);
    return items.slice(0, limit).map(toTyreView);
  }

  recommend(opts: { discipline: string; priority: string; ebike?: boolean; limit?: number }): RecoView[] {
    if (!opts.discipline || !opts.priority) {
      throw new BadRequestException("Parametres requis : discipline, priority.");
    }
    let ranked: Reco[];
    try {
      ranked = recommend(this.tyres, {
        discipline: opts.discipline,
        priority: opts.priority,
        ebike: opts.ebike ?? false,
        limit: clampLimit(opts.limit, 10),
      });
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    return ranked.map((r) => ({ ...toTyreView(r.product), score: r.score, why: r.why }));
  }
}

function clampLimit(value: number | undefined, max: number): number {
  if (!value || Number.isNaN(value)) return 5;
  return Math.min(Math.max(1, Math.trunc(value)), max);
}

function toTyreView(p: Product): TyreView {
  return {
    id: makeTyreId(p),
    range: p.range,
    designation: p.designation,
    productType: p.productType,
    segment: p.segment,
    cycleType: p.cycleType,
    use: p.use,
    terrainTypes: p.terrainTypes,
    fitting: cleanText(p.fitting),
    widthEtrto: cleanText(p.widthEtrto),
    diameterEtrto: cleanText(p.diameterEtrto),
    webDiameterInch: cleanText(p.webDiameterInch),
    webWidthMm: cleanText(p.webWidthMm),
    tpi: p.tpi,
    weightG: p.weightG,
    pressure: p.pressure,
    technologies: p.technologies,
    sidewallColor: cleanText(p.sidewallColor),
  };
}

function makeTyreId(p: Product): string {
  return `${p.range} ${p.designation}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}
