import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { TyresModule } from "./tyres/tyres.module";

@Module({
  imports: [HealthModule, TyresModule],
})
export class AppModule {}
