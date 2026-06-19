import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({
    summary: "Autocomplete pneus du catalogue confidentiel",
    description: "Lit la table Supabase `products` (service role). Utilise pour rattacher un pneu reel a une balade.",
  })
  @ApiQuery({ name: "q", required: false, example: "power" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @Get("search")
  async search(@Query("q") q: string | undefined, @Query("limit") limit?: string) {
    const items = await this.productsService.search(q ?? "", limit ? Number.parseInt(limit, 10) : undefined);
    return { items };
  }
}
