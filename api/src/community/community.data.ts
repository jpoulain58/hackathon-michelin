/**
 * Donnees seed de la communaute Michelin Trust Wheels.
 *
 * En production, ces objets viennent de la base (riders connectes a Strava),
 * et les champs `verified*` sont CALCULES a partir des sorties Strava du rider
 * sur la periode d'usage du pneu. Le seed permet une demo sans reseau
 * (recommande par le doc d'architecture).
 */

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
  rating: number; // 1..5
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

export const COMMUNITY_STATS: CommunityStats = {
  ridersCount: 12300,
  monthKm: 2_400_000,
  totalKm: 48_200_000,
  verifiedReviews: 1840,
};

export const VERIFIED_REVIEWS: VerifiedReview[] = [
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
  {
    id: "rev-004",
    rider: "Hugo R.",
    tyre: "MICHELIN Force AM",
    rating: 5,
    text: "En enduro, le grip dans les racines change tout. Confiance totale.",
    verifiedKm: 980,
    verifiedRides: 33,
    terrains: "VTT",
    avgSpeedKmh: 17,
  },
  {
    id: "rev-005",
    rider: "Ines T.",
    tyre: "MICHELIN Power Cup",
    rating: 5,
    text: "Montee du Puy de Dome chrono battu, pneu nerveux et rassurant en descente.",
    verifiedKm: 2110,
    verifiedRides: 59,
    terrains: "route",
    avgSpeedKmh: 29,
  },
  {
    id: "rev-006",
    rider: "Theo G.",
    tyre: "MICHELIN Power Protection TLR",
    rating: 4,
    text: "Vraiment increvable pour mes trajets quotidiens, je recommande en ville.",
    verifiedKm: 1740,
    verifiedRides: 128,
    terrains: "route + ville",
    avgSpeedKmh: 22,
  },
];

export const PRO_RIDERS: ProRider[] = [
  { name: "Pauline Ferrand-Prevot", discipline: "VTT / Gravel", team: "Team demo", tyre: "MICHELIN Power Gravel" },
  { name: "Coureur WorldTour (demo)", discipline: "Route", team: "Team demo", tyre: "MICHELIN Power Cup" },
  { name: "Rider Enduro (demo)", discipline: "VTT Enduro", team: "Team demo", tyre: "MICHELIN Force AM" },
  { name: "Ultra-distance (demo)", discipline: "Gravel longue distance", team: "Team demo", tyre: "MICHELIN Power Adventure" },
];
