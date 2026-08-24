'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, JobData } from '@/lib/api';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (p: number) => {
    setLoading(true);
    try {
      const data = await api.history(p, 10);
      setJobs(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        setError('You must be signed in to view your history.');
      } else {
        setError('Failed to load history.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const statusColor: Record<string, string> = {
    COMPLETED: 'var(--success)', ACTIVE: 'var(--accent)', QUEUED: 'var(--warning)', FAILED: 'var(--danger)',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <div className="fade-up" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>📋 My History</h1>
        <p style={{ color: 'var(--muted)', marginTop: '6px' }}>Your past repository analyses</p>
      </div>

      {error && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', borderColor: 'rgba(248,113,113,0.2)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/auth/github`}
            className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
            Sign in with GitHub
          </a>
        </div>
      )}

      {loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔭</div>
          <p>No analyses yet.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Analyse a Repo</Link>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {jobs.map(job => {
              const r = job.result as { health?: { score?: number } } | null;
              return (
                <Link key={job.id} href={`/jobs/${job.id}`} style={{ display: 'block' }}>
                  <div className="card" style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,106,255,0.35)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = ''}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor[job.status] ?? 'var(--muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.repoUrl.replace('https://github.com/', '')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                        {job.status} · {new Date(job.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {r?.health?.score !== undefined && (
                      <span style={{ fontWeight: 800, fontSize: '18px', color: r.health.score >= 70 ? 'var(--success)' : r.health.score >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                        {r.health.score}
                      </span>
                    )}
                    <span style={{ color: 'var(--muted)', fontSize: '18px' }}>→</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {total > 10 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary">← Prev</button>
              <span className="btn" style={{ cursor: 'default', color: 'var(--muted)', background: 'none' }}>Page {page} of {Math.ceil(total / 10)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 10)} className="btn btn-secondary">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
