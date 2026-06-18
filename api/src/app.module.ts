import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { TyresModule } from "./tyres/tyres.module";
import { CommunityModule } from "./community/community.module";
import { AuthModule } from "./auth/auth.module";
import { RidesModule } from "./rides/rides.module";
import { TagsModule } from "./tags/tags.module";
import { ProductsModule } from "./products/products.module";
import { RetailersModule } from "./retailers/retailers.module";

@Module({
  imports: [
    HealthModule,
    TyresModule,
    CommunityModule,
    AuthModule,
    RidesModule,
    TagsModule,
    ProductsModule,
    RetailersModule,
  ],
})
export class AppModule {}
