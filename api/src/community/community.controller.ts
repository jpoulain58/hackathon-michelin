import { Controller, Get, Inject } from "@nestjs/common";
import { CommunityService } from "./community.service";

@Controller("community")
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly community: CommunityService) {}

  /** GET /api/community/stats — compteurs collectifs. */
  @Get("stats")
  stats() {
    return this.community.stats();
  }

  /** GET /api/community/pros — pneus des pros. */
  @Get("pros")
  pros() {
    const items = this.community.pros();
    return { count: items.length, items };
  }
}
