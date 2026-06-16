import { Controller, Get, Inject, Query } from "@nestjs/common";
import { TyresService } from "./tyres.service";

@Controller("tyres")
export class TyresController {
  // @Inject explicite : l'injection fonctionne meme sans metadata de type
  // (necessaire en dev avec tsx/esbuild, qui n'emet pas design:paramtypes).
  constructor(@Inject(TyresService) private readonly tyres: TyresService) {}

  /** GET /api/tyres?discipline=road&limit=12 */
  @Get()
  list(@Query("discipline") discipline?: string, @Query("limit") limit?: string) {
    const items = this.tyres.list({ discipline, limit: toInt(limit) });
    return { count: items.length, total: this.tyres.count(), items };
  }

  /** GET /api/tyres/options — disciplines & priorites pour le wizard. */
  @Get("options")
  options() {
    return this.tyres.options();
  }

  /** GET /api/tyres/recommend?discipline=road&priority=speed&ebike=true&limit=5 */
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
}

function toInt(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}
