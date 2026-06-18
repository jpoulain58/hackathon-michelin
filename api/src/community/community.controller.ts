import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";
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

  /** GET /api/community/pros/:slug — fiche d'un pro. */
  @Get("pros/:slug")
  pro(@Param("slug") slug: string) {
    const pro = this.community.proBySlug(slug);
    if (!pro) throw new NotFoundException("Pro introuvable");
    return pro;
  }
}
