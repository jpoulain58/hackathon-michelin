import { Module } from "@nestjs/common";
import { RetailersController } from "./retailers.controller";
import { RetailersService } from "./retailers.service";

@Module({
  controllers: [RetailersController],
  providers: [RetailersService],
})
export class RetailersModule {}
