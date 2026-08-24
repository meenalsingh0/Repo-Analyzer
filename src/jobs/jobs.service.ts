import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { ANALYSIS_QUEUE } from './jobs.constants';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @InjectQueue(ANALYSIS_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueue(repoUrl: string, userId?: string, visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC') {
    // Cache hit → no queue round-trip, but still record a COMPLETED job
    // so it shows up in the user's history
    const cached = await this.cache.getResult(repoUrl);
    if (cached) {
      const job = await this.prisma.job.create({
        data: { repoUrl, userId, visibility, status: 'COMPLETED', result: cached as object },
      });
      return { jobId: job.id, status: 'COMPLETED', cached: true, result: cached };
    }

    // DB row is the source of truth; created first so the id exists before the worker runs
    const job = await this.prisma.job.create({ data: { repoUrl, userId, visibility } });

    // BullMQ jobId = DB id, so the processor can look the row up directly
    await this.queue.add(
      'analyze',
      { repoUrl },
      { jobId: job.id, removeOnComplete: true, removeOnFail: 100 },
    );

    return { jobId: job.id, status: job.status, cached: false };
  }

  async getStatus(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  // Public explore feed — visibility enforced in the WHERE clause, not the UI
  async getExplore(page: number, limit: number) {
    const where = { status: 'COMPLETED' as const, visibility: 'PUBLIC' as const };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, repoUrl: true, result: true, createdAt: true },
      }),
      this.prisma.job.count({ where }),
    ]);

    // flatten the stored result JSON into card-sized summaries
    const items = rows.map((r) => {
      const res = r.result as any;
      return {
        id: r.id,
        repo: new URL(r.repoUrl).pathname.replace(/^\/|\.git$/g, ''), // "owner/name"
        healthScore: res?.health?.score ?? null,
        stars: res?.health?.stars ?? null,
        primaryLanguage: res?.languages?.breakdown?.[0]?.language ?? null,
        analyzedAt: r.createdAt,
      };
    });

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  // Paginated history, most recent first; result omitted to keep the list light
  async getHistory(userId: string, page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, repoUrl: true, status: true, createdAt: true },
      }),
      this.prisma.job.count({ where: { userId } }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
