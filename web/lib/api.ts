export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
  pressure?: {
    minBar?: number | null;
    maxBar?: number | null;
    minPsi?: number | null;
    maxPsi?: number | null;
  };
  technologies?: Record<string, string[]>;
  sidewallColor?: string;
}

export interface RecoView extends TyreView {
  score: number;
  why: string[];
}

export interface Option {
  key: string;
  label: string;
}

export interface Options {
  disciplines: Option[];
  priorities: Option[];
}

/** Repli si l'API n'est pas joignable (demo offline). */
export const FALLBACK_OPTIONS: Options = {
  disciplines: [
    { key: "road", label: "Route" },
    { key: "gravel", label: "Gravel" },
    { key: "mtb", label: "VTT" },
    { key: "city", label: "Ville" },
  ],
  priorities: [
    { key: "speed", label: "vitesse / rendement" },
    { key: "grip", label: "adherence" },
    { key: "durability", label: "durabilite" },
    { key: "comfort", label: "confort" },
    { key: "puncture", label: "anti-crevaison" },
  ],
};

export async function fetchOptions(): Promise<Options> {
  const res = await fetch(`${API_BASE}/api/tyres/options`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as Options;
}

export async function fetchRecommendations(params: {
  discipline: string;
  priority: string;
  ebike: boolean;
  limit?: number;
}): Promise<RecoView[]> {
  const q = new URLSearchParams({
    discipline: params.discipline,
    priority: params.priority,
    ebike: String(params.ebike),
    limit: String(params.limit ?? 5),
  });
  const res = await fetch(`${API_BASE}/api/tyres/recommend?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  const data = (await res.json()) as { items: RecoView[] };
  return data.items;
}

export async function fetchTyres(params: {
  ids?: string[];
  discipline?: string;
  limit?: number;
} = {}): Promise<TyreView[]> {
  const q = new URLSearchParams();
  if (params.ids?.length) q.set("ids", params.ids.join(","));
  if (params.discipline) q.set("discipline", params.discipline);
  if (params.limit) q.set("limit", String(params.limit));

  const suffix = q.toString() ? `?${q.toString()}` : "";
  const res = await fetch(`${API_BASE}/api/tyres${suffix}`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  const data = (await res.json()) as { items: TyreView[] };
  return data.items;
}

// --- Communaute -------------------------------------------------------------

export interface CommunityStats {
  ridersCount: number;
  monthKm: number;
  totalKm: number;
  verifiedReviews: number;
}

export interface VerifiedReview {
  id: string;
  rider: string;
  tyre: string;
  rating: number;
  text: string;
  verifiedKm: number;
  verifiedRides: number;
  terrains: string;
  avgSpeedKmh: number;
}

export interface ProRider {
  name: string;
  discipline: string;
  team: string;
  tyre: string;
}

export const FALLBACK_STATS: CommunityStats = {
  ridersCount: 12300,
  monthKm: 2_400_000,
  totalKm: 48_200_000,
  verifiedReviews: 1840,
};

export const FALLBACK_REVIEWS: VerifiedReview[] = [
  { id: "rev-001", rider: "Camille D.", tyre: "MICHELIN Power Cup", rating: 5, text: "Rendement bluffant sur les bosses, je gagne clairement en vitesse moyenne.", verifiedKm: 2847, verifiedRides: 84, terrains: "route + gravel", avgSpeedKmh: 31 },
  { id: "rev-002", rider: "Sofiane B.", tyre: "MICHELIN Power Gravel", rating: 5, text: "Accroche parfaite en gravel sec comme humide, zero crevaison en 1500 km.", verifiedKm: 1523, verifiedRides: 41, terrains: "gravel", avgSpeedKmh: 24 },
  { id: "rev-003", rider: "Lea M.", tyre: "MICHELIN Power Road TLR", rating: 4, text: "Confort top sur les longues sorties, un poil lourd a mon gout.", verifiedKm: 3960, verifiedRides: 102, terrains: "route", avgSpeedKmh: 28 },
];

export const FALLBACK_PROS: ProRider[] = [
  { name: "Pauline Ferrand-Prevot", discipline: "VTT / Gravel", team: "Team demo", tyre: "MICHELIN Power Gravel" },
  { name: "Coureur WorldTour (demo)", discipline: "Route", team: "Team demo", tyre: "MICHELIN Power Cup" },
];

export async function fetchStats(): Promise<CommunityStats> {
  const res = await fetch(`${API_BASE}/api/community/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as CommunityStats;
}

export async function fetchReviews(): Promise<VerifiedReview[]> {
  const res = await fetch(`${API_BASE}/api/community/reviews`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: VerifiedReview[] }).items;
}

export async function fetchPros(): Promise<ProRider[]> {
  const res = await fetch(`${API_BASE}/api/community/pros`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: ProRider[] }).items;
}

export function formatKm(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M km`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k km`;
  return `${n} km`;
}
