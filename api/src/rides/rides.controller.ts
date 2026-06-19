import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "../auth/auth.service";
import { type CreateRideForm, RidesService } from "./rides.service";
import { CreateRideFromGpxDto, CreateRideFromStravaDto } from "./rides.dto";

@ApiTags("rides")
@Controller("rides")
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: "Liste des balades publiques (filtrable)" })
  @ApiQuery({ name: "terrain", required: false, example: "Route" })
  @ApiQuery({ name: "difficulty", required: false, example: "Expert" })
  @ApiQuery({ name: "ambassador", required: false, type: Boolean })
  @Get()
  async list(
    @Query("terrain") terrain?: string,
    @Query("difficulty") difficulty?: string,
    @Query("ambassador") ambassador?: string,
  ) {
    const items = await this.ridesService.listPublic({ terrain, difficulty, ambassador: ambassador === "true" });
    return { items };
  }

  @ApiOperation({ summary: "Detail d'une balade publique" })
  @ApiParam({ name: "id" })
  @ApiResponse({ status: 404, description: "Balade introuvable" })
  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.ridesService.getById(id);
  }

  @ApiOperation({ summary: "Publie une activite Strava comme balade publique" })
  @ApiBearerAuth("supabase-jwt")
  @ApiBody({ type: CreateRideFromStravaDto })
  @Post("from-strava")
  async createFromStrava(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { activityId: string } & CreateRideForm,
  ) {
    const user = await this.authService.getUserFromAuthorization(authorization);
    return this.ridesService.createFromStrava(user.id, body.activityId, body);
  }

  @ApiOperation({ summary: "Publie une balade depuis un fichier GPX" })
  @ApiBearerAuth("supabase-jwt")
  @ApiBody({ type: CreateRideFromGpxDto })
  @Post("from-gpx")
  async createFromGpx(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { gpxXml: string } & CreateRideForm,
  ) {
    const user = await this.authService.getUserFromAuthorization(authorization);
    return this.ridesService.createFromGpx(user.id, body.gpxXml, body);
  }
}
