import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { TyresModule } from "./tyres/tyres.module";
import { CommunityModule } from "./community/community.module";

@Module({
  imports: [HealthModule, TyresModule, CommunityModule],
})
export class AppModule {}
