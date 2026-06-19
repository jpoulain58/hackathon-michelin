import { Controller, Get, Headers, Inject, NotFoundException, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "../auth/auth.service";
import { StravaService } from "../auth/strava.service";
import { inferProfileFromStrava, TyresService } from "./tyres.service";

@ApiTags("tyres")
@Controller("tyres")
export class TyresController {
  // @Inject explicite : l'injection fonctionne meme sans metadata de type
  // (necessaire en dev avec tsx/esbuild, qui n'emet pas design:paramtypes).
  constructor(
    @Inject(TyresService) private readonly tyres: TyresService,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(StravaService) private readonly stravaService: StravaService,
  ) {}

  @ApiOperation({ summary: "Catalogue de pneus, filtrable par discipline ou par liste d'ids" })
  @ApiQuery({ name: "discipline", required: false, example: "road" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 12 })
  @ApiQuery({ name: "ids", required: false, description: "Liste d'ids separes par des virgules", example: "id-a,id-b" })
  @Get()
  list(
    @Query("discipline") discipline?: string,
    @Query("limit") limit?: string,
    @Query("ids") ids?: string,
  ) {
    const items = this.tyres.list({ discipline, ids: parseIds(ids), limit: toInt(limit) });
    return { count: items.length, total: this.tyres.count(), items };
  }

  @ApiOperation({ summary: "Disciplines & priorites disponibles (alimente le wizard \"Trouve ton pneu\")" })
  @Get("options")
  options() {
    return this.tyres.options();
  }

  @ApiOperation({ summary: "Recommandation de pneus scoree selon un profil discipline/priorite" })
  @ApiQuery({ name: "discipline", required: true, example: "gravel" })
  @ApiQuery({ name: "priority", required: true, example: "puncture" })
  @ApiQuery({ name: "ebike", required: false, type: Boolean, example: true })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 5 })
  @Get("recommend")
  recommend(
    @Query("discipline") discipline: string,
    @Query("priority") priority: string,
    @Query("ebike") ebike?: string,
    @Query("limit") limit?: string,
  ) {
    const items = this.tyres.recommend({
      discipline,
      priority,
      ebike: ebike === "true" || ebike === "1",
      limit: toInt(limit),
    });
    return { profile: { discipline, priority, ebike: ebike === "true" || ebike === "1" }, items };
  }

  @ApiOperation({ summary: "Recommandation deduite des sorties velo Strava recentes" })
  @ApiBearerAuth("supabase-jwt")
  @ApiResponse({ status: 404, description: "Aucune sortie velo Strava recente a analyser" })
  @Get("recommend/from-strava")
  async recommendFromStrava(@Headers("authorization") authorization?: string) {
    const user = await this.authService.getUserFromAuthorization(authorization);
    const strava = await this.stravaService.getProfile(user.id);
    if (!strava || strava.recentActivities.length === 0) {
      throw new NotFoundException(
        "Aucune sortie velo Strava recente a analyser. Relie Strava et synchronise au moins une sortie.",
      );
    }

    const inferred = inferProfileFromStrava(strava);
    const items = this.tyres.recommend({
      discipline: inferred.discipline,
      priority: inferred.priority,
      ebike: inferred.ebike,
      limit: 5,
    });

    return { profile: inferred, items };
  }
}

function toInt(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

function parseIds(value?: string): string[] | undefined {
  if (!value) return undefined;
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}
