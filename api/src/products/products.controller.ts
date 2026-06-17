import { Controller, Get, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** GET /api/products/search?q=power&limit=10 — autocomplete pneus du catalogue. */
  @Get("search")
  async search(@Query("q") q: string | undefined, @Query("limit") limit?: string) {
    const items = await this.productsService.search(q ?? "", limit ? Number.parseInt(limit, 10) : undefined);
    return { items };
  }
}
