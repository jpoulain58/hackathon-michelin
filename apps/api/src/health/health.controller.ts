import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check(): { status: string; service: string; ts: string } {
    return {
      status: "ok",
      service: "michelin-trust-wheels-api",
      ts: new Date().toISOString(),
    };
  }
}
