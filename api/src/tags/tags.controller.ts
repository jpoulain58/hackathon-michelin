import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { TagsService } from "./tags.service";

@ApiTags("tags")
@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiOperation({ summary: "Tags predefinis disponibles pour les balades (cle/label/icone Lucide)" })
  @Get()
  async list() {
    const items = await this.tagsService.listAll();
    return { items };
  }
}
