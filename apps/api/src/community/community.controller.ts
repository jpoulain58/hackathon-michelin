import { Controller, Get, Query } from "@nestjs/common";
import { CommunityService } from "./community.service";

@Controller("community")
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  /** GET /api/community/stats — compteurs collectifs. */
  @Get("stats")
  stats() {
    return this.community.stats();
  }

  /** GET /api/community/reviews?tyre=power%20cup&limit=10 — avis verifies. */
  @Get("reviews")
  reviews(@Query("tyre") tyre?: string, @Query("limit") limit?: string) {
    const items = this.community.reviews({ tyre, limit: toInt(limit) });
    return { count: items.length, items };
  }

  /** GET /api/community/pros — pneus des pros. */
  @Get("pros")
  pros() {
    const items = this.community.pros();
    return { count: items.length, items };
  }
}

function toInt(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}
