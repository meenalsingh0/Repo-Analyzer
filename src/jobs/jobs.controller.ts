import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { AnalysisRateLimitGuard } from './rate-limit.guard';
import { JwtAuthGuard } from '../auth/guards';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  // POST /jobs — login required, rate-limited 5/IP/hour; GET stays open
  @Post()
  @UseGuards(JwtAuthGuard, AnalysisRateLimitGuard) // auth first, then rate limit
  @HttpCode(202)
  create(@Body() dto: CreateJobDto, @Req() req: Request) {
    // JwtAuthGuard guarantees req.user; jobs are tied to the submitting account
    return this.jobs.enqueue(dto.repoUrl, (req.user as User).id, dto.visibility);
  }

  // GET /jobs/:id — status + result
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.jobs.getStatus(id);
  }
}
