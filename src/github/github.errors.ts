export class RepoNotFoundError extends Error {
  constructor(repo: string) {
    super(`Repository not found (or private): ${repo}`);
  }
}

export class RateLimitError extends Error {
  constructor(public readonly resetAt: Date | null) {
    super(
      `GitHub API rate limit exceeded${resetAt ? `, resets at ${resetAt.toISOString()}` : ''}`,
    );
  }
}
