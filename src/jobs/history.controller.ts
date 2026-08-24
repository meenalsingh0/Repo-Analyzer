import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('me')
export class HistoryController {
  constructor(private readonly jobs: JobsService) {}

  // GET /me/history?page=1&limit=10
  @Get('history')
  @UseGuards(JwtAuthGuard)
  history(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const user = req.user as User;
    return this.jobs.getHistory(user.id, Math.max(1, page), Math.min(50, Math.max(1, limit)));
  }
}
