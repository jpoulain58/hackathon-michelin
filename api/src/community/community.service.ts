import { Injectable } from "@nestjs/common";
import { COMMUNITY_STATS, PRO_RIDERS, type CommunityStats, type ProRider } from "./community.data";

@Injectable()
export class CommunityService {
  /** Compteurs collectifs (preuve sociale "de masse"). */
  stats(): CommunityStats {
    return COMMUNITY_STATS;
  }

  /** Pneus des pros (benchmark communautaire). */
  pros(): ProRider[] {
    return PRO_RIDERS;
  }

  /** Fiche d'un pro (photo, palmares, pneus par competition). */
  proBySlug(slug: string): ProRider | undefined {
    return PRO_RIDERS.find((p) => p.slug === slug);
  }
}
