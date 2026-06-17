export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface TyreView {
  id?: number;
  globalId?: string;
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
}

export interface TyreDetail extends TyreView {
  id: number;
  globalId?: string;
  brand?: string;
  productType?: string;
  fitting?: string;
  tpi?: string;
  widthEtrto?: string;
  diameterEtrto?: string;
  eanCode?: string;
  caiCode?: string;
  minBar?: number;
  maxBar?: number;
  minPsi?: number;
  maxPsi?: number;
  discontinuedDate?: string;
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
  const res = await fetch(`${API_BASE}/api/tyres/options`, {
    cache: "no-store",
  });
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
  const res = await fetch(`${API_BASE}/api/tyres/recommend?${q.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  const data = (await res.json()) as { items: RecoView[] };
  return data.items;
}

export async function fetchTyres(): Promise<TyreView[]> {
  const res = await fetch(`${API_BASE}/api/tyres?limit=50`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { items: TyreView[] };
  return data.items;
}

export const FALLBACK_TYRES: TyreView[] = [
  {
    range: "MICHELIN POWER CYCLOCROSS MUD TUBULAR RACING LINE",
    designation: "33-622 (700X33) POWER CYCLOCROSS MUD TUBULAR",
    cycleType: "ROAD",
    segment: "PREMIUM RACING LINE",
    use: ["CYCLOCROSS"],
    terrainTypes: ["OFFROAD MIXED", "OFFROAD SOFT", "OFFROAD MUD"],
    weightG: 470,
  },
  {
    range: "MICHELIN POWER CYCLOCROSS JET TUBULAR RACING LINE",
    designation: "33-622 (700X33) POWER CYCLOCROSS JET TUBULAR",
    cycleType: "ROAD",
    segment: "PREMIUM RACING LINE",
    use: ["CYCLOCROSS"],
    terrainTypes: ["ASPHALT", "OFFROAD HARD PACKED", "OFFROAD MIXED"],
    weightG: 460,
  },
  {
    range: "MICHELIN POWER CUP TUBULAR RACING LINE",
    designation: '28"-23mm POWER CUP TUBULAR BLACK',
    cycleType: "ROAD",
    segment: "PREMIUM RACING LINE",
    use: ["RACING"],
    terrainTypes: ["ASPHALT"],
    weightG: 265,
  },
  {
    range: "MICHELIN POWER TIME TRIAL RACING LINE",
    designation: "23-622 (700X23C) POWER TIME TRIAL BLACK",
    cycleType: "ROAD",
    segment: "PREMIUM RACING LINE",
    use: ["RACING"],
    terrainTypes: ["ASPHALT"],
    weightG: 180,
  },
  {
    range: "MICHELIN POWER CUP S RACING LINE",
    designation: "28-622 (700X28C) POWER CUP S RACING LINE FOLDABLE BEAD TLR",
    cycleType: "ROAD",
    segment: "PREMIUM RACING LINE",
    use: ["RACING"],
    terrainTypes: ["ASPHALT"],
    weightG: 290,
  },
  {
    range: "MICHELIN POWER GRAVEL RS RACING LINE",
    designation:
      "42-622 (700x42C) POWER GRAVEL RS RACING LINE FOLDABLE BEAD TLR",
    cycleType: "ROAD",
    segment: "PREMIUM RACING LINE",
    use: ["RACING", "E-GRAVEL"],
    terrainTypes: ["ASPHALT", "OFFROAD HARD PACKED"],
    weightG: 445,
  },
  {
    range: "MICHELIN POWER PROTECTION TLR COMPETITION LINE",
    designation: "28-622 (700x28C) POWER PROTECTION BLACK",
    cycleType: "ROAD",
    segment: "PREMIUM COMPETITION LINE",
    use: ["ENDURANCE", "ALL ROAD", "E-ROAD"],
    terrainTypes: ["ASPHALT"],
    weightG: 315,
  },
  {
    range: "MICHELIN STARGRIP COMPETITION LINE",
    designation: "37-622 (700X35C) STARGRIP",
    cycleType: "CITY",
    segment: "PREMIUM COMPETITION LINE",
    use: ["URBAN"],
    terrainTypes: ["ASPHALT"],
    weightG: 680,
  },
  {
    range: "MICHELIN CITY CARGO COMPETITION LINE",
    designation: "55-406 (20x2.20) 33B CITY CARGO WIRE BEAD TT",
    cycleType: "CITY",
    segment: "PREMIUM COMPETITION LINE",
    use: ["CARGO", "URBAN", "E-CARGO", "E-CITY"],
    terrainTypes: ["ASPHALT"],
    weightG: 900,
  },
  {
    range: "MICHELIN CITY STREET COMPETITION LINE (FOLDABLE BEAD)",
    designation: "55/100-584 (27.5x2.20) 40B CITY STREET",
    cycleType: "CITY",
    segment: "PREMIUM COMPETITION LINE",
    use: ["URBAN", "E-CITY", "SPEEDELEC"],
    terrainTypes: ["ASPHALT"],
    weightG: 795,
  },
  {
    range: "MICHELIN CITY TOURING COMPETITION LINE (FB)",
    designation: "55-584 (27.5x2.20) 40B CITY TOURING FOLDABLE BEAD TT",
    cycleType: "CITY",
    segment: "PREMIUM COMPETITION LINE",
    use: ["TOURING", "E-TOURING", "E-CITY", "SPEEDELEC"],
    terrainTypes: ["ASPHALT", "OFFROAD HARD PACKED"],
    weightG: 900,
  },
  {
    range: "MICHELIN CITY TREKKING COMPETITION LINE (FB)",
    designation: "60-584 (27.5X2.40) 35B CITY TREKKING FOLDABLE BEAD TT",
    cycleType: "CITY",
    segment: "PREMIUM COMPETITION LINE",
    use: [
      "TREKKING",
      "TOURING",
      "URBAN",
      "E-TREKKING",
      "E-TOURING",
      "E-CITY",
      "SPEEDELEC",
    ],
    terrainTypes: ["ASPHALT", "OFFROAD HARD PACKED", "OFFROAD MIXED"],
    weightG: 970,
  },
  {
    range: "MICHELIN CITY STREET PERFORMANCE LINE",
    designation: "40-559 (26x1.60) CITY STREET",
    cycleType: "CITY",
    segment: "PREMIUM PERFORMANCE LINE",
    use: ["URBAN", "E-CITY"],
    terrainTypes: ["ASPHALT"],
    weightG: 630,
  },
  {
    range: "MICHELIN CITY TOURING PERFORMANCE LINE",
    designation: "35-349 (16x1.40) CITY TOURING WIRE BEAD TT",
    cycleType: "CITY",
    segment: "PREMIUM PERFORMANCE LINE",
    use: ["TOURING", "E-CITY", "E-TOURING"],
    terrainTypes: ["ASPHALT", "OFFROAD HARD PACKED"],
    weightG: 370,
  },
  {
    range: "MICHELIN WILD ENDURO FRONT RACING LINE",
    designation: "61-622 (29X2.40) WILD ENDURO FRONT",
    cycleType: "MTB",
    segment: "PREMIUM RACING LINE",
    use: ["ENDURO", "E-ENDURO"],
    terrainTypes: ["OFFROAD MIXED"],
    weightG: 1400,
  },
  {
    range: "MICHELIN WILD ENDURO REAR RACING LINE",
    designation: "61-622 (29X2.40) WILD ENDURO REAR",
    cycleType: "MTB",
    segment: "PREMIUM RACING LINE",
    use: ["ENDURO", "E-ENDURO"],
    terrainTypes: ["OFFROAD HARD PACKED", "OFFROAD MIXED"],
    weightG: 1350,
  },
  {
    range: "MICHELIN WILD ENDURO MH RACING LINE",
    designation: "63-584 (27.5X2.50) WILD ENDURO MH RACING LINE",
    cycleType: "MTB",
    segment: "PREMIUM RACING LINE",
    use: ["ENDURO", "E-ENDURO"],
    terrainTypes: ["OFFROAD HARD PACKED", "OFFROAD MIXED"],
    weightG: 1295,
  },
  {
    range: "MICHELIN WILD ENDURO MS RACING LINE",
    designation: "61-584 (27.5X2.40) WILD ENDURO MS RACING LINE",
    cycleType: "MTB",
    segment: "PREMIUM RACING LINE",
    use: ["ENDURO", "E-ENDURO"],
    terrainTypes: ["OFFROAD MIXED", "OFFROAD SOFT"],
    weightG: 1235,
  },
  {
    range: "MICHELIN DH16 RACING LINE",
    designation: "61-584 (27.5X2.40) DH16",
    cycleType: "MTB",
    segment: "PREMIUM RACING LINE",
    use: ["DOWNHILL", "ENDURO", "E-ENDURO"],
    terrainTypes: ["OFFROAD HARD PACKED", "OFFROAD MIXED"],
    weightG: 1280,
  },
  {
    range: "MICHELIN DH22 RACING LINE",
    designation: "61-584 (27.5X2.40) DH22",
    cycleType: "MTB",
    segment: "PREMIUM RACING LINE",
    use: ["DOWNHILL", "ENDURO", "E-ENDURO"],
    terrainTypes: ["OFFROAD MIXED", "OFFROAD SOFT"],
    weightG: 1440,
  },
  {
    range: "MICHELIN DH22 RACING LINE (FOLDABLE BEAD)",
    designation: "61-584 (27.5X2.40) DH22 FOLDABLE BEAD",
    cycleType: "MTB",
    segment: "PREMIUM RACING LINE",
    use: ["DOWNHILL", "ENDURO", "E-ENDURO"],
    terrainTypes: ["OFFROAD MIXED", "OFFROAD SOFT"],
    weightG: 1260,
  },
];

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
  {
    id: "rev-001",
    rider: "Camille D.",
    tyre: "MICHELIN Power Cup",
    rating: 5,
    text: "Rendement bluffant sur les bosses, je gagne clairement en vitesse moyenne.",
    verifiedKm: 2847,
    verifiedRides: 84,
    terrains: "route + gravel",
    avgSpeedKmh: 31,
  },
  {
    id: "rev-002",
    rider: "Sofiane B.",
    tyre: "MICHELIN Power Gravel",
    rating: 5,
    text: "Accroche parfaite en gravel sec comme humide, zero crevaison en 1500 km.",
    verifiedKm: 1523,
    verifiedRides: 41,
    terrains: "gravel",
    avgSpeedKmh: 24,
  },
  {
    id: "rev-003",
    rider: "Lea M.",
    tyre: "MICHELIN Power Road TLR",
    rating: 4,
    text: "Confort top sur les longues sorties, un poil lourd a mon gout.",
    verifiedKm: 3960,
    verifiedRides: 102,
    terrains: "route",
    avgSpeedKmh: 28,
  },
];

export const FALLBACK_PROS: ProRider[] = [
  {
    name: "Pauline Ferrand-Prevot",
    discipline: "VTT / Gravel",
    team: "Team demo",
    tyre: "MICHELIN Power Gravel",
  },
  {
    name: "Coureur WorldTour (demo)",
    discipline: "Route",
    team: "Team demo",
    tyre: "MICHELIN Power Cup",
  },
];

export async function fetchStats(): Promise<CommunityStats> {
  const res = await fetch(`${API_BASE}/api/community/stats`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as CommunityStats;
}

export async function fetchReviews(): Promise<VerifiedReview[]> {
  const res = await fetch(`${API_BASE}/api/community/reviews`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: VerifiedReview[] }).items;
}

export async function fetchPros(): Promise<ProRider[]> {
  const res = await fetch(`${API_BASE}/api/community/pros`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: ProRider[] }).items;
}

// --- Strava (Mon Garage) ----------------------------------------------------

export interface StravaStats {
  connected: boolean;
  totalKm: number;
  rideCount: number;
}

/** Cumul des km Strava du rider connecte. Requiert le JWT Supabase. */
export async function fetchStravaStats(accessToken: string): Promise<StravaStats> {
  const res = await fetch(`${API_BASE}/api/auth/strava/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  return (await res.json()) as StravaStats;
}

export function formatKm(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M km`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k km`;
  return `${n} km`;
}
