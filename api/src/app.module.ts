import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { TyresModule } from "./tyres/tyres.module";
import { CommunityModule } from "./community/community.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [HealthModule, TyresModule, CommunityModule, AuthModule],
})
export class AppModule {}
