'use client';
import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import { api, JobData, AnalysisResult } from '@/lib/api';
import { subscribeToJob } from '@/lib/socket';
import ResultsDashboard from '@/components/ResultsDashboard';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { QUEUED: 'badge-queued', ACTIVE: 'badge-active', COMPLETED: 'badge-completed', FAILED: 'badge-failed' };
  return <span className={`badge ${map[status] ?? 'badge-queued'}`}>{status}</span>;
}

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobData | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Initialising…');
  const [error, setError] = useState('');

  const fetchJob = useCallback(async () => {
    try {
      const data = await api.getJob(id);
      setJob(data);
      if (data.status === 'COMPLETED') setProgress(100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load job. It may not exist.');
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') return;

    const unsub = subscribeToJob(id, data => {
      if (data.jobId !== id) return;
      setProgress(data.progress);
      setProgressMsg(data.message);
      if (data.progress >= 100) fetchJob();
    });

    // Poll every 3s as fallback
    const poll = setInterval(fetchJob, 3000);
    return () => { unsub(); clearInterval(poll); };
  }, [id, job, fetchJob]);

  if (error) return (
    <div style={{ padding: '120px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <p style={{ color: 'var(--danger)' }}>{error}</p>
    </div>
  );

  if (!job) return (
    <div style={{ padding: '120px 24px', display: 'flex', justifyContent: 'center' }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <StatusBadge status={job.status} />
          {job.status === 'ACTIVE' && <span className="spinner" />}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, wordBreak: 'break-all' }}>
          {job.repoUrl.replace('https://github.com/', '')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
          Job ID: {job.id} · Created {new Date(job.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Progress */}
      {(job.status === 'QUEUED' || job.status === 'ACTIVE') && (
        <div className="card fade-up" style={{ padding: '28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>{progressMsg}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>
            Hang tight — we&apos;re fetching commits, contributors, languages, and generating AI insights…
          </p>
        </div>
      )}

      {job.status === 'FAILED' && (
        <div className="card fade-up" style={{ padding: '28px', marginBottom: '32px', borderColor: 'rgba(248,113,113,0.3)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Analysis failed. Please try again.</p>
        </div>
      )}

      {job.status === 'COMPLETED' && job.result && (
        <ResultsDashboard result={job.result as AnalysisResult} />
      )}
    </div>
  );
}
