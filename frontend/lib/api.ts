const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  me: () => apiFetch<{ id: string; username: string; avatarUrl: string | null }>('/me'),
  logout: () => apiFetch<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),

  createJob: (repoUrl: string, visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC') =>
    apiFetch<{ jobId: string; status: string; cached: boolean }>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ repoUrl, visibility }),
    }),

  getJob: (id: string) =>
    apiFetch<JobData>(`/jobs/${id}`),

  explore: (page = 1, limit = 12) =>
    apiFetch<{ items: ExploreItem[]; page: number; limit: number; total: number; totalPages: number }>(`/explore?page=${page}&limit=${limit}`),

  history: (page = 1, limit = 10) =>
    apiFetch<PaginatedJobs>(`/me/history?page=${page}&limit=${limit}`),
};

export interface JobData {
  id: string;
  repoUrl: string;
  status: 'QUEUED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  visibility: 'PUBLIC' | 'PRIVATE';
  result: AnalysisResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedJobs {
  items: JobData[];
  total: number;
  page: number;
  limit: number;
}

// Shape returned by GET /explore (leaner than full JobData)
export interface ExploreItem {
  id: string;
  repo: string;           // "owner/name" — already stripped of https://github.com/
  healthScore: number | null;
  stars: number | null;
  primaryLanguage: string | null;
  analyzedAt: string;
}

export interface AnalysisResult {
  repoUrl: string;
  analyzedAt: string;
  health: {
    stars: number; forks: number; openIssues: number;
    openIssuesRatio: number; lastCommitAt: string | null;
    daysSinceLastCommit: number | null; score: number;
  };
  structure: {
    totalFiles: number; totalDirs: number; tree: string[];
    keyFiles: { readme: string | null; packageJson: string | null; entryPoint: string | null };
  };
  commits: {
    totalFetched: number; firstFetchedAt: string | null; lastFetchedAt: string | null;
    perWeek: Record<string, number>; mostActiveWeek: string | null;
    recent: { sha: string; message: string; author: string; date: string }[];
  };
  contributors: { total: number; top: { login: string; commits: number; share: number }[] };
  languages: { bytes: Record<string, number>; breakdown: { language: string; percent: number }[] };
  dependencies: { source: string | null; count: number; devCount: number; names: string[] };
  ai: {
    architecture: { summary: string; style: string; layers: string[]; patterns: string[] } | null;
    contributing: {
      overallDifficulty: 'easy' | 'moderate' | 'hard';
      suggestions: { title: string; reason: string; difficulty: string }[];
      signals: { hasContributingMd: boolean; goodFirstIssues: number; hasTests: boolean; todoCount: number | null };
    } | null;
  };
}
