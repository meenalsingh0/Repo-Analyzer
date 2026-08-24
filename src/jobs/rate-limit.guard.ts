import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const MAX_PER_HOUR = 5;

// Key pattern: ratelimit:analyze:<ip>:<UTC hour bucket>
// e.g. ratelimit:analyze:203.0.113.7:2026-07-19T14
@Injectable()
export class AnalysisRateLimitGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    // honor proxy header if present (first hop), else socket address
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
      req.socket.remoteAddress ??
      'unknown';

    const hourBucket = new Date().toISOString().slice(0, 13); // "2026-07-19T14"
    const key = `ratelimit:analyze:${ip}:${hourBucket}`;

    // INCR + EXPIRE atomically; expiry only set on first hit of the window
    const [[, count]] = (await this.redis
      .multi()
      .incr(key)
      .expire(key, 3600, 'NX')
      .exec()) as [[null, number], unknown];

    if (count > MAX_PER_HOUR) {
      const ttl = await this.redis.ttl(key);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Analysis limit reached (${MAX_PER_HOUR}/hour). Try again in ${Math.ceil(ttl / 60)} minutes.`,
          retryAfterSeconds: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
