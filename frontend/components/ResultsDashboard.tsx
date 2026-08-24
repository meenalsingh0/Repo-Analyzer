'use client';
import { useState } from 'react';
import { AnalysisResult } from '@/lib/api';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3776ab',
  Go: '#00add8', Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d',
  Ruby: '#701516', PHP: '#777bb4', CSS: '#563d7c', HTML: '#e34c26',
  Shell: '#89e051', Kotlin: '#a97bff', Swift: '#ffac45',
};

function getLangColor(lang: string) { return LANG_COLORS[lang] ?? '#7c6aff'; }

function ScoreRing({ score }: { score: number }) {
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-mid' : 'score-low';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1 }} className={cls}>{score}</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Health Score</div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ResultsDashboard({ result }: { result: AnalysisResult }) {
  const [tab, setTab] = useState('overview');

  return (
    <div className="fade-up">
      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', marginBottom: '28px' }}>
        <div className="stat-card">
          <ScoreRing score={result.health.score} />
        </div>
        <div className="stat-card">
          <div className="stat-value">⭐ {fmt(result.health.stars)}</div>
          <div className="stat-label">Stars</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">🍴 {fmt(result.health.forks)}</div>
          <div className="stat-label">Forks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">🐛 {fmt(result.health.openIssues)}</div>
          <div className="stat-label">Open Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '20px' }}>
            {result.health.daysSinceLastCommit !== null ? `${result.health.daysSinceLastCommit}d` : '—'}
          </div>
          <div className="stat-label">Since Last Commit</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '20px' }}>{result.contributors.total}</div>
          <div className="stat-label">Contributors</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="tabs" style={{ padding: '0 24px' }}>
          {['overview', 'commits', 'languages', 'contributors', 'ai'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {{ overview: '📊 Overview', commits: '📈 Commits', languages: '🌍 Languages', contributors: '👥 Contributors', ai: '🤖 AI Insights' }[t]}
            </button>
          ))}
        </div>

        <div style={{ padding: '28px 24px' }}>
          {tab === 'overview' && <OverviewTab result={result} />}
          {tab === 'commits' && <CommitsTab result={result} />}
          {tab === 'languages' && <LanguagesTab result={result} />}
          {tab === 'contributors' && <ContributorsTab result={result} />}
          {tab === 'ai' && <AITab result={result} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ result }: { result: AnalysisResult }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Repository Structure</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            ['📁 Total Files', result.structure.totalFiles],
            ['📂 Total Dirs', result.structure.totalDirs],
            ['📄 README', result.structure.keyFiles.readme ? '✅ Present' : '❌ Missing'],
            ['📦 package.json', result.structure.keyFiles.packageJson ? '✅ Present' : '—'],
            ['🚀 Entry Point', result.structure.keyFiles.entryPoint ?? '—'],
            ['📚 Dependencies', result.dependencies.count],
            ['🔧 Dev Dependencies', result.dependencies.devCount],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Recent Commits</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.commits.recent.map(c => (
            <div key={c.sha} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.message}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {c.author} · {new Date(c.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommitsTab({ result }: { result: AnalysisResult }) {
  const weeks = Object.entries(result.commits.perWeek).sort(([a], [b]) => a.localeCompare(b)).slice(-20);
  const max = Math.max(...weeks.map(([, v]) => v), 1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          ['Total Fetched', result.commits.totalFetched + ' commits'],
          ['Most Active Week', result.commits.mostActiveWeek ?? '—'],
          ['First Commit', result.commits.firstFetchedAt ? new Date(result.commits.firstFetchedAt).toLocaleDateString() : '—'],
          ['Last Commit', result.commits.lastFetchedAt ? new Date(result.commits.lastFetchedAt).toLocaleDateString() : '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>{k}</div>
            <div style={{ fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Weekly Commit Activity (last 20 weeks)</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
        {weeks.map(([week, count]) => (
          <div key={week} title={`${week}: ${count} commits`} style={{ flex: 1, minWidth: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{
              height: `${(count / max) * 100}%`, minHeight: count > 0 ? '4px' : '0',
              background: 'linear-gradient(180deg, var(--accent), var(--accent2))',
              borderRadius: '3px 3px 0 0', transition: 'height 0.3s ease',
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{weeks[0]?.[0]}</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{weeks[weeks.length - 1]?.[0]}</span>
      </div>
    </div>
  );
}

function LanguagesTab({ result }: { result: AnalysisResult }) {
  const total = Object.values(result.languages.bytes).reduce((a, b) => a + b, 0);
  return (
    <div>
      {/* Bar */}
      <div style={{ display: 'flex', height: '12px', borderRadius: '99px', overflow: 'hidden', marginBottom: '28px' }}>
        {result.languages.breakdown.map(l => (
          <div key={l.language} title={`${l.language}: ${l.percent.toFixed(1)}%`}
            style={{ width: `${l.percent}%`, background: getLangColor(l.language), transition: 'width 0.5s' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
        {result.languages.breakdown.map(l => (
          <div key={l.language} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getLangColor(l.language), flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{l.language}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {l.percent.toFixed(1)}% · {fmt(result.languages.bytes[l.language] ?? 0)} bytes
              </div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>Total: {fmt(total)} bytes analysed</p>
    </div>
  );
}

function ContributorsTab({ result }: { result: AnalysisResult }) {
  return (
    <div>
      <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>Top {result.contributors.top.length} contributors · {result.contributors.total} total</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {result.contributors.top.map((c, i) => (
          <div key={c.login} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b07219' : 'var(--muted)', minWidth: '24px' }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{c.login}</div>
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                  <span>{c.commits} commits</span>
                  <span>{(c.share * 100).toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${c.share * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AITab({ result }: { result: AnalysisResult }) {
  if (!result.ai.architecture && !result.ai.contributing) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤖</div>
        <p>AI insights are unavailable for this repo. Check your GROQ_API_KEY.</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {result.ai.architecture && (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>🏗️ Architecture Summary</h3>
          <div style={{ padding: '20px', background: 'rgba(124,106,255,0.08)', borderRadius: '12px', borderLeft: '4px solid var(--accent)', marginBottom: '16px' }}>
            <p style={{ lineHeight: 1.8, fontSize: '15px' }}>{result.ai.architecture.summary}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', fontSize: '13px', border: '1px solid var(--border)' }}>
              Style: <strong>{result.ai.architecture.style}</strong>
            </span>
            {result.ai.architecture.layers.map(l => (
              <span key={l} style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(124,106,255,0.1)', fontSize: '13px', color: 'var(--accent)' }}>{l}</span>
            ))}
          </div>
          {result.ai.architecture.patterns.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {result.ai.architecture.patterns.map(p => (
                <span key={p} style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(34,211,238,0.1)', fontSize: '13px', color: 'var(--accent2)' }}>{p}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {result.ai.contributing && (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>🤝 Contributing Insights</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span className={`badge badge-${result.ai.contributing.overallDifficulty === 'easy' ? 'completed' : result.ai.contributing.overallDifficulty === 'moderate' ? 'active' : 'failed'}`}>
              {result.ai.contributing.overallDifficulty} to contribute
            </span>
            {result.ai.contributing.signals.hasTests && <span className="badge badge-completed">✅ Has Tests</span>}
            {result.ai.contributing.signals.hasContributingMd && <span className="badge badge-completed">📝 CONTRIBUTING.md</span>}
            {result.ai.contributing.signals.goodFirstIssues > 0 && (
              <span className="badge badge-active">🏷️ {result.ai.contributing.signals.goodFirstIssues} Good First Issues</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result.ai.contributing.suggestions.map((s, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', borderLeft: `3px solid ${s.difficulty === 'easy' ? 'var(--success)' : s.difficulty === 'moderate' ? 'var(--warning)' : 'var(--danger)'}` }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{s.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{s.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
