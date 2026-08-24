import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimitError, RepoNotFoundError } from './github.errors';
import type { AnalysisResult } from '../jobs/analysis-result';

const API = 'https://api.github.com';

/*
 * Endpoints used (all cost 1 request against the core rate limit:
 * 60/hr unauthenticated, 5000/hr with a token):
 *
 * 1. health        GET /repos/{owner}/{repo}
 * 2. structure     GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
 * 3. commits       GET /repos/{owner}/{repo}/commits?per_page=100
 * 4. contributors  GET /repos/{owner}/{repo}/contributors?per_page=10
 * 5. languages     GET /repos/{owner}/{repo}/languages
 * 6. dependencies  GET /repos/{owner}/{repo}/contents/package.json
 *                  (falls back to /contents/requirements.txt → up to 2 requests)
 *
 * Full analysis ≈ 6–7 requests per repo.
 */
@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(private readonly config: ConfigService) {}

  parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const { pathname } = new URL(repoUrl);
    const [owner, repo] = pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '').split('/');
    return { owner, repo };
  }

  private async gh<T>(path: string): Promise<T> {
    const token = this.config.get<string>('GITHUB_TOKEN');
    const res = await fetch(`${API}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 404) throw new RepoNotFoundError(path);
    if (
      (res.status === 403 || res.status === 429) &&
      res.headers.get('x-ratelimit-remaining') === '0'
    ) {
      const reset = res.headers.get('x-ratelimit-reset');
      throw new RateLimitError(reset ? new Date(Number(reset) * 1000) : null);
    }
    if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`);
    return res.json() as Promise<T>;
  }

  // ── 1. Repo health ────────────────────────────────────────────────
  // Also returns defaultBranch (needed by getStructure) so /repos is only hit once
  async getHealth(
    owner: string,
    repo: string,
  ): Promise<{ health: AnalysisResult['health']; defaultBranch: string }> {
    const r = await this.gh<any>(`/repos/${owner}/${repo}`);
    const lastCommitAt: string | null = r.pushed_at ?? null;
    const daysSince = lastCommitAt
      ? Math.floor((Date.now() - new Date(lastCommitAt).getTime()) / 86_400_000)
      : null;
    const issuesRatio = r.open_issues_count / (r.stargazers_count + 1);

    // Simple composite: recency (50) + popularity (30) + issue hygiene (20)
    const recencyScore = daysSince === null ? 0 : Math.max(0, 50 - daysSince / 2);
    const popularityScore = Math.min(30, Math.log10(r.stargazers_count + 1) * 10);
    const issueScore = Math.max(0, 20 - issuesRatio * 20);

    return {
      health: {
        stars: r.stargazers_count,
        forks: r.forks_count,
        openIssues: r.open_issues_count,
        openIssuesRatio: Number(issuesRatio.toFixed(3)),
        lastCommitAt,
        daysSinceLastCommit: daysSince,
        score: Math.round(recencyScore + popularityScore + issueScore),
      },
      defaultBranch: r.default_branch,
    };
  }

  // ── 2. Project structure ──────────────────────────────────────────
  async getStructure(owner: string, repo: string, defaultBranch: string) {
    const t = await this.gh<{ tree: { path: string; type: string }[]; truncated: boolean }>(
      `/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    );
    const files = t.tree.filter((n) => n.type === 'blob');
    const dirs = t.tree.filter((n) => n.type === 'tree');
    const paths = files.map((f) => f.path);

    const find = (re: RegExp) => paths.find((p) => re.test(p)) ?? null;
    return {
      totalFiles: files.length,
      totalDirs: dirs.length,
      // keep it readable: only depth ≤ 2 paths
      tree: t.tree.filter((n) => n.path.split('/').length <= 2).map((n) => n.path),
      keyFiles: {
        readme: find(/^readme(\.|$)/i),
        packageJson: find(/^package\.json$/),
        entryPoint: find(/^(src\/)?(index|main|app)\.(ts|js|py)$/),
      },
    };
  }

  // ── 3. Commit history ─────────────────────────────────────────────
  async getCommits(owner: string, repo: string): Promise<AnalysisResult['commits']> {
    const commits = await this.gh<any[]>(`/repos/${owner}/${repo}/commits?per_page=100`);

    const perWeek: Record<string, number> = {};
    for (const c of commits) {
      const d = new Date(c.commit.author.date);
      d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // snap to week start (Sunday)
      const week = d.toISOString().slice(0, 10);
      perWeek[week] = (perWeek[week] ?? 0) + 1;
    }
    const mostActiveWeek =
      Object.entries(perWeek).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      totalFetched: commits.length,
      firstFetchedAt: commits.at(-1)?.commit.author.date ?? null,
      lastFetchedAt: commits[0]?.commit.author.date ?? null,
      perWeek,
      mostActiveWeek,
      recent: commits.slice(0, 5).map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split('\n')[0],
        author: c.commit.author.name,
        date: c.commit.author.date,
      })),
    };
  }

  // ── 4. Top contributors ───────────────────────────────────────────
  async getContributors(owner: string, repo: string): Promise<AnalysisResult['contributors']> {
    const list = await this.gh<any[]>(`/repos/${owner}/${repo}/contributors?per_page=10`);
    const total = list.reduce((s, c) => s + c.contributions, 0);
    return {
      total: list.length,
      top: list.map((c) => ({
        login: c.login,
        commits: c.contributions,
        share: Number((c.contributions / total).toFixed(3)),
      })),
    };
  }

  // ── 5. Language breakdown ─────────────────────────────────────────
  async getLanguages(owner: string, repo: string): Promise<AnalysisResult['languages']> {
    const bytes = await this.gh<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
    const total = Object.values(bytes).reduce((s, b) => s + b, 0) || 1;
    return {
      bytes,
      breakdown: Object.entries(bytes)
        .sort((a, b) => b[1] - a[1])
        .map(([language, b]) => ({ language, percent: Number(((b / total) * 100).toFixed(1)) })),
    };
  }

  // ── 6. Dependency count ───────────────────────────────────────────
  async getDependencies(owner: string, repo: string): Promise<AnalysisResult['dependencies']> {
    const content = async (path: string) => {
      const f = await this.gh<{ content: string }>(`/repos/${owner}/${repo}/contents/${path}`);
      return Buffer.from(f.content, 'base64').toString('utf8');
    };

    try {
      const pkg = JSON.parse(await content('package.json'));
      const deps = Object.keys(pkg.dependencies ?? {});
      const devDeps = Object.keys(pkg.devDependencies ?? {});
      return {
        source: 'package.json',
        count: deps.length,
        devCount: devDeps.length,
        names: [...deps, ...devDeps],
      };
    } catch (e) {
      if (!(e instanceof RepoNotFoundError)) throw e; // rate limit etc. — propagate
    }

    try {
      const reqs = (await content('requirements.txt'))
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => l.split(/[=<>~!\[;]/)[0].trim());
      return { source: 'requirements.txt', count: reqs.length, devCount: 0, names: reqs };
    } catch (e) {
      if (!(e instanceof RepoNotFoundError)) throw e;
      return { source: null, count: 0, devCount: 0, names: [] }; // no manifest found
    }
  }

  // ── Signals for AI metrics (Goal 4b) ──────────────────────────────

  // GET /repos/{owner}/{repo}/readme — 1 request; null if repo has no README
  async getReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const f = await this.gh<{ content: string }>(`/repos/${owner}/${repo}/readme`);
      return Buffer.from(f.content, 'base64').toString('utf8');
    } catch (e) {
      if (e instanceof RepoNotFoundError) return null;
      throw e;
    }
  }

  // GET /repos/{owner}/{repo}/issues?labels=... — 1 request per label
  async getLabeledIssues(owner: string, repo: string, label: string) {
    const issues = await this.gh<any[]>(
      `/repos/${owner}/${repo}/issues?labels=${encodeURIComponent(label)}&state=open&per_page=10`,
    );
    return issues
      .filter((i) => !i.pull_request) // /issues also returns PRs
      .map((i) => ({ number: i.number, title: i.title, updatedAt: i.updated_at }));
  }

  // GET /search/code — separate rate limit (10/min); returns null on any failure
  async countTodos(owner: string, repo: string): Promise<number | null> {
    try {
      const r = await this.gh<{ total_count: number }>(
        `/search/code?q=${encodeURIComponent(`TODO repo:${owner}/${repo}`)}&per_page=1`,
      );
      return r.total_count;
    } catch {
      return null; // search API is best-effort (needs auth, tight limits)
    }
  }
}
