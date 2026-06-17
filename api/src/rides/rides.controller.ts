import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { type CreateRideForm, RidesService } from "./rides.service";

@Controller("rides")
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly authService: AuthService,
  ) {}

  /** GET /api/rides?terrain=Route&difficulty=Expert */
  @Get()
  async list(@Query("terrain") terrain?: string, @Query("difficulty") difficulty?: string) {
    const items = await this.ridesService.listPublic({ terrain, difficulty });
    return { items };
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.ridesService.getById(id);
  }

  @Post("from-strava")
  async createFromStrava(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { activityId: string } & CreateRideForm,
  ) {
    const user = await this.authService.getUserFromAuthorization(authorization);
    return this.ridesService.createFromStrava(user.id, body.activityId, body);
  }

  @Post("from-gpx")
  async createFromGpx(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { gpxXml: string } & CreateRideForm,
  ) {
    const user = await this.authService.getUserFromAuthorization(authorization);
    return this.ridesService.createFromGpx(user.id, body.gpxXml, body);
  }
}
