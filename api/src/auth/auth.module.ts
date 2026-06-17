import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GarminService } from "./garmin.service";
import { StravaService } from "./strava.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, GarminService, StravaService],
  exports: [AuthService, StravaService],
})
export class AuthModule {}
