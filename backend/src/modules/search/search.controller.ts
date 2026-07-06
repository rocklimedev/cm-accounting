import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.searchService.search({
      q,
      type,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }
}
