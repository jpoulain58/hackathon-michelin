export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");

export interface TyreView {
  id?: string | number;
  globalId?: string;
  range: string;
  designation: string;
  productType?: string;
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
  brand?: string;
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
  const res = await fetch(`${API_BASE}/api/tyres${suffix}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
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

export interface InferredProfile {
  discipline: "road" | "gravel" | "mtb" | "city";
  priority: "speed" | "grip" | "durability" | "comfort" | "puncture";
  ebike: boolean;
  basedOnRides: number;
}

/** Profil pneu deduit des dernieres sorties Strava de l'utilisateur connecte. */
export async function fetchStravaTyreProfile(
  accessToken: string,
): Promise<{ profile: InferredProfile; items: RecoView[] } | null> {
  const res = await fetch(`${API_BASE}/api/tyres/recommend/from-strava`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as { profile: InferredProfile; items: RecoView[] };
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
  productId?: number;
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
  productId?: number;
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
    productId: 524,
    rating: 5,
    text: "Rendement bluffant sur les bosses, je gagne clairement en vitesse moyenne. Le grip en virage est rassurant meme a haute vitesse.",
    verifiedKm: 2847,
    verifiedRides: 84,
    terrains: "route",
    avgSpeedKmh: 31,
  },
  {
    id: "rev-002",
    rider: "Sofiane B.",
    tyre: "MICHELIN Power Gravel",
    productId: 507,
    rating: 5,
    text: "Accroche parfaite en gravel sec comme humide, zero crevaison en 1500 km. Le meilleur rapport grip/roulement que j'ai teste.",
    verifiedKm: 1523,
    verifiedRides: 41,
    terrains: "gravel",
    avgSpeedKmh: 24,
  },
  {
    id: "rev-003",
    rider: "Lea M.",
    tyre: "MICHELIN Power Protection TLR",
    productId: 488,
    rating: 4,
    text: "Confort top sur les longues sorties, zero crevaison depuis 4000 km. Un poil lourd compare a la concurrence Racing mais je privilegies la securite.",
    verifiedKm: 3960,
    verifiedRides: 102,
    terrains: "route",
    avgSpeedKmh: 28,
  },
  {
    id: "rev-004",
    rider: "Thomas R.",
    tyre: "MICHELIN Wild Enduro Front",
    productId: 695,
    rating: 5,
    text: "Mordant impressionnant en devers et dans les rochers mouilles. Je ne suis plus limite par le pneu avant, vraiment.",
    verifiedKm: 890,
    verifiedRides: 67,
    terrains: "VTT enduro mixte",
    avgSpeedKmh: 18,
  },
  {
    id: "rev-005",
    rider: "Marion G.",
    tyre: "MICHELIN Power Adventure",
    productId: 498,
    rating: 5,
    text: "Parfait pour mon usage bikepacking : rapide sur route, stable sur sentiers. J'ai traverse les Alpes dessus sans le moindre probleme.",
    verifiedKm: 2100,
    verifiedRides: 58,
    terrains: "route + sentiers",
    avgSpeedKmh: 22,
  },
  {
    id: "rev-006",
    rider: "Kevin L.",
    tyre: "MICHELIN Force AM2",
    productId: 764,
    rating: 5,
    text: "Polyvalent au max, je les roule de mars a novembre sur tout type de terrain. L'accroche en terre seche est excellente et ils encaissent bien les chocs.",
    verifiedKm: 1240,
    verifiedRides: 95,
    terrains: "VTT trail varié",
    avgSpeedKmh: 21,
  },
  {
    id: "rev-007",
    rider: "Julie B.",
    tyre: "MICHELIN City Street",
    productId: 592,
    rating: 4,
    text: "Parfait pour mon quotidien en ville, jamais de crevaison malgre les dechets sur les pistes cyclables parisiennes. Tres silencieux sur l'asphalte.",
    verifiedKm: 4200,
    verifiedRides: 312,
    terrains: "asphalte urbain",
    avgSpeedKmh: 19,
  },
  {
    id: "rev-008",
    rider: "Antoine M.",
    tyre: "MICHELIN PRO5 TLR",
    productId: 537,
    rating: 5,
    text: "5600 km et toujours impeccable. La regularite du roulement est bluffante, et le profil tient parfaitement la route en toutes conditions.",
    verifiedKm: 5600,
    verifiedRides: 145,
    terrains: "route",
    avgSpeedKmh: 29,
  },
  {
    id: "rev-009",
    rider: "Chloe V.",
    tyre: "MICHELIN Stargrip",
    productId: 583,
    rating: 4,
    text: "Indispensable en hiver a Paris. Meme sur les pavés mouilles ou les feuilles mortes, ca ne glisse pas. Je recommande pour les navetteurs hivernaux.",
    verifiedKm: 1800,
    verifiedRides: 220,
    terrains: "asphalte mouillé",
    avgSpeedKmh: 17,
  },
  {
    id: "rev-010",
    rider: "Romain P.",
    tyre: "MICHELIN Wild AM2",
    productId: 771,
    rating: 5,
    text: "Excellent equilibre entre accroche et roulement pour le trail. Ils ne se bouchent pas dans la boue et tiennent bien le carre en courbe sèche.",
    verifiedKm: 780,
    verifiedRides: 52,
    terrains: "VTT trail mixte",
    avgSpeedKmh: 20,
  },
  {
    id: "rev-011",
    rider: "Sarah K.",
    tyre: "MICHELIN Power All Season",
    productId: 496,
    rating: 5,
    text: "Mon pneu toute l'annee depuis 2 saisons. Performant par temps sec, rassurant sous la pluie. Je ne change plus meme l'ete, le roulement est vraiment bon.",
    verifiedKm: 6200,
    verifiedRides: 198,
    terrains: "route toutes conditions",
    avgSpeedKmh: 27,
  },
  {
    id: "rev-012",
    rider: "Baptiste F.",
    tyre: "MICHELIN City Cargo",
    productId: 584,
    rating: 4,
    text: "Robuste et fiable pour mon velo cargo avec les enfants. Aucune crevaison en 3400 km malgre la charge importante. Le confort absorbe bien les vibrations.",
    verifiedKm: 3400,
    verifiedRides: 280,
    terrains: "ville",
    avgSpeedKmh: 16,
  },
  {
    id: "rev-013",
    rider: "Emma S.",
    tyre: "MICHELIN Power Cyclocross Jet",
    productId: 549,
    rating: 5,
    text: "Tres polyvalent en cyclocross, rapide sur les sections dures et accrocheur dans la boue legere. Les relances sont nettes grace au profil centre.",
    verifiedKm: 420,
    verifiedRides: 28,
    terrains: "cyclocross mixte",
    avgSpeedKmh: 26,
  },
  {
    id: "rev-014",
    rider: "Lucas T.",
    tyre: "MICHELIN Force AM",
    productId: 808,
    rating: 4,
    text: "Bon compromis pour le trail quotidien, pas trop lourd et suffisamment accrocheur. Ideal pour qui cherche un pneu versatile sans casser la tirelire.",
    verifiedKm: 1100,
    verifiedRides: 76,
    terrains: "trail sec",
    avgSpeedKmh: 22,
  },
  {
    id: "rev-015",
    rider: "Nadia H.",
    tyre: "MICHELIN City Trekking",
    productId: 626,
    rating: 5,
    text: "Parfait pour mon usage mixte ville et chemin de halage. Tres confortable sur longue distance et la protection contre les crevaisons est reellement efficace.",
    verifiedKm: 2800,
    verifiedRides: 190,
    terrains: "ville + chemins",
    avgSpeedKmh: 18,
  },
];

export const FALLBACK_PROS: ProRider[] = [
  {
    name: "Pauline Ferrand-Prevot",
    discipline: "VTT XC / Gravel",
    team: "Ineos Grenadiers",
    tyre: "MICHELIN Power Gravel",
    productId: 507,
  },
  {
    name: "Julian Alaphilippe",
    discipline: "Route",
    team: "Tudor Pro Cycling",
    tyre: "MICHELIN Power Cup",
    productId: 524,
  },
  {
    name: "Mathieu van der Poel",
    discipline: "Route / Cyclocross",
    team: "Alpecin-Deceuninck",
    tyre: "MICHELIN Power Cup S",
    productId: 472,
  },
  {
    name: "Nino Schurter",
    discipline: "VTT Cross-Country",
    team: "Scott-SRAM MTB Racing",
    tyre: "MICHELIN Force XC3",
    productId: 745,
  },
  {
    name: "Loic Bruni",
    discipline: "VTT Descente",
    team: "Specialized Gravity",
    tyre: "MICHELIN Wild Enduro Front",
    productId: 695,
  },
  {
    name: "Annemiek van Vleuten",
    discipline: "Route",
    team: "Movistar Team",
    tyre: "MICHELIN PRO5 TLR",
    productId: 537,
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

export function formatKm(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M km`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k km`;
  return `${n} km`;
}
