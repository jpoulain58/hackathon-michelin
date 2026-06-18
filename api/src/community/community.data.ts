/**
 * Donnees seed de la communaute Michelin Trust Wheels (compteurs collectifs,
 * pneus des pros). Les avis riders sont stockes en base (table `reviews`,
 * cf. supabase/reviews.sql) et servis par les routes web/app/api/reviews,
 * pas par ce module.
 */

export interface CommunityStats {
  ridersCount: number;
  monthKm: number;
  totalKm: number;
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
};

export const PRO_RIDERS: ProRider[] = [
  { name: "Pauline Ferrand-Prevot", discipline: "VTT / Gravel", team: "Team demo", tyre: "MICHELIN Power Gravel" },
  { name: "Coureur WorldTour (demo)", discipline: "Route", team: "Team demo", tyre: "MICHELIN Power Cup" },
  { name: "Rider Enduro (demo)", discipline: "VTT Enduro", team: "Team demo", tyre: "MICHELIN Force AM" },
  { name: "Ultra-distance (demo)", discipline: "Gravel longue distance", team: "Team demo", tyre: "MICHELIN Power Adventure" },
];
