export type TabKey = "trouver" | "comparer" | "communaute" | "club" | "profil";

export type TyreCategory = "Route" | "Montagne" | "Performance";

export interface Tyre {
  id: string;
  name: string;
  weight: string; // ex. "205 g"
  dimensions: string; // ex. "8 dimensions disponibles"
  matchScore: number; // 0-100
  bestChoice?: boolean;
  categories: TyreCategory[];
  range?: string;
  designation?: string;
  productType?: string;
  segment?: string;
  cycleType?: string;
  use?: string[];
  terrainTypes?: string[];
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
  score?: number;
  why?: string[];
}

export interface CompareColumn {
  id: string;
  label: string; // ex. "Power Cup"
  tag?: string; // ex. "TON MATCH"
  accent: string; // couleur de la pastille d'en-tete
  rendement: number; // 0-5
  adherence: number; // 0-5
  antiCrevaison: number; // 0-5
  poids: string;
  prix: string;
  avis: string;
}

export interface Review {
  id: string;
  productId: number;
  author: string; // initiales ex. "MR"
  product: string; // ex. "MICHELIN Power Cup - 700x25C"
  rating: number; // 0-5
  verified: boolean;
  text: string;
}

export interface NewsItem {
  id: string;
  title: string;
  image: string;
}

export interface Ride {
  id: string;
  title: string;
  distanceKm: string; // "21,8 km"
  elevation: string; // "511 m"
  duration: string; // "3h30"
  tags: string[];
  mapUrl: string;
  pts?: [number, number][];
  summary: string;
  startInstructions: string;
  proTip: { author: string; text: string };
  recommendedTyres: Tyre[];
}

export interface ClubPlan {
  name: string;
  price: string;
  advantages: string[];
}
