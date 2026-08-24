import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsController } from './jobs.controller';
import { HistoryController } from './history.controller';
import { ExploreController } from './explore.controller';
import { JobsService } from './jobs.service';
import { AnalysisProcessor } from './analysis.processor';
import { ProgressGateway } from './progress.gateway';
import { AnalysisRateLimitGuard } from './rate-limit.guard';
import { ANALYSIS_QUEUE } from './jobs.constants';

@Module({
  imports: [BullModule.registerQueue({ name: ANALYSIS_QUEUE })],
  controllers: [JobsController, HistoryController, ExploreController],
  providers: [JobsService, AnalysisProcessor, ProgressGateway, AnalysisRateLimitGuard],
})
export class JobsModule {}
