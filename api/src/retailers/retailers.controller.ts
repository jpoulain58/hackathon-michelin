import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { RetailersService } from "./retailers.service";

@ApiTags("retailers")
@Controller("retailers")
export class RetailersController {
  constructor(private readonly retailersService: RetailersService) {}

  @ApiOperation({ summary: "Revendeurs du catalogue (bouton \"Voir ou acheter\")" })
  @ApiQuery({ name: "country", required: false, example: "France" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 8 })
  @Get()
  async list(@Query("country") country?: string, @Query("limit") limit?: string) {
    const items = await this.retailersService.list({
      country,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
    return { items };
  }
}
