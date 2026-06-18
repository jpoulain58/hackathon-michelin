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
}

export interface ReviewItem {
  id: number;
  productId: number;
  rating: number;
  text: string;
  createdAt: string;
  riderName: string;
  isAmbassador: boolean;
  tyre?: string;
}

export interface ProductOption {
  id: number;
  name: string;
}

export interface ProCompetition {
  name: string;
  tyre: string;
  date?: string;
  result?: string;
  productId?: number;
}

export interface ProRider {
  slug: string;
  name: string;
  discipline: string;
  team: string;
  tyre: string;
  productId?: number;
  image: string;
  bio?: string;
  competitions: ProCompetition[];
}

export const FALLBACK_STATS: CommunityStats = {
  ridersCount: 12300,
  monthKm: 2_400_000,
  totalKm: 48_200_000,
};

export const FALLBACK_PROS: ProRider[] = [
  {
    slug: "pauline-ferrand-prevot",
    name: "Pauline Ferrand-Prevot",
    discipline: "VTT XC / Gravel",
    team: "Ineos Grenadiers",
    tyre: "MICHELIN Power Gravel",
    productId: 507,
    image: "https://www.lequipe.fr/_medias/img-photo-jpg/pauline-ferrand-prevot-a-remporte-le-tour-de-france-pour-sa-premiere-participation-r-gomez-presse-sp/1500000002248555/0:0,2000:1333-828-552-75/1cd4f.jpg",
    bio: "Multiple championne du monde, elle alterne XC et gravel longue distance.",
    competitions: [
      { name: "Championnats du monde XC 2024", tyre: "MICHELIN Power Gravel", date: "Aout 2024", productId: 507, result: "Championne du monde" },
      { name: "UCI Gravel World Series", tyre: "MICHELIN Power Gravel", date: "Mai 2024", result: "Top 3" },
      { name: "Coupe du monde XCO", tyre: "MICHELIN Force XC3", date: "Juin 2024", result: "Podium" },
    ],
  },
  {
    slug: "julian-alaphilippe",
    name: "Julian Alaphilippe",
    discipline: "Route",
    team: "Tudor Pro Cycling",
    tyre: "MICHELIN Power Cup",
    productId: 524,
    image: "https://www.lequipe.fr/_medias/img-photo-jpg/julian-alaphilippe-lors-de-la-course-en-ligne-des-jo-de-paris-le-3-aout-dernier-g-van-gansen-photonews-presse-sports/1500000002037422/293:60,1549:1316-828-828-75/5904d",
    bio: "Puncheur explosif, deux fois champion du monde sur route.",
    competitions: [
      { name: "Tour de France 2025", tyre: "MICHELIN Power Cup", date: "Juillet 2025", productId: 524, result: "Etape gagnee" },
      { name: "Liege-Bastogne-Liege", tyre: "MICHELIN Power Cup", date: "Avril 2025", result: "Top 10" },
      { name: "Criterium du Dauphine", tyre: "MICHELIN Power Cup S", date: "Juin 2025", result: "Top 5" },
    ],
  },
  {
    slug: "mathieu-van-der-poel",
    name: "Mathieu van der Poel",
    discipline: "Route / Cyclocross",
    team: "Alpecin-Deceuninck",
    tyre: "MICHELIN Power Cup S",
    productId: 472,
    image: "https://4gold.eu/cdn/shop/articles/Scherm_afbeelding_2024-07-03_om_11.45.56_4b9f589d-684e-410d-8bd9-76758e48d052.png?v=1740063721",
    bio: "Le plus polyvalent du peloton : route, cyclocross et VTT.",
    competitions: [
      { name: "Tour des Flandres 2025", tyre: "MICHELIN Power Cup S", date: "Mars 2025", productId: 472, result: "Vainqueur" },
      { name: "Championnats du monde de cyclocross", tyre: "MICHELIN Power Cup S", date: "Fevrier 2025", result: "Champion du monde" },
      { name: "Paris-Roubaix", tyre: "MICHELIN Power Cup", date: "Avril 2025", result: "Podium" },
    ],
  },
  {
    slug: "nino-schurter",
    name: "Nino Schurter",
    discipline: "VTT Cross-Country",
    team: "Scott-SRAM MTB Racing",
    tyre: "MICHELIN Force XC3",
    productId: 745,
    image: "https://bnj.blob.core.windows.net/assets/Htdocs/Images/IF_Content_480/20250816170123071.jpg?puid=51209d1f-6b73-4986-b901-5b0240ac5e9d",
    bio: "Legende du XC, recordman de titres mondiaux.",
    competitions: [
      { name: "Coupe du monde XCO - Nove Mesto", tyre: "MICHELIN Force XC3", date: "Mai 2024", productId: 745, result: "Vainqueur" },
      { name: "Championnats du monde XC 2024", tyre: "MICHELIN Force XC3", date: "Aout 2024", result: "Podium" },
      { name: "Marathon des VTT Engadine", tyre: "MICHELIN Power Gravel", date: "Aout 2024", result: "Top 5" },
    ],
  },
  {
    slug: "loic-bruni",
    name: "Loic Bruni",
    discipline: "VTT Descente",
    team: "Specialized Gravity",
    tyre: "MICHELIN Wild Enduro Front",
    productId: 695,
    image: "https://magura.com/wp-content/uploads/2026/01/WC52D3-1.jpg",
    bio: "Champion du monde de descente, expert des terrains les plus engages.",
    competitions: [
      { name: "Coupe du monde DH - Fort William", tyre: "MICHELIN Wild Enduro Front", date: "Mai 2024", productId: 695, result: "Vainqueur" },
      { name: "Championnats du monde DH 2024", tyre: "MICHELIN Wild Enduro Front", date: "Septembre 2024", result: "Vice-champion" },
      { name: "Crankworx", tyre: "MICHELIN Wild Enduro Rear", date: "Juillet 2024", result: "Top 3" },
    ],
  },
  {
    slug: "annemiek-van-vleuten",
    name: "Annemiek van Vleuten",
    discipline: "Route",
    team: "Movistar Team",
    tyre: "MICHELIN PRO5 TLR",
    productId: 537,
    image: "https://www.226ers.com/cdn/shop/articles/Annemiek_Van_Vleuten_vencedora_giro_italia.jpg?v=1747642479",
    bio: "Specialiste des courses par etapes et du contre-la-montre.",
    competitions: [
      { name: "Tour de France Femmes", tyre: "MICHELIN PRO5 TLR", date: "Aout 2024", productId: 537, result: "Vainqueur" },
      { name: "Championnats du monde CLM", tyre: "MICHELIN PRO5 TLR", date: "Septembre 2024", result: "Championne du monde" },
      { name: "La Vuelta Femenina", tyre: "MICHELIN Power Cup", date: "Mai 2024", result: "Podium" },
    ],
  },
];

export async function fetchStats(): Promise<CommunityStats> {
  const res = await fetch(`${API_BASE}/api/community/stats`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as CommunityStats;
}

// Avis : servis par les routes Next.js internes (/api/reviews, /api/products),
// pas par l'API NestJS — elles lisent/ecrivent directement en base via
// supabaseAdmin (cf. web/lib/reviews.ts).
export async function fetchRecentReviews(limit = 20): Promise<{ items: ReviewItem[]; count: number }> {
  const res = await fetch(`/api/reviews?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as { items: ReviewItem[]; count: number };
}

export async function fetchProductsList(): Promise<ProductOption[]> {
  const res = await fetch(`/api/products`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: ProductOption[] }).items;
}

export async function submitReview(
  accessToken: string,
  input: { productId: number; rating: number; text: string },
): Promise<void> {
  const res = await fetch(`/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `API ${res.status}`);
  }
}

export async function fetchPros(): Promise<ProRider[]> {
  const res = await fetch(`${API_BASE}/api/community/pros`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: ProRider[] }).items;
}

export async function fetchPro(slug: string): Promise<ProRider | null> {
  const res = await fetch(`${API_BASE}/api/community/pros/${slug}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as ProRider;
}

export interface Retailer {
  id: number;
  region: string | null;
  country: string | null;
  website: string;
}

export async function fetchRetailers(params: { country?: string; limit?: number } = {}): Promise<Retailer[]> {
  const q = new URLSearchParams();
  if (params.country) q.set("country", params.country);
  if (params.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const res = await fetch(`${API_BASE}/api/retailers${suffix}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return ((await res.json()) as { items: Retailer[] }).items;
}

// --- Strava (Mon Garage) ----------------------------------------------------

export interface StravaStats {
  connected: boolean;
  totalKm: number;
  rideCount: number;
}

/**
 * Cumul des km Strava du rider connecte. Lit l'API profil existante
 * (/api/auth/profile -> strava.totals.allRideKm). Requiert le JWT Supabase.
 */
export async function fetchStravaStats(accessToken: string): Promise<StravaStats> {
  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  const data = (await res.json()) as {
    strava?: { totals?: { allRideKm?: number; allRideCount?: number } } | null;
  };
  const totals = data.strava?.totals;
  return {
    connected: Boolean(data.strava),
    totalKm: Math.round(totals?.allRideKm ?? 0),
    rideCount: totals?.allRideCount ?? 0,
  };
}

export function formatKm(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M km`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k km`;
  return `${n} km`;
}
