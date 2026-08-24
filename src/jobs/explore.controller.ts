import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';

// Public — no auth guard
@Controller('explore')
export class ExploreController {
  constructor(private readonly jobs: JobsService) {}

  // GET /explore?page=1&limit=12
  @Get()
  explore(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.jobs.getExplore(Math.max(1, page), Math.min(50, Math.max(1, limit)));
  }
}
