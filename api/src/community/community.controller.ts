import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CommunityService } from "./community.service";

@ApiTags("community")
@Controller("community")
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly community: CommunityService) {}

  @ApiOperation({ summary: "Compteurs collectifs (preuve sociale)" })
  @Get("stats")
  stats() {
    return this.community.stats();
  }

  @ApiOperation({ summary: "Pneus des pros (benchmark communautaire)" })
  @Get("pros")
  pros() {
    const items = this.community.pros();
    return { count: items.length, items };
  }

  @ApiOperation({ summary: "Fiche d'un pro (palmares, pneus par competition)" })
  @ApiParam({ name: "slug", example: "tom-pidcock" })
  @ApiResponse({ status: 404, description: "Pro introuvable" })
  @Get("pros/:slug")
  pro(@Param("slug") slug: string) {
    const pro = this.community.proBySlug(slug);
    if (!pro) throw new NotFoundException("Pro introuvable");
    return pro;
  }
}
