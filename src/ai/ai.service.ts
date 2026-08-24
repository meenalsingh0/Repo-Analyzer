import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AnalysisResult } from '../jobs/analysis-result';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Best available model that supports json_object mode on this account
const MODEL = 'groq/compound';

export interface ArchitectureSignals {
  languages: { language: string; percent: number }[];
  tree: string[]; // depth ≤ 2 paths from structure metric
  readme: string | null;
  dependencies: string[];
}

export interface ContributingSignals {
  hasContributingMd: boolean;
  goodFirstIssues: { number: number; title: string }[];
  helpWantedIssues: { number: number; title: string }[];
  hasTests: boolean;
  todoCount: number | null;
  readme: string | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  // Groq is OpenAI-compatible; json_object mode guarantees parseable output
  private async groqJson<T>(system: string, user: string): Promise<T> {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content) as T;
  }

  // ── 7. Architecture summary ───────────────────────────────────────
  async architectureSummary(
    s: ArchitectureSignals,
  ): Promise<NonNullable<AnalysisResult['ai']['architecture']>> {
    const system = `You are a senior software architect reviewing an open-source repository.
Respond ONLY with JSON matching this schema:
{
  "summary": "2-3 short paragraphs describing the architecture in plain prose",
  "style": "one short phrase, e.g. 'modular monolith', 'CLI tool', 'React SPA', 'library'",
  "layers": ["structural layers or areas you can identify"],
  "patterns": ["notable patterns or conventions, e.g. 'dependency injection', 'monorepo'"]
}
Base every claim on the provided signals. If signals are thin, say so in the summary rather than inventing detail.`;

    const user = `Language breakdown: ${JSON.stringify(s.languages.slice(0, 10))}

File tree (top 2 levels):
${s.tree.slice(0, 50).join('\n')}

Top dependencies: ${s.dependencies.slice(0, 20).join(', ') || 'none found'}

README (truncated):
${(s.readme ?? 'No README found').slice(0, 1500)}`;

    return this.groqJson(system, user);
  }

  // ── 8. "How to contribute" suggestions ────────────────────────────
  async contributionSuggestions(
    s: ContributingSignals,
  ): Promise<NonNullable<AnalysisResult['ai']['contributing']>> {
    const system = `You advise developers on how to start contributing to an open-source repository.
Respond ONLY with JSON matching this schema:
{
  "overallDifficulty": "easy" | "moderate" | "hard",
  "suggestions": [
    { "title": "short actionable suggestion", "reason": "which signal motivates it", "difficulty": "easy" | "moderate" | "hard" }
  ]
}
Give 3-5 concrete suggestions grounded in the signals (e.g. missing CONTRIBUTING.md -> write one;
open good-first-issues -> pick one, cite its number; no tests -> add test coverage; TODOs -> resolve them).
Do not invent issues or files that are not in the signals.`;

    const user = `Signals:
- CONTRIBUTING.md present: ${s.hasContributingMd}
- Open "good first issue" issues: ${JSON.stringify(s.goodFirstIssues.slice(0, 5))} (truncated)
- Open "help wanted" issues: ${JSON.stringify(s.helpWantedIssues.slice(0, 5))} (truncated)
- Test files/folders detected: ${s.hasTests}
- TODO comments found in code: ${s.todoCount ?? 'unknown'}

README (truncated):
${(s.readme ?? 'No README found').slice(0, 1500)}`;

    const parsed = await this.groqJson<{
      overallDifficulty: 'easy' | 'moderate' | 'hard';
      suggestions: { title: string; reason: string; difficulty: 'easy' | 'moderate' | 'hard' }[];
    }>(system, user);

    return {
      ...parsed,
      // raw signals stored alongside so the frontend can show "why"
      signals: {
        hasContributingMd: s.hasContributingMd,
        goodFirstIssues: s.goodFirstIssues.length,
        hasTests: s.hasTests,
        todoCount: s.todoCount,
      },
    };
  }
}
