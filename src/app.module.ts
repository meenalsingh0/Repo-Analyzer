import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule, REDIS_CLIENT } from './redis/redis.module';
import { CacheModule } from './cache/cache.module';
import { GithubModule } from './github/github.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    // BullMQ reuses the shared ioredis connection
    BullModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({ connection: redis }),
    }),
    CacheModule,
    GithubModule,
    AiModule,
    PrismaModule,
    AuthModule,
    JobsModule,
  ],
})
export class AppModule {}
