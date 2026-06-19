import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @ApiOperation({ summary: "Statut du service" })
  @Get()
  check(): { status: string; service: string; ts: string } {
    return {
      status: "ok",
      service: "michelin-trust-wheels-api",
      ts: new Date().toISOString(),
    };
  }
}
