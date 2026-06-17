import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TyresController } from "./tyres.controller";
import { TyresService } from "./tyres.service";

@Module({
  imports: [AuthModule],
  controllers: [TyresController],
  providers: [TyresService],
})
export class TyresModule {}
