// Shape stored in Job.result (Prisma Json column — no schema change needed)
export interface AnalysisResult {
  repoUrl: string;
  analyzedAt: string;

  health: {
    stars: number;
    forks: number;
    openIssues: number;
    openIssuesRatio: number; // openIssues / (stars + 1), rough popularity-adjusted ratio
    lastCommitAt: string | null;
    daysSinceLastCommit: number | null;
    score: number; // 0–100 composite
  };

  structure: {
    totalFiles: number;
    totalDirs: number;
    tree: string[]; // top-level + one level deep paths
    keyFiles: {
      readme: string | null; // path if present
      packageJson: string | null;
      entryPoint: string | null; // from package.json "main", or common defaults found
    };
  };

  commits: {
    totalFetched: number; // capped at 100 most recent
    firstFetchedAt: string | null;
    lastFetchedAt: string | null;
    perWeek: Record<string, number>; // ISO week start date → count
    mostActiveWeek: string | null;
    recent: { sha: string; message: string; author: string; date: string }[]; // last 5
  };

  contributors: {
    total: number; // top 10 fetched
    top: { login: string; commits: number; share: number }[]; // share = fraction of fetched total
  };

  languages: {
    bytes: Record<string, number>;
    breakdown: { language: string; percent: number }[];
  };

  dependencies: {
    source: 'package.json' | 'requirements.txt' | null;
    count: number;
    devCount: number; // package.json only
    names: string[];
  };

  // AI-generated metrics (Goal 4b) — null if Groq call failed; job still completes
  ai: {
    architecture: {
      summary: string; // 2–3 paragraph prose
      style: string; // e.g. "modular monolith", "CLI tool", "library"
      layers: string[]; // detected structural layers/areas
      patterns: string[]; // notable patterns/conventions
    } | null;
    contributing: {
      overallDifficulty: 'easy' | 'moderate' | 'hard';
      suggestions: { title: string; reason: string; difficulty: 'easy' | 'moderate' | 'hard' }[];
      signals: {
        hasContributingMd: boolean;
        goodFirstIssues: number;
        hasTests: boolean;
        todoCount: number | null; // null = search API unavailable
      };
    } | null;
  };
}
