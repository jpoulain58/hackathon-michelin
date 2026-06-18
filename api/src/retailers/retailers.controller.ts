import { Controller, Get, Query } from "@nestjs/common";
import { RetailersService } from "./retailers.service";

@Controller("retailers")
export class RetailersController {
  constructor(private readonly retailersService: RetailersService) {}

  /** GET /api/retailers?country=France&limit=8 — revendeurs catalogue. */
  @Get()
  async list(@Query("country") country?: string, @Query("limit") limit?: string) {
    const items = await this.retailersService.list({
      country,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
    return { items };
  }
}
