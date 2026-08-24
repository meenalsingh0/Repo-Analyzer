import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { GithubService } from '../github/github.service';
import { AiService } from '../ai/ai.service';
import { RateLimitError, RepoNotFoundError } from '../github/github.errors';
import { ProgressGateway } from './progress.gateway';
import { ANALYSIS_QUEUE } from './jobs.constants';
import type { AnalysisResult } from './analysis-result';

@Processor(ANALYSIS_QUEUE)
export class AnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly github: GithubService,
    private readonly ai: AiService,
    private readonly gateway: ProgressGateway,
  ) {
    super();
  }

  async process(job: Job<{ repoUrl: string }>) {
    const id = job.id as string;
    const { repoUrl } = job.data;
    const { owner, repo } = this.github.parseRepoUrl(repoUrl);
    this.logger.log(`Analyzing ${owner}/${repo} (job ${id})`);

    await this.prisma.job.update({ where: { id }, data: { status: 'ACTIVE' } });

    const step = async (label: string, pct: number) => {
      this.gateway.emitProgress(id, label, pct);
      await job.updateProgress(pct);
    };

    try {
      await step('Fetching repo metadata...', 0);
      const { health, defaultBranch } = await this.github.getHealth(owner, repo);

      await step('Scanning project structure...', 15);
      const structure = await this.github.getStructure(owner, repo, defaultBranch);

      await step('Analyzing commit history...', 35);
      const commits = await this.github.getCommits(owner, repo);

      await step('Ranking contributors...', 55);
      const contributors = await this.github.getContributors(owner, repo);

      await step('Computing language breakdown...', 70);
      const languages = await this.github.getLanguages(owner, repo);

      await step('Counting dependencies...', 60);
      const dependencies = await this.github.getDependencies(owner, repo);

      // ── AI metrics (7 & 8) — best-effort: a Groq failure never fails the job
      await step('Gathering AI signals...', 70);
      const readme = await this.github.getReadme(owner, repo);
      const allPaths = structure.tree;
      const hasContributingMd = allPaths.some((p) => /^contributing(\.|$)/i.test(p));
      const hasTests = allPaths.some((p) =>
        /((^|\/)(test|tests|__tests__|spec)(\/|$))|(\.(test|spec)\.\w+$)/i.test(p),
      );
      const [goodFirstIssues, helpWantedIssues, todoCount] = await Promise.all([
        this.github.getLabeledIssues(owner, repo, 'good first issue'),
        this.github.getLabeledIssues(owner, repo, 'help wanted'),
        this.github.countTodos(owner, repo),
      ]);

      // best-effort: a Groq failure stores null instead of failing the job
      const tryAi = async <T>(label: string, fn: () => Promise<T>): Promise<T | null> => {
        try {
          return await fn();
        } catch (err) {
          this.logger.warn(`${label} failed for job ${id}: ${(err as Error).message}`);
          return null;
        }
      };

      await step('Generating architecture summary...', 80);
      const architecture = await tryAi('Architecture summary', () =>
        this.ai.architectureSummary({
          languages: languages.breakdown,
          tree: structure.tree,
          readme,
          dependencies: dependencies.names,
        }),
      );

      await step('Generating contribution suggestions...', 90);
      const contributing = await tryAi('Contribution suggestions', () =>
        this.ai.contributionSuggestions({
          hasContributingMd,
          goodFirstIssues,
          helpWantedIssues,
          hasTests,
          todoCount,
          readme,
        }),
      );

      const result: AnalysisResult = {
        repoUrl,
        analyzedAt: new Date().toISOString(),
        health,
        structure,
        commits,
        contributors,
        languages,
        dependencies,
        ai: { architecture, contributing },
      };

      await this.prisma.job.update({
        where: { id },
        data: { status: 'COMPLETED', result: result as object },
      });
      await this.cache.setResult(repoUrl, result); // 24h TTL
      await step('Done', 100);
      this.gateway.emitCompleted(id, result);
      this.logger.log(`Job ${id} completed`);
    } catch (err) {
      // User-actionable failures get a clean message; anything else keeps the raw one
      let message: string;
      if (err instanceof RepoNotFoundError) {
        message = `Repository ${owner}/${repo} not found or not public`;
      } else if (err instanceof RateLimitError) {
        message = err.message; // includes reset time
      } else {
        message = (err as Error).message;
      }

      await this.prisma.job.update({
        where: { id },
        data: { status: 'FAILED', result: { error: message } },
      });
      this.gateway.emitFailed(id, message);
      throw err; // let BullMQ record the failure too
    }
  }
}
