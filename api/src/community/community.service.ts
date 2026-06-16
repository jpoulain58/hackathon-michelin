import { Injectable } from "@nestjs/common";
import {
  COMMUNITY_STATS,
  VERIFIED_REVIEWS,
  PRO_RIDERS,
  type CommunityStats,
  type VerifiedReview,
  type ProRider,
} from "./community.data";

@Injectable()
export class CommunityService {
  /** Compteurs collectifs (preuve sociale "de masse"). */
  stats(): CommunityStats {
    return COMMUNITY_STATS;
  }

  /**
   * Avis verifies (adosses aux vrais km Strava). Optionnellement filtres
   * par modele de pneu. Tries du plus "prouve" au moins prouve (km verifies).
   */
  reviews(opts: { tyre?: string; limit?: number } = {}): VerifiedReview[] {
    let items = [...VERIFIED_REVIEWS];
    if (opts.tyre) {
      const q = opts.tyre.toUpperCase();
      items = items.filter((r) => r.tyre.toUpperCase().includes(q));
    }
    items.sort((a, b) => b.verifiedKm - a.verifiedKm);
    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 50) : items.length;
    return items.slice(0, limit);
  }

  /** Pneus des pros (benchmark communautaire). */
  pros(): ProRider[] {
    return PRO_RIDERS;
  }
}
