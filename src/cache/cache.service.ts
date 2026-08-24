import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const TTL_24H = 60 * 60 * 24; // seconds

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // "https://GitHub.com/NestJS/Nest.git/" → "repo:analysis:nestjs/nest"
  keyFor(repoUrl: string): string {
    const { pathname } = new URL(repoUrl.toLowerCase());
    const slug = pathname.replace(/\/+$/, '').replace(/\.git$/, '').replace(/^\/+/, '');
    return `repo:analysis:${slug}`;
  }

  async getResult<T>(repoUrl: string): Promise<T | null> {
    const raw = await this.redis.get(this.keyFor(repoUrl));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setResult(repoUrl: string, result: unknown, ttlSeconds = TTL_24H): Promise<void> {
    await this.redis.set(this.keyFor(repoUrl), JSON.stringify(result), 'EX', ttlSeconds);
  }
}
