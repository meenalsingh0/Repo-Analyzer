'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RepoForm() {
  const [url, setUrl] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setLoading(true);
    try {
      const job = await api.createJob(url.trim(), visibility);
      // backend returns { jobId, status, cached }
      router.push(`/jobs/${job.jobId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create job';
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        setError('You must be signed in to analyse a repo. Click "Sign in with GitHub" above.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '640px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          id="repo-url-input"
          className="input"
          type="url"
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={loading}
          style={{ flex: 1, minWidth: '280px' }}
        />
        <button
          id="analyse-btn"
          type="submit"
          className="btn btn-primary"
          disabled={loading || !url.trim()}
          style={{ minWidth: '140px', justifyContent: 'center' }}
        >
          {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Queuing…</> : '✦ Analyse Repo'}
        </button>
      </div>

      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
          <input type="radio" name="vis" value="PUBLIC" checked={visibility === 'PUBLIC'} onChange={() => setVisibility('PUBLIC')} /> Public result
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
          <input type="radio" name="vis" value="PRIVATE" checked={visibility === 'PRIVATE'} onChange={() => setVisibility('PRIVATE')} /> Private result
        </label>
      </div>

      {error && (
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--danger)', background: 'rgba(248,113,113,0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </p>
      )}
    </form>
  );
}
