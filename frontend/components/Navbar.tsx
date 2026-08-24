'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface User { id: string; username: string; avatarUrl: string | null }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    window.location.reload();
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: '64px',
      background: 'rgba(8,11,20,0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '18px' }}>
        <span style={{ fontSize: '24px' }}>🔭</span>
        <span className="gradient-text">RepoAnalyser</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/explore" className="btn btn-ghost" style={{ fontSize: '14px' }}>Explore</Link>
        {user && <Link href="/history" className="btn btn-ghost" style={{ fontSize: '14px' }}>History</Link>}

        {loading ? null : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px' }}>
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.username} style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '2px solid rgba(124,106,255,0.5)',
              }} />
            )}
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>@{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: '13px' }}>Sign out</button>
          </div>
        ) : (
          <a href={`${API}/auth/github`} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Sign in with GitHub
          </a>
        )}
      </div>
    </nav>
  );
}
