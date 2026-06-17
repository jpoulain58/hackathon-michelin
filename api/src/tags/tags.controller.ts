import { Controller, Get } from "@nestjs/common";
import { TagsService } from "./tags.service";

@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /** GET /api/tags — tags predefinis disponibles pour les balades. */
  @Get()
  async list() {
    const items = await this.tagsService.listAll();
    return { items };
  }
}
